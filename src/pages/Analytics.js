import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Table, Spinner, ProgressBar, Form, Button, Badge, ButtonGroup, OverlayTrigger, Tooltip, Alert } from 'react-bootstrap';
import {
  FaChartLine, FaMoneyBillWave, FaUsers, FaClipboardList,
  FaTruck, FaArrowUp, FaArrowDown, FaChartBar, FaCalendarAlt, FaSync, FaDownload, 
  FaFilter, FaEquals, FaBoxes, FaClock, FaCheckCircle, FaExclamationTriangle, 
  FaStar, FaEye, FaFileAlt, FaPrint, FaChartPie
} from 'react-icons/fa';
import UniversalSidebar from '../components/UniversalSidebar';
import EnhancedPageHeader from '../components/EnhancedPageHeader';
import SharedHeader from '../components/SharedHeader';
import { getOrders, getCustomers, getUsers, getDashboardStats } from '../components/api';

const Analytics = ({ user, userRole, onLogout }) => {
  const navigate = useNavigate();
  
  // State management
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filter states
  const [dateRange, setDateRange] = useState('30'); // days

  // Load data on component mount
  useEffect(() => {
    fetchAllData();
    // Auto-refresh every 60 seconds
    const interval = setInterval(fetchAllData, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const [ordersData, customersData, usersData] = await Promise.all([
        getOrders(),
        getCustomers(),
        getUsers()
      ]);
      setOrders(ordersData.results || ordersData);
      setCustomers(customersData.results || customersData);
      setUsers(usersData.results || usersData);
      setError('');
    } catch (err) {
      setError('Failed to load analytics data: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Date filtering helper
  const filterByDateRange = (items, dateField = 'created_at') => {
    if (!dateRange || dateRange === 'all') return items;
    
    const now = new Date();
    const daysAgo = parseInt(dateRange);
    const cutoffDate = new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000));
    
    return items.filter(item => {
      const itemDate = new Date(item[dateField]);
      return itemDate >= cutoffDate;
    });
  };

  // Analytics calculations
  const getFinancialMetrics = () => {
    const filteredOrders = filterByDateRange(orders, 'order_date');
    
    const totalRevenue = filteredOrders.reduce((sum, order) => 
      sum + (parseFloat(order.total_amount) || 0), 0);
    
    const totalDeposits = filteredOrders.reduce((sum, order) => 
      sum + (parseFloat(order.deposit_amount) || 0), 0);
    
    const outstandingBalance = filteredOrders.reduce((sum, order) => 
      sum + (parseFloat(order.balance_amount) || 0), 0);
    
    const averageOrderValue = filteredOrders.length > 0 ? totalRevenue / filteredOrders.length : 0;
    
    const paidOrders = filteredOrders.filter(o => o.payment_status === 'paid');
    const paidRevenue = paidOrders.reduce((sum, order) => 
      sum + (parseFloat(order.total_amount) || 0), 0);
    
    return {
      totalRevenue,
      totalDeposits,
      outstandingBalance,
      averageOrderValue,
      paidRevenue,
      totalOrders: filteredOrders.length,
      paidOrders: paidOrders.length,
      collectionRate: filteredOrders.length > 0 ? (paidOrders.length / filteredOrders.length) * 100 : 0
    };
  };

  const getOrderMetrics = () => {
    const filteredOrders = filterByDateRange(orders, 'order_date');
    
    const statusCounts = {
      pending: filteredOrders.filter(o => o.order_status === 'pending').length,
      confirmed: filteredOrders.filter(o => o.order_status === 'confirmed').length,
      in_production: filteredOrders.filter(o => o.production_status === 'in_production').length,
      ready_for_delivery: filteredOrders.filter(o => o.production_status === 'ready_for_delivery').length,
      delivered: filteredOrders.filter(o => o.order_status === 'delivered').length,
      cancelled: filteredOrders.filter(o => o.order_status === 'cancelled').length
    };

    const overdue = filteredOrders.filter(o => {
      if (!o.expected_delivery_date) return false;
      const expectedDate = new Date(o.expected_delivery_date);
      const today = new Date();
      return expectedDate < today && o.order_status !== 'delivered';
    }).length;

    return { ...statusCounts, overdue, total: filteredOrders.length };
  };

  const getCustomerMetrics = () => {
    const filteredCustomers = filterByDateRange(customers);
    const customersWithOrders = customers.filter(c => 
      orders.some(o => o.customer?.id === c.id)
    );
    
    const customerOrderCounts = customers.map(customer => {
      const customerOrders = orders.filter(o => o.customer?.id === customer.id);
      const totalValue = customerOrders.reduce((sum, order) => 
        sum + (parseFloat(order.total_amount) || 0), 0);
      return { ...customer, orderCount: customerOrders.length, totalValue };
    });

    const topCustomers = customerOrderCounts
      .sort((a, b) => b.totalValue - a.totalValue)
      .slice(0, 5);

    return {
      total: customers.length,
      new: filteredCustomers.length,
      active: customersWithOrders.length,
      withEmail: customers.filter(c => c.email).length,
      topCustomers,
      retentionRate: customers.length > 0 ? (customersWithOrders.length / customers.length) * 100 : 0
    };
  };

  const getProductionMetrics = () => {
    const productionStatuses = {
      not_started: orders.filter(o => o.production_status === 'not_started' || !o.production_status).length,
      in_production: orders.filter(o => o.production_status === 'in_production').length,
      ready_for_delivery: orders.filter(o => o.production_status === 'ready_for_delivery').length,
      completed: orders.filter(o => o.order_status === 'delivered').length
    };

    const avgProductionTime = 5; // This would be calculated from actual production data
    const onTimeDelivery = orders.filter(o => o.order_status === 'delivered').length;
    const totalDelivered = orders.filter(o => o.order_status === 'delivered').length;
    const onTimeRate = totalDelivered > 0 ? (onTimeDelivery / totalDelivered) * 100 : 0;

    return { ...productionStatuses, avgProductionTime, onTimeRate };
  };

  const getTeamMetrics = () => {
    const roleStats = {
      owner: users.filter(u => u.role === 'owner').length,
      admin: users.filter(u => u.role === 'admin').length,
      warehouse: users.filter(u => u.role === 'warehouse').length,
      delivery: users.filter(u => u.role === 'delivery').length
    };

    const activeUsers = users.filter(u => u.is_active).length;
    const recentLogins = users.filter(u => {
      if (!u.last_login) return false;
      const loginDate = new Date(u.last_login);
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      return loginDate > weekAgo;
    }).length;

    return { ...roleStats, active: activeUsers, total: users.length, recentLogins };
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR'
    }).format(amount || 0);
  };

  // Format percentage
  const formatPercentage = (value) => {
    return `${Math.round(value || 0)}%`;
  };

  // Get trend indicator
  const getTrendIndicator = (current, previous) => {
    if (current > previous) return { icon: FaArrowUp, color: 'success', direction: 'up' };
    if (current < previous) return { icon: FaArrowDown, color: 'danger', direction: 'down' };
    return { icon: FaEquals, color: 'secondary', direction: 'same' };
  };

  const financial = getFinancialMetrics();
  const orderStats = getOrderMetrics();
  const customerStats = getCustomerMetrics();
  const production = getProductionMetrics();
  const team = getTeamMetrics();

  if (loading && orders.length === 0) {
    return (
      <Container fluid className="py-4 text-center">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2">Loading analytics...</p>
      </Container>
    );
  }

  return (
    <>
      <UniversalSidebar user={user} userRole={userRole} onLogout={onLogout} />
      <div className="main-content">
        <SharedHeader 
          user={user} 
          onLogout={onLogout} 
          dashboardType={userRole} 
        />
        
        <Container fluid className="py-4">
        {/* Enhanced Header */}
        <EnhancedPageHeader
          title="OOX Furniture - Business Analytics"
          subtitle="OOX Furniture comprehensive business intelligence and performance metrics"
          icon={FaChartLine}
          onRefresh={fetchAllData}
          accentColor="#f59e0b"
        >
          <div className="d-flex gap-3 justify-content-end align-items-center">
            <Form.Select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              style={{ 
                width: '150px',
                borderRadius: '12px',
                border: '2px solid #f59e0b40',
                fontWeight: '600'
              }}
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 3 months</option>
              <option value="365">Last year</option>
              <option value="all">All time</option>
            </Form.Select>
            <Button 
              variant="primary"
              className="d-flex align-items-center"
              style={{
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                border: 'none',
                borderRadius: '12px',
                padding: '0.75rem 1.5rem',
                fontWeight: '600',
                boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
              onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
            >
              <FaDownload className="me-2" />
              Export Report
            </Button>
          </div>
        </EnhancedPageHeader>

        {/* Error Alert */}
        {error && (
          <Alert variant="danger" dismissible onClose={() => setError('')}>
            <FaExclamationTriangle className="me-2" />
            {error}
          </Alert>
        )}

        {/* Key Performance Indicators */}
        <Row className="mb-4">
          <Col md={3}>
            <Card className="border-0 shadow-sm h-100">
              <Card.Body className="text-center">
                <FaMoneyBillWave size={40} className="text-success mb-3" />
                <h3 className="text-success mb-1">{formatCurrency(financial.totalRevenue)}</h3>
                <p className="text-muted mb-2">Total Revenue</p>
                                 <div className="d-flex align-items-center justify-content-center">
                   <FaArrowUp className="text-success me-1" size={14} />
                   <small className="text-success">+12% vs last period</small>
                 </div>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="border-0 shadow-sm h-100">
              <Card.Body className="text-center">
                <FaClipboardList size={40} className="text-primary mb-3" />
                <h3 className="text-primary mb-1">{financial.totalOrders}</h3>
                <p className="text-muted mb-2">Total Orders</p>
                                 <div className="d-flex align-items-center justify-content-center">
                   <FaArrowUp className="text-success me-1" size={14} />
                   <small className="text-success">+8% vs last period</small>
                 </div>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="border-0 shadow-sm h-100">
              <Card.Body className="text-center">
                <FaUsers size={40} className="text-info mb-3" />
                <h3 className="text-info mb-1">{customerStats.total}</h3>
                <p className="text-muted mb-2">Total Customers</p>
                                 <div className="d-flex align-items-center justify-content-center">
                   <FaArrowUp className="text-success me-1" size={14} />
                   <small className="text-success">+{customerStats.new} new</small>
                 </div>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="border-0 shadow-sm h-100">
              <Card.Body className="text-center">
                <FaChartLine size={40} className="text-warning mb-3" />
                <h3 className="text-warning mb-1">{formatCurrency(financial.averageOrderValue)}</h3>
                <p className="text-muted mb-2">Avg Order Value</p>
                <div className="d-flex align-items-center justify-content-center">
                  <FaEquals className="text-secondary me-1" size={14} />
                  <small className="text-secondary">Stable</small>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Financial Overview */}
        <Row className="mb-4">
          <Col md={8}>
            <Card className="border-0 shadow-sm h-100">
              <Card.Header className="bg-white border-bottom">
                <div className="d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">
                    <FaMoneyBillWave className="me-2 text-success" />
                    Financial Overview
                  </h5>
                  <ButtonGroup size="sm">
                    <Button variant="outline-secondary">
                      <FaEye className="me-1" />
                      Details
                    </Button>
                    <Button variant="outline-secondary">
                      <FaPrint className="me-1" />
                      Print
                    </Button>
                  </ButtonGroup>
                </div>
              </Card.Header>
              <Card.Body>
                <Row>
                  <Col md={6}>
                    <div className="mb-4">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <span className="text-muted">Total Revenue</span>
                        <span className="fw-bold text-success">{formatCurrency(financial.totalRevenue)}</span>
                      </div>
                      <ProgressBar variant="success" now={100} height={8} />
                    </div>
                    <div className="mb-4">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <span className="text-muted">Collected</span>
                        <span className="fw-bold text-info">{formatCurrency(financial.paidRevenue)}</span>
                      </div>
                      <ProgressBar 
                        variant="info" 
                        now={(financial.paidRevenue / financial.totalRevenue) * 100} 
                        height={8} 
                      />
                    </div>
                    <div className="mb-4">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <span className="text-muted">Outstanding</span>
                        <span className="fw-bold text-warning">{formatCurrency(financial.outstandingBalance)}</span>
                      </div>
                      <ProgressBar 
                        variant="warning" 
                        now={(financial.outstandingBalance / financial.totalRevenue) * 100} 
                        height={8} 
                      />
                    </div>
                  </Col>
                  <Col md={6}>
                    <div className="mb-3">
                      <div className="d-flex justify-content-between align-items-center">
                        <span className="text-muted">Collection Rate</span>
                        <Badge bg="success" className="fs-6">{formatPercentage(financial.collectionRate)}</Badge>
                      </div>
                    </div>
                    <div className="mb-3">
                      <div className="d-flex justify-content-between align-items-center">
                        <span className="text-muted">Average Order Value</span>
                        <span className="fw-bold">{formatCurrency(financial.averageOrderValue)}</span>
                      </div>
                    </div>
                    <div className="mb-3">
                      <div className="d-flex justify-content-between align-items-center">
                        <span className="text-muted">Orders Paid</span>
                        <span className="fw-bold">{financial.paidOrders} / {financial.totalOrders}</span>
                      </div>
                    </div>
                    <div className="mb-3">
                      <div className="d-flex justify-content-between align-items-center">
                        <span className="text-muted">Deposits Collected</span>
                        <span className="fw-bold">{formatCurrency(financial.totalDeposits)}</span>
                      </div>
                    </div>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </Col>
          <Col md={4}>
            <Card className="border-0 shadow-sm h-100">
              <Card.Header className="bg-white border-bottom">
                <h5 className="mb-0">
                  <FaChartPie className="me-2 text-primary" />
                  Order Status Breakdown
                </h5>
              </Card.Header>
              <Card.Body>
                <div className="mb-3">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <div className="d-flex align-items-center">
                      <div className="bg-warning rounded me-2" style={{width: '12px', height: '12px'}}></div>
                      <span className="text-muted">Pending</span>
                    </div>
                    <Badge bg="warning">{orderStats.pending}</Badge>
                  </div>
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <div className="d-flex align-items-center">
                      <div className="bg-info rounded me-2" style={{width: '12px', height: '12px'}}></div>
                      <span className="text-muted">In Production</span>
                    </div>
                    <Badge bg="info">{orderStats.in_production}</Badge>
                  </div>
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <div className="d-flex align-items-center">
                      <div className="bg-primary rounded me-2" style={{width: '12px', height: '12px'}}></div>
                      <span className="text-muted">Ready for Delivery</span>
                    </div>
                    <Badge bg="primary">{orderStats.ready_for_delivery}</Badge>
                  </div>
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <div className="d-flex align-items-center">
                      <div className="bg-success rounded me-2" style={{width: '12px', height: '12px'}}></div>
                      <span className="text-muted">Delivered</span>
                    </div>
                    <Badge bg="success">{orderStats.delivered}</Badge>
                  </div>
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <div className="d-flex align-items-center">
                      <div className="bg-danger rounded me-2" style={{width: '12px', height: '12px'}}></div>
                      <span className="text-muted">Overdue</span>
                    </div>
                    <Badge bg="danger">{orderStats.overdue}</Badge>
                  </div>
                </div>
                <hr />
                <div className="text-center">
                  <h4 className="text-primary">{orderStats.total}</h4>
                  <p className="text-muted mb-0">Total Orders</p>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Customer & Production Analytics */}
        <Row className="mb-4">
          <Col md={6}>
            <Card className="border-0 shadow-sm h-100">
              <Card.Header className="bg-white border-bottom">
                <h5 className="mb-0">
                  <FaUsers className="me-2 text-info" />
                  Customer Analytics
                </h5>
              </Card.Header>
              <Card.Body>
                <Row className="mb-3">
                  <Col xs={6}>
                    <div className="text-center">
                      <h4 className="text-info">{customerStats.total}</h4>
                      <small className="text-muted">Total Customers</small>
                    </div>
                  </Col>
                  <Col xs={6}>
                    <div className="text-center">
                      <h4 className="text-success">{customerStats.active}</h4>
                      <small className="text-muted">Active Customers</small>
                    </div>
                  </Col>
                </Row>
                <div className="mb-3">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="text-muted">Customer Retention Rate</span>
                    <Badge bg="success">{formatPercentage(customerStats.retentionRate)}</Badge>
                  </div>
                  <ProgressBar variant="success" now={customerStats.retentionRate} height={6} />
                </div>
                <div className="mb-3">
                  <div className="d-flex justify-content-between align-items-center">
                    <span className="text-muted">Customers with Email</span>
                    <span className="fw-bold">{customerStats.withEmail}</span>
                  </div>
                </div>
                <div>
                  <div className="d-flex justify-content-between align-items-center">
                    <span className="text-muted">New Customers (Period)</span>
                    <Badge bg="info">{customerStats.new}</Badge>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col md={6}>
            <Card className="border-0 shadow-sm h-100">
              <Card.Header className="bg-white border-bottom">
                <h5 className="mb-0">
                  <FaBoxes className="me-2 text-warning" />
                  Production Metrics
                </h5>
              </Card.Header>
              <Card.Body>
                <Row className="mb-3">
                  <Col xs={6}>
                    <div className="text-center">
                      <h4 className="text-warning">{production.in_production}</h4>
                      <small className="text-muted">In Production</small>
                    </div>
                  </Col>
                  <Col xs={6}>
                    <div className="text-center">
                      <h4 className="text-success">{production.completed}</h4>
                      <small className="text-muted">Completed</small>
                    </div>
                  </Col>
                </Row>
                <div className="mb-3">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="text-muted">On-Time Delivery Rate</span>
                    <Badge bg="success">{formatPercentage(production.onTimeRate)}</Badge>
                  </div>
                  <ProgressBar variant="success" now={production.onTimeRate} height={6} />
                </div>
                <div className="mb-3">
                  <div className="d-flex justify-content-between align-items-center">
                    <span className="text-muted">Not Started</span>
                    <Badge bg="secondary">{production.not_started}</Badge>
                  </div>
                </div>
                <div>
                  <div className="d-flex justify-content-between align-items-center">
                    <span className="text-muted">Ready for Delivery</span>
                    <Badge bg="primary">{production.ready_for_delivery}</Badge>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Top Customers & Team Analytics */}
        <Row className="mb-4">
          <Col md={8}>
            <Card className="border-0 shadow-sm h-100">
              <Card.Header className="bg-white border-bottom">
                <h5 className="mb-0">
                  <FaStar className="me-2 text-warning" />
                  Top Customers by Revenue
                </h5>
              </Card.Header>
              <Card.Body className="p-0">
                <div className="table-responsive">
                  <Table className="mb-0">
                    <thead className="bg-light">
                      <tr>
                        <th>Rank</th>
                        <th>Customer</th>
                        <th>Orders</th>
                        <th>Total Revenue</th>
                        <th>Avg Order Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {customerStats.topCustomers.map((customer, index) => (
                        <tr key={customer.id}>
                          <td>
                            <Badge bg={index === 0 ? 'warning' : index === 1 ? 'secondary' : 'light'}>
                              #{index + 1}
                            </Badge>
                          </td>
                          <td>
                            <div className="d-flex align-items-center">
                              <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-3" 
                                   style={{ width: '32px', height: '32px', fontSize: '0.9rem', fontWeight: 'bold' }}>
                                {customer.name?.charAt(0)?.toUpperCase() || 'C'}
                              </div>
                              <div>
                                <div className="fw-medium">{customer.name}</div>
                                <small className="text-muted">{customer.phone}</small>
                              </div>
                            </div>
                          </td>
                          <td>
                            <Badge bg="info">{customer.orderCount}</Badge>
                          </td>
                          <td>
                            <span className="fw-bold text-success">{formatCurrency(customer.totalValue)}</span>
                          </td>
                          <td>
                            <span className="text-muted">
                              {formatCurrency(customer.orderCount > 0 ? customer.totalValue / customer.orderCount : 0)}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {customerStats.topCustomers.length === 0 && (
                        <tr>
                          <td colSpan="5" className="text-center text-muted py-4">
                            No customer data available
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </Table>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col md={4}>
            <Card className="border-0 shadow-sm h-100">
              <Card.Header className="bg-white border-bottom">
                <h5 className="mb-0">
                  <FaUsers className="me-2 text-secondary" />
                  Team Overview
                </h5>
              </Card.Header>
              <Card.Body>
                <div className="mb-4">
                  <div className="text-center">
                    <h3 className="text-primary">{team.total}</h3>
                    <p className="text-muted mb-0">Total Team Members</p>
                  </div>
                </div>
                
                <div className="mb-3">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="text-muted">Active Users</span>
                    <Badge bg="success">{team.active}</Badge>
                  </div>
                </div>
                
                <div className="mb-3">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="text-muted">Recent Logins (7 days)</span>
                    <Badge bg="info">{team.recentLogins}</Badge>
                  </div>
                </div>

                <hr />
                
                <div className="mb-2">
                  <div className="d-flex justify-content-between align-items-center">
                    <span className="text-muted">Owners</span>
                    <Badge bg="warning">{team.owner}</Badge>
                  </div>
                </div>
                <div className="mb-2">
                  <div className="d-flex justify-content-between align-items-center">
                    <span className="text-muted">Admins</span>
                    <Badge bg="primary">{team.admin}</Badge>
                  </div>
                </div>
                <div className="mb-2">
                  <div className="d-flex justify-content-between align-items-center">
                    <span className="text-muted">Warehouse</span>
                    <Badge bg="success">{team.warehouse}</Badge>
                  </div>
                </div>
                <div>
                  <div className="d-flex justify-content-between align-items-center">
                    <span className="text-muted">Delivery</span>
                    <Badge bg="info">{team.delivery}</Badge>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Quick Actions */}
        <Row>
          <Col>
            <Card className="border-0 shadow-sm">
              <Card.Header className="bg-white border-bottom">
                <h5 className="mb-0">
                  <FaFileAlt className="me-2 text-primary" />
                  Quick Actions
                </h5>
              </Card.Header>
              <Card.Body>
                <div className="d-flex gap-3 flex-wrap">
                  <Button variant="primary" onClick={() => navigate('/owner/orders')}>
                    <FaClipboardList className="me-2" />
                    View All Orders
                  </Button>
                  <Button variant="success" onClick={() => navigate('/owner/customers')}>
                    <FaUsers className="me-2" />
                    Manage Customers
                  </Button>
                  <Button variant="info" onClick={() => navigate('/owner/payments')}>
                    <FaMoneyBillWave className="me-2" />
                    Payment Overview
                  </Button>
                  <Button variant="warning" onClick={() => navigate('/owner/deliveries')}>
                    <FaTruck className="me-2" />
                    Delivery Status
                  </Button>
                  <Button variant="outline-secondary">
                    <FaDownload className="me-2" />
                    Export Full Report
                  </Button>
                  <Button variant="outline-secondary">
                    <FaPrint className="me-2" />
                    Print Dashboard
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
        </Container>
      </div>
    </>
  );
};

export default Analytics;