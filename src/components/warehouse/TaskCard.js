import React, { useState, useEffect } from 'react';
import { Card, Button, Badge, Row, Col, ProgressBar } from 'react-bootstrap';
import { 
  FaPlay, FaPause, FaStop, FaCheck, FaClock, 
  FaUser, FaBox, FaExclamationTriangle, FaStickyNote 
} from 'react-icons/fa';
import { warehouseAPI } from '../api';

const TaskCard = ({ 
  task, 
  onTaskUpdate, 
  showOrderInfo = true, 
  compact = false,
  enableActions = true 
}) => {
  const [loading, setLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isRunning, setIsRunning] = useState(task.status === 'started');

  // Timer for active tasks
  useEffect(() => {
    let interval;
    if (isRunning && task.status === 'started') {
      interval = setInterval(() => {
        setCurrentTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, task.status]);

  // Initialize timer from task data
  useEffect(() => {
    if (task.active_session && task.active_session.elapsed_time) {
      setCurrentTime(task.active_session.elapsed_time);
    }
    setIsRunning(task.status === 'started');
  }, [task]);

  const handleTaskAction = async (action) => {
    if (loading) return;
    
    setLoading(true);
    try {
      const result = await warehouseAPI.handleTaskAction(task.id, action);
      if (result.success) {
        // Update local state immediately for better UX
        if (action === 'start') {
          setIsRunning(true);
        } else if (action === 'pause' || action === 'complete') {
          setIsRunning(false);
        } else if (action === 'resume') {
          setIsRunning(true);
        }
        
        // Notify parent component
        onTaskUpdate && onTaskUpdate(result.data);
      }
    } catch (error) {
      console.error('Task action failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'assigned': return '#6c757d';
      case 'started': return '#28a745';
      case 'paused': return '#ffc107';
      case 'completed': return '#17a2b8';
      case 'approved': return '#007bff';
      default: return '#6c757d';
    }
  };

  const getStatusBadge = (status) => {
    const colors = {
      'assigned': 'secondary',
      'started': 'success',
      'paused': 'warning',
      'completed': 'info',
      'approved': 'primary'
    };
    return colors[status] || 'secondary';
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'critical': return '#dc3545';
      case 'high': return '#fd7e14';
      case 'medium': return '#ffc107';
      case 'low': return '#28a745';
      default: return '#6c757d';
    }
  };

  const canStart = task.status === 'assigned' && task.can_start !== false;
  const canPause = task.status === 'started';
  const canResume = task.status === 'paused';
  const canComplete = task.status === 'started' || task.status === 'paused';

  return (
    <Card 
      className={`task-card mb-3 ${compact ? 'compact' : ''}`}
      style={{
        borderLeft: `4px solid ${getStatusColor(task.status)}`,
        transition: 'all 0.3s ease',
        cursor: 'pointer'
      }}
    >
      <Card.Body className={compact ? 'p-3' : 'p-4'}>
        {/* Task Header */}
        <div className="d-flex justify-content-between align-items-start mb-3">
          <div className="flex-grow-1">
            <h6 className="mb-1 fw-bold text-truncate" title={task.title}>
              {task.title}
            </h6>
            {showOrderInfo && task.order_info && (
              <small className="text-muted">
                <FaBox className="me-1" />
                {task.order_info.order_number} - {task.order_info.customer_name}
              </small>
            )}
          </div>
          <div className="d-flex flex-column align-items-end">
            <Badge bg={getStatusBadge(task.status)} className="mb-1">
              {task.status.toUpperCase()}
            </Badge>
            {task.priority && (
              <Badge 
                style={{ backgroundColor: getPriorityColor(task.priority) }}
                className="text-white"
              >
                {task.priority.toUpperCase()}
              </Badge>
            )}
          </div>
        </div>

        {/* Task Details */}
        <Row className="mb-3">
          {task.assigned_to && (
            <Col xs={6}>
              <small className="text-muted d-block">
                <FaUser className="me-1" />
                {task.assigned_to.first_name || task.assigned_to.username}
              </small>
            </Col>
          )}
          {task.task_type && (
            <Col xs={6}>
              <small className="text-muted d-block">
                Type: {task.task_type.name}
              </small>
            </Col>
          )}
        </Row>

        {/* Timer Display */}
        {(task.status === 'started' || task.status === 'paused' || currentTime > 0) && (
          <div className="timer-display mb-3 p-3 bg-light rounded">
            <div className="d-flex justify-content-between align-items-center">
              <div className="d-flex align-items-center">
                <FaClock className={`me-2 ${isRunning ? 'text-success' : 'text-warning'}`} />
                <span className="h5 mb-0 font-monospace">
                  {formatTime(currentTime)}
                </span>
              </div>
              {isRunning && (
                <div className="pulse-indicator bg-success rounded-circle" 
                     style={{ width: '12px', height: '12px' }} />
              )}
            </div>
            {task.estimated_duration && (
              <ProgressBar 
                now={(currentTime / (task.estimated_duration * 3600)) * 100}
                variant={currentTime > (task.estimated_duration * 3600) ? 'danger' : 'success'}
                size="sm"
                className="mt-2"
              />
            )}
          </div>
        )}

        {/* Task Description */}
        {task.description && !compact && (
          <p className="text-muted small mb-3">{task.description}</p>
        )}

        {/* Notes indicator */}
        {task.notes_count > 0 && (
          <div className="mb-3">
            <small className="text-info">
              <FaStickyNote className="me-1" />
              {task.notes_count} note{task.notes_count !== 1 ? 's' : ''}
            </small>
          </div>
        )}

        {/* Action Buttons */}
        {enableActions && (
          <Row className="g-2">
            {canStart && (
              <Col xs={6}>
                <Button
                  variant="success"
                  size="sm"
                  className="w-100"
                  onClick={() => handleTaskAction('start')}
                  disabled={loading}
                >
                  <FaPlay className="me-1" />
                  Start
                </Button>
              </Col>
            )}
            
            {canPause && (
              <Col xs={6}>
                <Button
                  variant="warning"
                  size="sm"
                  className="w-100"
                  onClick={() => handleTaskAction('pause')}
                  disabled={loading}
                >
                  <FaPause className="me-1" />
                  Pause
                </Button>
              </Col>
            )}
            
            {canResume && (
              <Col xs={6}>
                <Button
                  variant="info"
                  size="sm"
                  className="w-100"
                  onClick={() => handleTaskAction('resume')}
                  disabled={loading}
                >
                  <FaPlay className="me-1" />
                  Resume
                </Button>
              </Col>
            )}
            
            {canComplete && (
              <Col xs={canPause ? 6 : 12}>
                <Button
                  variant="primary"
                  size="sm"
                  className="w-100"
                  onClick={() => handleTaskAction('complete')}
                  disabled={loading}
                >
                  <FaCheck className="me-1" />
                  Complete
                </Button>
              </Col>
            )}
          </Row>
        )}

        {/* Deadline Warning */}
        {task.deadline && new Date(task.deadline) < new Date() && task.status !== 'completed' && (
          <div className="mt-3 p-2 bg-danger bg-opacity-10 border border-danger rounded">
            <small className="text-danger">
              <FaExclamationTriangle className="me-1" />
              Overdue: {new Date(task.deadline).toLocaleDateString()}
            </small>
          </div>
        )}
      </Card.Body>

      <style jsx>{`
        .task-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 15px rgba(0,0,0,0.1);
        }
        
        .task-card.compact .card-body {
          padding: 0.75rem;
        }
        
        .timer-display {
          border: 2px solid #e9ecef;
        }
        
        .pulse-indicator {
          animation: pulse 1.5s infinite;
        }
        
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }
        
        .font-monospace {
          font-family: 'Courier New', monospace;
        }
      `}</style>
    </Card>
  );
};

export default TaskCard;