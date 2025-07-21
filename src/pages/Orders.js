import React, { useState, useEffect } from 'react';
import {
  Container, Row, Col, Card, Button, Table, Modal, Form,
  Badge, Dropdown, InputGroup, Alert, Spinner, Tab, Tabs,
  ProgressBar, ButtonGroup, OverlayTrigger, Tooltip
} from 'react-bootstrap';
import {
  FaPlus, FaEdit, FaTrash, FaEye, FaSearch, FaFilter,
  FaDownload, FaUpload, FaCheck, FaClock, FaExclamationTriangle,
  FaBoxes, FaTruck, FaMoneyBillWave, FaUser, FaCalendarAlt,
  FaClipboardList, FaSync, FaChartLine, FaSortUp, FaSortDown
} from 'react-icons/fa';
import { 
  getOrders, getCustomers, getProducts, 
  createOrder, updateOrder, deleteOrder,
  getOrderItems, createOrderItem, updateOrderItem
} from '../components/api';
import SharedHeader from '../components/SharedHeader';
import OrderForm from '../components/OrderForm';
import EnhancedPageHeader from '../components/EnhancedPageHeader';
import UniversalSidebar from '../components/UniversalSidebar';

const Orders = ({ user, userRole, onLogout }) => {
  // State management
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modal states
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [editingOrder, setEditingOrder] = useState(null);

  // Filter and search states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [productionFilter, setProductionFilter] = useState('all');
  const [sortField, setSortField] = useState('created_at');
  const [sortDirection, setSortDirection] = useState('desc');
  const [activeTab, setActiveTab] = useState('all');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [ordersPerPage] = useState(10);

  // Load data on component mount
  useEffect(() => {
    fetchAllData();
    // Auto-refresh every 30 seconds for real-time updates
    const interval = setInterval(fetchAllData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const [ordersData, customersData, productsData] = await Promise.all([
        getOrders(),
        getCustomers(),
        getProducts()
      ]);
      setOrders(ordersData.results || ordersData);
      setCustomers(customersData.results || customersData);
      setProducts(productsData.results || productsData);
      setError('');
    } catch (err) {
      setError('Failed to load data: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Role-based permissions
  const canCreate = userRole === 'owner' || userRole === 'admin';
  const canEdit = userRole === 'owner' || userRole === 'admin';
  const canDelete = userRole === 'owner';
  const canUpdateProduction = userRole === 'owner' || userRole === 'warehouse';
  const canViewFinancials = userRole === 'owner' || userRole === 'admin';

  // Filter and sort orders
  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.order_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || order.order_status === statusFilter;
    const matchesProduction = productionFilter === 'all' || order.production_status === productionFilter;
    
    if (activeTab === 'all') return matchesSearch && matchesStatus && matchesProduction;
    if (activeTab === 'pending') return order.order_status === 'pending' && matchesSearch;
    if (activeTab === 'production') return order.production_status === 'in_production' && matchesSearch;
    if (activeTab === 'ready') return order.production_status === 'ready_for_delivery' && matchesSearch;
    if (activeTab === 'overdue') {
      const isOverdue = new Date(order.delivery_deadline) < new Date() && 
                       !['delivered', 'cancelled'].includes(order.order_status);
      return isOverdue && matchesSearch;
    }
    
    return matchesSearch && matchesStatus && matchesProduction;
  }).sort((a, b) => {
    let aVal = a[sortField];
    let bVal = b[sortField];
    
    if (sortField === 'customer_name') {
      aVal = a.customer?.name || a.customer_name || '';
      bVal = b.customer?.name || b.customer_name || '';
    }
    
    if (typeof aVal === 'string') {
      return sortDirection === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    }
    
    return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
  });

  // Pagination logic
  const indexOfLastOrder = currentPage * ordersPerPage;
  const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
  const currentOrders = filteredOrders.slice(indexOfFirstOrder, indexOfLastOrder);
  const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);

  // Handler functions
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleCreateOrder = () => {
    setEditingOrder(null);
    setShowOrderModal(true);
  };

  const handleEditOrder = (order) => {
    setEditingOrder(order);
    setShowOrderModal(true);
  };

  const handleDeleteOrder = (order) => {
    setSelectedOrder(order);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      await deleteOrder(selectedOrder.id);
      setSuccess('Order deleted successfully');
      setShowDeleteModal(false);
      fetchAllData();
    } catch (err) {
      setError('Failed to delete order: ' + err.message);
    }
  };

  const handleOrderSubmit = async (orderData) => {
    try {
      if (editingOrder) {
        await updateOrder(editingOrder.id, orderData);
        setSuccess('Order updated successfully');
      } else {
        await createOrder(orderData);
        setSuccess('Order created successfully');
      }
      setShowOrderModal(false);
      fetchAllData();
    } catch (err) {
      setError('Failed to save order: ' + err.message);
    }
  };

  const getStatusBadge = (status, type = 'order') => {
    const statusConfig = {
      order: {
        pending: { bg: 'warning', text: 'Pending' },
        confirmed: { bg: 'info', text: 'Confirmed' },
        in_production: { bg: 'primary', text: 'In Production' },
        ready_for_delivery: { bg: 'success', text: 'Ready' },
        out_for_delivery: { bg: 'info', text: 'Out for Delivery' },
        delivered: { bg: 'success', text: 'Delivered' },
        cancelled: { bg: 'danger', text: 'Cancelled' }
      },
      production: {
        not_started: { bg: 'secondary', text: '🟡 Not Started' },
        in_production: { bg: 'warning', text: '🟠 In Production' },
        ready_for_delivery: { bg: 'success', text: '🟢 Ready for Delivery' }
      }
    };
    
    const config = statusConfig[type][status] || { bg: 'secondary', text: status };
    return <Badge bg={config.bg}>{config.text}</Badge>;
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

  const isOverdue = (order) => {
    return new Date(order.delivery_deadline) < new Date() && 
           !['delivered', 'cancelled'].includes(order.order_status);
  };

  const getTabCounts = () => {
    return {
      all: orders.length,
      pending: orders.filter(o => o.order_status === 'pending').length,
      production: orders.filter(o => o.production_status === 'in_production').length,
      ready: orders.filter(o => o.production_status === 'ready_for_delivery').length,
      overdue: orders.filter(o => isOverdue(o)).length
    };
  };

  const tabCounts = getTabCounts();

  if (loading && orders.length === 0) {
    return (
      <Container fluid className="py-4 text-center">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2">Loading orders...</p>
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
          title="OOX Furniture - Orders Management"
          subtitle={
            userRole === 'owner' 
              ? 'OOX Furniture full order oversight and management'
              : userRole === 'admin' 
              ? 'OOX Furniture order administration and customer service'
              : 'OOX Furniture production tracking and fulfillment'
          }
          icon={FaClipboardList}
          onRefresh={fetchAllData}
          accentColor="#f59e0b"
        >
          {canCreate && (
            <div className="d-flex gap-2 justify-content-end">
              <Button 
                variant="success" 
                onClick={handleCreateOrder}
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
          )}
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

        {/* Tabs */}
        <Card className="mb-4">
          <Card.Header className="pb-0">
            <Tabs 
              activeKey={activeTab} 
              onSelect={setActiveTab}
              className="border-bottom-0"
            >
              <Tab 
                eventKey="all" 
                title={
                  <span>
                    All Orders <Badge bg="secondary" className="ms-1">{tabCounts.all}</Badge>
                  </span>
                }
              />
              <Tab 
                eventKey="pending" 
                title={
                  <span>
                    Pending <Badge bg="warning" className="ms-1">{tabCounts.pending}</Badge>
                  </span>
                }
              />
              <Tab 
                eventKey="production" 
                title={
                  <span>
                    In Production <Badge bg="primary" className="ms-1">{tabCounts.production}</Badge>
                  </span>
                }
              />
              <Tab 
                eventKey="ready" 
                title={
                  <span>
                    Ready <Badge bg="success" className="ms-1">{tabCounts.ready}</Badge>
                  </span>
                }
              />
              <Tab 
                eventKey="overdue" 
                title={
                  <span>
                    Overdue <Badge bg="danger" className="ms-1">{tabCounts.overdue}</Badge>
                  </span>
                }
              />
            </Tabs>
          </Card.Header>

          {/* Filters and Search */}
          <Card.Body className="pb-2">
            <Row className="g-3">
              <Col md={4}>
                <InputGroup>
                  <InputGroup.Text>
                    <FaSearch />
                  </InputGroup.Text>
                  <Form.Control
                    type="text"
                    placeholder="Search orders, customers..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </InputGroup>
              </Col>
              {activeTab === 'all' && (
                <>
                  <Col md={3}>
                    <Form.Select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                    >
                      <option value="all">All Status</option>
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="in_production">In Production</option>
                      <option value="delivered">Delivered</option>
                    </Form.Select>
                  </Col>
                  <Col md={3}>
                    <Form.Select
                      value={productionFilter}
                      onChange={(e) => setProductionFilter(e.target.value)}
                    >
                      <option value="all">All Production Status</option>
                      <option value="not_started">Not Started</option>
                      <option value="in_production">In Production</option>
                      <option value="ready_for_delivery">Ready for Delivery</option>
                    </Form.Select>
                  </Col>
                </>
              )}
              <Col md={2}>
                <Dropdown>
                  <Dropdown.Toggle variant="outline-secondary" size="sm">
                    <FaDownload className="me-1" />
                    Export
                  </Dropdown.Toggle>
                  <Dropdown.Menu>
                    <Dropdown.Item>Export to CSV</Dropdown.Item>
                    <Dropdown.Item>Export to PDF</Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        {/* Orders Table */}
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
                    <th>Status</th>
                    <th>Production</th>
                    {canViewFinancials && (
                      <th 
                        style={{ cursor: 'pointer' }}
                        onClick={() => handleSort('total_amount')}
                      >
                        Total {getSortIcon('total_amount')}
                      </th>
                    )}
                    <th 
                      style={{ cursor: 'pointer' }}
                      onClick={() => handleSort('delivery_deadline')}
                    >
                      Deadline {getSortIcon('delivery_deadline')}
                    </th>
                    <th 
                      style={{ cursor: 'pointer' }}
                      onClick={() => handleSort('order_date')}
                    >
                      Created {getSortIcon('order_date')}
                    </th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentOrders.map(order => (
                    <tr 
                      key={order.id} 
                      className={isOverdue(order) ? 'table-warning' : ''}
                    >
                      <td>
                        <strong>{order.order_number}</strong>
                        {isOverdue(order) && (
                          <OverlayTrigger
                            overlay={<Tooltip>Overdue</Tooltip>}
                          >
                            <FaExclamationTriangle className="ms-2 text-danger" />
                          </OverlayTrigger>
                        )}
                      </td>
                      <td>
                        <div>
                          <div className="fw-medium">
                            {order.customer?.name || order.customer_name}
                          </div>
                          {order.customer?.phone && (
                            <small className="text-muted">{order.customer.phone}</small>
                          )}
                        </div>
                      </td>
                      <td>{getStatusBadge(order.order_status, 'order')}</td>
                      <td>{getStatusBadge(order.production_status, 'production')}</td>
                      {canViewFinancials && (
                        <td>
                          <div className="fw-medium">{formatCurrency(order.total_amount)}</div>
                          <small className="text-muted">
                            Paid: {formatCurrency(order.deposit_amount)}
                          </small>
                        </td>
                      )}
                      <td>
                        <div className={isOverdue(order) ? 'text-danger fw-medium' : ''}>
                          {formatDate(order.delivery_deadline)}
                        </div>
                      </td>
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
                              size="sm"
                              onClick={() => setSelectedOrder(order)}
                            >
                              <FaEye />
                            </Button>
                          </OverlayTrigger>
                          {canEdit && (
                            <OverlayTrigger overlay={<Tooltip>Edit Order</Tooltip>}>
                              <Button 
                                variant="outline-secondary" 
                                size="sm"
                                onClick={() => handleEditOrder(order)}
                              >
                                <FaEdit />
                              </Button>
                            </OverlayTrigger>
                          )}
                          {canDelete && (
                            <OverlayTrigger overlay={<Tooltip>Delete Order</Tooltip>}>
                              <Button 
                                variant="outline-danger" 
                                size="sm"
                                onClick={() => handleDeleteOrder(order)}
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

              {filteredOrders.length === 0 && (
                <div className="text-center py-5">
                  <FaBoxes size={48} className="text-muted mb-3" />
                  <h5 className="text-muted">No orders found</h5>
                  <p className="text-muted">
                    {searchTerm ? 'Try adjusting your search criteria' : 'No orders match the current filters'}
                  </p>
                  {canCreate && (
                    <Button variant="primary" onClick={handleCreateOrder}>
                      <FaPlus className="me-1" />
                      Create First Order
                    </Button>
                  )}
                </div>
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="d-flex justify-content-between align-items-center p-3 border-top">
                <div className="text-muted">
                  Showing {indexOfFirstOrder + 1} to {Math.min(indexOfLastOrder, filteredOrders.length)} of {filteredOrders.length} orders
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

        {/* Order Form Modal */}
        <Modal 
          show={showOrderModal} 
          onHide={() => setShowOrderModal(false)} 
          size="xl"
          backdrop="static"
        >
          <Modal.Header closeButton>
            <Modal.Title>
              {editingOrder ? 'Edit Order' : 'Create New Order'}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <OrderForm
              initialData={editingOrder}
              customers={customers}
              products={products}
              onSubmit={handleOrderSubmit}
              onClose={() => setShowOrderModal(false)}
              userRole={userRole}
            />
          </Modal.Body>
        </Modal>

        {/* Delete Confirmation Modal */}
        <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
          <Modal.Header closeButton>
            <Modal.Title>Confirm Delete</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <div className="text-center">
              <FaTrash size={48} className="text-danger mb-3" />
              <h5>Delete Order?</h5>
              <p className="text-muted">
                Are you sure you want to delete order <strong>{selectedOrder?.order_number}</strong>?
                This action cannot be undone.
              </p>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={confirmDelete}>
              Delete Order
            </Button>
          </Modal.Footer>
        </Modal>
        </Container>
      </div>
    </>
  );
};

export default Orders;