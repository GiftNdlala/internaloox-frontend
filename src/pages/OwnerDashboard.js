import React, { useState, useEffect } from 'react';
import { 
  Container, Row, Col, Card, Nav, Button, 
  Table, Modal, Form, Alert, Badge, Dropdown,
  Navbar, NavDropdown
} from 'react-bootstrap';
import { 
  FaUsers, FaBoxes, FaTruck, FaChartLine, 
  FaPlus, FaEdit, FaTrash, FaCog, FaSignOutAlt,
  FaUserShield, FaClipboardList, FaMoneyBillWave,
  FaFileAlt, FaDownload, FaEye
} from 'react-icons/fa';
import OrderForm from '../components/OrderForm';

const OwnerDashboard = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState({});
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showPOPModal, setShowPOPModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedPOP, setSelectedPOP] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Form states
  const [userForm, setUserForm] = useState({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    role: 'admin',
    phone: '',
    password: '',
    confirm_password: ''
  });

  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    payment_type: 'deposit',
    payment_method: 'bank_transfer',
    reference_number: '',
    payment_date: '',
    notes: ''
  });

  // Delivery-related modal state
  const [showDeliveryStatusModal, setShowDeliveryStatusModal] = useState(false);
  const [showDeliveryNoteModal, setShowDeliveryNoteModal] = useState(false);
  const [showPODUploadModal, setShowPODUploadModal] = useState(false);
  const [selectedDeliveryOrder, setSelectedDeliveryOrder] = useState(null);
  const [selectedPODOrder, setSelectedPODOrder] = useState(null);

  // Delivery action stubs
  const viewPOD = (order) => {
    setSelectedPODOrder(order);
    setShowPODUploadModal(true); // For now, reuse upload modal for viewing
  };
  const openDeliveryStatusModal = (order) => {
    setSelectedDeliveryOrder(order);
    setShowDeliveryStatusModal(true);
  };
  const openDeliveryNoteModal = (order) => {
    setSelectedDeliveryOrder(order);
    setShowDeliveryNoteModal(true);
  };
  const uploadPOD = (order) => {
    setSelectedPODOrder(order);
    setShowPODUploadModal(true);
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      // For now, use mock data since we don't have backend API working
      setStats({
        total_orders: 25,
        pending_orders: 8,
        in_production: 12,
        ready_for_delivery: 5,
        overdue_orders: 2
      });
      
      setUsers([
        {
          id: 1,
          username: 'owner',
          email: 'owner@oox.com',
          first_name: 'Owner',
          last_name: 'User',
          role: 'owner',
          phone: '08012345678',
          is_active: true
        },
        {
          id: 2,
          username: 'admin',
          email: 'admin@oox.com',
          first_name: 'Admin',
          last_name: 'User',
          role: 'admin',
          phone: '08087654321',
          is_active: true
        }
      ]);
      
      setOrders([
        {
          id: 1,
          order_number: 'OOX000001',
          customer: { name: 'John Doe', phone: '08012345678' },
          product_name: 'Dining Table Set',
          total_amount: '150000.00',
          order_status: 'confirmed',
          payment_status: 'deposit_only',
          expected_delivery_date: '2024-02-15',
          payments: [
            {
              id: 1,
              amount: '50000.00',
              payment_type: 'deposit',
              payment_method: 'bank_transfer',
              reference_number: 'TXN001234',
              payment_date: '2024-01-15',
              notes: 'Initial deposit payment',
              pop_file: 'pop_001.jpg',
              pop_url: '/uploads/pop_001.jpg'
            }
          ],
          total_paid: '50000.00',
          balance_due: '100000.00'
        },
        {
          id: 2,
          order_number: 'OOX000002',
          customer: { name: 'Jane Smith', phone: '08087654321' },
          product_name: 'Bedroom Suite',
          total_amount: '200000.00',
          order_status: 'in_production',
          payment_status: 'fifty_percent',
          expected_delivery_date: '2024-02-20',
          payments: [
            {
              id: 2,
              amount: '100000.00',
              payment_type: 'deposit',
              payment_method: 'cash',
              reference_number: 'CASH001',
              payment_date: '2024-01-20',
              notes: '50% deposit payment',
              pop_file: 'pop_002.jpg',
              pop_url: '/uploads/pop_002.jpg'
            }
          ],
          total_paid: '100000.00',
          balance_due: '100000.00'
        },
        {
          id: 3,
          order_number: 'OOX000003',
          customer: { name: 'Mike Johnson', phone: '08055556666' },
          product_name: 'Living Room Set',
          total_amount: '180000.00',
          order_status: 'ready_for_delivery',
          payment_status: 'fully_paid',
          expected_delivery_date: '2024-02-25',
          payments: [
            {
              id: 3,
              amount: '90000.00',
              payment_type: 'deposit',
              payment_method: 'bank_transfer',
              reference_number: 'TXN005678',
              payment_date: '2024-01-25',
              notes: '50% deposit',
              pop_file: 'pop_003a.jpg',
              pop_url: '/uploads/pop_003a.jpg'
            },
            {
              id: 4,
              amount: '90000.00',
              payment_type: 'balance',
              payment_method: 'bank_transfer',
              reference_number: 'TXN005679',
              payment_date: '2024-02-10',
              notes: 'Final payment',
              pop_file: 'pop_003b.jpg',
              pop_url: '/uploads/pop_003b.jpg'
            }
          ],
          total_paid: '180000.00',
          balance_due: '0.00'
        }
      ]);
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrder = async (orderData) => {
    try {
      setLoading(true);
      
      // For now, just add to local state since we don't have backend API
      const newOrder = {
        id: orders.length + 1,
        order_number: `OOX${String(orders.length + 1).padStart(6, '0')}`,
        customer: { name: orderData.customerName, phone: orderData.customerPhone || '' },
        product_name: orderData.productName,
        total_amount: orderData.totalAmount,
        order_status: orderData.orderStatus || 'pending',
        payment_status: orderData.paymentStatus || 'deposit_only',
        expected_delivery_date: orderData.expectedDeliveryDate,
        payments: [],
        total_paid: '0.00',
        balance_due: orderData.totalAmount
      };
      
      setOrders([newOrder, ...orders]);
      setShowOrderForm(false);
      setSuccess('Order created successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
      
    } catch (err) {
      setError('Failed to create order');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (userForm.password !== userForm.confirm_password) {
      setError('Passwords do not match');
      return;
    }

    try {
      // For now, just add to local state
      const newUser = {
        id: users.length + 1,
        username: userForm.username,
        email: userForm.email,
        first_name: userForm.first_name,
        last_name: userForm.last_name,
        role: userForm.role,
        phone: userForm.phone,
        is_active: true
      };
      
      setUsers([...users, newUser]);
      setShowUserModal(false);
      setUserForm({
        username: '', email: '', first_name: '', last_name: '',
        role: 'admin', phone: '', password: '', confirm_password: ''
      });
      setError(null);
      setSuccess('User created successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to create user');
    }
  };

  const handleEditUser = async (e) => {
    e.preventDefault();
    try {
      // For now, just update local state
      const updatedUsers = users.map(u => 
        u.id === selectedUser.id 
          ? { ...u, ...userForm }
          : u
      );
      
      setUsers(updatedUsers);
      setShowEditUserModal(false);
      setSelectedUser(null);
      setError(null);
      setSuccess('User updated successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to update user');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        setUsers(users.filter(u => u.id !== userId));
        setError(null);
        setSuccess('User deleted successfully!');
        setTimeout(() => setSuccess(null), 3000);
      } catch (err) {
        setError('Failed to delete user');
      }
    }
  };

  const openEditUser = (user) => {
    setSelectedUser(user);
    setUserForm({
      username: user.username,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      role: user.role,
      phone: user.phone || '',
      password: '',
      confirm_password: ''
    });
    setShowEditUserModal(true);
  };

  // Payment-related functions
  const openPaymentModal = (order) => {
    setSelectedOrder(order);
    setPaymentForm({
      amount: '',
      payment_type: 'balance',
      payment_method: 'bank_transfer',
      reference_number: '',
      payment_date: new Date().toISOString().split('T')[0],
      notes: ''
    });
    setShowPaymentModal(true);
  };

  const handleAddPayment = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      // Create new payment
      const newPayment = {
        id: Date.now(),
        amount: paymentForm.amount,
        payment_type: paymentForm.payment_type,
        payment_method: paymentForm.payment_method,
        reference_number: paymentForm.reference_number,
        payment_date: paymentForm.payment_date,
        notes: paymentForm.notes,
        pop_file: 'pop_' + Date.now() + '.jpg',
        pop_url: '/uploads/pop_' + Date.now() + '.jpg'
      };

      // Update order with new payment
      const updatedOrders = orders.map(order => {
        if (order.id === selectedOrder.id) {
          const updatedPayments = [...order.payments, newPayment];
          const totalPaid = updatedPayments.reduce((sum, payment) => 
            sum + parseFloat(payment.amount), 0
          );
          const balanceDue = parseFloat(order.total_amount) - totalPaid;
          
          let newPaymentStatus = 'deposit_only';
          if (balanceDue === 0) {
            newPaymentStatus = 'fully_paid';
          } else if (totalPaid >= parseFloat(order.total_amount) * 0.5) {
            newPaymentStatus = 'fifty_percent';
          }

          return {
            ...order,
            payments: updatedPayments,
            total_paid: totalPaid.toFixed(2),
            balance_due: balanceDue.toFixed(2),
            payment_status: newPaymentStatus
          };
        }
        return order;
      });

      setOrders(updatedOrders);
      setShowPaymentModal(false);
      setSelectedOrder(null);
      setSuccess('Payment added successfully!');
      setTimeout(() => setSuccess(null), 3000);
      
    } catch (err) {
      setError('Failed to add payment');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const viewPOP = (pop) => {
    setSelectedPOP(pop);
    setShowPOPModal(true);
  };

  const getPaymentStatusColor = (status) => {
    switch (status) {
      case 'fully_paid': return 'success';
      case 'fifty_percent': return 'warning';
      case 'deposit_only': return 'info';
      default: return 'secondary';
    }
  };

  const getPaymentMethodLabel = (method) => {
    switch (method) {
      case 'bank_transfer': return 'Bank Transfer';
      case 'cash': return 'Cash';
      case 'card': return 'Card';
      case 'mobile_money': return 'Mobile Money';
      default: return method;
    }
  };

  const getPaymentTypeLabel = (type) => {
    switch (type) {
      case 'deposit': return 'Deposit';
      case 'balance': return 'Balance';
      case 'full': return 'Full Payment';
      default: return type;
    }
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'owner': return 'danger';
      case 'admin': return 'primary';
      case 'warehouse': return 'warning';
      case 'delivery': return 'success';
      default: return 'secondary';
    }
  };

  if (loading) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </Container>
    );
  }

  return (
    <div className="owner-dashboard">
      {/* Navigation Bar */}
      <Navbar bg="dark" variant="dark" expand="lg" className="mb-4">
        <Container fluid>
          <Navbar.Brand>
            <FaUserShield className="me-2" />
            OOX Owner Portal
          </Navbar.Brand>
          <Navbar.Toggle />
          <Navbar.Collapse className="justify-content-end">
            <NavDropdown title={`Welcome, ${user?.first_name || user?.username}`} id="user-dropdown">
              <NavDropdown.Item href="#profile">Profile</NavDropdown.Item>
              <NavDropdown.Item href="#settings">Settings</NavDropdown.Item>
              <NavDropdown.Divider />
              <NavDropdown.Item onClick={onLogout}>
                <FaSignOutAlt className="me-2" />
                Logout
              </NavDropdown.Item>
            </NavDropdown>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      <Container fluid>
        {error && (
          <Alert variant="danger" dismissible onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert variant="success" dismissible onClose={() => setSuccess(null)}>
            {success}
          </Alert>
        )}

        <Row>
          {/* Sidebar */}
          <Col md={2}>
            <Nav defaultActiveKey={activeTab} className="flex-column">
              <Nav.Link 
                eventKey="overview" 
                onClick={() => setActiveTab('overview')}
                className="d-flex align-items-center"
              >
                <FaChartLine className="me-2" />
                Overview
              </Nav.Link>
              <Nav.Link 
                eventKey="users" 
                onClick={() => setActiveTab('users')}
                className="d-flex align-items-center"
              >
                <FaUsers className="me-2" />
                User Management
              </Nav.Link>
              <Nav.Link 
                eventKey="orders" 
                onClick={() => setActiveTab('orders')}
                className="d-flex align-items-center"
              >
                <FaClipboardList className="me-2" />
                Orders
              </Nav.Link>
              <Nav.Link 
                eventKey="payments" 
                onClick={() => setActiveTab('payments')}
                className="d-flex align-items-center"
              >
                <FaMoneyBillWave className="me-2" />
                Payments
              </Nav.Link>
              <Nav.Link 
                eventKey="delivery" 
                onClick={() => setActiveTab('delivery')}
                className="d-flex align-items-center"
              >
                <FaTruck className="me-2" />
                Delivery
              </Nav.Link>
              <Nav.Link 
                eventKey="settings" 
                onClick={() => setActiveTab('settings')}
                className="d-flex align-items-center"
              >
                <FaCog className="me-2" />
                System Settings
              </Nav.Link>
            </Nav>
          </Col>

          {/* Main Content */}
          <Col md={10}>
            {activeTab === 'overview' && (
              <div>
                <h2 className="mb-4">System Overview</h2>
                <Row className="mb-4">
                  <Col md={3}>
                    <Card className="text-center">
                      <Card.Body>
                        <FaClipboardList className="text-primary mb-2" size={30} />
                        <Card.Title>{stats.total_orders || 0}</Card.Title>
                        <Card.Text>Total Orders</Card.Text>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col md={3}>
                    <Card className="text-center">
                      <Card.Body>
                        <FaUsers className="text-success mb-2" size={30} />
                        <Card.Title>{users.length}</Card.Title>
                        <Card.Text>Active Users</Card.Text>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col md={3}>
                    <Card className="text-center">
                      <Card.Body>
                        <FaBoxes className="text-warning mb-2" size={30} />
                        <Card.Title>{stats.in_production || 0}</Card.Title>
                        <Card.Text>In Production</Card.Text>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col md={3}>
                    <Card className="text-center">
                      <Card.Body>
                        <FaTruck className="text-info mb-2" size={30} />
                        <Card.Title>{stats.ready_for_delivery || 0}</Card.Title>
                        <Card.Text>Ready for Delivery</Card.Text>
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <Card>
                      <Card.Header>Recent Orders</Card.Header>
                      <Card.Body>
                        <Table striped hover>
                          <thead>
                            <tr>
                              <th>Order #</th>
                              <th>Customer</th>
                              <th>Status</th>
                              <th>Amount</th>
                            </tr>
                          </thead>
                          <tbody>
                            {orders.slice(0, 5).map(order => (
                              <tr key={order.id}>
                                <td>{order.order_number}</td>
                                <td>{order.customer?.name}</td>
                                <td>
                                  <Badge bg={order.order_status === 'delivered' ? 'success' : 'warning'}>
                                    {order.order_status}
                                  </Badge>
                                </td>
                                <td>₦{order.total_amount}</td>
                              </tr>
                            ))}
                          </tbody>
                        </Table>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col md={6}>
                    <Card>
                      <Card.Header>User Activity</Card.Header>
                      <Card.Body>
                        <Table striped hover>
                          <thead>
                            <tr>
                              <th>User</th>
                              <th>Role</th>
                              <th>Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {users.slice(0, 5).map(user => (
                              <tr key={user.id}>
                                <td>{user.first_name} {user.last_name}</td>
                                <td>
                                  <Badge bg={getRoleBadgeColor(user.role)}>
                                    {user.role}
                                  </Badge>
                                </td>
                                <td>
                                  <Badge bg={user.is_active ? 'success' : 'danger'}>
                                    {user.is_active ? 'Active' : 'Inactive'}
                                  </Badge>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </Table>
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>
              </div>
            )}

            {activeTab === 'users' && (
              <div>
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <h2>User Management</h2>
                  <Button variant="primary" onClick={() => setShowUserModal(true)}>
                    <FaPlus className="me-2" />
                    Add New User
                  </Button>
                </div>

                <Card>
                  <Card.Body>
                    <Table striped hover responsive>
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Username</th>
                          <th>Email</th>
                          <th>Role</th>
                          <th>Phone</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.map(user => (
                          <tr key={user.id}>
                            <td>{user.first_name} {user.last_name}</td>
                            <td>{user.username}</td>
                            <td>{user.email}</td>
                            <td>
                              <Badge bg={getRoleBadgeColor(user.role)}>
                                {user.role}
                              </Badge>
                            </td>
                            <td>{user.phone || '-'}</td>
                            <td>
                              <Badge bg={user.is_active ? 'success' : 'danger'}>
                                {user.is_active ? 'Active' : 'Inactive'}
                              </Badge>
                            </td>
                            <td>
                              <Dropdown>
                                <Dropdown.Toggle variant="outline-secondary" size="sm">
                                  Actions
                                </Dropdown.Toggle>
                                <Dropdown.Menu>
                                  <Dropdown.Item onClick={() => openEditUser(user)}>
                                    <FaEdit className="me-2" />
                                    Edit
                                  </Dropdown.Item>
                                  <Dropdown.Item 
                                    onClick={() => handleDeleteUser(user.id)}
                                    className="text-danger"
                                  >
                                    <FaTrash className="me-2" />
                                    Delete
                                  </Dropdown.Item>
                                </Dropdown.Menu>
                              </Dropdown>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </Card.Body>
                </Card>
              </div>
            )}

            {activeTab === 'orders' && (
              <div>
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <h2>Order Management</h2>
                  <Button 
                    variant="primary" 
                    onClick={() => setShowOrderForm(true)}
                    className="d-flex align-items-center"
                  >
                    <FaPlus className="me-2" />
                    Add New Order
                  </Button>
                </div>

                <Card>
                  <Card.Body>
                    <Table striped hover responsive>
                      <thead>
                        <tr>
                          <th>Order #</th>
                          <th>Customer</th>
                          <th>Product</th>
                          <th>Amount</th>
                          <th>Status</th>
                          <th>Payment</th>
                          <th>Expected Delivery</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orders.map(order => (
                          <tr key={order.id}>
                            <td>{order.order_number}</td>
                            <td>{order.customer?.name}</td>
                            <td>{order.product_name}</td>
                            <td>₦{order.total_amount}</td>
                            <td>
                              <Badge bg={
                                order.order_status === 'delivered' ? 'success' :
                                order.order_status === 'cancelled' ? 'danger' :
                                'warning'
                              }>
                                {order.order_status}
                              </Badge>
                            </td>
                            <td>
                              <Badge bg={
                                order.payment_status === 'fully_paid' ? 'success' :
                                order.payment_status === 'deposit_only' ? 'warning' :
                                'info'
                              }>
                                {order.payment_status}
                              </Badge>
                            </td>
                            <td>{new Date(order.expected_delivery_date).toLocaleDateString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </Card.Body>
                </Card>
              </div>
            )}

            {activeTab === 'payments' && (
              <div>
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <h2>Payment Management</h2>
                  <div>
                    <Badge bg="success" className="me-2">
                      Total Orders: {orders.length}
                    </Badge>
                    <Badge bg="info" className="me-2">
                      Fully Paid: {orders.filter(o => o.payment_status === 'fully_paid').length}
                    </Badge>
                    <Badge bg="warning">
                      Pending: {orders.filter(o => o.payment_status !== 'fully_paid').length}
                    </Badge>
                  </div>
                </div>

                <Card>
                  <Card.Body>
                    <Table striped hover responsive>
                      <thead>
                        <tr>
                          <th>Order #</th>
                          <th>Customer</th>
                          <th>Product</th>
                          <th>Total Amount</th>
                          <th>Paid</th>
                          <th>Balance</th>
                          <th>Payment Status</th>
                          <th>Payments</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orders.map(order => (
                          <tr key={order.id}>
                            <td>
                              <strong>{order.order_number}</strong>
                              <br />
                              <small className="text-muted">
                                {new Date(order.expected_delivery_date).toLocaleDateString()}
                              </small>
                            </td>
                            <td>
                              <div>
                                <strong>{order.customer?.name}</strong>
                                <br />
                                <small className="text-muted">{order.customer?.phone}</small>
                              </div>
                            </td>
                            <td>{order.product_name}</td>
                            <td>
                              <strong>₦{parseFloat(order.total_amount).toLocaleString()}</strong>
                            </td>
                            <td>
                              <span className="text-success">
                                ₦{parseFloat(order.total_paid).toLocaleString()}
                              </span>
                            </td>
                            <td>
                              <span className={parseFloat(order.balance_due) > 0 ? 'text-danger' : 'text-success'}>
                                ₦{parseFloat(order.balance_due).toLocaleString()}
                              </span>
                            </td>
                            <td>
                              <Badge bg={getPaymentStatusColor(order.payment_status)}>
                                {order.payment_status.replace('_', ' ').toUpperCase()}
                              </Badge>
                            </td>
                            <td>
                              <div>
                                {order.payments?.length > 0 ? (
                                  <div>
                                    {order.payments.map((payment, index) => (
                                      <div key={payment.id} className="mb-1">
                                        <small>
                                          <strong>₦{parseFloat(payment.amount).toLocaleString()}</strong>
                                          {' - '}
                                          {getPaymentTypeLabel(payment.payment_type)}
                                          {' via '}
                                          {getPaymentMethodLabel(payment.payment_method)}
                                          {payment.pop_file && (
                                            <Button
                                              variant="link"
                                              size="sm"
                                              className="p-0 ms-1"
                                              onClick={() => viewPOP(payment)}
                                            >
                                              <FaClipboardList size={12} />
                                            </Button>
                                          )}
                                        </small>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="text-muted">No payments</span>
                                )}
                              </div>
                            </td>
                            <td>
                              <Dropdown>
                                <Dropdown.Toggle variant="outline-secondary" size="sm">
                                  Actions
                                </Dropdown.Toggle>
                                <Dropdown.Menu>
                                  <Dropdown.Item onClick={() => openPaymentModal(order)}>
                                    <FaPlus className="me-2" />
                                    Add Payment
                                  </Dropdown.Item>
                                  {order.payments?.length > 0 && (
                                    <Dropdown.Item onClick={() => viewPOP(order.payments[0])}>
                                      <FaClipboardList className="me-2" />
                                      View POP
                                    </Dropdown.Item>
                                  )}
                                </Dropdown.Menu>
                              </Dropdown>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </Card.Body>
                </Card>
              </div>
            )}

            {activeTab === 'delivery' && (
              <div>
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <h2>Delivery Management</h2>
                  <div>
                    <Badge bg="info" className="me-2">
                      Total Orders: {orders.length}
                    </Badge>
                    <Badge bg="success" className="me-2">
                      Delivered: {orders.filter(o => o.delivery_status === 'delivered').length}
                    </Badge>
                    <Badge bg="warning">
                      Pending: {orders.filter(o => o.delivery_status !== 'delivered').length}
                    </Badge>
                  </div>
                </div>
                <Card>
                  <Card.Body>
                    <Table striped hover responsive>
                      <thead>
                        <tr>
                          <th>Order #</th>
                          <th>Customer</th>
                          <th>Product</th>
                          <th>Delivery Address</th>
                          <th>Delivery Status</th>
                          <th>Delivery Team</th>
                          <th>Payment Status</th>
                          <th>POD</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orders.map(order => (
                          <tr key={order.id}>
                            <td>
                              <strong>{order.order_number}</strong>
                              <br />
                              <small className="text-muted">
                                {new Date(order.expected_delivery_date).toLocaleDateString()}
                              </small>
                            </td>
                            <td>
                              <div>
                                <strong>{order.customer?.name}</strong>
                                <br />
                                <small className="text-muted">{order.customer?.phone}</small>
                              </div>
                            </td>
                            <td>{order.product_name}</td>
                            <td>{order.delivery_address || <span className="text-muted">N/A</span>}</td>
                            <td>
                              <Badge bg={
                                order.delivery_status === 'delivered' ? 'success' :
                                order.delivery_status === 'out_for_delivery' ? 'info' :
                                order.delivery_status === 'ready_for_delivery' ? 'warning' :
                                'secondary'
                              }>
                                {order.delivery_status ? order.delivery_status.replace('_', ' ').toUpperCase() : 'PENDING'}
                              </Badge>
                            </td>
                            <td>{order.delivery_team || <span className="text-muted">Unassigned</span>}</td>
                            <td>
                              <Badge bg={getPaymentStatusColor(order.payment_status)}>
                                {order.payment_status.replace('_', ' ').toUpperCase()}
                              </Badge>
                            </td>
                            <td>
                              {order.pod_file ? (
                                <Button variant="link" size="sm" className="p-0" onClick={() => viewPOD(order)}>
                                  <FaFileAlt />
                                </Button>
                              ) : (
                                <span className="text-muted">-</span>
                              )}
                            </td>
                            <td>
                              <Dropdown>
                                <Dropdown.Toggle variant="outline-secondary" size="sm">
                                  Actions
                                </Dropdown.Toggle>
                                <Dropdown.Menu>
                                  <Dropdown.Item onClick={() => openDeliveryStatusModal(order)}>
                                    <FaEdit className="me-2" />
                                    Update Status
                                  </Dropdown.Item>
                                  <Dropdown.Item onClick={() => openDeliveryNoteModal(order)}>
                                    <FaClipboardList className="me-2" />
                                    View/Add Notes
                                  </Dropdown.Item>
                                  <Dropdown.Item onClick={() => uploadPOD(order)}>
                                    <FaFileAlt className="me-2" />
                                    Upload POD
                                  </Dropdown.Item>
                                </Dropdown.Menu>
                              </Dropdown>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </Card.Body>
                </Card>
              </div>
            )}

            {activeTab === 'settings' && (
              <div>
                <h2 className="mb-4">System Settings</h2>
                <Card>
                  <Card.Body>
                    <p>System configuration and settings will be implemented here.</p>
                  </Card.Body>
                </Card>
              </div>
            )}
          </Col>
        </Row>
      </Container>

      {/* Order Form Modal */}
      {showOrderForm && (
        <OrderForm
          onClose={() => setShowOrderForm(false)}
          onSubmit={handleCreateOrder}
          loading={loading}
        />
      )}

      {/* Create User Modal */}
      <Modal show={showUserModal} onHide={() => setShowUserModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Create New User</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleCreateUser}>
          <Modal.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Username *</Form.Label>
                  <Form.Control
                    type="text"
                    value={userForm.username}
                    onChange={(e) => setUserForm({...userForm, username: e.target.value})}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Email *</Form.Label>
                  <Form.Control
                    type="email"
                    value={userForm.email}
                    onChange={(e) => setUserForm({...userForm, email: e.target.value})}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>First Name *</Form.Label>
                  <Form.Control
                    type="text"
                    value={userForm.first_name}
                    onChange={(e) => setUserForm({...userForm, first_name: e.target.value})}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Last Name *</Form.Label>
                  <Form.Control
                    type="text"
                    value={userForm.last_name}
                    onChange={(e) => setUserForm({...userForm, last_name: e.target.value})}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Role *</Form.Label>
                  <Form.Select
                    value={userForm.role}
                    onChange={(e) => setUserForm({...userForm, role: e.target.value})}
                    required
                  >
                    <option value="admin">Admin</option>
                    <option value="warehouse">Warehouse</option>
                    <option value="delivery">Delivery</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Phone</Form.Label>
                  <Form.Control
                    type="tel"
                    value={userForm.phone}
                    onChange={(e) => setUserForm({...userForm, phone: e.target.value})}
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Password *</Form.Label>
                  <Form.Control
                    type="password"
                    value={userForm.password}
                    onChange={(e) => setUserForm({...userForm, password: e.target.value})}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Confirm Password *</Form.Label>
                  <Form.Control
                    type="password"
                    value={userForm.confirm_password}
                    onChange={(e) => setUserForm({...userForm, confirm_password: e.target.value})}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowUserModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Create User
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Edit User Modal */}
      <Modal show={showEditUserModal} onHide={() => setShowEditUserModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Edit User</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleEditUser}>
          <Modal.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Username *</Form.Label>
                  <Form.Control
                    type="text"
                    value={userForm.username}
                    onChange={(e) => setUserForm({...userForm, username: e.target.value})}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Email *</Form.Label>
                  <Form.Control
                    type="email"
                    value={userForm.email}
                    onChange={(e) => setUserForm({...userForm, email: e.target.value})}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>First Name *</Form.Label>
                  <Form.Control
                    type="text"
                    value={userForm.first_name}
                    onChange={(e) => setUserForm({...userForm, first_name: e.target.value})}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Last Name *</Form.Label>
                  <Form.Control
                    type="text"
                    value={userForm.last_name}
                    onChange={(e) => setUserForm({...userForm, last_name: e.target.value})}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Role *</Form.Label>
                  <Form.Select
                    value={userForm.role}
                    onChange={(e) => setUserForm({...userForm, role: e.target.value})}
                    required
                  >
                    <option value="admin">Admin</option>
                    <option value="warehouse">Warehouse</option>
                    <option value="delivery">Delivery</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Phone</Form.Label>
                  <Form.Control
                    type="tel"
                    value={userForm.phone}
                    onChange={(e) => setUserForm({...userForm, phone: e.target.value})}
                  />
                </Form.Group>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowEditUserModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Update User
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Payment Modal */}
      <Modal show={showPaymentModal} onHide={() => setShowPaymentModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            Add Payment - {selectedOrder?.order_number}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleAddPayment}>
          <Modal.Body>
            {selectedOrder && (
              <Alert variant="info" className="mb-3">
                <strong>Order Details:</strong> {selectedOrder.product_name} - ₦{parseFloat(selectedOrder.total_amount).toLocaleString()}
                <br />
                <strong>Customer:</strong> {selectedOrder.customer?.name}
                <br />
                <strong>Balance Due:</strong> ₦{parseFloat(selectedOrder.balance_due).toLocaleString()}
              </Alert>
            )}
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Amount *</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    value={paymentForm.amount}
                    onChange={(e) => setPaymentForm({...paymentForm, amount: e.target.value})}
                    placeholder="Enter payment amount"
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Payment Type *</Form.Label>
                  <Form.Select
                    value={paymentForm.payment_type}
                    onChange={(e) => setPaymentForm({...paymentForm, payment_type: e.target.value})}
                    required
                  >
                    <option value="deposit">Deposit</option>
                    <option value="balance">Balance Payment</option>
                    <option value="full">Full Payment</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Payment Method *</Form.Label>
                  <Form.Select
                    value={paymentForm.payment_method}
                    onChange={(e) => setPaymentForm({...paymentForm, payment_method: e.target.value})}
                    required
                  >
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="cash">Cash</option>
                    <option value="card">Card</option>
                    <option value="mobile_money">Mobile Money</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Payment Date *</Form.Label>
                  <Form.Control
                    type="date"
                    value={paymentForm.payment_date}
                    onChange={(e) => setPaymentForm({...paymentForm, payment_date: e.target.value})}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Reference Number</Form.Label>
                  <Form.Control
                    type="text"
                    value={paymentForm.reference_number}
                    onChange={(e) => setPaymentForm({...paymentForm, reference_number: e.target.value})}
                    placeholder="Transaction reference"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Proof of Payment</Form.Label>
                  <Form.Control
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => {
                      // Handle file upload - for now just store filename
                      const file = e.target.files[0];
                      if (file) {
                        setPaymentForm({...paymentForm, pop_file: file.name});
                      }
                    }}
                  />
                  <Form.Text className="text-muted">
                    Upload POP image or PDF (optional)
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>
            <Form.Group className="mb-3">
              <Form.Label>Notes</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={paymentForm.notes}
                onChange={(e) => setPaymentForm({...paymentForm, notes: e.target.value})}
                placeholder="Additional notes about this payment"
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowPaymentModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={loading}>
              {loading ? 'Adding...' : 'Add Payment'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* POP Modal */}
      <Modal show={showPOPModal} onHide={() => setShowPOPModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Proof of Payment</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedPOP && (
            <div>
              <Row className="mb-3">
                <Col md={6}>
                  <strong>Payment Details:</strong>
                  <br />
                  Amount: ₦{parseFloat(selectedPOP.amount).toLocaleString()}
                  <br />
                  Type: {getPaymentTypeLabel(selectedPOP.payment_type)}
                  <br />
                  Method: {getPaymentMethodLabel(selectedPOP.payment_method)}
                  <br />
                  Date: {new Date(selectedPOP.payment_date).toLocaleDateString()}
                  {selectedPOP.reference_number && (
                    <>
                      <br />
                      Reference: {selectedPOP.reference_number}
                    </>
                  )}
                </Col>
                <Col md={6}>
                  <strong>File Information:</strong>
                  <br />
                  File: {selectedPOP.pop_file}
                  <br />
                  {selectedPOP.notes && (
                    <>
                      Notes: {selectedPOP.notes}
                    </>
                  )}
                </Col>
              </Row>
              <div className="text-center">
                <div className="border rounded p-4 bg-light">
                  <FaFileAlt size={48} className="text-muted mb-3" />
                  <p className="text-muted">
                    Proof of Payment Document
                  </p>
                  <p className="text-muted small">
                    {selectedPOP.pop_file}
                  </p>
                  <div className="d-flex justify-content-center gap-2">
                    <Button 
                      variant="outline-primary" 
                      size="sm"
                      onClick={() => {
                        // In a real app, this would open the file
                        alert('File viewing functionality would be implemented here');
                      }}
                    >
                      <FaEye className="me-1" />
                      View POP
                    </Button>
                    <Button 
                      variant="outline-secondary" 
                      size="sm"
                      onClick={() => {
                        // In a real app, this would download the file
                        alert('File download functionality would be implemented here');
                      }}
                    >
                      <FaDownload className="me-1" />
                      Download
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowPOPModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Delivery Status Modal */}
      <Modal show={showDeliveryStatusModal} onHide={() => setShowDeliveryStatusModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Update Delivery Status for {selectedDeliveryOrder?.order_number}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>New Status *</Form.Label>
              <Form.Select>
                <option value="ready_for_delivery">Ready for Delivery</option>
                <option value="out_for_delivery">Out for Delivery</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Delivery Team</Form.Label>
              <Form.Control type="text" placeholder="e.g., Team Alpha, Team Beta" />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Notes</Form.Label>
              <Form.Control as="textarea" rows={3} placeholder="Additional notes for this status update" />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeliveryStatusModal(false)}>
            Cancel
          </Button>
          <Button variant="primary">Update Status</Button>
        </Modal.Footer>
      </Modal>

      {/* Delivery Notes Modal */}
      <Modal show={showDeliveryNoteModal} onHide={() => setShowDeliveryNoteModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Notes for {selectedDeliveryOrder?.order_number}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Notes</Form.Label>
              <Form.Control as="textarea" rows={5} placeholder="Add notes for this order..." />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeliveryNoteModal(false)}>
            Close
          </Button>
          <Button variant="primary">Save Notes</Button>
        </Modal.Footer>
      </Modal>

      {/* POD Upload Modal */}
      <Modal show={showPODUploadModal} onHide={() => setShowPODUploadModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Upload Proof of Delivery (POD) for {selectedPODOrder?.order_number}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>POD File *</Form.Label>
              <Form.Control
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => {
                  // Handle file upload - for now just store filename
                  const file = e.target.files[0];
                  if (file) {
                    // In a real app, you would send this file to your backend
                    // For now, just store it in a temporary state or show a message
                    alert(`File selected: ${file.name}. Upload functionality not yet implemented.`);
                  }
                }}
              />
              <Form.Text className="text-muted">
                Upload a scanned copy of the POD document (PDF or image)
              </Form.Text>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Notes</Form.Label>
              <Form.Control as="textarea" rows={3} placeholder="Additional notes for this POD" />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowPODUploadModal(false)}>
            Cancel
          </Button>
          <Button variant="primary">Upload POD</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default OwnerDashboard; 