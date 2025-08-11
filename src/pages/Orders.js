import React, { useState, useEffect } from 'react';
import {
  Container, Row, Col, Card, Button, Table, Modal, Form,
  Badge, Dropdown, InputGroup, Alert, Spinner, Tab, Tabs,
  ButtonGroup, OverlayTrigger, Tooltip
} from 'react-bootstrap';
import {
  FaPlus, FaEdit, FaTrash, FaEye, FaSearch,
  FaDownload, FaCheck, FaExclamationTriangle,
  FaClipboardList, FaSortUp, FaSortDown, FaBoxes, FaHourglassHalf
} from 'react-icons/fa';
import { 
  getOrders, getCustomers, getProducts, 
  createOrder, updateOrder, deleteOrder, advanceOrderWorkflow
} from '../components/api';
import OrderForm from '../components/OrderForm';
import SharedHeader from '../components/SharedHeader';
import UniversalSidebar from '../components/UniversalSidebar';
import { getOrderManagementData, patchOrderStatus } from '../components/api';
import { getOrderStatusOptions } from '../components/api';

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
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusForm, setStatusForm] = useState({ order_status: '', production_status: '' });
  const [statusOptions, setStatusOptions] = useState({ order_statuses: [], production_statuses: [] });

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
    // Load management options for status editing
    (async () => {
      try {
        const mgmt = await getOrderManagementData().catch(() => null);
        const defaultOrderStatuses = [
          { value: 'deposit_pending', label: 'Deposit Pending' },
          { value: 'deposit_paid', label: 'Deposit Paid' },
          { value: 'pending', label: 'Pending' },
          { value: 'confirmed', label: 'Confirmed' },
          { value: 'out_for_delivery', label: 'Out for Delivery' },
          { value: 'delivered', label: 'Delivered' },
          { value: 'cancelled', label: 'Cancelled' }
        ];
        const defaultProductionStatuses = [
          { value: 'not_started', label: 'Not Started' },
          { value: 'in_production', label: 'In Production' },
          { value: 'ready_for_delivery', label: 'Ready for Delivery' }
        ];

        let fetchedOrderStatuses = mgmt?.status_options?.order_statuses;
        let fetchedProductionStatuses = mgmt?.status_options?.production_statuses;

        if (!Array.isArray(fetchedOrderStatuses) || fetchedOrderStatuses.length === 0 || !Array.isArray(fetchedProductionStatuses) || fetchedProductionStatuses.length === 0) {
          try {
            const statusOpts = await getOrderStatusOptions();
            fetchedOrderStatuses = statusOpts?.order_statuses;
            fetchedProductionStatuses = statusOpts?.production_statuses;
          } catch {}
        }

        setStatusOptions({
          order_statuses: Array.isArray(fetchedOrderStatuses) && fetchedOrderStatuses.length > 0 ? fetchedOrderStatuses : defaultOrderStatuses,
          production_statuses: Array.isArray(fetchedProductionStatuses) && fetchedProductionStatuses.length > 0 ? fetchedProductionStatuses : defaultProductionStatuses
        });
      } catch (_) {
        // fallback defaults
        setStatusOptions({
          order_statuses: [
            { value: 'deposit_pending', label: 'Deposit Pending' },
            { value: 'deposit_paid', label: 'Deposit Paid' },
            { value: 'pending', label: 'Pending' },
            { value: 'confirmed', label: 'Confirmed' },
            { value: 'out_for_delivery', label: 'Out for Delivery' },
            { value: 'delivered', label: 'Delivered' },
            { value: 'cancelled', label: 'Cancelled' }
          ],
          production_statuses: [
            { value: 'not_started', label: 'Not Started' },
            { value: 'in_production', label: 'In Production' },
            { value: 'ready_for_delivery', label: 'Ready for Delivery' }
          ]
        });
      }
    })();
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
  const canEdit = userRole === 'owner' || userRole === 'admin' || userRole === 'warehouse_manager' || userRole === 'warehouse';
  const canDelete = userRole === 'owner';
  const isManagerOnly = userRole === 'warehouse_manager' || userRole === 'warehouse';

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

  // Manager should not be able to create new orders
  const handleCreateOrder = () => {
    if (!canCreate) return;
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

  // Manager actions: mark ready or delay
  const markReadyForDelivery = async (order) => {
    try {
      await updateOrder(order.id, { order_status: 'confirmed', production_status: 'ready_for_delivery' });
      setSuccess(`Order ${order.order_number} marked as ready for delivery`);
      fetchAllData();
    } catch (e) { setError(e?.message || 'Failed to update'); }
  };
  const delayOrder = async (order) => {
    try {
      // Example: store a delayed flag or update deadline; adjust based on backend support
      await updateOrder(order.id, { order_status: order.order_status, production_status: 'in_production', delayed: true });
      setSuccess(`Order ${order.order_number} flagged as delayed`);
      fetchAllData();
    } catch (e) { setError(e?.message || 'Failed to delay'); }
  };

  // Manual Status Change
  const openStatusModal = (order) => {
    if (!canEdit) return;
    setSelectedOrder(order);
    setStatusForm({
      order_status: order.order_status || '',
      production_status: order.production_status || ''
    });
    setShowStatusModal(true);
  };
  const submitStatusChange = async (e) => {
    e?.preventDefault?.();
    try {
      await patchOrderStatus(selectedOrder.id, statusForm);
      setShowStatusModal(false);
      setSuccess('Status updated');
      fetchAllData();
    } catch (e) {
      setError(e?.message || 'Failed to update status');
    }
  };

  const getStatusBadge = (status, type = 'order') => {
    const statusConfig = {
      order: {
        pending: { bg: 'warning', text: 'Pending' },
        confirmed: { bg: 'info', text: 'Confirmed' },
        in_production: { bg: 'primary', text: 'In Production' },
        order_ready: { bg: 'success', text: 'Ready' },
        out_for_delivery: { bg: 'info', text: 'Out for Delivery' },
        delivered: { bg: 'success', text: 'Delivered' },
        cancelled: { bg: 'danger', text: 'Cancelled' }
      },
      production: {
        not_started: { bg: 'secondary', text: '🟡 Not Started' },
        in_production: { bg: 'warning', text: '🟠 In Production' },
        completed: { bg: 'success', text: '🟢 Completed' }
      }
    };
    const normalized = status === 'ready_for_delivery' ? 'order_ready' : status;
    const config = statusConfig[type][normalized] || { bg: 'secondary', text: normalized };
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
      ready: orders.filter(o => (o.order_status === 'order_ready') || (o.production_status === 'completed')).length,
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
 
  const content = (
    <Container fluid className="py-3">
      <Card className="mb-3">
        <Card.Body>
          <Row className="g-2 align-items-center">
            <Col md={4}>
              <InputGroup>
                <InputGroup.Text><FaSearch /></InputGroup.Text>
                <Form.Control
                  placeholder="Search by order number or customer"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>
            </Col>
            <Col md={2}>
              <Form.Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </Form.Select>
            </Col>
            <Col md={2}>
              <Form.Select value={productionFilter} onChange={(e) => setProductionFilter(e.target.value)}>
                <option value="all">All Production</option>
                <option value="not_started">Not Started</option>
                <option value="in_production">In Production</option>
                <option value="ready_for_delivery">Ready</option>
              </Form.Select>
            </Col>
            <Col className="text-end">
              {canCreate && (
                <Button variant="primary" onClick={handleCreateOrder}>
                  <FaPlus className="me-2" /> Add New Order
                </Button>
              )}
            </Col>
          </Row>
        </Card.Body>
      </Card>
      <Card>
        <Card.Header className="d-flex justify-content-between align-items-center">
          <span>Orders</span>
          <div>
            <Button variant="outline-secondary" size="sm" onClick={fetchAllData}>
              Refresh
            </Button>
          </div>
        </Card.Header>
        <Card.Body className="p-0">
          <Table responsive hover className="mb-0">
                <thead>
                  <tr>
                    <th onClick={() => handleSort('order_number')} style={{ cursor: 'pointer' }}>
                      Order # {getSortIcon('order_number')}
                    </th>
                    <th onClick={() => handleSort('customer_name')} style={{ cursor: 'pointer' }}>
                      Customer {getSortIcon('customer_name')}
                    </th>
                    <th>Order Status</th>
                    <th>Production</th>
                    <th>Amount</th>
                    <th>Created</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentOrders.map(order => (
                    <tr key={order.id}>
                      <td>{order.order_number}</td>
                      <td>{order.customer?.name || order.customer_name}</td>
                      <td>
                        <span role="button" onClick={() => openStatusModal(order)}>
                          {getStatusBadge(order.order_status, 'order')}
                        </span>
                      </td>
                      <td>
                        <span role="button" onClick={() => openStatusModal(order)}>
                          {getStatusBadge(order.production_status, 'production')}
                        </span>
                      </td>
                      <td>{formatCurrency(order.total_amount)}</td>
                      <td>{formatDate(order.created_at)}</td>
                      <td className="text-end">
                        <ButtonGroup size="sm">
                          <OverlayTrigger placement="top" overlay={<Tooltip>View</Tooltip>}>
                            <Button variant="outline-secondary"><FaEye /></Button>
                          </OverlayTrigger>
                          {canEdit && (
                            <OverlayTrigger placement="top" overlay={<Tooltip>Edit</Tooltip>}>
                              <Button variant="outline-primary" onClick={() => handleEditOrder(order)}><FaEdit /></Button>
                            </OverlayTrigger>
                          )}
                          {canEdit && (
                            <OverlayTrigger placement="top" overlay={<Tooltip>Advance Workflow</Tooltip>}>
                              <Button variant="outline-secondary" onClick={async ()=>{ try { await advanceOrderWorkflow(order.id); fetchAllData(); } catch(e){ setError(e?.message||'Advance failed'); } }}>Next</Button>
                            </OverlayTrigger>
                          )}
                          {canDelete && (
                            <OverlayTrigger placement="top" overlay={<Tooltip>Delete</Tooltip>}>
                              <Button variant="outline-danger" onClick={() => handleDeleteOrder(order)}><FaTrash /></Button>
                            </OverlayTrigger>
                          )}
                          {isManagerOnly && (
                            <>
                              <OverlayTrigger placement="top" overlay={<Tooltip>Mark Ready</Tooltip>}>
                                <Button variant="outline-success" onClick={() => markReadyForDelivery(order)}><FaCheck /></Button>
                              </OverlayTrigger>
                              <OverlayTrigger placement="top" overlay={<Tooltip>Delay Order</Tooltip>}>
                                <Button variant="outline-warning" onClick={() => delayOrder(order)}><FaHourglassHalf /></Button>
                              </OverlayTrigger>
                            </>
                          )}
                        </ButtonGroup>
                      </td>
                    </tr>
                  ))}
                  {currentOrders.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center text-muted py-4">No orders found</td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
          {/* Pagination */}
          <div className="d-flex justify-content-between align-items-center mt-3">
            <div className="text-muted">Page {currentPage} of {totalPages}</div>
            <div>
              <Button
                variant="outline-secondary"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              >Previous</Button>
              <Button
                variant="outline-secondary"
                size="sm"
                className="ms-2"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              >Next</Button>
            </div>
          </div>

          {/* Order Modal */}
          {canCreate && (
            <Modal show={showOrderModal} onHide={() => setShowOrderModal(false)} size="lg">
              <Modal.Header closeButton>
                <Modal.Title>{editingOrder ? 'Edit Order' : 'Add New Order'}</Modal.Title>
              </Modal.Header>
              <Modal.Body>
                <OrderForm 
                  onClose={() => setShowOrderModal(false)}
                  onSubmit={handleOrderSubmit}
                  loading={loading}
                  isEdit={!!editingOrder}
                  initialData={editingOrder ? {
                    customerName: editingOrder.customer?.name || editingOrder.customer_name || '',
                    customerPhone: editingOrder.customer?.phone || '',
                    customerEmail: editingOrder.customer?.email || '',
                    customerAddress: editingOrder.customer?.address || '',
                    expectedDeliveryDate: editingOrder.expected_delivery_date || editingOrder.delivery_deadline || '',
                    adminNotes: editingOrder.admin_notes || '',
                    depositAmount: editingOrder.deposit_amount ?? '',
                    paymentStatus: editingOrder.payment_status || 'deposit_only',
                    orderStatus: editingOrder.order_status || 'pending',
                  } : null}
                  initialItems={editingOrder?.items || []}
                />
              </Modal.Body>
            </Modal>
          )}

          {/* Delete Confirmation Modal */}
          {canDelete && (
            <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
              <Modal.Header closeButton>
                <Modal.Title>Confirm Delete</Modal.Title>
              </Modal.Header>
              <Modal.Body>
                Are you sure you want to delete order {selectedOrder?.order_number}?
              </Modal.Body>
              <Modal.Footer>
                <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>Cancel</Button>
                <Button variant="danger" onClick={confirmDelete}>Delete</Button>
              </Modal.Footer>
            </Modal>
          )}

          {/* Status Change Modal */}
          {canEdit && (
            <Modal show={showStatusModal} onHide={() => setShowStatusModal(false)}>
              <Modal.Header closeButton>
                <Modal.Title>Change Order Status</Modal.Title>
              </Modal.Header>
              <Modal.Body>
                <Form onSubmit={submitStatusChange}>
                  <Form.Group className="mb-3">
                    <Form.Label>Order Status</Form.Label>
                    <Form.Select
                      value={statusForm.order_status}
                      onChange={(e)=>setStatusForm({...statusForm, order_status: e.target.value})}
                    >
                      <option value="">-- Select --</option>
                      {statusOptions.order_statuses
                        .filter(opt => {
                          const val = typeof opt === 'string' ? opt : opt.value;
                          // Role-based filtering of order status transitions
                          if (userRole === 'owner' || userRole === 'admin') return true;
                          const current = selectedOrder?.order_status;
                          if (userRole === 'warehouse' || userRole === 'warehouse_worker') {
                            return current === 'deposit_paid' ? ['order_ready'].includes(val) : false;
                          }
                          if (userRole === 'warehouse_manager') {
                            if (current === 'deposit_paid') return ['order_ready'].includes(val);
                            if (current === 'order_ready') return ['out_for_delivery'].includes(val);
                            return false;
                          }
                          if (userRole === 'delivery') {
                            if (current === 'order_ready') return ['out_for_delivery'].includes(val);
                            if (current === 'out_for_delivery') return ['delivered'].includes(val);
                            return false;
                          }
                          return false;
                        })
                        .map(opt => {
                          const val = typeof opt === 'string' ? opt : opt.value;
                          const label = typeof opt === 'string' ? opt : (opt.label || opt.value);
                          return <option key={val} value={val}>{label}</option>;
                        })}
                    </Form.Select>
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Production Status</Form.Label>
                    <Form.Select
                      value={statusForm.production_status}
                      onChange={(e)=>setStatusForm({...statusForm, production_status: e.target.value})}
                    >
                      <option value="">-- Select --</option>
                      {statusOptions.production_statuses
                        .filter(opt => {
                          const val = typeof opt === 'string' ? opt : opt.value;
                          // Only forward movement for production statuses unless owner/admin
                          if (userRole === 'owner' || userRole === 'admin') return true;
                          const current = selectedOrder?.production_status || 'not_started';
                          const order = ['not_started', 'in_production', 'completed'];
                          const currentIdx = order.indexOf(current);
                          const targetIdx = order.indexOf(val);
                          return targetIdx >= currentIdx && targetIdx <= currentIdx + 1;
                        })
                        .map(opt => {
                          const val = typeof opt === 'string' ? opt : opt.value;
                          const label = typeof opt === 'string' ? opt : (opt.label || opt.value);
                          return <option key={val} value={val}>{label}</option>;
                        })}
                    </Form.Select>
                  </Form.Group>
                </Form>
              </Modal.Body>
              <Modal.Footer>
                <Button variant="secondary" onClick={()=>setShowStatusModal(false)}>Cancel</Button>
                <Button variant="primary" onClick={submitStatusChange}>Update</Button>
              </Modal.Footer>
            </Modal>
          )}
    </Container>
  );
  if (userRole === 'owner' || userRole === 'admin') {
    return (
      <>
        <UniversalSidebar user={user} userRole={userRole} onLogout={onLogout} />
        <div className="main-content">
          <SharedHeader user={user} onLogout={onLogout} dashboardType={userRole} />
          {content}
        </div>
      </>
    );
  }
  return content;
};

export default Orders;