import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Table, Button, Modal, Form, Alert, Badge, InputGroup, ButtonGroup, OverlayTrigger, Tooltip, Spinner } from 'react-bootstrap';
import {
  FaUsers, FaPlus, FaEdit, FaTrash, FaEye, FaPhone, FaEnvelope, FaMapMarkerAlt,
  FaSearch, FaCalendarAlt, FaSync, FaDownload, FaCheck, FaExclamationTriangle, 
  FaSortUp, FaSortDown, FaBuilding
} from 'react-icons/fa';
import UniversalSidebar from '../components/UniversalSidebar';
import EnhancedPageHeader from '../components/EnhancedPageHeader';
import SharedHeader from '../components/SharedHeader';
import { getCustomers, getOrders, createCustomer, updateCustomer, deleteCustomer } from '../components/api';

const Customers = ({ user, userRole, onLogout }) => {
  const navigate = useNavigate();
  
  // State management
  const [customers, setCustomers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modal states
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [editingCustomer, setEditingCustomer] = useState(null);

  // Form state
  const [customerForm, setCustomerForm] = useState({
    name: '',
    phone: '',
    email: '',
    address: ''
  });

  // Filter and search states
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('created_at');
  const [sortDirection, setSortDirection] = useState('desc');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [customersPerPage] = useState(10);

  // Load data on component mount
  useEffect(() => {
    fetchAllData();
    // Auto-refresh disabled for better user experience
    // Users can manually refresh using the refresh button if needed
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const [customersData, ordersData] = await Promise.all([
        getCustomers(),
        getOrders()
      ]);
      setCustomers(customersData.results || customersData);
      setOrders(ordersData.results || ordersData);
      setError('');
    } catch (err) {
      setError('Failed to load data: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort customers
  const filteredCustomers = customers.filter(customer =>
    customer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone?.includes(searchTerm) ||
    customer.email?.toLowerCase().includes(searchTerm.toLowerCase())
  ).sort((a, b) => {
    let aVal = a[sortField];
    let bVal = b[sortField];
    
    if (typeof aVal === 'string') {
      return sortDirection === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    }
    
    return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
  });

  // Pagination logic
  const indexOfLastCustomer = currentPage * customersPerPage;
  const indexOfFirstCustomer = indexOfLastCustomer - customersPerPage;
  const currentCustomers = filteredCustomers.slice(indexOfFirstCustomer, indexOfLastCustomer);
  const totalPages = Math.ceil(filteredCustomers.length / customersPerPage);

  // Handler functions
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleCreateCustomer = () => {
    setEditingCustomer(null);
    setCustomerForm({
      name: '',
      phone: '',
      email: '',
      address: ''
    });
    setShowCustomerModal(true);
  };

  const handleEditCustomer = (customer) => {
    setEditingCustomer(customer);
    setCustomerForm({
      name: customer.name || '',
      phone: customer.phone || '',
      email: customer.email || '',
      address: customer.address || ''
    });
    setShowCustomerModal(true);
  };

  const handleDeleteCustomer = (customer) => {
    setSelectedCustomer(customer);
    setShowDeleteModal(true);
  };

  const handleViewDetails = (customer) => {
    setSelectedCustomer(customer);
    setShowDetailsModal(true);
  };

  const confirmDelete = async () => {
    try {
      await deleteCustomer(selectedCustomer.id);
      setSuccess('Customer deleted successfully');
      setShowDeleteModal(false);
      fetchAllData();
    } catch (err) {
      setError('Failed to delete customer: ' + err.message);
    }
  };

  const handleCustomerSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCustomer) {
        await updateCustomer(editingCustomer.id, customerForm);
        setSuccess('Customer updated successfully');
      } else {
        await createCustomer(customerForm);
        setSuccess('Customer created successfully');
      }
      setShowCustomerModal(false);
      fetchAllData();
    } catch (err) {
      setError('Failed to save customer: ' + err.message);
    }
  };

  const getSortIcon = (field) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? <FaSortUp /> : <FaSortDown />;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getCustomerOrderCount = (customerId) => {
    return orders.filter(order => order.customer?.id === customerId).length;
  };

  const getCustomerOrderValue = (customerId) => {
    const customerOrders = orders.filter(order => order.customer?.id === customerId);
    const totalValue = customerOrders.reduce((sum, order) => sum + (parseFloat(order.total_amount) || 0), 0);
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR'
    }).format(totalValue);
  };

  if (loading && customers.length === 0) {
    return (
      <Container fluid className="py-4 text-center">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2">Loading customers...</p>
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
          title="OOX Furniture - Customer Management"
          subtitle="OOX Furniture customer information, contact details, and order history management"
          icon={FaUsers}
          onRefresh={fetchAllData}
          accentColor="#3b82f6"
        >
          <div className="d-flex gap-2 justify-content-end">
            <Button 
              variant="primary" 
              onClick={handleCreateCustomer}
              className="d-flex align-items-center"
              style={{
                background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                border: 'none',
                borderRadius: '12px',
                padding: '0.75rem 1.5rem',
                fontWeight: '600',
                boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
              onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
            >
              <FaPlus className="me-2" />
              Add Customer
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

        {/* Stats Cards */}
        <Row className="mb-4">
          <Col md={3}>
            <Card className="border-0 shadow-sm">
              <Card.Body className="text-center">
                <FaUsers size={40} className="text-primary mb-2" />
                <h3 className="mb-1">{customers.length}</h3>
                <p className="text-muted mb-0">Total Customers</p>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="border-0 shadow-sm">
              <Card.Body className="text-center">
                <FaBuilding size={40} className="text-success mb-2" />
                <h3 className="mb-1">{customers.filter(c => c.email).length}</h3>
                <p className="text-muted mb-0">With Email</p>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="border-0 shadow-sm">
              <Card.Body className="text-center">
                <FaCalendarAlt size={40} className="text-warning mb-2" />
                <h3 className="mb-1">
                  {customers.filter(c => {
                    const created = new Date(c.created_at);
                    const thirtyDaysAgo = new Date();
                    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                    return created > thirtyDaysAgo;
                  }).length}
                </h3>
                <p className="text-muted mb-0">New (30 days)</p>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="border-0 shadow-sm">
              <Card.Body className="text-center">
                <FaDownload size={40} className="text-info mb-2" />
                <h3 className="mb-1">
                  {customers.filter(c => getCustomerOrderCount(c.id) > 0).length}
                </h3>
                <p className="text-muted mb-0">With Orders</p>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Search and Filters */}
        <Card className="mb-4">
          <Card.Body>
            <Row className="g-3">
              <Col md={6}>
                <InputGroup>
                  <InputGroup.Text>
                    <FaSearch />
                  </InputGroup.Text>
                  <Form.Control
                    type="text"
                    placeholder="Search customers by name, phone, or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </InputGroup>
              </Col>
              <Col md={6} className="text-end">
                <Button variant="outline-secondary" className="me-2">
                  <FaDownload className="me-1" />
                  Export CSV
                </Button>
                <Button variant="outline-secondary">
                  <FaDownload className="me-1" />
                  Export PDF
                </Button>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        {/* Customers Table */}
        <Card>
          <Card.Body className="p-0">
            <div className="table-responsive">
              <Table hover className="mb-0">
                <thead className="bg-light">
                  <tr>
                    <th 
                      style={{ cursor: 'pointer' }}
                      onClick={() => handleSort('name')}
                    >
                      Customer Name {getSortIcon('name')}
                    </th>
                    <th>Contact Information</th>
                    <th>Address</th>
                    <th>Orders</th>
                    <th>Total Value</th>
                    <th 
                      style={{ cursor: 'pointer' }}
                      onClick={() => handleSort('created_at')}
                    >
                      Created {getSortIcon('created_at')}
                    </th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentCustomers.map(customer => (
                    <tr key={customer.id}>
                      <td>
                        <div className="d-flex align-items-center">
                          <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-3" 
                               style={{ width: '40px', height: '40px', fontSize: '1.2rem', fontWeight: 'bold' }}>
                            {customer.name?.charAt(0)?.toUpperCase() || 'C'}
                          </div>
                          <div>
                            <div className="fw-medium">{customer.name}</div>
                            <small className="text-muted">ID: {customer.id}</small>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div>
                          <div className="d-flex align-items-center mb-1">
                            <FaPhone className="me-2 text-muted" size={12} />
                            <span>{customer.phone}</span>
                          </div>
                          {customer.email && (
                            <div className="d-flex align-items-center">
                              <FaEnvelope className="me-2 text-muted" size={12} />
                              <span className="text-muted">{customer.email}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="d-flex align-items-start">
                          <FaMapMarkerAlt className="me-2 text-muted mt-1" size={12} />
                          <small className="text-muted" style={{ maxWidth: '200px' }}>
                            {customer.address || 'No address provided'}
                          </small>
                        </div>
                      </td>
                      <td>
                        <Badge bg="info" className="fs-6">
                          {getCustomerOrderCount(customer.id)} orders
                        </Badge>
                      </td>
                      <td>
                        <div className="fw-medium text-success">
                          {getCustomerOrderValue(customer.id)}
                        </div>
                      </td>
                      <td>
                        <small className="text-muted">
                          {formatDate(customer.created_at)}
                        </small>
                      </td>
                      <td>
                        <ButtonGroup size="sm">
                          <OverlayTrigger overlay={<Tooltip>View Details</Tooltip>}>
                            <Button 
                              variant="outline-primary" 
                              onClick={() => handleViewDetails(customer)}
                            >
                              <FaEye />
                            </Button>
                          </OverlayTrigger>
                          <OverlayTrigger overlay={<Tooltip>Edit Customer</Tooltip>}>
                            <Button 
                              variant="outline-secondary" 
                              onClick={() => handleEditCustomer(customer)}
                            >
                              <FaEdit />
                            </Button>
                          </OverlayTrigger>
                          {userRole === 'owner' && (
                            <OverlayTrigger overlay={<Tooltip>Delete Customer</Tooltip>}>
                              <Button 
                                variant="outline-danger" 
                                onClick={() => handleDeleteCustomer(customer)}
                              >
                                <FaTrash />
                              </Button>
                            </OverlayTrigger>
                          )}
                        </ButtonGroup>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>

              {filteredCustomers.length === 0 && (
                <div className="text-center py-5">
                  <FaUsers size={48} className="text-muted mb-3" />
                  <h5 className="text-muted">No customers found</h5>
                  <p className="text-muted">
                    {searchTerm ? 'Try adjusting your search criteria' : 'No customers have been added yet'}
                  </p>
                  <Button variant="primary" onClick={handleCreateCustomer}>
                    <FaPlus className="me-1" />
                    Add First Customer
                  </Button>
                </div>
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="d-flex justify-content-between align-items-center p-3 border-top">
                <div className="text-muted">
                  Showing {indexOfFirstCustomer + 1} to {Math.min(indexOfLastCustomer, filteredCustomers.length)} of {filteredCustomers.length} customers
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

        {/* Customer Form Modal */}
        <Modal show={showCustomerModal} onHide={() => setShowCustomerModal(false)} size="lg">
          <Modal.Header closeButton>
            <Modal.Title>
              {editingCustomer ? 'Edit Customer' : 'Add New Customer'}
            </Modal.Title>
          </Modal.Header>
          <Form onSubmit={handleCustomerSubmit}>
            <Modal.Body>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Customer Name *</Form.Label>
                    <Form.Control
                      type="text"
                      value={customerForm.name}
                      onChange={(e) => setCustomerForm({...customerForm, name: e.target.value})}
                      required
                      placeholder="Enter customer name"
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Phone Number *</Form.Label>
                    <Form.Control
                      type="tel"
                      value={customerForm.phone}
                      onChange={(e) => setCustomerForm({...customerForm, phone: e.target.value})}
                      required
                      placeholder="e.g., +27 11 123 4567"
                    />
                  </Form.Group>
                </Col>
              </Row>
              <Row>
                <Col md={12}>
                  <Form.Group className="mb-3">
                    <Form.Label>Email Address</Form.Label>
                    <Form.Control
                      type="email"
                      value={customerForm.email}
                      onChange={(e) => setCustomerForm({...customerForm, email: e.target.value})}
                      placeholder="customer@example.com"
                    />
                  </Form.Group>
                </Col>
              </Row>
              <Row>
                <Col md={12}>
                  <Form.Group className="mb-3">
                    <Form.Label>Address</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      value={customerForm.address}
                      onChange={(e) => setCustomerForm({...customerForm, address: e.target.value})}
                      placeholder="Enter full delivery address..."
                    />
                  </Form.Group>
                </Col>
              </Row>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={() => setShowCustomerModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" type="submit">
                {editingCustomer ? 'Update Customer' : 'Create Customer'}
              </Button>
            </Modal.Footer>
          </Form>
        </Modal>

        {/* Customer Details Modal */}
        <Modal show={showDetailsModal} onHide={() => setShowDetailsModal(false)} size="lg">
          <Modal.Header closeButton>
            <Modal.Title>Customer Details</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {selectedCustomer && (
              <Row>
                <Col md={6}>
                  <Card className="h-100">
                    <Card.Header>
                      <h6 className="mb-0">Contact Information</h6>
                    </Card.Header>
                    <Card.Body>
                      <div className="mb-3">
                        <strong>Name:</strong><br />
                        {selectedCustomer.name}
                      </div>
                      <div className="mb-3">
                        <strong>Phone:</strong><br />
                        <FaPhone className="me-2" />
                        {selectedCustomer.phone}
                      </div>
                      {selectedCustomer.email && (
                        <div className="mb-3">
                          <strong>Email:</strong><br />
                          <FaEnvelope className="me-2" />
                          {selectedCustomer.email}
                        </div>
                      )}
                      <div className="mb-3">
                        <strong>Address:</strong><br />
                        <FaMapMarkerAlt className="me-2" />
                        {selectedCustomer.address || 'No address provided'}
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={6}>
                  <Card className="h-100">
                    <Card.Header>
                      <h6 className="mb-0">Order Summary</h6>
                    </Card.Header>
                    <Card.Body>
                      <div className="mb-3">
                        <strong>Total Orders:</strong><br />
                        <Badge bg="info" className="fs-6">
                          {getCustomerOrderCount(selectedCustomer.id)} orders
                        </Badge>
                      </div>
                      <div className="mb-3">
                        <strong>Total Value:</strong><br />
                        <span className="text-success fs-5 fw-bold">
                          {getCustomerOrderValue(selectedCustomer.id)}
                        </span>
                      </div>
                      <div className="mb-3">
                        <strong>Customer Since:</strong><br />
                        {formatDate(selectedCustomer.created_at)}
                      </div>
                      <div className="mb-3">
                        <strong>Last Updated:</strong><br />
                        {formatDate(selectedCustomer.updated_at)}
                      </div>
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
            <Button variant="primary" onClick={() => {
              setShowDetailsModal(false);
              handleEditCustomer(selectedCustomer);
            }}>
              Edit Customer
            </Button>
          </Modal.Footer>
        </Modal>

        {/* Delete Confirmation Modal */}
        <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
          <Modal.Header closeButton>
            <Modal.Title>Confirm Delete</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <div className="text-center">
              <FaTrash size={48} className="text-danger mb-3" />
              <h5>Delete Customer?</h5>
              <p className="text-muted">
                Are you sure you want to delete <strong>{selectedCustomer?.name}</strong>?
                This action cannot be undone.
              </p>
              {getCustomerOrderCount(selectedCustomer?.id) > 0 && (
                <Alert variant="warning">
                  <FaExclamationTriangle className="me-2" />
                  This customer has {getCustomerOrderCount(selectedCustomer?.id)} order(s). 
                  Deleting will affect order history.
                </Alert>
              )}
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={confirmDelete}>
              Delete Customer
            </Button>
          </Modal.Footer>
        </Modal>
        </Container>
      </div>
    </>
  );
};

export default Customers;