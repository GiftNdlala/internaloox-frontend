import { useState, useEffect, useRef } from 'react';
import { getRealTimeUpdates } from '../components/api';
import { useWarehouse } from '../contexts/WarehouseContext';

export const useRealTimeUpdates = (interval = 30000) => {
  const [updates, setUpdates] = useState({
    notifications: [],
    task_updates: [],
    stock_alerts: [],
  });
  const [lastCheck, setLastCheck] = useState(null);
  const intervalRef = useRef();
  const { addNotification } = useWarehouse();

  const fetchUpdates = async () => {
    try {
      const params = lastCheck ? `?since=${lastCheck}` : '';
      const response = await getRealTimeUpdates(params);
      
      if (response.has_updates) {
        setUpdates(response);
        
        // Add new notifications to warehouse context
        response.notifications.forEach(notification => {
          addNotification(notification);
          
          // Show browser notifications for high priority items
          if (notification.priority === 'high' || notification.priority === 'critical') {
            showBrowserNotification(notification.message);
          }
        });

        // Handle task updates
        if (response.task_updates && response.task_updates.length > 0) {
          response.task_updates.forEach(taskUpdate => {
            // Could dispatch task updates to warehouse context here
            console.log('Task update received:', taskUpdate);
          });
        }

        // Handle stock alerts
        if (response.stock_alerts && response.stock_alerts.length > 0) {
          response.stock_alerts.forEach(alert => {
            addNotification({
              id: `stock-${alert.id}`,
              message: `Low stock alert: ${alert.material_name} (${alert.current_stock} ${alert.unit} remaining)`,
              type: 'warning',
              priority: 'high',
              is_read: false,
              created_at: new Date().toISOString()
            });
          });
        }
      }
      
      setLastCheck(new Date().toISOString());
    } catch (error) {
      console.error('Error fetching real-time updates:', error);
    }
  };

  const showBrowserNotification = (message) => {
    // Request permission if not granted
    if (Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          showNotification(message);
        }
      });
    } else if (Notification.permission === 'granted') {
      showNotification(message);
    }
  };

  const showNotification = (message) => {
    try {
      new Notification('OOX Warehouse', {
        body: message,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: 'oox-warehouse',
        requireInteraction: false,
        silent: false
      });
    } catch (error) {
      console.error('Error showing notification:', error);
    }
  };

  useEffect(() => {
    // Request notification permission on mount
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    fetchUpdates(); // Initial fetch

    // Set up polling
    intervalRef.current = setInterval(fetchUpdates, interval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [interval]);

  const refresh = () => {
    fetchUpdates();
  };

  const stopUpdates = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const startUpdates = () => {
    if (!intervalRef.current) {
      intervalRef.current = setInterval(fetchUpdates, interval);
    }
  };

  return { 
    updates, 
    refresh, 
    stopUpdates, 
    startUpdates,
    lastCheck 
  };
};