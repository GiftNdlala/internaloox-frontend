import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container, Row, Col, Card, Button, Table, Modal, Form,
  Badge, InputGroup, Alert, Spinner, ButtonGroup, 
  OverlayTrigger, Tooltip, Tabs, Tab
} from 'react-bootstrap';
import {
  FaMoneyBillWave, FaPlus, FaEdit, FaTrash, FaEye, FaSearch,
  FaCalendarAlt, FaSync, FaDownload, FaCheck, FaExclamationTriangle,
  FaSortUp, FaSortDown, FaCreditCard, FaReceipt, FaChartLine,
  FaFileInvoice, FaWallet, FaExchangeAlt, FaClock, FaCheckCircle
} from 'react-icons/fa';
import { 
  getOrders, getCustomers, updateOrder
} from '../components/api';
import SharedHeader from '../components/SharedHeader';
import EnhancedPageHeader from '../components/EnhancedPageHeader';
import UniversalSidebar from '../components/UniversalSidebar';

const Payments = ({ user, userRole, onLogout }) => {
  const navigate = useNavigate();
  
  // State management
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modal states
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Form state
  const [paymentForm, setPaymentForm] = useState({
    deposit_amount: '',
    balance_amount: '',
    payment_status: '',
    payment_method: '',
    payment_notes: ''
  });

  // Filter and search states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortField, setSortField] = useState('order_date');
  const [sortDirection, setSortDirection] = useState('desc');
  const [activeTab, setActiveTab] = useState('all');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [paymentsPerPage] = useState(10);

  // Load data on component mount
  useEffect(() => {
    fetchAllData();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchAllData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const [ordersData, customersData] = await Promise.all([
        getOrders(),
        getCustomers()
      ]);
      setOrders(ordersData.results || ordersData);
      setCustomers(customersData.results || customersData);
      setError('');
    } catch (err) {
      setError('Failed to load data: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Payment status configuration
  const paymentStatusConfig = {
    pending: { label: 'Pending', color: 'warning', icon: FaClock },
    partial: { label: 'Partial', color: 'info', icon: FaExchangeAlt },
    paid: { label: 'Paid', color: 'success', icon: FaCheckCircle },
    overdue: { label: 'Overdue', color: 'danger', icon: FaExclamationTriangle }
  };

  // Filter orders based on tab and search
  const getFilteredOrders = () => {
    let filtered = orders;

    // Filter by tab
    if (activeTab !== 'all') {
      filtered = filtered.filter(order => order.payment_status === activeTab);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(order =>
        order.order_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.total_amount?.toString().includes(searchTerm)
      );
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.payment_status === statusFilter);
    }

    // Sort
    return filtered.sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];
      
      if (sortField === 'customer_name') {
        aVal = a.customer?.name || '';
        bVal = b.customer?.name || '';
      }
      
      if (typeof aVal === 'string') {
        return sortDirection === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      
      return sortDirection === 'asc' ? 
        (parseFloat(aVal) || 0) - (parseFloat(bVal) || 0) : 
        (parseFloat(bVal) || 0) - (parseFloat(aVal) || 0);
    });
  };

  const filteredOrders = getFilteredOrders();

  // Pagination logic
  const indexOfLastPayment = currentPage * paymentsPerPage;
  const indexOfFirstPayment = indexOfLastPayment - paymentsPerPage;
  const currentPayments = filteredOrders.slice(indexOfFirstPayment, indexOfLastPayment);
  const totalPages = Math.ceil(filteredOrders.length / paymentsPerPage);

  // Handler functions
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleUpdatePayment = (order) => {
    setSelectedOrder(order);
    setPaymentForm({
      deposit_amount: order.deposit_amount || '',
      balance_amount: order.balance_amount || '',
      payment_status: order.payment_status || '',
      payment_method: order.payment_method || '',
      payment_notes: order.payment_notes || ''
    });
    setShowPaymentModal(true);
  };

  const handleViewDetails = (order) => {
    setSelectedOrder(order);
    setShowDetailsModal(true);
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    try {
      const updateData = {
        deposit_amount: parseFloat(paymentForm.deposit_amount) || 0,
        balance_amount: parseFloat(paymentForm.balance_amount) || 0,
        payment_status: paymentForm.payment_status,
        payment_method: paymentForm.payment_method,
        payment_notes: paymentForm.payment_notes
      };

      await updateOrder(selectedOrder.id, updateData);
      setSuccess('Payment information updated successfully');
      setShowPaymentModal(false);
      fetchAllData();
    } catch (err) {
      setError('Failed to update payment: ' + err.message);
    }
  };

  const getSortIcon = (field) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? <FaSortUp /> : <FaSortDown />;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR'
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getPaymentStatusBadge = (status) => {
    const config = paymentStatusConfig[status] || { label: status, color: 'secondary', icon: FaWallet };
    const IconComponent = config.icon;
    return (
      <Badge bg={config.color} className="d-flex align-items-center gap-1">
        <IconComponent size={12} />
        {config.label}
      </Badge>
    );
  };

  const getPaymentStats = () => {
    const totalRevenue = orders.reduce((sum, order) => sum + (parseFloat(order.total_amount) || 0), 0);
    const totalDeposits = orders.reduce((sum, order) => sum + (parseFloat(order.deposit_amount) || 0), 0);
    const totalBalance = orders.reduce((sum, order) => sum + (parseFloat(order.balance_amount) || 0), 0);
    
    return {
      total: orders.length,
      pending: orders.filter(o => o.payment_status === 'pending').length,
      partial: orders.filter(o => o.payment_status === 'partial').length,
      paid: orders.filter(o => o.payment_status === 'paid').length,
      overdue: orders.filter(o => o.payment_status === 'overdue').length,
      totalRevenue,
      totalDeposits,
      totalBalance
    };
  };

  const stats = getPaymentStats();

  if (loading && orders.length === 0) {
    return (
      <Container fluid className="py-4 text-center">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2">Loading payments...</p>
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
          title="OOX Furniture - Payment Management"
          subtitle="OOX Furniture payments, deposits, balances, and financial transactions tracking"
          icon={FaMoneyBillWave}
          onRefresh={fetchAllData}
          accentColor="#10b981"
        >
          <div className="d-flex gap-2 justify-content-end">
            <Button 
              variant="success" 
              onClick={() => navigate('/owner/orders')}
              className="d-flex align-items-center"
              style={{
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                border: 'none',
                borderRadius: '12px',
                padding: '0.75rem 1.5rem',
                fontWeight: '600',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
              onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
            >
              <FaPlus className="me-2" />
              New Order
            </Button>
          </div>
        </EnhancedPageHeader>

        {/* Alerts */}
        {error && (
          <Alert variant="danger" dismissible onClose={() => setError('')}>
            <FaExclamationTriangle className="me-2" />
            {error}
          </Alert>
        )}
        {success && (
          <Alert variant="success" dismissible onClose={() => setSuccess('')}>
            <FaCheck className="me-2" />
            {success}
          </Alert>
        )}

        {/* Financial Stats Cards */}
        <Row className="mb-4">
          <Col md={3}>
            <Card className="border-0 shadow-sm">
              <Card.Body className="text-center">
                <FaChartLine size={40} className="text-success mb-2" />
                <h3 className="mb-1 text-success">{formatCurrency(stats.totalRevenue)}</h3>
                <p className="text-muted mb-0">Total Revenue</p>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="border-0 shadow-sm">
              <Card.Body className="text-center">
                <FaWallet size={40} className="text-info mb-2" />
                <h3 className="mb-1 text-info">{formatCurrency(stats.totalDeposits)}</h3>
                <p className="text-muted mb-0">Total Deposits</p>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="border-0 shadow-sm">
              <Card.Body className="text-center">
                <FaExchangeAlt size={40} className="text-warning mb-2" />
                <h3 className="mb-1 text-warning">{formatCurrency(stats.totalBalance)}</h3>
                <p className="text-muted mb-0">Outstanding Balance</p>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="border-0 shadow-sm">
              <Card.Body className="text-center">
                <FaFileInvoice size={40} className="text-primary mb-2" />
                <h3 className="mb-1">{stats.total}</h3>
                <p className="text-muted mb-0">Total Orders</p>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Payment Status Stats */}
        <Row className="mb-4">
          <Col md={3}>
            <Card className="border-0 shadow-sm">
              <Card.Body className="text-center">
                <FaClock size={30} className="text-warning mb-2" />
                <h4 className="mb-1">{stats.pending}</h4>
                <small className="text-muted">Pending</small>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="border-0 shadow-sm">
              <Card.Body className="text-center">
                <FaExchangeAlt size={30} className="text-info mb-2" />
                <h4 className="mb-1">{stats.partial}</h4>
                <small className="text-muted">Partial</small>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="border-0 shadow-sm">
              <Card.Body className="text-center">
                <FaCheckCircle size={30} className="text-success mb-2" />
                <h4 className="mb-1">{stats.paid}</h4>
                <small className="text-muted">Paid</small>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="border-0 shadow-sm">
              <Card.Body className="text-center">
                <FaExclamationTriangle size={30} className="text-danger mb-2" />
                <h4 className="mb-1">{stats.overdue}</h4>
                <small className="text-muted">Overdue</small>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Payment Tabs */}
        <Card className="mb-4">
          <Card.Body>
            <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k)} className="mb-3">
              <Tab eventKey="all" title={`All Payments (${stats.total})`} />
              <Tab eventKey="pending" title={`Pending (${stats.pending})`} />
              <Tab eventKey="partial" title={`Partial (${stats.partial})`} />
              <Tab eventKey="paid" title={`Paid (${stats.paid})`} />
              <Tab eventKey="overdue" title={`Overdue (${stats.overdue})`} />
            </Tabs>

            {/* Search and Filters */}
            <Row className="g-3">
              <Col md={4}>
                <InputGroup>
                  <InputGroup.Text>
                    <FaSearch />
                  </InputGroup.Text>
                  <Form.Control
                    type="text"
                    placeholder="Search by order number, customer, or amount..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </InputGroup>
              </Col>
              <Col md={3}>
                <Form.Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="partial">Partial</option>
                  <option value="paid">Paid</option>
                  <option value="overdue">Overdue</option>
                </Form.Select>
              </Col>
              <Col md={5} className="text-end">
                <Button variant="outline-secondary" className="me-2">
                  <FaDownload className="me-1" />
                  Export CSV
                </Button>
                <Button variant="outline-secondary">
                  <FaReceipt className="me-1" />
                  Print Report
                </Button>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        {/* Payments Table */}
        <Card>
          <Card.Body className="p-0">
            <div className="table-responsive">
              <Table hover className="mb-0">
                <thead className="bg-light">
                  <tr>
                    <th 
                      style={{ cursor: 'pointer' }}
                      onClick={() => handleSort('order_number')}
                    >
                      Order # {getSortIcon('order_number')}
                    </th>
                    <th 
                      style={{ cursor: 'pointer' }}
                      onClick={() => handleSort('customer_name')}
                    >
                      Customer {getSortIcon('customer_name')}
                    </th>
                    <th 
                      style={{ cursor: 'pointer' }}
                      onClick={() => handleSort('total_amount')}
                    >
                      Total Amount {getSortIcon('total_amount')}
                    </th>
                    <th>Deposit</th>
                    <th>Balance</th>
                    <th 
                      style={{ cursor: 'pointer' }}
                      onClick={() => handleSort('payment_status')}
                    >
                      Status {getSortIcon('payment_status')}
                    </th>
                    <th 
                      style={{ cursor: 'pointer' }}
                      onClick={() => handleSort('order_date')}
                    >
                      Order Date {getSortIcon('order_date')}
                    </th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentPayments.map(order => (
                    <tr key={order.id}>
                      <td>
                        <div className="fw-medium text-primary">
                          #{order.order_number}
                        </div>
                        <small className="text-muted">ID: {order.id}</small>
                      </td>
                      <td>
                        <div className="d-flex align-items-center">
                          <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-3" 
                               style={{ width: '35px', height: '35px', fontSize: '1rem', fontWeight: 'bold' }}>
                            {order.customer?.name?.charAt(0)?.toUpperCase() || 'C'}
                          </div>
                          <div>
                            <div className="fw-medium">{order.customer?.name || 'Unknown Customer'}</div>
                            <small className="text-muted">{order.customer?.phone}</small>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="fw-bold text-success fs-5">
                          {formatCurrency(order.total_amount)}
                        </div>
                      </td>
                      <td>
                        <div className="text-info">
                          {formatCurrency(order.deposit_amount)}
                        </div>
                        {order.deposit_amount > 0 && (
                          <small className="text-muted">
                            {((parseFloat(order.deposit_amount) / parseFloat(order.total_amount)) * 100).toFixed(0)}%
                          </small>
                        )}
                      </td>
                      <td>
                        <div className="text-warning">
                          {formatCurrency(order.balance_amount)}
                        </div>
                      </td>
                      <td>{getPaymentStatusBadge(order.payment_status)}</td>
                      <td>
                        <small className="text-muted">
                          {formatDate(order.order_date)}
                        </small>
                      </td>
                      <td>
                        <ButtonGroup size="sm">
                          <OverlayTrigger overlay={<Tooltip>View Details</Tooltip>}>
                            <Button 
                              variant="outline-primary" 
                              onClick={() => handleViewDetails(order)}
                            >
                              <FaEye />
                            </Button>
                          </OverlayTrigger>
                          <OverlayTrigger overlay={<Tooltip>Update Payment</Tooltip>}>
                            <Button 
                              variant="outline-success" 
                              onClick={() => handleUpdatePayment(order)}
                            >
                              <FaEdit />
                            </Button>
                          </OverlayTrigger>
                          <OverlayTrigger overlay={<Tooltip>View Order</Tooltip>}>
                            <Button 
                              variant="outline-secondary" 
                              onClick={() => navigate(`/owner/orders`)}
                            >
                              <FaFileInvoice />
                            </Button>
                          </OverlayTrigger>
                        </ButtonGroup>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>

              {filteredOrders.length === 0 && (
                <div className="text-center py-5">
                  <FaMoneyBillWave size={48} className="text-muted mb-3" />
                  <h5 className="text-muted">No payments found</h5>
                  <p className="text-muted">
                    {searchTerm ? 'Try adjusting your search criteria' : 'No orders with payment information yet'}
                  </p>
                  <Button variant="success" onClick={() => navigate('/owner/orders')}>
                    <FaPlus className="me-1" />
                    Create First Order
                  </Button>
                </div>
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="d-flex justify-content-between align-items-center p-3 border-top">
                <div className="text-muted">
                  Showing {indexOfFirstPayment + 1} to {Math.min(indexOfLastPayment, filteredOrders.length)} of {filteredOrders.length} payments
                </div>
                <div className="d-flex gap-1">
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(currentPage - 1)}
                  >
                    Previous
                  </Button>
                  {[...Array(totalPages)].map((_, index) => (
                    <Button
                      key={index + 1}
                      variant={currentPage === index + 1 ? "primary" : "outline-secondary"}
                      size="sm"
                      onClick={() => setCurrentPage(index + 1)}
                    >
                      {index + 1}
                    </Button>
                  ))}
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(currentPage + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </Card.Body>
        </Card>

        {/* Payment Update Modal */}
        <Modal show={showPaymentModal} onHide={() => setShowPaymentModal(false)} size="lg">
          <Modal.Header closeButton>
            <Modal.Title>Update Payment Information</Modal.Title>
          </Modal.Header>
          <Form onSubmit={handlePaymentSubmit}>
            <Modal.Body>
              {selectedOrder && (
                <>
                  <div className="mb-4 p-3 bg-light rounded">
                    <h6>Order Details</h6>
                    <div className="row">
                      <div className="col-md-6">
                        <strong>Order #:</strong> {selectedOrder.order_number}<br />
                        <strong>Customer:</strong> {selectedOrder.customer?.name}
                      </div>
                      <div className="col-md-6">
                        <strong>Total Amount:</strong> {formatCurrency(selectedOrder.total_amount)}<br />
                        <strong>Order Date:</strong> {formatDate(selectedOrder.order_date)}
                      </div>
                    </div>
                  </div>

                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Deposit Amount</Form.Label>
                        <Form.Control
                          type="number"
                          step="0.01"
                          value={paymentForm.deposit_amount}
                          onChange={(e) => setPaymentForm({...paymentForm, deposit_amount: e.target.value})}
                          placeholder="0.00"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Balance Amount</Form.Label>
                        <Form.Control
                          type="number"
                          step="0.01"
                          value={paymentForm.balance_amount}
                          onChange={(e) => setPaymentForm({...paymentForm, balance_amount: e.target.value})}
                          placeholder="0.00"
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Payment Status *</Form.Label>
                        <Form.Select
                          value={paymentForm.payment_status}
                          onChange={(e) => setPaymentForm({...paymentForm, payment_status: e.target.value})}
                          required
                        >
                          <option value="">Select status...</option>
                          <option value="pending">Pending</option>
                          <option value="partial">Partial</option>
                          <option value="paid">Paid</option>
                          <option value="overdue">Overdue</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Payment Method</Form.Label>
                        <Form.Select
                          value={paymentForm.payment_method}
                          onChange={(e) => setPaymentForm({...paymentForm, payment_method: e.target.value})}
                        >
                          <option value="">Select method...</option>
                          <option value="cash">Cash</option>
                          <option value="card">Card</option>
                          <option value="eft">EFT</option>
                          <option value="cheque">Cheque</option>
                          <option value="other">Other</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                  </Row>
                  <Row>
                    <Col md={12}>
                      <Form.Group className="mb-3">
                        <Form.Label>Payment Notes</Form.Label>
                        <Form.Control
                          as="textarea"
                          rows={3}
                          value={paymentForm.payment_notes}
                          onChange={(e) => setPaymentForm({...paymentForm, payment_notes: e.target.value})}
                          placeholder="Add any payment notes or special instructions..."
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                </>
              )}
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={() => setShowPaymentModal(false)}>
                Cancel
              </Button>
              <Button variant="success" type="submit">
                Update Payment
              </Button>
            </Modal.Footer>
          </Form>
        </Modal>

        {/* Payment Details Modal */}
        <Modal show={showDetailsModal} onHide={() => setShowDetailsModal(false)} size="lg">
          <Modal.Header closeButton>
            <Modal.Title>Payment Details</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {selectedOrder && (
              <Row>
                <Col md={6}>
                  <Card className="h-100">
                    <Card.Header>
                      <h6 className="mb-0">Order Information</h6>
                    </Card.Header>
                    <Card.Body>
                      <div className="mb-3">
                        <strong>Order Number:</strong><br />
                        #{selectedOrder.order_number}
                      </div>
                      <div className="mb-3">
                        <strong>Customer:</strong><br />
                        {selectedOrder.customer?.name}
                      </div>
                      <div className="mb-3">
                        <strong>Order Date:</strong><br />
                        {formatDate(selectedOrder.order_date)}
                      </div>
                      <div className="mb-3">
                        <strong>Order Status:</strong><br />
                        <Badge bg="primary">{selectedOrder.order_status}</Badge>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={6}>
                  <Card className="h-100">
                    <Card.Header>
                      <h6 className="mb-0">Payment Information</h6>
                    </Card.Header>
                    <Card.Body>
                      <div className="mb-3">
                        <strong>Total Amount:</strong><br />
                        <span className="text-success fs-5 fw-bold">
                          {formatCurrency(selectedOrder.total_amount)}
                        </span>
                      </div>
                      <div className="mb-3">
                        <strong>Deposit Paid:</strong><br />
                        <span className="text-info">
                          {formatCurrency(selectedOrder.deposit_amount)}
                        </span>
                      </div>
                      <div className="mb-3">
                        <strong>Balance Due:</strong><br />
                        <span className="text-warning">
                          {formatCurrency(selectedOrder.balance_amount)}
                        </span>
                      </div>
                      <div className="mb-3">
                        <strong>Payment Status:</strong><br />
                        {getPaymentStatusBadge(selectedOrder.payment_status)}
                      </div>
                      {selectedOrder.payment_method && (
                        <div className="mb-3">
                          <strong>Payment Method:</strong><br />
                          <Badge bg="secondary">{selectedOrder.payment_method}</Badge>
                        </div>
                      )}
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowDetailsModal(false)}>
              Close
            </Button>
            <Button variant="success" onClick={() => {
              setShowDetailsModal(false);
              handleUpdatePayment(selectedOrder);
            }}>
              Update Payment
            </Button>
          </Modal.Footer>
        </Modal>
        </Container>
      </div>
    </>
  );
};

export default Payments;