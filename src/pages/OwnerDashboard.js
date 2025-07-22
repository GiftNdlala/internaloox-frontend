import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Row, Col, Button, 
  Alert, Modal, Form
} from 'react-bootstrap';
import { 
  FaUsers, FaChartLine, 
  FaClipboardList, FaMoneyBillWave,
  FaArrowUp, FaArrowDown, FaChartBar,
  FaCalendarCheck, FaCouch, FaBolt, FaGem,
  FaUserCog, FaPlus, FaEdit, FaTrash, FaTimes
} from 'react-icons/fa';
import UniversalSidebar from '../components/UniversalSidebar';
import { getDashboardStats, getOrders, getUsers, createUser, updateUser, deleteUser } from '../components/api';
import '../styles/MobileFirst.css';

const OwnerDashboard = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  // User Management States
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [userForm, setUserForm] = useState({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    phone: '',
    role: 'delivery',
    password: '',
    is_active: true
  });

  // Initialize time once
  useEffect(() => {
    setCurrentTime(new Date());
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
      const [usersData, ordersData] = await Promise.all([
        getUsers(),
        getOrders()
      ]);
      setUsers(usersData.results || usersData);
      setOrders(ordersData.results || ordersData);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  // User Management Functions
  const openUserModal = (user = null) => {
    if (user) {
      setEditingUser(user);
      setUserForm({
        username: user.username || '',
        email: user.email || '',
              first_name: user.first_name || '',
      last_name: user.last_name || '',
      phone: user.phone || '',
      role: user.role || 'delivery',
        password: '',
        is_active: user.is_active !== undefined ? user.is_active : true
      });
    } else {
      setEditingUser(null);
      setUserForm({
        username: '',
        email: '',
              first_name: '',
      last_name: '',
      phone: '',
      role: 'delivery',
        password: '',
        is_active: true
      });
    }
    setShowUserModal(true);
  };

  const handleUserFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setUserForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleUserSubmit = async (e) => {
    e.preventDefault();
    try {
      // Client-side validation
      if (!editingUser) {
        if (!userForm.username || !userForm.password) {
          setError('Username and password are required');
          return;
        }
        
        const validRoles = ['owner', 'admin', 'warehouse', 'delivery'];
        if (userForm.role && !validRoles.includes(userForm.role)) {
          setError(`Invalid role: ${userForm.role}. Valid roles: ${validRoles.join(', ')}`);
          return;
        }
      }
      
      if (editingUser) {
        await updateUser(editingUser.id, userForm);
        setSuccess('User updated successfully!');
      } else {
        const response = await createUser(userForm);
        // Handle new API response format
        if (response.success && response.user) {
          setSuccess(`User "${response.user.username}" created successfully with role "${response.user.role_display}"`);
        } else {
          setSuccess('User created successfully!');
        }
      }
      setShowUserModal(false);
      fetchDashboardData();
    } catch (err) {
      setError('Failed to save user');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await deleteUser(userId);
        setSuccess('User deleted successfully!');
        fetchDashboardData();
      } catch (err) {
        setError('Failed to delete user');
      }
    }
  };

  const formatCurrency = (amount) => `R${Number(amount).toLocaleString()}`;

  // Calculate KPIs
  const totalRevenue = orders.reduce((sum, order) => sum + parseFloat(order.total_amount || 0), 0);
  const todayOrders = orders.filter(order => 
    new Date(order.created_at).toDateString() === new Date().toDateString()
  ).length;

  // Mobile-First Executive Header
  const ExecutiveHeader = () => (
    <div className="oox-mobile-header oox-animate-fadeInUp">
      <div className="oox-brand">
        <div className="oox-logo">
          <FaCouch size={25} style={{ color: 'white' }} />
        </div>
        <div>
          <h1 className="oox-title">
            OOX Executive Portal
          </h1>
          <p className="oox-subtitle">
            {user?.first_name || user?.username || 'Owner'} • {currentTime.toLocaleDateString('en-ZA', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>
      </div>
      
      {/* Mobile Stats */}
      <div className="oox-mobile-stats">
        <div className="oox-mobile-stat">
          <div className="oox-mobile-stat-value">{formatCurrency(totalRevenue)}</div>
          <div className="oox-mobile-stat-label">Revenue</div>
        </div>
        <div className="oox-mobile-stat">
          <div className="oox-mobile-stat-value">{orders.length}</div>
          <div className="oox-mobile-stat-label">Orders</div>
        </div>
        <div className="oox-mobile-stat">
          <div className="oox-mobile-stat-value">{users.length}</div>
          <div className="oox-mobile-stat-label">Team</div>
        </div>
        <div className="oox-mobile-stat">
          <div className="oox-mobile-stat-value">{todayOrders}</div>
          <div className="oox-mobile-stat-label">Today</div>
        </div>
      </div>
    </div>
  );

  // Mobile Navigation
  const MobileNav = () => (
    <div className="oox-mobile-nav oox-animate-slideInLeft">
      {[
        { key: 'overview', label: 'Dashboard', icon: FaChartBar },
        { key: 'orders', label: 'Orders', icon: FaClipboardList },
        { key: 'users', label: 'Team', icon: FaUserCog },
        { key: 'customers', label: 'Customers', icon: FaUsers },
        { key: 'payments', label: 'Payments', icon: FaMoneyBillWave },
        { key: 'analytics', label: 'Analytics', icon: FaChartLine }
      ].map(tab => (
        <button
          key={tab.key}
          onClick={() => setActiveTab(tab.key)}
          className={`oox-mobile-nav-item ${activeTab === tab.key ? 'active' : ''}`}
        >
          <tab.icon className="oox-mobile-nav-icon" />
          <div className="oox-mobile-nav-label">{tab.label}</div>
        </button>
      ))}
    </div>
  );

  // KPI Card Component
  const KPICard = ({ title, value, change, icon: IconComponent, color, prefix = '', suffix = '' }) => (
    <div className="oox-mobile-card">
      <div className="oox-mobile-flex-between oox-mobile-mb-2">
        <div>
          <div style={{ 
            fontSize: '0.875rem', 
            color: '#6b7280', 
            fontWeight: '600',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            {title}
          </div>
          <div style={{
            fontSize: '1.75rem',
            fontWeight: '700',
            color: color,
            marginTop: '0.25rem'
          }}>
            {prefix}{typeof value === 'number' ? value.toLocaleString() : value}{suffix}
          </div>
        </div>
        <div style={{
          width: '60px',
          height: '60px',
          borderRadius: '12px',
          background: `${color}15`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: color
        }}>
          <IconComponent size={24} />
        </div>
      </div>
      
      {change && (
        <div className="oox-mobile-flex" style={{ alignItems: 'center', gap: '0.5rem' }}>
          {change > 0 ? (
            <FaArrowUp style={{ color: '#10b981', fontSize: '0.875rem' }} />
          ) : (
            <FaArrowDown style={{ color: '#ef4444', fontSize: '0.875rem' }} />
          )}
          <span style={{
            fontSize: '0.875rem',
            fontWeight: '600',
            color: change > 0 ? '#10b981' : '#ef4444'
          }}>
            {Math.abs(change)}%
          </span>
          <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>vs last month</span>
        </div>
      )}
    </div>
  );

  // User Management Table
  const UsersTable = () => (
    <div className="oox-mobile-card">
      <div className="oox-mobile-flex-between oox-mobile-mb-3">
        <h3 style={{ margin: 0, color: '#1e293b', fontWeight: '700' }}>
          <FaUserCog style={{ marginRight: '0.5rem', color: '#f59e0b' }} />
          OOX Team Management
        </h3>
        <button
          onClick={() => openUserModal()}
          className="oox-mobile-btn"
          style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
        >
          <FaPlus style={{ marginRight: '0.25rem' }} />
          Add User
        </button>
      </div>
      
      <div className="oox-mobile-table">
        {users.map(userItem => (
          <div key={userItem.id} className="oox-mobile-table-item">
            <div className="oox-mobile-table-header">
              <div className="oox-mobile-table-title">
                {userItem.first_name} {userItem.last_name}
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={() => openUserModal(userItem)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#f59e0b',
                    cursor: 'pointer',
                    padding: '0.25rem'
                  }}
                >
                  <FaEdit />
                </button>
                <button
                  onClick={() => handleDeleteUser(userItem.id)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#ef4444',
                    cursor: 'pointer',
                    padding: '0.25rem'
                  }}
                >
                  <FaTrash />
                </button>
              </div>
            </div>
            
            <div className="oox-mobile-table-meta">
              <div style={{ marginBottom: '0.5rem' }}>
                <strong>@{userItem.username}</strong> • {userItem.email}
              </div>
              <div className="oox-mobile-flex" style={{ gap: '0.5rem', alignItems: 'center' }}>
                <span className={`oox-mobile-badge ${
                  userItem.role === 'owner' ? 'warning' :
                  userItem.role === 'admin' ? 'success' :
                  userItem.role === 'warehouse' ? 'warning' : 'success'
                }`}>
                  {userItem.role?.toUpperCase()}
                </span>
                <span className={`oox-mobile-badge ${userItem.is_active ? 'success' : 'danger'}`}>
                  {userItem.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // User Modal
  const UserModal = () => (
    <Modal show={showUserModal} onHide={() => setShowUserModal(false)} size="lg">
      <Modal.Header closeButton style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', color: 'white' }}>
        <Modal.Title>
          <FaUserCog style={{ marginRight: '0.5rem' }} />
          {editingUser ? 'Edit OOX Team Member' : 'Add New OOX Team Member'}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form onSubmit={handleUserSubmit}>
          <Row>
            <Col md={6}>
              <div className="oox-mobile-form-group">
                <label className="oox-mobile-form-label">First Name</label>
                <input
                  name="first_name"
                  value={userForm.first_name}
                  onChange={handleUserFormChange}
                  className="oox-mobile-form-input"
                  placeholder="Enter first name"
                  required
                />
              </div>
            </Col>
            <Col md={6}>
              <div className="oox-mobile-form-group">
                <label className="oox-mobile-form-label">Last Name</label>
                <input
                  name="last_name"
                  value={userForm.last_name}
                  onChange={handleUserFormChange}
                  className="oox-mobile-form-input"
                  placeholder="Enter last name"
                  required
                />
              </div>
            </Col>
          </Row>
          
          <Row>
            <Col md={12}>
              <div className="oox-mobile-form-group">
                <label className="oox-mobile-form-label">Phone Number</label>
                <input
                  name="phone"
                  value={userForm.phone}
                  onChange={handleUserFormChange}
                  className="oox-mobile-form-input"
                  placeholder="+1234567890"
                  type="tel"
                />
              </div>
            </Col>
          </Row>
          
          <Row>
            <Col md={6}>
              <div className="oox-mobile-form-group">
                <label className="oox-mobile-form-label">Username</label>
                <input
                  name="username"
                  value={userForm.username}
                  onChange={handleUserFormChange}
                  className="oox-mobile-form-input"
                  placeholder="Enter username"
                  required
                />
              </div>
            </Col>
            <Col md={6}>
              <div className="oox-mobile-form-group">
                <label className="oox-mobile-form-label">Email</label>
                <input
                  name="email"
                  type="email"
                  value={userForm.email}
                  onChange={handleUserFormChange}
                  className="oox-mobile-form-input"
                  placeholder="Enter email"
                  required
                />
              </div>
            </Col>
          </Row>
          
          <Row>
            <Col md={6}>
              <div className="oox-mobile-form-group">
                <label className="oox-mobile-form-label">Role</label>
                <select
                  name="role"
                  value={userForm.role}
                  onChange={handleUserFormChange}
                  className="oox-mobile-form-input"
                  required
                >
                  <option value="admin">Admin</option>
                  <option value="warehouse">Warehouse</option>
                  <option value="delivery">Delivery</option>
                  <option value="owner">Owner</option>
                </select>
              </div>
            </Col>
            <Col md={6}>
              <div className="oox-mobile-form-group">
                <label className="oox-mobile-form-label">Password {editingUser && '(leave blank to keep current)'}</label>
                <input
                  name="password"
                  type="password"
                  value={userForm.password}
                  onChange={handleUserFormChange}
                  className="oox-mobile-form-input"
                  placeholder="Enter password"
                  required={!editingUser}
                />
              </div>
            </Col>
          </Row>
          
          <div className="oox-mobile-form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input
                name="is_active"
                type="checkbox"
                checked={userForm.is_active}
                onChange={handleUserFormChange}
              />
              <span className="oox-mobile-form-label" style={{ margin: 0 }}>Active User</span>
            </label>
          </div>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={() => setShowUserModal(false)}>
          <FaTimes style={{ marginRight: '0.25rem' }} />
          Cancel
        </Button>
        <Button 
          variant="primary" 
          onClick={handleUserSubmit}
          style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', border: 'none' }}
        >
          <FaUserCog style={{ marginRight: '0.25rem' }} />
          {editingUser ? 'Update User' : 'Create User'}
        </Button>
      </Modal.Footer>
    </Modal>
  );

  if (loading) {
    return (
      <div className="oox-mobile-container" style={{ minHeight: '100vh' }}>
        <div className="oox-mobile-loading">
          <div className="oox-mobile-spinner"></div>
        </div>
        <div className="oox-mobile-text-center" style={{ marginTop: '1rem' }}>
          <h3 style={{ color: '#f59e0b' }}>Loading OOX Executive Portal...</h3>
        </div>
      </div>
    );
  }

  return (
    <>
      <UniversalSidebar user={user} userRole="owner" onLogout={onLogout} />
      <div className="main-content">
        <div className="oox-mobile-container" style={{ background: '#f8fafc', minHeight: '100vh' }}>
          
          {/* Alerts */}
          {error && (
            <Alert variant="danger" dismissible onClose={() => setError(null)} className="oox-animate-fadeInUp">
              {error}
            </Alert>
          )}
          {success && (
            <Alert variant="success" dismissible onClose={() => setSuccess(null)} className="oox-animate-fadeInUp">
              {success}
            </Alert>
          )}

          {/* Executive Header */}
          <ExecutiveHeader />

          {/* Mobile Navigation */}
          <MobileNav />

          {/* Tab Content */}
          {activeTab === 'overview' && (
            <div className="oox-animate-fadeInUp">
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
                gap: '1rem',
                marginBottom: '1.5rem'
              }}>
                <KPICard
                  title="Total Revenue"
                  value={totalRevenue}
                  change={12}
                  icon={FaMoneyBillWave}
                  color="#f59e0b"
                  prefix="R"
                />
                <KPICard
                  title="Total Orders"
                  value={orders.length}
                  change={8}
                  icon={FaClipboardList}
                  color="#3b82f6"
                />
                <KPICard
                  title="Team Members"
                  value={users.length}
                  change={5}
                  icon={FaUsers}
                  color="#10b981"
                />
                <KPICard
                  title="Today's Orders"
                  value={todayOrders}
                  change={-2}
                  icon={FaCalendarCheck}
                  color="#8b5cf6"
                />
              </div>

              {/* Quick Actions */}
              <div className="oox-mobile-card">
                <h3 style={{ marginBottom: '1rem', color: '#1e293b', fontWeight: '700' }}>
                  <FaBolt style={{ marginRight: '0.5rem', color: '#f59e0b' }} />
                  OOX Quick Actions
                </h3>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '1rem'
                }}>
                  <button
                    onClick={() => navigate('/owner/orders')}
                    className="oox-mobile-btn"
                  >
                    <FaClipboardList />
                    Manage Orders
                  </button>
                  <button
                    onClick={() => setActiveTab('users')}
                    className="oox-mobile-btn"
                  >
                    <FaUserCog />
                    Team Management
                  </button>
                  <button
                    onClick={() => navigate('/owner/customers')}
                    className="oox-mobile-btn"
                  >
                    <FaUsers />
                    View Customers
                  </button>
                  <button
                    onClick={() => navigate('/owner/analytics')}
                    className="oox-mobile-btn"
                  >
                    <FaChartLine />
                    Analytics
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="oox-animate-fadeInUp">
              <UsersTable />
            </div>
          )}

          {activeTab === 'orders' && (
            <div className="oox-mobile-card oox-animate-fadeInUp">
              <div className="oox-mobile-text-center" style={{ padding: '2rem' }}>
                <FaClipboardList size={48} style={{ color: '#f59e0b', marginBottom: '1rem' }} />
                <h3 style={{ color: '#1e293b', marginBottom: '1rem' }}>OOX Orders Management</h3>
                <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
                  Comprehensive order management system coming soon
                </p>
                <button
                  onClick={() => navigate('/owner/orders')}
                  className="oox-mobile-btn"
                >
                  Go to Orders Page
                </button>
              </div>
            </div>
          )}

          {(activeTab === 'customers' || activeTab === 'payments' || activeTab === 'analytics') && (
            <div className="oox-mobile-card oox-animate-fadeInUp">
              <div className="oox-mobile-text-center" style={{ padding: '2rem' }}>
                <FaGem size={48} style={{ color: '#f59e0b', marginBottom: '1rem' }} />
                <h3 style={{ color: '#1e293b', marginBottom: '1rem' }}>OOX {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</h3>
                <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
                  Advanced {activeTab} management features are being enhanced for the executive experience
                </p>
                <button
                  onClick={() => navigate(`/owner/${activeTab}`)}
                  className="oox-mobile-btn"
                >
                  Go to {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Page
                </button>
              </div>
            </div>
          )}

          {/* User Management Modal */}
          <UserModal />
        </div>
      </div>
    </>
  );
};

export default OwnerDashboard; 