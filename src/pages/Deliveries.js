import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Table, Button, Modal, Form, Alert, Badge, InputGroup, ButtonGroup, OverlayTrigger, Tooltip, Tabs, Tab, Spinner } from 'react-bootstrap';
import {
  FaTruck, FaMapMarkerAlt, FaEye, FaEdit, FaRoute, FaPhone, FaSearch, FaCalendarAlt, 
  FaSync, FaDownload, FaCheck, FaExclamationTriangle, FaSortUp, FaSortDown, 
  FaClock, FaShippingFast, FaCheckCircle, FaTimesCircle, FaBoxes, FaClipboardCheck, FaPhoneAlt
} from 'react-icons/fa';
import UniversalSidebar from '../components/UniversalSidebar';
import EnhancedPageHeader from '../components/EnhancedPageHeader';
import SharedHeader from '../components/SharedHeader';
import { getOrders, updateOrder, getCustomers } from '../components/api';

const Deliveries = ({ user, userRole, onLogout }) => {
  const navigate = useNavigate();
  
  // State management
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modal states
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Form state
  const [deliveryForm, setDeliveryForm] = useState({
    order_status: '',
    expected_delivery_date: '',
    actual_delivery_date: '',
    delivery_notes: '',
    delivery_address: ''
  });

  // Filter and search states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortField, setSortField] = useState('expected_delivery_date');
  const [sortDirection, setSortDirection] = useState('asc');
  const [activeTab, setActiveTab] = useState('ready');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [deliveriesPerPage] = useState(10);

  // Load data on component mount
  useEffect(() => {
    fetchAllData();
    // Auto-refresh disabled for better user experience
    // Users can manually refresh using the refresh button if needed
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

  // Delivery status configuration
  const deliveryStatusConfig = {
    ready_for_delivery: { label: 'Ready', color: 'info', icon: FaBoxes },
    out_for_delivery: { label: 'Out for Delivery', color: 'warning', icon: FaTruck },
    delivered: { label: 'Delivered', color: 'success', icon: FaCheckCircle },
    failed_delivery: { label: 'Failed', color: 'danger', icon: FaTimesCircle },
    returned: { label: 'Returned', color: 'secondary', icon: FaRoute }
  };

  // Get delivery-relevant orders
  const getDeliveryOrders = () => {
    return orders.filter(order => 
      order.production_status === 'ready_for_delivery' || 
      ['out_for_delivery', 'delivered', 'failed_delivery', 'returned'].includes(order.order_status)
    );
  };

  // Filter orders based on tab and search
  const getFilteredOrders = () => {
    let filtered = getDeliveryOrders();

    // Filter by tab
    if (activeTab === 'ready') {
      filtered = filtered.filter(order => 
        order.production_status === 'ready_for_delivery' && 
        order.order_status !== 'out_for_delivery' &&
        order.order_status !== 'delivered'
      );
    } else if (activeTab === 'transit') {
      filtered = filtered.filter(order => order.order_status === 'out_for_delivery');
    } else if (activeTab === 'delivered') {
      filtered = filtered.filter(order => order.order_status === 'delivered');
    } else if (activeTab === 'issues') {
      filtered = filtered.filter(order => 
        ['failed_delivery', 'returned'].includes(order.order_status)
      );
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(order =>
        order.order_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customer?.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customer?.phone?.includes(searchTerm)
      );
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.order_status === statusFilter);
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
        new Date(aVal || 0) - new Date(bVal || 0) : 
        new Date(bVal || 0) - new Date(aVal || 0);
    });
  };

  const filteredOrders = getFilteredOrders();

  // Pagination logic
  const indexOfLastDelivery = currentPage * deliveriesPerPage;
  const indexOfFirstDelivery = indexOfLastDelivery - deliveriesPerPage;
  const currentDeliveries = filteredOrders.slice(indexOfFirstDelivery, indexOfLastDelivery);
  const totalPages = Math.ceil(filteredOrders.length / deliveriesPerPage);

  // Handler functions
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleUpdateDelivery = (order) => {
    setSelectedOrder(order);
    setDeliveryForm({
      order_status: order.order_status || '',
      expected_delivery_date: order.expected_delivery_date || '',
      actual_delivery_date: order.actual_delivery_date || '',
      delivery_notes: order.delivery_notes || '',
      delivery_address: order.customer?.address || ''
    });
    setShowDeliveryModal(true);
  };

  const handleViewDetails = (order) => {
    setSelectedOrder(order);
    setShowDetailsModal(true);
  };

  const handleDeliverySubmit = async (e) => {
    e.preventDefault();
    try {
      const updateData = {
        order_status: deliveryForm.order_status,
        expected_delivery_date: deliveryForm.expected_delivery_date || null,
        actual_delivery_date: deliveryForm.actual_delivery_date || null,
        delivery_notes: deliveryForm.delivery_notes
      };

      await updateOrder(selectedOrder.id, updateData);
      setSuccess('Delivery information updated successfully');
      setShowDeliveryModal(false);
      fetchAllData();
    } catch (err) {
      setError('Failed to update delivery: ' + err.message);
    }
  };

  const getSortIcon = (field) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? <FaSortUp /> : <FaSortDown />;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleString('en-ZA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDeliveryStatusBadge = (order) => {
    let status = order.order_status;
    if (order.production_status === 'ready_for_delivery' && !['out_for_delivery', 'delivered'].includes(order.order_status)) {
      status = 'ready_for_delivery';
    }
    
    const config = deliveryStatusConfig[status] || { label: status, color: 'secondary', icon: FaBoxes };
    const IconComponent = config.icon;
    return (
      <Badge bg={config.color} className="d-flex align-items-center gap-1">
        <IconComponent size={12} />
        {config.label}
      </Badge>
    );
  };

  const isOverdue = (order) => {
    if (!order.expected_delivery_date) return false;
    const expectedDate = new Date(order.expected_delivery_date);
    const today = new Date();
    return expectedDate < today && order.order_status !== 'delivered';
  };

  const getDeliveryStats = () => {
    const deliveryOrders = getDeliveryOrders();
    return {
      total: deliveryOrders.length,
      ready: deliveryOrders.filter(o => 
        o.production_status === 'ready_for_delivery' && 
        !['out_for_delivery', 'delivered'].includes(o.order_status)
      ).length,
      transit: deliveryOrders.filter(o => o.order_status === 'out_for_delivery').length,
      delivered: deliveryOrders.filter(o => o.order_status === 'delivered').length,
      issues: deliveryOrders.filter(o => 
        ['failed_delivery', 'returned'].includes(o.order_status)
      ).length,
      overdue: deliveryOrders.filter(o => isOverdue(o)).length
    };
  };

  const stats = getDeliveryStats();

  if (loading && orders.length === 0) {
    return (
      <Container fluid className="py-4 text-center">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2">Loading deliveries...</p>
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
          title="OOX Furniture - Delivery Management"
          subtitle="OOX Furniture order deliveries, logistics management, and delivery status monitoring"
          icon={FaTruck}
          onRefresh={fetchAllData}
          accentColor="#06b6d4"
        >
          <div className="d-flex gap-2 justify-content-end">
            <Button 
              variant="info" 
              onClick={() => navigate('/owner/orders')}
              className="d-flex align-items-center"
              style={{
                background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
                border: 'none',
                borderRadius: '12px',
                padding: '0.75rem 1.5rem',
                fontWeight: '600',
                boxShadow: '0 4px 12px rgba(6, 182, 212, 0.3)',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
              onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
            >
              <FaBoxes className="me-2" />
              View Orders
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

        {/* Delivery Stats Cards */}
        <Row className="mb-4">
          <Col md={2}>
            <Card className="border-0 shadow-sm">
              <Card.Body className="text-center">
                <FaBoxes size={30} className="text-info mb-2" />
                <h4 className="mb-1">{stats.ready}</h4>
                <small className="text-muted">Ready</small>
              </Card.Body>
            </Card>
          </Col>
          <Col md={2}>
            <Card className="border-0 shadow-sm">
              <Card.Body className="text-center">
                <FaTruck size={30} className="text-warning mb-2" />
                <h4 className="mb-1">{stats.transit}</h4>
                <small className="text-muted">In Transit</small>
              </Card.Body>
            </Card>
          </Col>
          <Col md={2}>
            <Card className="border-0 shadow-sm">
              <Card.Body className="text-center">
                <FaCheckCircle size={30} className="text-success mb-2" />
                <h4 className="mb-1">{stats.delivered}</h4>
                <small className="text-muted">Delivered</small>
              </Card.Body>
            </Card>
          </Col>
          <Col md={2}>
            <Card className="border-0 shadow-sm">
              <Card.Body className="text-center">
                <FaTimesCircle size={30} className="text-danger mb-2" />
                <h4 className="mb-1">{stats.issues}</h4>
                <small className="text-muted">Issues</small>
              </Card.Body>
            </Card>
          </Col>
          <Col md={2}>
            <Card className="border-0 shadow-sm">
              <Card.Body className="text-center">
                <FaClock size={30} className="text-danger mb-2" />
                <h4 className="mb-1">{stats.overdue}</h4>
                <small className="text-muted">Overdue</small>
              </Card.Body>
            </Card>
          </Col>
          <Col md={2}>
            <Card className="border-0 shadow-sm">
              <Card.Body className="text-center">
                <FaShippingFast size={30} className="text-primary mb-2" />
                <h4 className="mb-1">{stats.total}</h4>
                <small className="text-muted">Total</small>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Delivery Tabs */}
        <Card className="mb-4">
          <Card.Body>
            <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k)} className="mb-3">
              <Tab eventKey="ready" title={`Ready (${stats.ready})`} />
              <Tab eventKey="transit" title={`In Transit (${stats.transit})`} />
              <Tab eventKey="delivered" title={`Delivered (${stats.delivered})`} />
              <Tab eventKey="issues" title={`Issues (${stats.issues})`} />
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
                    placeholder="Search by order number, customer, or address..."
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
                  <option value="out_for_delivery">Out for Delivery</option>
                  <option value="delivered">Delivered</option>
                  <option value="failed_delivery">Failed Delivery</option>
                  <option value="returned">Returned</option>
                </Form.Select>
              </Col>
              <Col md={5} className="text-end">
                <Button variant="outline-secondary" className="me-2">
                  <FaDownload className="me-1" />
                  Export CSV
                </Button>
                <Button variant="outline-secondary">
                  <FaRoute className="me-1" />
                  Plan Routes
                </Button>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        {/* Deliveries Table */}
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
                    <th>Delivery Address</th>
                    <th 
                      style={{ cursor: 'pointer' }}
                      onClick={() => handleSort('expected_delivery_date')}
                    >
                      Expected {getSortIcon('expected_delivery_date')}
                    </th>
                    <th>Actual Delivery</th>
                    <th>Status</th>
                    <th>Priority</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentDeliveries.map(order => (
                    <tr key={order.id} className={isOverdue(order) ? 'table-warning' : ''}>
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
                            <small className="text-muted">
                              <FaPhoneAlt className="me-1" size={10} />
                              {order.customer?.phone}
                            </small>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="d-flex align-items-start">
                          <FaMapMarkerAlt className="me-2 text-muted mt-1" size={12} />
                          <small className="text-muted" style={{ maxWidth: '200px' }}>
                            {order.customer?.address || 'No address provided'}
                          </small>
                        </div>
                      </td>
                      <td>
                        <div className={isOverdue(order) ? 'text-danger fw-bold' : 'text-muted'}>
                          {formatDate(order.expected_delivery_date)}
                        </div>
                        {isOverdue(order) && (
                          <Badge bg="danger" className="mt-1">
                            <FaClock className="me-1" size={10} />
                            OVERDUE
                          </Badge>
                        )}
                      </td>
                      <td>
                        <small className="text-muted">
                          {formatDateTime(order.actual_delivery_date)}
                        </small>
                      </td>
                      <td>{getDeliveryStatusBadge(order)}</td>
                      <td>
                        {isOverdue(order) ? (
                          <Badge bg="danger">High</Badge>
                        ) : order.order_status === 'out_for_delivery' ? (
                          <Badge bg="warning">Medium</Badge>
                        ) : (
                          <Badge bg="secondary">Normal</Badge>
                        )}
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
                          <OverlayTrigger overlay={<Tooltip>Update Delivery</Tooltip>}>
                            <Button 
                              variant="outline-info" 
                              onClick={() => handleUpdateDelivery(order)}
                            >
                              <FaEdit />
                            </Button>
                          </OverlayTrigger>
                          <OverlayTrigger overlay={<Tooltip>View Order</Tooltip>}>
                            <Button 
                              variant="outline-secondary" 
                              onClick={() => navigate(`/owner/orders`)}
                            >
                              <FaClipboardCheck />
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
                  <FaTruck size={48} className="text-muted mb-3" />
                  <h5 className="text-muted">No deliveries found</h5>
                  <p className="text-muted">
                    {searchTerm ? 'Try adjusting your search criteria' : 'No orders ready for delivery yet'}
                  </p>
                  <Button variant="info" onClick={() => navigate('/owner/orders')}>
                    <FaBoxes className="me-1" />
                    View All Orders
                  </Button>
                </div>
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="d-flex justify-content-between align-items-center p-3 border-top">
                <div className="text-muted">
                  Showing {indexOfFirstDelivery + 1} to {Math.min(indexOfLastDelivery, filteredOrders.length)} of {filteredOrders.length} deliveries
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

        {/* Delivery Update Modal */}
        <Modal show={showDeliveryModal} onHide={() => setShowDeliveryModal(false)} size="lg">
          <Modal.Header closeButton>
            <Modal.Title>Update Delivery Information</Modal.Title>
          </Modal.Header>
          <Form onSubmit={handleDeliverySubmit}>
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
                        <strong>Phone:</strong> {selectedOrder.customer?.phone}<br />
                        <strong>Production Status:</strong> <Badge bg="info">{selectedOrder.production_status}</Badge>
                      </div>
                    </div>
                  </div>

                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Delivery Status *</Form.Label>
                        <Form.Select
                          value={deliveryForm.order_status}
                          onChange={(e) => setDeliveryForm({...deliveryForm, order_status: e.target.value})}
                          required
                        >
                          <option value="">Select status...</option>
                          <option value="out_for_delivery">Out for Delivery</option>
                          <option value="delivered">Delivered</option>
                          <option value="failed_delivery">Failed Delivery</option>
                          <option value="returned">Returned</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Expected Delivery Date</Form.Label>
                        <Form.Control
                          type="date"
                          value={deliveryForm.expected_delivery_date}
                          onChange={(e) => setDeliveryForm({...deliveryForm, expected_delivery_date: e.target.value})}
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Actual Delivery Date & Time</Form.Label>
                        <Form.Control
                          type="datetime-local"
                          value={deliveryForm.actual_delivery_date}
                          onChange={(e) => setDeliveryForm({...deliveryForm, actual_delivery_date: e.target.value})}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Delivery Address</Form.Label>
                        <Form.Control
                          as="textarea"
                          rows={2}
                          value={deliveryForm.delivery_address}
                          onChange={(e) => setDeliveryForm({...deliveryForm, delivery_address: e.target.value})}
                          placeholder="Delivery address..."
                          readOnly
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                  <Row>
                    <Col md={12}>
                      <Form.Group className="mb-3">
                        <Form.Label>Delivery Notes</Form.Label>
                        <Form.Control
                          as="textarea"
                          rows={4}
                          value={deliveryForm.delivery_notes}
                          onChange={(e) => setDeliveryForm({...deliveryForm, delivery_notes: e.target.value})}
                          placeholder="Add delivery notes, instructions, or issues encountered..."
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                </>
              )}
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={() => setShowDeliveryModal(false)}>
                Cancel
              </Button>
              <Button variant="info" type="submit">
                Update Delivery
              </Button>
            </Modal.Footer>
          </Form>
        </Modal>

        {/* Delivery Details Modal */}
        <Modal show={showDetailsModal} onHide={() => setShowDetailsModal(false)} size="lg">
          <Modal.Header closeButton>
            <Modal.Title>Delivery Details</Modal.Title>
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
                        <strong>Phone:</strong><br />
                        <FaPhoneAlt className="me-2" />
                        {selectedOrder.customer?.phone}
                      </div>
                      <div className="mb-3">
                        <strong>Production Status:</strong><br />
                        <Badge bg="info">{selectedOrder.production_status}</Badge>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={6}>
                  <Card className="h-100">
                    <Card.Header>
                      <h6 className="mb-0">Delivery Information</h6>
                    </Card.Header>
                    <Card.Body>
                      <div className="mb-3">
                        <strong>Status:</strong><br />
                        {getDeliveryStatusBadge(selectedOrder)}
                      </div>
                      <div className="mb-3">
                        <strong>Expected Delivery:</strong><br />
                        <span className={isOverdue(selectedOrder) ? 'text-danger fw-bold' : ''}>
                          {formatDate(selectedOrder.expected_delivery_date)}
                        </span>
                        {isOverdue(selectedOrder) && (
                          <Badge bg="danger" className="ms-2">OVERDUE</Badge>
                        )}
                      </div>
                      <div className="mb-3">
                        <strong>Actual Delivery:</strong><br />
                        {formatDateTime(selectedOrder.actual_delivery_date)}
                      </div>
                      <div className="mb-3">
                        <strong>Delivery Address:</strong><br />
                        <FaMapMarkerAlt className="me-2" />
                        {selectedOrder.customer?.address || 'No address provided'}
                      </div>
                      {selectedOrder.delivery_notes && (
                        <div className="mb-3">
                          <strong>Notes:</strong><br />
                          <small className="text-muted">{selectedOrder.delivery_notes}</small>
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
            <Button variant="info" onClick={() => {
              setShowDetailsModal(false);
              handleUpdateDelivery(selectedOrder);
            }}>
              Update Delivery
            </Button>
          </Modal.Footer>
        </Modal>
        </Container>
      </div>
    </>
  );
};

export default Deliveries;