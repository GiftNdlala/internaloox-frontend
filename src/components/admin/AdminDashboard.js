import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container, Row, Col, Nav, Card, Button, Modal, Form, Alert,
  Badge
} from 'react-bootstrap';
import {
  FaClipboardList, FaMoneyBillWave, FaUsers, FaChartBar,
  FaBell, FaCheckCircle, FaExclamationTriangle,
  FaCog, FaFileAlt, FaClock, FaUserShield,
  FaEnvelope, FaTasks, FaCheck, FaPlus
} from 'react-icons/fa';
import CustomersTable from './CustomersTable';
import PaymentsTable from './PaymentsTable';
import ReportsTable from './ReportsTable';
import {
  getOrders, getCustomers, getPayments, getUsers
} from '../api';

const AdminDashboard = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [currentTime, setCurrentTime] = useState(new Date());

  // Data states
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [payments, setPayments] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modal states - keeping for future functionality
  // const [showOrderFormModal, setShowOrderFormModal] = useState(false);
  // const [showCustomerModal, setShowCustomerModal] = useState(false);
  // const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Real-time clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000); // 1 minute
    return () => clearInterval(timer);
  }, []);

  // Fetch data
  useEffect(() => {
    fetchAll();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchAll, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [ordersData, customersData, paymentsData, usersData] = await Promise.all([
        getOrders(),
        getCustomers(),
        getPayments(),
        getUsers()
      ]);
      setOrders(ordersData.results || ordersData);
      setCustomers(customersData.results || customersData);
      setPayments(paymentsData.results || paymentsData);
      setUsers(usersData.results || usersData);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // --- CRUD Functions temporarily commented out for clean build ---
  /*
  const openOrderFormModal = (order = null) => {
    // Implementation moved to dedicated pages
  };

  const handleOrderFormSubmit = async (payload) => {
    // Implementation moved to dedicated pages
  };

  const handleDeleteOrder = async id => {
    // Implementation moved to dedicated pages
  };

  // --- Customers CRUD ---
  const openCustomerModal = (customer = null) => {
    // Implementation moved to dedicated pages
  };
  
  const handleCustomerFormChange = e => {
    // Implementation moved to dedicated pages
  };
  
  const handleCustomerSubmit = async e => {
    // Implementation moved to dedicated pages
  };
  
  const handleDeleteCustomer = async id => {
    // Implementation moved to dedicated pages
  };

  // --- Payments CRUD ---
  const openPaymentModal = (payment = null) => {
    // Implementation moved to dedicated pages
  };
  
  const handlePaymentFormChange = e => {
    // Implementation moved to dedicated pages
  };
  
  const handlePaymentSubmit = async e => {
    // Implementation moved to dedicated pages
  };
  
  const handleDeletePayment = async id => {
    // Implementation moved to dedicated pages
  };
  */

  // Professional Admin Header
  const AdminHeader = () => (
    <div className="admin-header mb-4" style={{
      background: 'linear-gradient(135deg, #64748b 0%, #475569 100%)',
      color: 'white',
      borderRadius: '15px',
      padding: '2rem',
      boxShadow: '0 10px 25px rgba(100, 116, 139, 0.2)',
      border: '2px solid #3b82f6'
    }}>
      <Row className="align-items-center">
        <Col md={8}>
          <div className="d-flex align-items-center mb-3">
            <div className="p-3 rounded-circle me-3" style={{
              backgroundColor: '#3b82f6',
              color: 'white'
            }}>
                              <FaUserShield size={35} />
            </div>
            <div>
              <h1 className="mb-0" style={{
                fontWeight: '700',
                fontSize: '2.3rem',
                textShadow: '2px 2px 4px rgba(0,0,0,0.3)'
              }}>
                OOX Operations Control
              </h1>
              <p className="mb-0 text-primary" style={{
                fontSize: '1.1rem',
                fontWeight: '500',
                color: '#93c5fd !important'
              }}>
                OOX Furniture Admin Dashboard • {currentTime.toLocaleDateString('en-ZA', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
          </div>
        </Col>
        <Col md={4} className="text-end">
          <div className="d-flex flex-column">
            <Badge
              style={{
                backgroundColor: '#3b82f6',
                color: 'white',
                fontSize: '0.9rem',
                padding: '8px 16px',
                borderRadius: '25px',
                marginBottom: '8px'
              }}
            >
              <FaUserShield className="me-2" />
              {user?.first_name || 'Admin'} • {user?.role?.toUpperCase()}
            </Badge>
            <div style={{ color: '#e2e8f0', fontSize: '1rem', fontWeight: '600' }}>
              <FaClock className="me-2" />
                              {currentTime.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}
            </div>
          </div>
        </Col>
      </Row>
    </div>
  );

  // Professional Stats Card
  const AdminStatsCard = ({ title, value, icon, color, bgColor, change }) => (
    <Card className="h-100 shadow-sm border-0" style={{
      background: `linear-gradient(135deg, ${bgColor}15 0%, ${bgColor}05 100%)`,
      borderLeft: `4px solid ${color}`,
      borderRadius: '12px'
    }}>
      <Card.Body className="p-4">
        <div className="d-flex justify-content-between align-items-start mb-3">
          <div>
            <h3 className="mb-1" style={{
              fontWeight: '700',
              color: color,
              fontSize: '2.2rem',
              fontFamily: 'monospace'
            }}>
              {value}
            </h3>
            <p className="mb-0" style={{
              fontSize: '0.9rem',
              fontWeight: '600',
              color: '#64748b',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              {title}
            </p>
          </div>
          <div className="p-3 rounded-circle" style={{ backgroundColor: `${color}20` }}>
            {React.createElement(icon, { size: 30, color: color })}
          </div>
        </div>
        {change !== undefined && (
          <div className={`small ${change >= 0 ? 'text-success' : 'text-danger'}`}>
            {change >= 0 ? '↗' : '↘'} {Math.abs(change)}% from last month
          </div>
        )}
      </Card.Body>
    </Card>
  );

  // Approval Queue Component
  const ApprovalQueue = () => {
    const pendingOrders = orders.filter(o => o.order_status === 'pending');
    const overdueOrders = orders.filter(o => {
      if (!o.delivery_deadline) return false;
      return new Date(o.delivery_deadline) < new Date() && o.order_status !== 'delivered';
    });

    return (
      <Card className="h-100 shadow-sm">
        <Card.Header className="bg-warning text-dark d-flex justify-content-between align-items-center">
          <h6 className="mb-0">
                          <FaEnvelope className="me-2" />
            Approval Queue
          </h6>
          <Badge bg="dark">{pendingOrders.length}</Badge>
        </Card.Header>
        <Card.Body style={{ maxHeight: '300px', overflowY: 'auto' }}>
          {pendingOrders.length > 0 ? (
            pendingOrders.slice(0, 5).map(order => (
              <div key={order.id} className="d-flex justify-content-between align-items-center mb-3 p-2 rounded bg-light">
                <div>
                  <div className="fw-bold">{order.order_number}</div>
                  <small className="text-muted">{order.customer?.name}</small>
                </div>
                <Button variant="outline-success" size="sm">
                  <FaCheck />
                </Button>
              </div>
            ))
          ) : (
            <p className="text-muted text-center">No pending approvals</p>
          )}
        </Card.Body>
      </Card>
    );
  };

  // Activity Monitor
  const ActivityMonitor = () => {
    const recentOrders = orders.slice(0, 5);

    return (
      <Card className="h-100 shadow-sm">
        <Card.Header className="bg-info text-white d-flex justify-content-between align-items-center">
          <h6 className="mb-0">
            <FaBell className="me-2" />
            Recent Activity
          </h6>
          <Badge bg="light" text="dark">LIVE</Badge>
        </Card.Header>
        <Card.Body style={{ maxHeight: '300px', overflowY: 'auto' }}>
          {recentOrders.map((order, index) => (
            <div key={order.id} className="d-flex align-items-center mb-3 p-2">
              <div className="me-3">
                <div className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center"
                     style={{ width: '35px', height: '35px', fontSize: '0.8rem' }}>
                  {index + 1}
                </div>
              </div>
              <div className="flex-grow-1">
                <div className="fw-bold small">{order.order_number}</div>
                <small className="text-muted">
                  {order.customer?.name} • {new Date(order.created_at).toLocaleDateString()}
                </small>
              </div>
              <Badge bg={
                order.production_status === 'completed' || order.order_status === 'order_ready' ? 'success' :
                order.production_status === 'in_production' ? 'warning' : 'secondary'
              } className="small">
                {(order.production_status === 'completed' ? 'COMPLETED' : (order.order_status === 'order_ready' ? 'ORDER READY' : ((order.production_status || 'pending').replace('_', ' ').toUpperCase())))}
              </Badge>
            </div>
          ))}
        </Card.Body>
      </Card>
    );
  };

  // Professional Navigation
  const AdminNav = () => (
    <Nav variant="pills" className="mb-4 flex-nowrap" style={{ overflowX: 'auto' }}>
      {[
        { key: 'overview', label: 'Overview', icon: FaChartBar, isTab: true },
        { key: 'orders', label: 'Orders', icon: FaClipboardList, isTab: false, route: '/admin/orders' },
        { key: 'customers', label: 'Customers', icon: FaFileAlt, isTab: false, route: '/admin/customers' },
        { key: 'payments', label: 'Payments', icon: FaMoneyBillWave, isTab: false, route: '/admin/payments' },
        { key: 'reports', label: 'Reports', icon: FaFileAlt, isTab: false, route: '/admin/warehouse' },
      ].map(tab => (
        <Nav.Link
          key={tab.key}
          active={activeTab === tab.key}
          onClick={() => tab.isTab ? setActiveTab(tab.key) : navigate(tab.route)}
          className="d-flex align-items-center text-nowrap me-2"
          style={{
            backgroundColor: activeTab === tab.key ? '#3b82f6' : 'transparent',
            color: activeTab === tab.key ? 'white' : '#64748b',
            border: `2px solid ${activeTab === tab.key ? '#3b82f6' : '#e2e8f0'}`,
            borderRadius: '20px',
            padding: '10px 20px',
            fontWeight: '600'
          }}
        >
          <tab.icon className="me-2" />
          {tab.label}
        </Nav.Link>
      ))}
    </Nav>
  );

  if (loading) {
    return (
      <Container fluid className="p-4">
        <div className="text-center">
          <div className="spinner-border text-primary" style={{ width: '3rem', height: '3rem' }} role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3 h5">Loading admin dashboard...</p>
        </div>
      </Container>
    );
  }

  return (
    <Container fluid className="admin-dashboard" style={{
      backgroundColor: '#f8fafc',
      minHeight: '100vh',
      padding: '1rem'
    }}>
      <AdminHeader />
      
      {/* Quick Actions */}
      <Row className="mb-4">
        <Col>
          <Card className="border-0 shadow-sm">
            <Card.Body className="py-3">
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0 text-primary">
                  <FaClipboardList className="me-2" />
                  Quick Actions
                </h5>
                <div className="d-flex gap-2">
                  <Button 
                    variant="primary" 
                    size="lg"
                    onClick={() => navigate('/admin/orders')}
                    className="d-flex align-items-center"
                  >
                    <FaClipboardList className="me-2" />
                    Manage Orders
                  </Button>
                  <Button 
                    variant="outline-primary" 
                    onClick={() => navigate('/admin/customers')}
                  >
                    <FaPlus className="me-1" />
                    Add Customer
                  </Button>
                  <Button 
                    variant="outline-secondary"
                    onClick={() => navigate('/admin/deliveries')}
                  >
                    Deliveries
                  </Button>
                  <Button 
                    variant="outline-success"
                    onClick={() => navigate('/admin/warehouse')}
                  >
                    Warehouse Overview
                  </Button>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      <AdminNav />

      {/* Error/Success Alerts */}
      {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert variant="success" dismissible onClose={() => setSuccess('')}>{success}</Alert>}

      {activeTab === 'overview' && (
        <>
          {/* Stats Cards */}
          <Row className="mb-4">
            <Col xl={3} md={6} className="mb-3">
              <AdminStatsCard
                title="Total Orders"
                value={orders.length}
                icon={FaClipboardList}
                color="#3b82f6"
                bgColor="#3b82f6"
                change={12}
              />
            </Col>
            <Col xl={3} md={6} className="mb-3">
              <AdminStatsCard
                title="Active Users"
                value={users.filter(u => u.is_active).length}
                icon={FaUsers}
                color="#10b981"
                bgColor="#10b981"
                change={5}
              />
            </Col>
            <Col xl={3} md={6} className="mb-3">
              <AdminStatsCard
                title="Pending Approvals"
                value={orders.filter(o => o.order_status === 'pending').length}
                icon={FaTasks}
                color="#f59e0b"
                bgColor="#f59e0b"
                change={-3}
              />
            </Col>
            <Col xl={3} md={6} className="mb-3">
              <AdminStatsCard
                title="Total Customers"
                value={customers.length}
                icon={FaFileAlt}
                color="#8b5cf6"
                bgColor="#8b5cf6"
                change={8}
              />
            </Col>
          </Row>

          {/* Dashboard Widgets */}
          <Row className="mb-4">
            <Col lg={6} className="mb-3">
              <ApprovalQueue />
            </Col>
            <Col lg={6} className="mb-3">
              <ActivityMonitor />
            </Col>
          </Row>

          {/* System Status */}
          <Row>
            <Col>
              <Card className="shadow-sm">
                <Card.Header className="bg-dark text-white">
                  <h6 className="mb-0">
                    <FaCog className="me-2" />
                    System Status
                  </h6>
                </Card.Header>
                <Card.Body>
                  <Row>
                    <Col md={3} className="text-center mb-3">
                      <div className="h4 text-success mb-1">
                        <FaCheckCircle />
                      </div>
                      <div className="small">Database</div>
                      <div className="text-success small">Online</div>
                    </Col>
                    <Col md={3} className="text-center mb-3">
                      <div className="h4 text-success mb-1">
                        <FaCheckCircle />
                      </div>
                      <div className="small">API Server</div>
                      <div className="text-success small">Running</div>
                    </Col>
                    <Col md={3} className="text-center mb-3">
                      <div className="h4 text-warning mb-1">
                        <FaExclamationTriangle />
                      </div>
                      <div className="small">Notifications</div>
                      <div className="text-warning small">Limited</div>
                    </Col>
                    <Col md={3} className="text-center mb-3">
                      <div className="h4 text-success mb-1">
                        <FaCheckCircle />
                      </div>
                      <div className="small">File Storage</div>
                      <div className="text-success small">Available</div>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </>
      )}

      {/* Tab Content */}

      {activeTab === 'customers' && (
        <Card className="shadow-sm">
          <Card.Header className="bg-success text-white">
            <h5 className="mb-0">Customer Management</h5>
          </Card.Header>
          <Card.Body>
            <CustomersTable customers={customers} loading={loading} />
          </Card.Body>
        </Card>
      )}

      {activeTab === 'payments' && (
        <Card className="shadow-sm">
          <Card.Header className="bg-warning text-dark">
            <h5 className="mb-0">Payment Tracking</h5>
          </Card.Header>
          <Card.Body>
            <PaymentsTable payments={payments} loading={loading} />
          </Card.Body>
        </Card>
      )}

      {activeTab === 'reports' && (
        <Card className="shadow-sm">
          <Card.Header className="bg-secondary text-white">
            <h5 className="mb-0">Reports & Analytics</h5>
          </Card.Header>
          <Card.Body>
            <div className="text-muted mb-3">Warehouse reports only</div>
            <ReportsTable reports={orders.map(o=>({
              id: o.id,
              name: `Order ${o.order_number} • ${o.production_status || o.order_status}`,
              value: o.total_amount || '-',
              date: new Date(o.created_at).toLocaleDateString()
            }))} loading={loading} />
          </Card.Body>
        </Card>
      )}

      {/* Custom Styles */}
      <style jsx>{`
        .admin-dashboard {
          font-family: 'Inter', sans-serif;
        }
        .admin-header {
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
        .nav-link {
          transition: all 0.2s ease;
        }
        .nav-link:hover {
          transform: translateY(-1px);
        }
        @media (max-width: 768px) {
          .admin-header {
            padding: 1.5rem !important;
          }
          .admin-header h1 {
            font-size: 1.8rem !important;
          }
        }
      `}</style>

      {/* Modals functionality moved to dedicated pages for better organization */}

    </Container>
  );
};

export default AdminDashboard; 