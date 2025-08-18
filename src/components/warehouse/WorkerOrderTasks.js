import React, { useState } from 'react';
import { Card, Button, Badge, Row, Col, Spinner, Alert, Accordion } from 'react-bootstrap';
import { 
  FaTasks, FaSync, FaPlay, FaPause, FaCheck, FaBox,
  FaExclamationTriangle, FaClock, FaUser 
} from 'react-icons/fa';
import { usePolling } from '../../hooks/usePolling';
import { useTaskActions } from '../../hooks/useTaskActions';
import { getTasksByOrder, getOrderDetailsForTasks } from '../api';
import TaskCard from './TaskCard';

const WorkerOrderTasks = () => {
  const [expandedOrders, setExpandedOrders] = useState(new Set());
  const [filterStatus, setFilterStatus] = useState('all');
  const [orderDetailsMap, setOrderDetailsMap] = useState({});
  
  const { data, loading, error, refresh } = usePolling(
    () => getTasksByOrder(),
    15000 // Refresh every 15 seconds for workers
  );

  const { loading: actionLoading } = useTaskActions();

  const handleTaskUpdate = (updatedTask) => {
    // Task updates are handled by the TaskCard component and useTaskActions hook
    refresh(); // Refresh the data to get latest state
  };

  const toggleOrderExpansion = async (orderId) => {
    const newExpanded = new Set(expandedOrders);
    if (newExpanded.has(orderId)) {
      newExpanded.delete(orderId);
    } else {
      newExpanded.add(orderId);
      // Lazy-load rich order details (items with color/fabric) when expanding
      if (!orderDetailsMap[orderId]) {
        try {
          const details = await getOrderDetailsForTasks(orderId);
          setOrderDetailsMap((prev) => ({ ...prev, [orderId]: details }));
        } catch (_) {
          // ignore; keep UI responsive even if extra details fail
        }
      }
    }
    setExpandedOrders(newExpanded);
  };

  const getUrgencyColor = (urgency) => {
    const colors = {
      critical: 'danger',
      high: 'warning',
      medium: 'info',
      low: 'success',
    };
    return colors[urgency] || 'secondary';
  };

  const getUrgencyBgColor = (urgency) => {
    const colors = {
      critical: 'bg-danger-subtle border-danger',
      high: 'bg-warning-subtle border-warning',
      medium: 'bg-info-subtle border-info',
      low: 'bg-success-subtle border-success',
    };
    return colors[urgency] || 'bg-light border-secondary';
  };

  const filterTasks = (orderTasks) => {
    if (filterStatus === 'all') return orderTasks;
    
    return orderTasks.filter(orderTask => {
      const filteredTasks = orderTask.tasks.filter(task => task.status === filterStatus);
      return filteredTasks.length > 0;
    }).map(orderTask => ({
      ...orderTask,
      tasks: orderTask.tasks.filter(task => task.status === filterStatus)
    }));
  };

  const getTaskStatusCounts = (tasks) => {
    return tasks.reduce((counts, task) => {
      counts[task.status] = (counts[task.status] || 0) + 1;
      return counts;
    }, {});
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <div className="text-center">
          <Spinner animation="border" variant="primary" style={{ width: '3rem', height: '3rem' }} />
          <p className="mt-3 h5">Loading your tasks...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="danger" className="m-4">
        <Alert.Heading>Error Loading Tasks</Alert.Heading>
        <p>{error}</p>
        <Button variant="outline-danger" onClick={refresh}>
          <FaSync className="me-2" />
          Retry
        </Button>
      </Alert>
    );
  }

  const { orders_with_tasks = [], summary = {} } = data || {};
  const filteredOrderTasks = filterTasks(orders_with_tasks);

  return (
    <div className="worker-order-tasks p-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-1">
            <FaTasks className="me-2 text-primary" />
            My Tasks by Order
          </h2>
          <p className="text-muted mb-0">
            {summary.total_orders} orders • {summary.total_tasks} tasks • {summary.active_tasks} active
          </p>
        </div>
        <Button variant="outline-primary" onClick={refresh} disabled={loading || actionLoading}>
          <FaSync className={`me-2 ${(loading || actionLoading) ? 'fa-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      <Row className="mb-4">
        <Col md={3} sm={6} className="mb-3">
          <Card className="text-center h-100 border-0 shadow-sm">
            <Card.Body>
              <h3 className="text-primary mb-1">{summary.total_tasks || 0}</h3>
              <small className="text-muted">Total Tasks</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3} sm={6} className="mb-3">
          <Card className="text-center h-100 border-0 shadow-sm bg-success-subtle">
            <Card.Body>
              <h3 className="text-success mb-1">{summary.active_tasks || 0}</h3>
              <small className="text-success">Active Tasks</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3} sm={6} className="mb-3">
          <Card className="text-center h-100 border-0 shadow-sm bg-warning-subtle">
            <Card.Body>
              <h3 className="text-warning mb-1">
                {filteredOrderTasks.reduce((total, order) => 
                  total + order.tasks.filter(t => t.status === 'assigned').length, 0
                )}
              </h3>
              <small className="text-warning">Pending</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3} sm={6} className="mb-3">
          <Card className="text-center h-100 border-0 shadow-sm bg-info-subtle">
            <Card.Body>
              <h3 className="text-info mb-1">
                {filteredOrderTasks.reduce((total, order) => 
                  total + order.tasks.filter(t => t.status === 'completed').length, 0
                )}
              </h3>
              <small className="text-info">Completed</small>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Filter Buttons */}
      <div className="mb-4">
        <div className="btn-group" role="group">
          <Button 
            variant={filterStatus === 'all' ? 'primary' : 'outline-primary'}
            onClick={() => setFilterStatus('all')}
          >
            All Tasks
          </Button>
          <Button 
            variant={filterStatus === 'assigned' ? 'secondary' : 'outline-secondary'}
            onClick={() => setFilterStatus('assigned')}
          >
            Assigned
          </Button>
          <Button 
            variant={filterStatus === 'started' ? 'success' : 'outline-success'}
            onClick={() => setFilterStatus('started')}
          >
            In Progress
          </Button>
          <Button 
            variant={filterStatus === 'paused' ? 'warning' : 'outline-warning'}
            onClick={() => setFilterStatus('paused')}
          >
            Paused
          </Button>
          <Button 
            variant={filterStatus === 'completed' ? 'info' : 'outline-info'}
            onClick={() => setFilterStatus('completed')}
          >
            Completed
          </Button>
        </div>
      </div>

      {/* Orders with Tasks */}
      <div className="orders-list">
        {filteredOrderTasks.map((orderGroup) => {
          const isExpanded = expandedOrders.has(orderGroup.order_info.id);
          const statusCounts = getTaskStatusCounts(orderGroup.tasks);
          
          return (
            <Card 
              key={orderGroup.order_info.id}
              className={`mb-4 border-start border-4 ${getUrgencyBgColor(orderGroup.order_info.urgency)} order-card`}
            >
              {/* Order Header */}
              <Card.Header 
                className="cursor-pointer"
                onClick={() => toggleOrderExpansion(orderGroup.order_info.id)}
                style={{ cursor: 'pointer' }}
              >
                <div className="d-flex justify-content-between align-items-center">
                  <div className="d-flex align-items-center">
                    <FaBox className="me-2 text-primary" />
                    <div>
                      <h5 className="mb-1 fw-bold">
                        {orderGroup.order_info.order_number}
                      </h5>
                      <p className="mb-0 text-muted">
                        {orderGroup.order_info.customer_name}
                      </p>
                    </div>
                  </div>
                  
                  <div className="d-flex align-items-center gap-3">
                    <div className="text-end">
                      <Badge bg={getUrgencyColor(orderGroup.order_info.urgency)} className="mb-1">
                        {orderGroup.order_info.urgency?.toUpperCase()}
                      </Badge>
                      <div>
                        <small className="text-muted">
                          Due: {orderGroup.order_info.delivery_deadline || 'No deadline'}
                        </small>
                      </div>
                    </div>
                    
                    <div className="text-end">
                      <div className="fw-bold text-primary">
                        {orderGroup.tasks.length} task{orderGroup.tasks.length !== 1 ? 's' : ''}
                      </div>
                      <small className="text-muted">
                        {isExpanded ? '▼ Click to collapse' : '▶ Click to expand'}
                      </small>
                    </div>
                  </div>
                </div>

                {/* Task Status Summary */}
                <div className="mt-2">
                  <div className="d-flex gap-2 flex-wrap">
                    {statusCounts.assigned > 0 && (
                      <Badge bg="secondary" className="small">
                        {statusCounts.assigned} Assigned
                      </Badge>
                    )}
                    {statusCounts.started > 0 && (
                      <Badge bg="success" className="small">
                        {statusCounts.started} In Progress
                      </Badge>
                    )}
                    {statusCounts.paused > 0 && (
                      <Badge bg="warning" className="small">
                        {statusCounts.paused} Paused
                      </Badge>
                    )}
                    {statusCounts.completed > 0 && (
                      <Badge bg="info" className="small">
                        {statusCounts.completed} Completed
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Order Items Specifications (visible when expanded and details available) */}
                {isExpanded && orderDetailsMap[orderGroup.order_info.id]?.items && (
                  <div className="mt-3">
                    <small className="text-muted d-block mb-1">Order Items:</small>
                    <div className="d-flex flex-wrap gap-2">
                      {orderDetailsMap[orderGroup.order_info.id].items.map((item, idx) => (
                        <Badge key={idx} bg="light" text="dark" className="border">
                          {item.quantity}x {item.product_name || item.product}
                          {item.color && ` • Color: ${item.color_name || item.color}`}
                          {item.fabric && ` • Fabric: ${item.fabric_name || item.fabric}`}
                          {item.product_description && ` • ${item.product_description}`}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </Card.Header>

              {/* Tasks List */}
              {isExpanded && (
                <Card.Body className="bg-light">
                  <Row>
                    {orderGroup.tasks.map((task) => (
                      <Col lg={6} key={task.id} className="mb-3">
                        <TaskCard 
                          task={task}
                          onTaskUpdate={handleTaskUpdate}
                          showOrderInfo={false}
                          compact={true}
                          enableActions={true}
                        />
                      </Col>
                    ))}
                  </Row>
                </Card.Body>
              )}
            </Card>
          );
        })}
      </div>

      {filteredOrderTasks.length === 0 && (
        <div className="text-center py-5">
          <FaTasks size={60} className="text-muted mb-3" />
          <h4 className="text-muted mb-2">No tasks found</h4>
          <p className="text-muted">
            {filterStatus === 'all' 
              ? "You don't have any tasks assigned to you at the moment."
              : `No tasks with "${filterStatus}" status found.`
            }
          </p>
          {filterStatus !== 'all' && (
            <Button variant="outline-primary" onClick={() => setFilterStatus('all')}>
              Show All Tasks
            </Button>
          )}
        </div>
      )}

      <style jsx>{`
        .order-card {
          transition: all 0.3s ease;
        }
        
        .order-card:hover {
          box-shadow: 0 4px 15px rgba(0,0,0,0.1) !important;
        }
        
        .cursor-pointer:hover {
          background-color: rgba(0,0,0,0.02);
        }
        
        .btn-group .btn {
          font-size: 0.9rem;
        }
        
        @media (max-width: 768px) {
          .btn-group {
            flex-wrap: wrap;
            gap: 0.25rem;
          }
          
          .btn-group .btn {
            font-size: 0.8rem;
            padding: 0.375rem 0.5rem;
          }
          
          .order-card .card-header {
            padding: 1rem;
          }
          
          .order-card .card-header h5 {
            font-size: 1.1rem;
          }
        }
      `}</style>
    </div>
  );
};

export default WorkerOrderTasks;