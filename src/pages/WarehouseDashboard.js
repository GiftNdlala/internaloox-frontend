import React, { useState, useEffect } from 'react';
import { 
  Container, Row, Col, Card, Button, Badge, 
  ProgressBar, Alert, Form, Modal 
} from 'react-bootstrap';
import { 
  FaWrench, FaBoxes, FaClock, FaPlay, FaPause, 
  FaCheck, FaExclamationTriangle, FaQrcode,
  FaEye, FaEdit, FaChevronRight, FaUser
} from 'react-icons/fa';
import { getOrders, getProducts } from '../components/api';

const WarehouseDashboard = ({ user, onLogout }) => {
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Real-time clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    fetchData();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [ordersData, productsData] = await Promise.all([
        getOrders(),
        getProducts()
      ]);
      setOrders(ordersData.results || ordersData);
      setProducts(productsData.results || productsData);
    } catch (err) {
      setError('Failed to load warehouse data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Industrial Header
  const IndustrialHeader = () => (
    <div className="warehouse-header mb-4" style={{
      background: 'linear-gradient(135deg, #1f2937 0%, #374151 100%)',
      color: 'white',
      borderRadius: '15px',
      padding: '2rem',
      border: '3px solid #10b981'
    }}>
      <Row className="align-items-center">
        <Col md={8}>
          <div className="d-flex align-items-center mb-3">
                          <FaWrench className="text-success me-3" size={50} />
            <div>
              <h1 className="mb-0" style={{ 
                fontWeight: '900', 
                fontSize: '2.5rem',
                textShadow: '2px 2px 4px rgba(0,0,0,0.5)'
              }}>
                PRODUCTION FLOOR
              </h1>
              <p className="mb-0 text-success" style={{ 
                fontSize: '1.2rem', 
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: '2px'
              }}>
                Warehouse Operations • {currentTime.toLocaleDateString()}
              </p>
            </div>
          </div>
        </Col>
        <Col md={4} className="text-end">
          <div className="d-flex flex-column">
            <Badge bg="success" className="mb-2" style={{ 
              fontSize: '1rem',
              padding: '8px 16px',
              borderRadius: '25px'
            }}>
              <FaUser className="me-2" />
              {user?.first_name || 'WORKER'} • {user?.role?.toUpperCase()}
            </Badge>
            <div className="text-light" style={{ fontSize: '1.1rem', fontWeight: '600' }}>
              <FaClock className="me-2" />
              {currentTime.toLocaleTimeString()}
            </div>
          </div>
        </Col>
      </Row>
    </div>
  );

  // Status Statistics Cards
  const StatusCard = ({ title, count, icon, color, bgColor }) => (
    <Card className="h-100 shadow-lg border-0" style={{
      background: `linear-gradient(135deg, ${bgColor}20 0%, ${bgColor}10 100%)`,
      borderLeft: `6px solid ${color}`,
      transform: 'scale(1.02)'
    }}>
      <Card.Body className="text-center p-4">
        <div className="mb-3">
          {React.createElement(icon, { size: 60, color: color })}
        </div>
        <h2 className="mb-2" style={{ 
          fontWeight: '900', 
          color: color,
          fontSize: '3rem',
          fontFamily: 'monospace',
          textShadow: '1px 1px 2px rgba(0,0,0,0.1)'
        }}>
          {count}
        </h2>
        <p className="mb-0" style={{ 
          fontSize: '1.1rem', 
          fontWeight: '700',
          textTransform: 'uppercase',
          letterSpacing: '1px'
        }}>
          {title}
        </p>
      </Card.Body>
    </Card>
  );

  // Large Action Button for mobile/tablet
  const ActionButton = ({ variant, size = 'lg', onClick, icon, children, disabled = false }) => (
    <Button
      variant={variant}
      size={size}
      onClick={onClick}
      disabled={disabled}
      className="w-100 mb-3 d-flex align-items-center justify-content-center"
      style={{
        height: '80px',
        fontSize: '1.2rem',
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: '1px',
        borderRadius: '15px',
        boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
        border: '3px solid transparent'
      }}
    >
      {icon && React.createElement(icon, { size: 24, className: 'me-3' })}
      {children}
    </Button>
  );

  // Order Card for Kanban Board
  const OrderCard = ({ order, onStatusUpdate, onViewDetails }) => {
    const getStatusColor = (status) => {
      switch (status) {
        case 'not_started': return '#6b7280';
        case 'in_production': return '#f59e0b';
        case 'ready_for_delivery': return '#10b981';
        default: return '#6b7280';
      }
    };

    const getNextStatus = (current) => {
      const statusFlow = {
        'not_started': 'in_production',
        'in_production': 'ready_for_delivery',
        'ready_for_delivery': null
      };
      return statusFlow[current];
    };

    const isOverdue = order.delivery_deadline && 
      new Date(order.delivery_deadline) < new Date() && 
      order.production_status !== 'ready_for_delivery';

    return (
      <Card className={`mb-3 shadow-sm ${isOverdue ? 'border-danger' : ''}`}
            style={{
              borderLeft: `5px solid ${getStatusColor(order.production_status)}`,
              cursor: 'pointer'
            }}>
        <Card.Body className="p-3">
          <div className="d-flex justify-content-between align-items-start mb-2">
            <h6 className="mb-0 fw-bold">{order.order_number}</h6>
            {isOverdue && (
              <Badge bg="danger" className="animate-pulse">
                <FaExclamationTriangle className="me-1" />
                OVERDUE
              </Badge>
            )}
          </div>
          
          <p className="text-muted mb-2" style={{ fontSize: '0.9rem' }}>
            {order.customer?.name || order.customer_name || 'Customer'}
          </p>
          
          <div className="mb-3">
            <small className="text-muted">Due: {order.delivery_deadline || 'No deadline'}</small>
          </div>

          <Row className="g-2">
            <Col>
              <ActionButton
                variant="outline-primary"
                size="sm"
                onClick={() => onViewDetails(order)}
                icon={FaEye}
              >
                Details
              </ActionButton>
            </Col>
            {getNextStatus(order.production_status) && (
              <Col>
                <ActionButton
                  variant={order.production_status === 'not_started' ? 'success' : 'warning'}
                  size="sm"
                  onClick={() => onStatusUpdate(order, getNextStatus(order.production_status))}
                  icon={order.production_status === 'not_started' ? FaPlay : 
                        order.production_status === 'in_production' ? FaCheck : FaPause}
                >
                  {order.production_status === 'not_started' ? 'START' :
                   order.production_status === 'in_production' ? 'FINISH' : 'DONE'}
                </ActionButton>
              </Col>
            )}
          </Row>
        </Card.Body>
      </Card>
    );
  };

  // Kanban Column
  const KanbanColumn = ({ title, status, orders, icon, color }) => (
    <Col lg={4} className="mb-4">
      <Card className="h-100 shadow-lg">
        <Card.Header 
          className="text-white text-center py-3"
          style={{ 
            backgroundColor: color,
            fontSize: '1.2rem',
            fontWeight: '700',
            textTransform: 'uppercase',
            letterSpacing: '1px'
          }}
        >
          {React.createElement(icon, { className: 'me-2', size: 24 })}
          {title}
          <Badge bg="light" text="dark" className="ms-2">
            {orders.length}
          </Badge>
        </Card.Header>
        <Card.Body style={{ 
          minHeight: '600px', 
          maxHeight: '600px', 
          overflowY: 'auto',
          backgroundColor: '#f8f9fa'
        }}>
          {orders.map(order => (
            <OrderCard
              key={order.id}
              order={order}
              onStatusUpdate={handleStatusUpdate}
              onViewDetails={handleViewDetails}
            />
          ))}
          {orders.length === 0 && (
            <div className="text-center text-muted py-5">
              <p>No orders in this stage</p>
            </div>
          )}
        </Card.Body>
      </Card>
    </Col>
  );

  const handleStatusUpdate = async (order, newStatus) => {
    try {
      // TODO: Implement API call to update production status
      setSuccess(`Order ${order.order_number} moved to ${newStatus.replace('_', ' ').toUpperCase()}`);
      setTimeout(() => setSuccess(null), 3000);
      fetchData(); // Refresh data
    } catch (err) {
      setError('Failed to update order status');
    }
  };

  const handleViewDetails = (order) => {
    setSelectedOrder(order);
    setShowDetailModal(true);
  };

  // Organize orders by production status
  const notStarted = orders.filter(o => o.production_status === 'not_started' || !o.production_status);
  const inProduction = orders.filter(o => o.production_status === 'in_production');
  const readyForDelivery = orders.filter(o => o.production_status === 'ready_for_delivery');

  if (loading) {
    return (
      <Container fluid className="p-4">
        <div className="text-center">
          <div className="spinner-border text-success" style={{ width: '3rem', height: '3rem' }} role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3 h5">Loading production floor...</p>
        </div>
      </Container>
    );
  }

  return (
    <Container fluid className="warehouse-dashboard" style={{ 
      backgroundColor: '#f1f5f9', 
      minHeight: '100vh',
      padding: '1rem'
    }}>
      <IndustrialHeader />

      {/* Error/Success Alerts */}
      {error && <Alert variant="danger" dismissible onClose={() => setError(null)}>{error}</Alert>}
      {success && <Alert variant="success" dismissible onClose={() => setSuccess(null)}>{success}</Alert>}

      {/* Status Overview Cards */}
      <Row className="mb-4">
        <Col md={4} className="mb-3">
          <StatusCard
            title="TO START"
            count={notStarted.length}
            icon={FaClock}
            color="#6b7280"
            bgColor="#6b7280"
          />
        </Col>
        <Col md={4} className="mb-3">
          <StatusCard
            title="IN PROGRESS"
            count={inProduction.length}
            icon={FaWrench}
            color="#f59e0b"
            bgColor="#fbbf24"
          />
        </Col>
        <Col md={4} className="mb-3">
          <StatusCard
            title="COMPLETED"
            count={readyForDelivery.length}
            icon={FaCheck}
            color="#10b981"
            bgColor="#34d399"
          />
        </Col>
      </Row>

      {/* Kanban Board */}
      <Row>
        <KanbanColumn
          title="🟡 NOT STARTED"
          status="not_started"
          orders={notStarted}
          icon={FaClock}
          color="#6b7280"
        />
        <KanbanColumn
          title="🟠 IN PRODUCTION"
          status="in_production"
          orders={inProduction}
          icon={FaWrench}
          color="#f59e0b"
        />
        <KanbanColumn
          title="🟢 READY FOR DELIVERY"
          status="ready_for_delivery"
          orders={readyForDelivery}
          icon={FaCheck}
          color="#10b981"
        />
      </Row>

      {/* Order Detail Modal */}
      <Modal 
        show={showDetailModal} 
        onHide={() => setShowDetailModal(false)} 
        size="lg"
        centered
      >
        <Modal.Header closeButton className="bg-dark text-white">
          <Modal.Title>
            <FaBoxes className="me-2" />
            Order Details: {selectedOrder?.order_number}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedOrder && (
            <>
              <Row className="mb-3">
                <Col md={6}>
                  <h6>Customer Information</h6>
                  <p><strong>Name:</strong> {selectedOrder.customer?.name || selectedOrder.customer_name}</p>
                  <p><strong>Phone:</strong> {selectedOrder.customer?.phone || 'N/A'}</p>
                </Col>
                <Col md={6}>
                  <h6>Order Information</h6>
                  <p><strong>Order #:</strong> {selectedOrder.order_number}</p>
                  <p><strong>Total Amount:</strong> R{selectedOrder.total_amount}</p>
                  <p><strong>Due Date:</strong> {selectedOrder.delivery_deadline}</p>
                </Col>
              </Row>
              
              <h6>Order Items</h6>
              {selectedOrder.items && selectedOrder.items.length > 0 ? (
                <div className="table-responsive">
                  <table className="table table-striped">
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th>Quantity</th>
                        <th>Fabric</th>
                        <th>Color</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedOrder.items.map((item, index) => (
                        <tr key={index}>
                          <td>{item.product_name}</td>
                          <td>{item.quantity}</td>
                          <td>{item.assigned_fabric_letter?.fabric_name || 'N/A'}</td>
                          <td>{item.assigned_color_code?.color_name || 'N/A'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-muted">No items found</p>
              )}
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDetailModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Custom Styles */}
      <style jsx>{`
        .warehouse-dashboard {
          font-family: 'Roboto', sans-serif;
        }
        .warehouse-header {
          animation: slideInDown 0.8s ease-out;
        }
        @keyframes slideInDown {
          from {
            opacity: 0;
            transform: translateY(-30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .card {
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(0,0,0,0.15) !important;
        }
        .btn {
          transition: all 0.2s ease;
        }
        .btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        }
        .animate-pulse {
          animation: pulse 2s infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        @media (max-width: 768px) {
          .warehouse-header {
            padding: 1.5rem !important;
          }
          .warehouse-header h1 {
            font-size: 1.8rem !important;
          }
        }
      `}</style>
    </Container>
  );
};

export default WarehouseDashboard; 