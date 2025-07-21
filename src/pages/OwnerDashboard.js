import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Container, Row, Col, Card, Nav, Button, 
  Table, Modal, Form, Alert, Badge, Dropdown,
  Navbar, NavDropdown, ButtonGroup, ProgressBar
} from 'react-bootstrap';
import { 
  FaUsers, FaBoxes, FaTruck, FaChartLine, 
  FaPlus, FaEdit, FaTrash, FaCog, FaSignOutAlt,
  FaUserShield, FaClipboardList, FaMoneyBillWave,
  FaFileAlt, FaDownload, FaEye, FaArrowUp,
  FaArrowDown, FaStar, FaCircle, FaChartBar,
  FaCalendarCheck, FaClock, FaExclamationTriangle
} from 'react-icons/fa';
import OrderForm from '../components/OrderForm';
import OrderDetail from '../components/OrderDetail';
import { getDashboardStats, getUsers, getOrders, deleteUser, createOrder, createUser, updateUser, deleteOrder, updateOrder, getOrder } from '../components/api';

const OwnerDashboard = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState({});
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Real-time clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000); // 1 minute
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    fetchDashboardData();
    // Auto-refresh every 30 seconds for live data
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [statsData, usersData, ordersData] = await Promise.all([
        getDashboardStats(),
        getUsers(),
        getOrders()
      ]);
      setStats(statsData);
      setUsers(usersData.results || usersData);
      setOrders(ordersData.results || ordersData);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const getGreeting = () => {
    const hour = currentTime.getHours();
    const name = user?.first_name || user?.username || 'Owner';
    if (hour < 12) return `Good morning, ${name}`;
    if (hour < 18) return `Good afternoon, ${name}`;
    return `Good evening, ${name}`;
  };

  const formatCurrency = (amount) => `R${Number(amount).toLocaleString()}`;

  // Calculate KPIs
  const totalRevenue = orders.reduce((sum, order) => sum + parseFloat(order.total_amount || 0), 0);
  const avgOrderValue = orders.length ? totalRevenue / orders.length : 0;
  const todayOrders = orders.filter(order => 
    new Date(order.created_at).toDateString() === new Date().toDateString()
  ).length;

  // Executive Header with live greeting and credentials
  const ExecutiveHeader = () => (
    <div className="owner-header mb-4" style={{
      background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
      color: 'white',
      borderRadius: '15px',
      padding: '2rem',
      boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
    }}>
      <Row className="align-items-center">
        <Col md={8}>
          <div className="d-flex align-items-center mb-3">
                            <FaStar className="text-warning me-3" size={40} />
            <div>
              <h2 className="mb-0" style={{ fontWeight: '700', fontSize: '2.2rem' }}>
                {getGreeting()}
              </h2>
              <p className="mb-0 text-warning" style={{ fontSize: '1.1rem' }}>
                Executive Dashboard • {currentTime.toLocaleDateString('en-ZA', { 
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
            <Badge bg="warning" className="mb-2" style={{ fontSize: '0.9rem' }}>
              <FaUserShield className="me-1" />
              {user?.role?.toUpperCase() || 'OWNER'}
            </Badge>
            <small className="text-light">
              Last login: {new Date().toLocaleString()}
            </small>
            <small className="text-light">
              <FaClock className="me-1" />
                              {currentTime.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}
            </small>
          </div>
        </Col>
      </Row>
    </div>
  );

  // Animated KPI Cards
  const KPICard = ({ title, value, change, icon, color, prefix = '' }) => (
    <Card className="h-100 shadow-sm border-0" style={{
      background: `linear-gradient(135deg, ${color}15 0%, ${color}05 100%)`,
      borderLeft: `4px solid ${color}`
    }}>
      <Card.Body className="text-center">
        <div className="mb-3">
          {React.createElement(icon, { size: 40, color: color })}
        </div>
        <h3 className="mb-1" style={{ 
          fontWeight: '700', 
          color: color,
          fontSize: '2rem',
          fontFamily: 'monospace'
        }}>
          {prefix}{typeof value === 'number' ? value.toLocaleString() : value}
        </h3>
        <p className="text-muted mb-2" style={{ fontSize: '0.9rem', fontWeight: '500' }}>
          {title}
        </p>
        {change !== undefined && (
          <div className={`small ${change >= 0 ? 'text-success' : 'text-danger'}`}>
            {change >= 0 ? <FaArrowUp /> : <FaArrowDown />}
            <span className="ms-1">{Math.abs(change)}%</span>
          </div>
        )}
      </Card.Body>
    </Card>
  );

  // Live Order Activity Feed
  const OrderActivityFeed = () => (
    <Card className="h-100 shadow-sm">
      <Card.Header className="bg-dark text-white">
        <FaClipboardList className="me-2" />
        Live Order Activity
        <Badge bg="warning" className="ms-2">LIVE</Badge>
      </Card.Header>
      <Card.Body style={{ maxHeight: '400px', overflowY: 'auto' }}>
        {orders.slice(0, 5).map((order, index) => (
          <div key={order.id} className="d-flex align-items-center mb-3 p-2 rounded" 
               style={{ backgroundColor: index % 2 === 0 ? '#f8f9fa' : 'white' }}>
            <div className="me-3">
              <div className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center"
                   style={{ width: '40px', height: '40px', fontSize: '0.8rem' }}>
                {order.order_number?.slice(-3) || '###'}
              </div>
            </div>
            <div className="flex-grow-1">
              <div className="fw-bold">{order.customer?.name || 'Customer'}</div>
              <small className="text-muted">
                {formatCurrency(order.total_amount)} • {new Date(order.created_at).toLocaleDateString()}
              </small>
            </div>
            <Badge bg={
              order.production_status === 'ready_for_delivery' ? 'success' :
              order.production_status === 'in_production' ? 'warning' : 'secondary'
            }>
              {order.production_status?.replace('_', ' ').toUpperCase() || 'PENDING'}
            </Badge>
          </div>
        ))}
      </Card.Body>
    </Card>
  );

  // Performance Charts Placeholder
  const PerformanceCharts = () => (
    <Card className="shadow-sm">
      <Card.Header className="bg-primary text-white">
        <FaChartLine className="me-2" />
        Business Performance
      </Card.Header>
      <Card.Body>
        <Row>
          <Col md={6}>
            <h6>Revenue Trend (Last 7 Days)</h6>
            <div className="text-center p-4" style={{ 
              background: 'linear-gradient(45deg, #f59e0b, #f97316)', 
              borderRadius: '10px',
              color: 'white'
            }}>
              <FaChartBar size={50} />
              <p className="mt-2 mb-0">Chart Integration Ready</p>
              <small>Connect to Supabase real-time</small>
            </div>
          </Col>
          <Col md={6}>
            <h6>Production Pipeline</h6>
            <div className="mb-2">
              <small>Not Started</small>
              <ProgressBar variant="secondary" now={30} className="mb-1" />
            </div>
            <div className="mb-2">
              <small>In Production</small>
              <ProgressBar variant="warning" now={60} className="mb-1" />
            </div>
            <div className="mb-2">
              <small>Ready for Delivery</small>
              <ProgressBar variant="success" now={80} className="mb-1" />
            </div>
          </Col>
        </Row>
      </Card.Body>
    </Card>
  );

  // Mobile-optimized navigation
  const MobileNav = () => (
    <Nav variant="pills" className="mb-4 flex-nowrap" style={{ overflowX: 'auto' }}>
      {[
        { key: 'overview', label: 'Overview', icon: FaChartLine, isTab: true },
        { key: 'orders', label: 'Orders', icon: FaClipboardList, isTab: false, route: '/owner/orders' },
        { key: 'payments', label: 'Payments', icon: FaMoneyBillWave, isTab: false, route: '/owner/payments' },
        { key: 'deliveries', label: 'Deliveries', icon: FaTruck, isTab: false, route: '/owner/deliveries' },
        { key: 'analytics', label: 'Analytics', icon: FaChartBar, isTab: false, route: '/owner/analytics' },
      ].map(tab => (
        <Nav.Link
          key={tab.key}
          active={activeTab === tab.key}
          onClick={() => tab.isTab ? setActiveTab(tab.key) : navigate(tab.route)}
          className="d-flex align-items-center text-nowrap me-2"
          style={{
            backgroundColor: activeTab === tab.key ? '#1e293b' : 'transparent',
            color: activeTab === tab.key ? 'white' : '#1e293b',
            border: `2px solid ${activeTab === tab.key ? '#1e293b' : '#e2e8f0'}`,
            borderRadius: '25px',
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
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3">Loading executive dashboard...</p>
        </div>
      </Container>
    );
  }

  return (
    <Container fluid className="owner-dashboard" style={{ backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      {/* Executive Header */}
      <ExecutiveHeader />

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
                     onClick={() => navigate('/owner/orders')}
                     className="d-flex align-items-center"
                   >
                     <FaClipboardList className="me-2" />
                     Manage Orders
                   </Button>
                   <Button
                     variant="success"
                     size="lg"
                     onClick={() => navigate('/owner/customers')}
                     className="d-flex align-items-center"
                   >
                     <FaUsers className="me-2" />
                     Customers
                   </Button>
                   <Button
                     variant="info"
                     size="lg"
                     onClick={() => navigate('/owner/payments')}
                     className="d-flex align-items-center"
                   >
                     <FaMoneyBillWave className="me-2" />
                     Payments
                   </Button>
                                       <Button
                      variant="warning"
                      size="lg"
                      onClick={() => navigate('/owner/deliveries')}
                      className="d-flex align-items-center"
                    >
                      <FaTruck className="me-2" />
                      Deliveries
                    </Button>
                    <Button
                      variant="secondary"
                      size="lg"
                      onClick={() => navigate('/owner/analytics')}
                      className="d-flex align-items-center"
                    >
                      <FaChartBar className="me-2" />
                      Analytics
                    </Button>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Mobile Navigation */}
      <MobileNav />

      {/* Error/Success Alerts */}
      {error && <Alert variant="danger" dismissible onClose={() => setError(null)}>{error}</Alert>}
      {success && <Alert variant="success" dismissible onClose={() => setSuccess(null)}>{success}</Alert>}

      {/* Dashboard Content */}
      {activeTab === 'overview' && (
        <>
          {/* KPI Cards Row */}
          <Row className="mb-4">
            <Col xl={3} md={6} className="mb-3">
              <KPICard
                title="Total Revenue"
                value={totalRevenue}
                change={12}
                icon={FaMoneyBillWave}
                color="#f59e0b"
                prefix="R"
              />
            </Col>
            <Col xl={3} md={6} className="mb-3">
              <KPICard
                title="Total Orders"
                value={orders.length}
                change={8}
                icon={FaClipboardList}
                color="#3b82f6"
              />
            </Col>
            <Col xl={3} md={6} className="mb-3">
              <KPICard
                title="Today's Orders"
                value={todayOrders}
                change={-2}
                icon={FaCalendarCheck}
                color="#10b981"
              />
            </Col>
            <Col xl={3} md={6} className="mb-3">
              <KPICard
                title="Avg Order Value"
                value={Math.round(avgOrderValue)}
                change={15}
                                  icon={FaCircle}
                color="#8b5cf6"
                prefix="R"
              />
            </Col>
          </Row>

          {/* Performance Dashboard Row */}
          <Row className="mb-4">
            <Col lg={8} className="mb-3">
              <PerformanceCharts />
            </Col>
            <Col lg={4} className="mb-3">
              <OrderActivityFeed />
            </Col>
          </Row>
        </>
      )}

      {/* Add other tab content here */}
      {activeTab !== 'overview' && (
        <Card className="text-center p-5">
          <h4>Coming Soon</h4>
          <p className="text-muted">This section is being enhanced with executive-level features</p>
        </Card>
      )}

      {/* Custom Styles */}
      <style jsx>{`
        .owner-dashboard {
          font-family: 'Inter', sans-serif;
        }
        .owner-header {
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
        @media (max-width: 768px) {
          .owner-header {
            padding: 1.5rem !important;
          }
          .owner-header h2 {
            font-size: 1.5rem !important;
          }
        }
      `}</style>
    </Container>
  );
};

export default OwnerDashboard; 