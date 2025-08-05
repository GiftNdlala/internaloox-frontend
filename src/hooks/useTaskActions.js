import { useState } from 'react';
import { taskAction } from '../components/api';
import { useWarehouse } from '../contexts/WarehouseContext';

export const useTaskActions = () => {
  const [loading, setLoading] = useState(false);
  const { updateTask, addNotification } = useWarehouse();

  const performAction = async (taskId, action, reason = '') => {
    setLoading(true);
    try {
      const result = await taskAction(taskId, action, { reason });

      // Update local state immediately for better UX
      const statusMap = {
        'start': 'started',
        'pause': 'paused', 
        'resume': 'started',
        'complete': 'completed'
      };

      updateTask({
        id: taskId,
        status: statusMap[action] || result.new_status,
        is_running: action === 'start' || action === 'resume',
        time_elapsed: result.time_elapsed || 0,
        can_start: result.can_start !== undefined ? result.can_start : false,
        can_pause: result.can_pause !== undefined ? result.can_pause : false,
        can_complete: result.can_complete !== undefined ? result.can_complete : false,
      });

      // Add notification for successful action
      addNotification({
        id: Date.now(),
        message: `Task ${action}ed successfully`,
        type: 'success',
        is_read: false,
        created_at: new Date().toISOString()
      });

      return { success: true, data: result };
    } catch (error) {
      // Add error notification
      addNotification({
        id: Date.now(),
        message: `Failed to ${action} task: ${error.message}`,
        type: 'error',
        is_read: false,
        created_at: new Date().toISOString()
      });

      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const startTask = (taskId) => performAction(taskId, 'start');
  const pauseTask = (taskId) => performAction(taskId, 'pause');
  const resumeTask = (taskId) => performAction(taskId, 'resume');
  const completeTask = (taskId, reason) => performAction(taskId, 'complete', reason);
  const approveTask = (taskId) => performAction(taskId, 'approve');
  const rejectTask = (taskId, reason) => performAction(taskId, 'reject', reason);

  return {
    loading,
    startTask,
    pauseTask,
    resumeTask,
    completeTask,
    approveTask,
    rejectTask,
    performAction,
  };
};