import React, { useState, useEffect } from 'react';
import {
  Container, Row, Col, Card, Button, Badge,
  Alert, Modal, Form, ProgressBar, ListGroup
} from 'react-bootstrap';
import {
  FaTruck, FaMapMarkerAlt, FaRoute, FaClock,
  FaCheckCircle, FaCamera, FaPhone, FaCompass,
  FaPlay, FaPause, FaFlag, FaUser, FaMoneyBillWave,
  FaClipboardCheck, FaExclamationTriangle
} from 'react-icons/fa';
import { getOrders } from '../components/api';

const DeliveryDashboard = ({ user, onLogout }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showPODModal, setShowPODModal] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeDelivery, setActiveDelivery] = useState(null);

  // Real-time clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000); // 1 minute
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    fetchOrders();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchOrders, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const ordersData = await getOrders();
      const deliveryOrders = (ordersData.results || ordersData).filter(
        order => order.production_status === 'ready_for_delivery' ||
                 order.order_status === 'out_for_delivery' ||
                 order.order_status === 'delivered'
      );
      setOrders(deliveryOrders);
    } catch (err) {
      setError('Failed to load delivery orders');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Delivery Header - UberEats style
  const DeliveryHeader = () => (
    <div className="delivery-header mb-4" style={{
      background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
      borderRadius: '20px',
      padding: '2rem',
      border: '2px solid #fbbf24',
      boxShadow: '0 10px 30px rgba(251, 191, 36, 0.1)'
    }}>
      <Row className="align-items-center">
        <Col md={8}>
          <div className="d-flex align-items-center mb-3">
            <div className="p-3 rounded-circle me-3" style={{
              backgroundColor: '#fbbf24',
              color: 'white'
            }}>
              <FaTruck size={30} />
            </div>
            <div>
              <h1 className="mb-0" style={{
                fontWeight: '700',
                fontSize: '2.2rem',
                color: '#1f2937'
              }}>
                OOX Furniture Delivery Hub
              </h1>
              <p className="mb-0" style={{
                fontSize: '1.1rem',
                color: '#6b7280',
                fontWeight: '500'
              }}>
                OOX Furniture Route Management • {currentTime.toLocaleDateString()}
              </p>
            </div>
          </div>
        </Col>
        <Col md={4} className="text-end">
          <div className="d-flex flex-column">
            <Badge
              style={{
                backgroundColor: '#fbbf24',
                color: '#1f2937',
                fontSize: '0.9rem',
                padding: '8px 16px',
                borderRadius: '25px',
                marginBottom: '8px'
              }}
            >
              <FaUser className="me-2" />
              {user?.first_name || 'Driver'} • {user?.role?.toUpperCase()}
            </Badge>
            <div style={{ color: '#6b7280', fontSize: '1rem', fontWeight: '600' }}>
              <FaClock className="me-2" />
              {currentTime.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}
            </div>
          </div>
        </Col>
      </Row>
    </div>
  );

  // Delivery Stats Cards
  const StatsCard = ({ title, value, icon, color, bgColor }) => (
    <Card className="h-100 shadow-sm border-0" style={{
      background: `linear-gradient(135deg, ${bgColor}15 0%, ${bgColor}05 100%)`,
      borderLeft: `4px solid ${color}`,
      borderRadius: '15px'
    }}>
      <Card.Body className="text-center p-4">
        <div className="mb-3">
          {React.createElement(icon, { size: 40, color: color })}
        </div>
        <h3 className="mb-1" style={{
          fontWeight: '700',
          color: color,
          fontSize: '2.5rem',
          fontFamily: 'monospace'
        }}>
          {value}
        </h3>
        <p className="mb-0" style={{
          fontSize: '0.9rem',
          fontWeight: '600',
          color: '#6b7280',
          textTransform: 'uppercase',
          letterSpacing: '0.5px'
        }}>
          {title}
        </p>
      </Card.Body>
    </Card>
  );

  // Large Delivery Action Button
  const DeliveryButton = ({ variant, onClick, icon, children, disabled = false, style = {} }) => (
    <Button
      variant={variant}
      onClick={onClick}
      disabled={disabled}
      className="w-100 mb-3 d-flex align-items-center justify-content-center"
      style={{
        height: '70px',
        fontSize: '1.1rem',
        fontWeight: '700',
        borderRadius: '15px',
        boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
        textTransform: 'uppercase',
        letterSpacing: '1px',
        ...style
      }}
    >
      {icon && React.createElement(icon, { size: 20, className: 'me-3' })}
      {children}
    </Button>
  );

  // Delivery Order Card - UberEats inspired
  const DeliveryOrderCard = ({ order, onStartDelivery, onViewDetails, onComplete }) => {
    const isActive = activeDelivery?.id === order.id;
    const isDelivered = order.order_status === 'delivered';
    const isInTransit = order.order_status === 'out_for_delivery';

    return (
      <Card className={`mb-3 shadow-sm ${isActive ? 'border-warning border-2' : ''}`}
            style={{
              borderRadius: '15px',
              overflow: 'hidden',
              border: isDelivered ? '2px solid #10b981' :
                      isInTransit ? '2px solid #fbbf24' : '1px solid #e5e7eb'
            }}>
        <Card.Body className="p-3">
          <Row className="align-items-center">
            <Col md={8}>
              <div className="d-flex align-items-center mb-2">
                <Badge
                  bg={isDelivered ? 'success' : isInTransit ? 'warning' : 'secondary'}
                  className="me-2 px-3 py-2"
                  style={{ fontSize: '0.8rem', borderRadius: '10px' }}
                >
                  {isDelivered ? 'DELIVERED' : isInTransit ? 'IN TRANSIT' : 'READY'}
                </Badge>
                <h6 className="mb-0 fw-bold">{order.order_number}</h6>
              </div>

              <div className="mb-2">
                <div className="d-flex align-items-center mb-1">
                  <FaUser className="text-muted me-2" size={14} />
                  <span className="fw-bold">{order.customer?.name || order.customer_name}</span>
                </div>
                <div className="d-flex align-items-center mb-1">
                  <FaPhone className="text-muted me-2" size={14} />
                  <span>{order.customer?.phone || 'No phone'}</span>
                </div>
                <div className="d-flex align-items-center">
                  <FaMapMarkerAlt className="text-muted me-2" size={14} />
                  <span className="text-muted small">
                    {order.customer?.address || 'Address not available'}
                  </span>
                </div>
              </div>

              <div className="d-flex align-items-center">
                <FaMoneyBillWave className="text-success me-2" size={14} />
                <span className="fw-bold text-success">R{order.total_amount}</span>
                <span className="text-muted ms-2 small">
                  {order.payment_status === 'fully_paid' ? '(Paid)' : '(Balance Due)'}
                </span>
              </div>
            </Col>

            <Col md={4}>
              {!isDelivered && !isInTransit && (
                <DeliveryButton
                  variant="warning"
                  onClick={() => onStartDelivery(order)}
                  icon={FaPlay}
                  style={{ height: '50px', fontSize: '0.9rem' }}
                >
                  Start Route
                </DeliveryButton>
              )}

              {isInTransit && (
                <DeliveryButton
                  variant="success"
                  onClick={() => onComplete(order)}
                  icon={FaCheckCircle}
                  style={{ height: '50px', fontSize: '0.9rem' }}
                >
                  Mark Delivered
                </DeliveryButton>
              )}

              {isDelivered && (
                <DeliveryButton
                  variant="outline-success"
                  onClick={() => onViewDetails(order)}
                  icon={FaClipboardCheck}
                  style={{ height: '50px', fontSize: '0.9rem' }}
                >
                  View POD
                </DeliveryButton>
              )}

              <Button
                variant="outline-primary"
                size="sm"
                onClick={() => onViewDetails(order)}
                className="w-100 mt-2"
                style={{ borderRadius: '10px' }}
              >
                <FaMapMarkerAlt className="me-1" />
                View Route
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>
    );
  };

  const handleStartDelivery = (order) => {
    setActiveDelivery(order);
    // TODO: Update order status to 'out_for_delivery'
    setSuccess(`Started delivery for ${order.order_number}`);
    setTimeout(() => setSuccess(null), 3000);
  };

  const handleCompleteDelivery = (order) => {
    setSelectedOrder(order);
    setShowPODModal(true);
  };

  const handleViewDetails = (order) => {
    setSelectedOrder(order);
    setShowDetailModal(true);
  };

  const openGoogleMaps = (address) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`;
    window.open(url, '_blank');
  };

  // Filter orders by status
  const readyOrders = orders.filter(o => o.production_status === 'ready_for_delivery' && o.order_status !== 'out_for_delivery');
  const inTransitOrders = orders.filter(o => o.order_status === 'out_for_delivery');
  const deliveredOrders = orders.filter(o => o.order_status === 'delivered');

  if (loading) {
    return (
      <Container fluid className="p-4">
        <div className="text-center">
          <div className="spinner-border text-warning" style={{ width: '3rem', height: '3rem' }} role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3 h5">Loading delivery routes...</p>
        </div>
      </Container>
    );
  }

  return (
    <Container fluid className="delivery-dashboard" style={{
      backgroundColor: '#f9fafb',
      minHeight: '100vh',
      padding: '1rem'
    }}>
      <DeliveryHeader />

      {/* Error/Success Alerts */}
      {error && <Alert variant="danger" dismissible onClose={() => setError(null)}>{error}</Alert>}
      {success && <Alert variant="success" dismissible onClose={() => setSuccess(null)}>{success}</Alert>}

      {/* Delivery Stats */}
      <Row className="mb-4">
        <Col md={4} className="mb-3">
          <StatsCard
            title="Ready to Deliver"
            value={readyOrders.length}
            icon={FaTruck}
            color="#6b7280"
            bgColor="#6b7280"
          />
        </Col>
        <Col md={4} className="mb-3">
          <StatsCard
            title="In Transit"
            value={inTransitOrders.length}
            icon={FaRoute}
            color="#fbbf24"
            bgColor="#fbbf24"
          />
        </Col>
        <Col md={4} className="mb-3">
          <StatsCard
            title="Delivered Today"
            value={deliveredOrders.length}
            icon={FaCheckCircle}
            color="#10b981"
            bgColor="#10b981"
          />
        </Col>
      </Row>

      {/* Active Delivery Section */}
      {activeDelivery && (
        <Card className="mb-4 shadow-lg border-warning border-2">
          <Card.Header className="bg-warning text-dark">
            <h5 className="mb-0">
              <FaCompass className="me-2" />
              Active Delivery: {activeDelivery.order_number}
            </h5>
          </Card.Header>
          <Card.Body>
            <Row>
              <Col md={8}>
                <h6>Customer: {activeDelivery.customer?.name}</h6>
                <p>Address: {activeDelivery.customer?.address}</p>
                <p>Phone: {activeDelivery.customer?.phone}</p>
              </Col>
              <Col md={4}>
                <DeliveryButton
                  variant="primary"
                  onClick={() => openGoogleMaps(activeDelivery.customer?.address)}
                  icon={FaMapMarkerAlt}
                >
                  Open in Maps
                </DeliveryButton>
                <DeliveryButton
                  variant="success"
                  onClick={() => handleCompleteDelivery(activeDelivery)}
                  icon={FaFlag}
                >
                  Mark as Delivered
                </DeliveryButton>
              </Col>
            </Row>
          </Card.Body>
        </Card>
      )}

      {/* Delivery Queue */}
      <Row>
        <Col>
          <Card className="shadow-sm">
            <Card.Header className="bg-primary text-white">
              <h5 className="mb-0">
                <FaTruck className="me-2" />
                Delivery Queue ({orders.length} orders)
              </h5>
            </Card.Header>
            <Card.Body style={{ maxHeight: '600px', overflowY: 'auto' }}>
              {orders.length > 0 ? (
                orders.map(order => (
                  <DeliveryOrderCard
                    key={order.id}
                    order={order}
                    onStartDelivery={handleStartDelivery}
                    onViewDetails={handleViewDetails}
                    onComplete={handleCompleteDelivery}
                  />
                ))
              ) : (
                <div className="text-center text-muted py-5">
                  <FaTruck size={50} className="mb-3 opacity-50" />
                  <p>No deliveries available</p>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Order Detail Modal */}
      <Modal show={showDetailModal} onHide={() => setShowDetailModal(false)} size="lg" centered>
        <Modal.Header closeButton className="bg-primary text-white">
          <Modal.Title>
            <FaMapMarkerAlt className="me-2" />
            Delivery Details: {selectedOrder?.order_number}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedOrder && (
            <>
              <Row className="mb-3">
                <Col md={6}>
                  <h6>Customer Information</h6>
                  <ListGroup variant="flush">
                    <ListGroup.Item><strong>Name:</strong> {selectedOrder.customer?.name}</ListGroup.Item>
                    <ListGroup.Item><strong>Phone:</strong> {selectedOrder.customer?.phone}</ListGroup.Item>
                    <ListGroup.Item><strong>Address:</strong> {selectedOrder.customer?.address}</ListGroup.Item>
                  </ListGroup>
                </Col>
                <Col md={6}>
                  <h6>Order Information</h6>
                  <ListGroup variant="flush">
                    <ListGroup.Item><strong>Order #:</strong> {selectedOrder.order_number}</ListGroup.Item>
                    <ListGroup.Item><strong>Amount:</strong> R{selectedOrder.total_amount}</ListGroup.Item>
                    <ListGroup.Item><strong>Payment:</strong> {selectedOrder.payment_status}</ListGroup.Item>
                  </ListGroup>
                </Col>
              </Row>

              <div className="text-center">
                <DeliveryButton
                  variant="primary"
                  onClick={() => openGoogleMaps(selectedOrder.customer?.address)}
                  icon={FaCompass}
                >
                  Open Navigation
                </DeliveryButton>
              </div>
            </>
          )}
        </Modal.Body>
      </Modal>

      {/* Proof of Delivery Modal */}
      <Modal show={showPODModal} onHide={() => setShowPODModal(false)} size="lg" centered>
        <Modal.Header closeButton className="bg-success text-white">
          <Modal.Title>
            <FaCamera className="me-2" />
            Proof of Delivery: {selectedOrder?.order_number}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Upload Photo</Form.Label>
              <Form.Control type="file" accept="image/*" capture="environment" />
              <Form.Text className="text-muted">
                Take a photo of the delivered items or signed receipt
              </Form.Text>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Delivery Notes</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                placeholder="Any special notes about the delivery..."
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                label="Customer received all items and is satisfied"
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowPODModal(false)}>
            Cancel
          </Button>
          <Button
            variant="success"
            onClick={() => {
              setShowPODModal(false);
              setActiveDelivery(null);
              setSuccess('Delivery completed successfully!');
              setTimeout(() => setSuccess(null), 3000);
              fetchOrders();
            }}
          >
            <FaCheckCircle className="me-2" />
            Complete Delivery
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Custom Styles */}
      <style jsx>{`
        .delivery-dashboard {
          font-family: 'Inter', sans-serif;
        }
        .delivery-header {
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
          box-shadow: 0 8px 25px rgba(0,0,0,0.1) !important;
        }
        .btn {
          transition: all 0.2s ease;
        }
        .btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        }
        @media (max-width: 768px) {
          .delivery-header {
            padding: 1.5rem !important;
          }
          .delivery-header h1 {
            font-size: 1.8rem !important;
          }
        }
      `}</style>
    </Container>
  );
};

export default DeliveryDashboard; 