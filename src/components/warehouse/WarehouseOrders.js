import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Badge, Row, Col, Spinner, Alert } from 'react-bootstrap';
import { FaBoxes, FaEye, FaPlus, FaSync, FaExclamationTriangle } from 'react-icons/fa';
import { usePolling } from '../../hooks/usePolling';
import { getWarehouseOrders } from '../api';

const WarehouseOrders = () => {
  const navigate = useNavigate();
  const [selectedUrgency, setSelectedUrgency] = useState('all');
  
  const { data, loading, error, refresh } = usePolling(
    () => getWarehouseOrders(),
    30000 // Refresh every 30 seconds
  );

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

  const handleOrderClick = (orderId) => {
    navigate(`/orders/${orderId}/assign-tasks`);
  };

  const handleViewDetails = (orderId) => {
    navigate(`/orders/${orderId}/details`);
  };

  const filterOrders = (orders) => {
    if (selectedUrgency === 'all') return orders;
    return orders.filter(order => order.urgency === selectedUrgency);
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <div className="text-center">
          <Spinner animation="border" variant="primary" style={{ width: '3rem', height: '3rem' }} />
          <p className="mt-3 h5">Loading warehouse orders...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="danger" className="m-4">
        <Alert.Heading>Error Loading Orders</Alert.Heading>
        <p>{error}</p>
        <Button variant="outline-danger" onClick={refresh}>
          <FaSync className="me-2" />
          Retry
        </Button>
      </Alert>
    );
  }

  const { orders = [], summary = {} } = data || {};
  const filteredOrders = filterOrders(orders);

  return (
    <div className="warehouse-orders p-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-1">
            <FaBoxes className="me-2 text-primary" />
            Orders for Today
          </h2>
          <p className="text-muted mb-0">
            {summary.total_orders} total orders • Ready for warehouse processing
          </p>
        </div>
        <Button variant="outline-primary" onClick={refresh}>
          <FaSync className="me-2" />
          Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      <Row className="mb-4">
        <Col md={3} sm={6} className="mb-3">
          <Card className="text-center h-100 border-0 shadow-sm">
            <Card.Body>
              <h3 className="text-primary mb-1">{summary.total_orders || 0}</h3>
              <small className="text-muted">Total Orders</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3} sm={6} className="mb-3">
          <Card className="text-center h-100 border-0 shadow-sm bg-danger-subtle">
            <Card.Body>
              <h3 className="text-danger mb-1">{summary.critical || 0}</h3>
              <small className="text-danger">Critical</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3} sm={6} className="mb-3">
          <Card className="text-center h-100 border-0 shadow-sm bg-warning-subtle">
            <Card.Body>
              <h3 className="text-warning mb-1">{summary.high || 0}</h3>
              <small className="text-warning">High Priority</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3} sm={6} className="mb-3">
          <Card className="text-center h-100 border-0 shadow-sm bg-info-subtle">
            <Card.Body>
              <h3 className="text-info mb-1">{summary.medium || 0}</h3>
              <small className="text-info">Medium Priority</small>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Filter Buttons */}
      <div className="mb-4">
        <div className="btn-group" role="group">
          <Button 
            variant={selectedUrgency === 'all' ? 'primary' : 'outline-primary'}
            onClick={() => setSelectedUrgency('all')}
          >
            All ({orders.length})
          </Button>
          <Button 
            variant={selectedUrgency === 'critical' ? 'danger' : 'outline-danger'}
            onClick={() => setSelectedUrgency('critical')}
          >
            Critical ({summary.critical || 0})
          </Button>
          <Button 
            variant={selectedUrgency === 'high' ? 'warning' : 'outline-warning'}
            onClick={() => setSelectedUrgency('high')}
          >
            High ({summary.high || 0})
          </Button>
          <Button 
            variant={selectedUrgency === 'medium' ? 'info' : 'outline-info'}
            onClick={() => setSelectedUrgency('medium')}
          >
            Medium ({summary.medium || 0})
          </Button>
          <Button 
            variant={selectedUrgency === 'low' ? 'success' : 'outline-success'}
            onClick={() => setSelectedUrgency('low')}
          >
            Low ({summary.low || 0})
          </Button>
        </div>
      </div>

      {/* Orders Grid */}
      <Row>
        {filteredOrders.map((order) => (
          <Col lg={4} md={6} key={order.id} className="mb-4">
            <Card 
              className={`h-100 shadow-sm border-start border-4 ${getUrgencyBgColor(order.urgency)} order-card`}
              style={{ cursor: 'pointer' }}
            >
              <Card.Body className="d-flex flex-column">
                {/* Order Header */}
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <div>
                    <h5 className="mb-1 fw-bold">{order.order_number}</h5>
                    <p className="text-muted mb-0">{order.customer_name}</p>
                  </div>
                  <div className="text-end">
                    <Badge bg={getUrgencyColor(order.urgency)} className="mb-1">
                      {order.urgency?.toUpperCase()}
                    </Badge>
                    {order.days_until_deadline <= 2 && (
                      <div>
                        <Badge bg="danger" className="small">
                          <FaExclamationTriangle className="me-1" />
                          {order.days_until_deadline} days left
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>

                {/* Order Details */}
                <div className="mb-3 flex-grow-1">
                  <Row className="g-2 mb-2">
                    <Col xs={6}>
                      <small className="text-muted">Items:</small>
                      <div className="fw-semibold">{order.items_count}</div>
                    </Col>
                    <Col xs={6}>
                      <small className="text-muted">Amount:</small>
                      <div className="fw-semibold">R{order.total_amount?.toFixed(2)}</div>
                    </Col>
                  </Row>
                  <Row className="g-2">
                    <Col xs={12}>
                      <small className="text-muted">Deadline:</small>
                      <div className="fw-semibold">
                        {order.delivery_deadline || 'No deadline set'}
                      </div>
                    </Col>
                  </Row>
                </div>

                {/* Task Progress */}
                <div className="mb-3">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <small className="text-muted fw-semibold">Task Progress</small>
                    <small className="text-muted">
                      {order.task_counts?.completed || 0}/{order.task_counts?.total || 0}
                    </small>
                  </div>
                  
                  {order.task_counts?.total > 0 ? (
                    <div>
                      <div className="progress mb-2" style={{ height: '6px' }}>
                        <div
                          className="progress-bar bg-success"
                          style={{
                            width: `${((order.task_counts.completed || 0) / order.task_counts.total) * 100}%`
                          }}
                        ></div>
                      </div>
                      <div className="d-flex justify-content-between text-xs">
                        <span className="small text-muted">
                          In Progress: {order.task_counts.in_progress || 0}
                        </span>
                        <span className="small text-muted">
                          Pending: {order.task_counts.not_started || 0}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-2">
                      <Badge bg="light" text="dark" className="mb-2">
                        No tasks assigned
                      </Badge>
                      <div>
                        <small className="text-primary">Click to assign tasks</small>
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="d-grid gap-2">
                  <Button
                    variant="primary"
                    onClick={() => handleOrderClick(order.id)}
                    className="d-flex align-items-center justify-content-center"
                  >
                    <FaPlus className="me-2" />
                    Assign Tasks
                  </Button>
                  <Button
                    variant="outline-primary"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleViewDetails(order.id);
                    }}
                    className="d-flex align-items-center justify-content-center"
                  >
                    <FaEye className="me-2" />
                    View Details
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      {filteredOrders.length === 0 && (
        <div className="text-center py-5">
          <FaBoxes size={60} className="text-muted mb-3" />
          <h4 className="text-muted mb-2">No orders found</h4>
          <p className="text-muted">
            {selectedUrgency === 'all' 
              ? 'All orders are either completed or not ready for warehouse processing.'
              : `No orders with ${selectedUrgency} priority found.`
            }
          </p>
          {selectedUrgency !== 'all' && (
            <Button variant="outline-primary" onClick={() => setSelectedUrgency('all')}>
              Show All Orders
            </Button>
          )}
        </div>
      )}

      <style jsx>{`
        .order-card {
          transition: all 0.3s ease;
        }
        
        .order-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 15px rgba(0,0,0,0.1) !important;
        }
        
        .progress {
          border-radius: 10px;
        }
        
        .progress-bar {
          border-radius: 10px;
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
        }
      `}</style>
    </div>
  );
};

export default WarehouseOrders;