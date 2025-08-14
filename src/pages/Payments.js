import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Table, Button, Modal, Form, Alert, Badge, Tabs, Tab, InputGroup, ButtonGroup, OverlayTrigger, Tooltip, Spinner } from 'react-bootstrap';
import {
  FaMoneyBillWave, FaPlus, FaEdit, FaTrash, FaEye, FaCheck, FaExclamationTriangle,
  FaSearch, FaDownload, FaReceipt, FaChartLine, FaFileInvoice, FaWallet, 
  FaExchangeAlt, FaClock, FaCheckCircle, FaSortUp, FaSortDown
} from 'react-icons/fa';
import UniversalSidebar from '../components/UniversalSidebar';
import EnhancedPageHeader from '../components/EnhancedPageHeader';
import SharedHeader from '../components/SharedHeader';
import { getPayments, getOrders, getCustomers, createPayment, updatePayment, deletePayment, updateOrderPayment, markPaymentOverdue, getPaymentsDashboard, getPaymentProofsForOrder } from '../components/api';
import { getPaymentProofSignedUrl, getPaymentProofFileUrl } from '../components/api';
import PdfViewer from '../components/PdfViewer';

const Payments = ({ user, userRole, onLogout }) => {
  const navigate = useNavigate();
  
  // State management
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [payDash, setPayDash] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modal states
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [recentProofs, setRecentProofs] = useState([]);
  const [uploadingProof, setUploadingProof] = useState(false);
  const [proofFile, setProofFile] = useState(null);
  const [viewer, setViewer] = useState({ open: false, url: '', name: '' });

  // Form state
  const [paymentForm, setPaymentForm] = useState({
    deposit_amount: '',
    balance_amount: '',
    payment_status: '',
    payment_method: '',
    payment_notes: '',
    proof_id: ''
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
    // Auto-refresh disabled for better user experience
    // Users can manually refresh using the refresh button if needed
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const [ordersData, customersData, dashboardData] = await Promise.all([
        getOrders(),
        getCustomers(),
        getPaymentsDashboard().catch(()=>null)
      ]);
      setOrders(ordersData.results || ordersData);
      setCustomers(customersData.results || customersData);
      if (dashboardData) setPayDash(dashboardData);
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
      payment_notes: order.payment_notes || '',
      proof_id: ''
    });
    // Load recent proofs for this order
    getPaymentProofsForOrder(order.id)
      .then((data) => {
        const list = Array.isArray(data?.results) ? data.results : (Array.isArray(data) ? data : []);
        setRecentProofs(list.slice(0, 5));
      })
      .catch(() => setRecentProofs([]));
    setShowPaymentModal(true);
  };

  const previewProof = async (proof) => {
    if (!proof?.id) return;
    try {
      let url = '';
      try {
        const res = await getPaymentProofSignedUrl(proof.id, 300);
        url = res?.url || '';
      } catch {}
      if (!url) url = getPaymentProofFileUrl(proof.id);
      const name = proof?.file_name || `proof_${proof.id}.pdf`;
      setViewer({ open: true, url, name });
    } catch (e) {
      setError(e?.message || 'Unable to open proof');
    }
  };
  const closeViewer = () => setViewer({ open: false, url: '', name: '' });

  const handleViewDetails = (order) => {
    setSelectedOrder(order);
    setShowDetailsModal(true);
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    try {
      // If EFT selected and no proof_id, attempt to upload file first
      const method = (paymentForm.payment_method || selectedOrder?.payment_method || '').toLowerCase();
      if (method === 'eft' && !paymentForm.proof_id) {
        if (!proofFile) {
          setError('Payment proof required for EFT payments');
          return;
        }
        try {
          setUploadingProof(true);
          const form = new FormData();
          form.append('order', selectedOrder.id);
          if (paymentForm.deposit_amount) form.append('amount', paymentForm.deposit_amount);
          form.append('proof_image', proofFile);
          const created = await createPayment(form, true);
          if (created?.id) {
            paymentForm.proof_id = created.id;
          }
        } catch (uploadErr) {
          setUploadingProof(false);
          setError(uploadErr?.message || 'Failed to upload payment proof');
          return;
        } finally {
          setUploadingProof(false);
        }
      }
      const toNumber = (v) => {
        const n = typeof v === 'string' && v.trim() === '' ? null : Number(v);
        return (n !== null && !Number.isNaN(n)) ? n : undefined;
      };
      const updateData = {
        ...(toNumber(paymentForm.deposit_amount) !== undefined ? { deposit_amount: toNumber(paymentForm.deposit_amount) } : {}),
        ...(toNumber(paymentForm.balance_amount) !== undefined ? { balance_amount: toNumber(paymentForm.balance_amount) } : {}),
        payment_status: paymentForm.payment_status,
        payment_method: paymentForm.payment_method,
        payment_notes: paymentForm.payment_notes
      };
      // EFT PoP enforcement: include proof_id if provided
      if ((paymentForm.payment_method || selectedOrder?.payment_method || '').toLowerCase() === 'eft') {
        if (paymentForm.proof_id) {
          updateData.proof_id = paymentForm.proof_id;
        }
      }

      await updateOrderPayment(selectedOrder.id, updateData);
      setSuccess('Payment information updated successfully');
      setShowPaymentModal(false);
      fetchAllData();
    } catch (err) {
      setError('Failed to update payment: ' + err.message);
    }
  };
  const handleMarkOverdue = async (order) => {
    try {
      await markPaymentOverdue(order.id);
      setSuccess('Marked as overdue');
      fetchAllData();
    } catch (e) { setError(e?.message || 'Failed to mark overdue'); }
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

  const stats = payDash ? {
    total: payDash.statistics?.total_orders ?? orders.length,
    pending: payDash.statistics?.payment_status_counts?.pending ?? orders.filter(o=>o.payment_status==='pending').length,
    partial: payDash.statistics?.payment_status_counts?.partial ?? orders.filter(o=>o.payment_status==='partial').length,
    paid: payDash.statistics?.payment_status_counts?.paid ?? orders.filter(o=>o.payment_status==='paid').length,
    overdue: payDash.statistics?.payment_status_counts?.overdue ?? orders.filter(o=>o.payment_status==='overdue').length,
    totalRevenue: payDash.statistics?.financial?.total_revenue ?? orders.reduce((s,o)=>s+(+o.total_amount||0),0),
    totalDeposits: payDash.statistics?.financial?.total_deposits ?? orders.reduce((s,o)=>s+(+o.deposit_amount||0),0),
    totalBalance: payDash.statistics?.financial?.total_balance ?? orders.reduce((s,o)=>s+(+o.balance_amount||0),0),
  } : getPaymentStats();

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
          {userRole === 'owner' && (
          <Col md={3}>
            <Card className="border-0 shadow-sm">
              <Card.Body className="text-center">
                <FaChartLine size={40} className="text-success mb-2" />
                <h3 className="mb-1 text-success">{formatCurrency(stats.totalRevenue)}</h3>
                <p className="text-muted mb-0">Total Revenue</p>
              </Card.Body>
            </Card>
          </Col>) }
          <Col md={3}>
            <Card className="border-0 shadow-sm">
              <Card.Body className="text-center">
                <FaWallet size={40} className="text-info mb-2" />
                <h3 className="mb-1 text-info">{formatCurrency(filteredOrders.reduce((s,o)=>s+(+o.deposit_amount||0),0))}</h3>
                <p className="text-muted mb-0">Deposits (Visible Orders)</p>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="border-0 shadow-sm">
              <Card.Body className="text-center">
                <FaExchangeAlt size={40} className="text-warning mb-2" />
                <h3 className="mb-1 text-warning">{formatCurrency(filteredOrders.reduce((s,o)=>s+(+o.balance_amount||0),0))}</h3>
                <p className="text-muted mb-0">Outstanding (Visible Orders)</p>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="border-0 shadow-sm">
              <Card.Body className="text-center">
                <FaFileInvoice size={40} className="text-primary mb-2" />
                <h3 className="mb-1">{filteredOrders.length}</h3>
                <p className="text-muted mb-0">Orders (Visible)</p>
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
                          {(userRole === 'owner' || userRole === 'admin') && (
                            <OverlayTrigger placement="top" overlay={<Tooltip>Mark Overdue</Tooltip>}>
                              <Button variant="outline-warning" onClick={() => handleMarkOverdue(order)}>
                                <FaExclamationTriangle />
                              </Button>
                            </OverlayTrigger>
                          )}
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
                  {/* EFT Proof-of-payment */}
                  {((paymentForm.payment_method || selectedOrder?.payment_method || '').toLowerCase() === 'eft') && (
                    <Row>
                      <Col md={12}>
                        <Form.Group className="mb-3">
                          <Form.Label>Payment Proof (required for EFT)</Form.Label>
                          <InputGroup>
                            <Form.Control
                              placeholder="Enter proof ID (recent uploaded proof)"
                              value={paymentForm.proof_id}
                              onChange={(e)=>setPaymentForm({...paymentForm, proof_id: e.target.value})}
                            />
                            <Button variant="outline-secondary" onClick={()=>navigate('/owner/payments')}>Refresh</Button>
                          </InputGroup>
                          <div className="form-text">Upload proof via PaymentProofs module if needed, then paste its ID here. Backend validates proof belongs to this order and is recent.</div>
                          {recentProofs.length > 0 && (
                            <div className="mt-2">
                              <div className="small text-muted mb-1">Recent proofs for this order:</div>
                              <div className="d-flex flex-wrap gap-2">
                                {recentProofs.map(p => (
                                  <Button key={p.id} size="sm" variant="outline-primary" onClick={()=>setPaymentForm({...paymentForm, proof_id: String(p.id)})}>
                                    Use ID {p.id}
                                  </Button>
                                ))}
                              </div>
                              <div className="d-flex flex-wrap gap-2 mt-2">
                                {recentProofs.map(p => (
                                  <Button key={`pv-${p.id}`} size="sm" variant="outline-secondary" onClick={()=>previewProof(p)}>
                                    Preview #{p.id}
                                  </Button>
                                ))}
                              </div>
                            </div>
                          )}
                          <div className="mt-3">
                            <div className="small text-muted mb-1">Or upload proof image now (auto-attaches to this order):</div>
                            <Form.Control type="file" accept="image/*,application/pdf" onChange={(e)=>setProofFile(e.target.files?.[0] || null)} />
                            {uploadingProof && <div className="small text-muted mt-1">Uploading proof...</div>}
                          </div>
                        </Form.Group>
                      </Col>
                    </Row>
                  )}
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
        <Modal show={viewer.open} onHide={closeViewer} size="lg" centered>
          <Modal.Header closeButton>
            <Modal.Title>Proof of Payment</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {viewer.url ? <PdfViewer url={viewer.url} fileName={viewer.name} height="75vh"/> : <div className="text-muted">No document</div>}
          </Modal.Body>
        </Modal>
      </div>
    </>
  );
};

export default Payments;