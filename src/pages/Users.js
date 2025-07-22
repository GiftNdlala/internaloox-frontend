import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Button, Modal, Form, Alert, Badge } from 'react-bootstrap';
import {
  FaUserShield, FaPlus, FaEdit, FaTrash, FaEye, FaSearch,
  FaEnvelope, FaDownload, FaCheck, 
  FaExclamationTriangle, FaSortUp, FaSortDown, FaUsers,
  FaCrown, FaCog, FaWrench, FaTruck, FaKey, FaUserCheck
} from 'react-icons/fa';
import { 
  getUsers, createUser, updateUser, deleteUser
} from '../components/api';
import SharedHeader from '../components/SharedHeader';
import EnhancedPageHeader from '../components/EnhancedPageHeader';
import UniversalSidebar from '../components/UniversalSidebar';

const Users = ({ user, userRole, onLogout }) => {
  
  // State management
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modal states
  const [showUserModal, setShowUserModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [editingUser, setEditingUser] = useState(null);

  // Form state
  const [userForm, setUserForm] = useState({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    phone: '',
    role: '',
    password: '',
    password_confirm: '',
    is_active: true
  });

  // Filter and search states
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [sortField, setSortField] = useState('date_joined');
  const [sortDirection, setSortDirection] = useState('desc');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage] = useState(10);

  // Load data on component mount
  useEffect(() => {
    fetchUsers();
    // Auto-refresh disabled for better user experience
    // Users can manually refresh using the refresh button if needed
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const usersData = await getUsers();
      setUsers(usersData.results || usersData);
      setError('');
    } catch (err) {
      setError('Failed to load users: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Role configuration
  const roleConfig = {
    owner: { 
      label: 'Owner', 
      color: 'warning', 
      icon: FaCrown, 
      description: 'Full system access and management' 
    },
    admin: { 
      label: 'Admin', 
      color: 'primary', 
      icon: FaCog, 
      description: 'Administrative functions and user management' 
    },
    warehouse: { 
      label: 'Warehouse', 
      color: 'success', 
      icon: FaWrench, 
      description: 'Production tracking and inventory management' 
    },
    delivery: { 
      label: 'Delivery', 
      color: 'info', 
      icon: FaTruck, 
      description: 'Order delivery and logistics management' 
    }
  };

  // Filter and sort users
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.last_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    
    return matchesSearch && matchesRole;
  }).sort((a, b) => {
    let aVal = a[sortField];
    let bVal = b[sortField];
    
    if (sortField === 'full_name') {
      aVal = `${a.first_name} ${a.last_name}`;
      bVal = `${b.first_name} ${b.last_name}`;
    }
    
    if (typeof aVal === 'string') {
      return sortDirection === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    }
    
    return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
  });

  // Pagination logic
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

  // Handler functions
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleCreateUser = () => {
    // Check if current user has owner role
    if (user?.role !== 'owner') {
      setError('Only users with Owner role can create new users');
      return;
    }
    
    // Clear any previous errors
    setError(null);
    setSuccess(null);
    
    setEditingUser(null);
    setUserForm({
      username: '',
      email: '',
      first_name: '',
      last_name: '',
      phone: '',
      role: 'delivery', // Default to lowest role
      password: '',
      password_confirm: '',
      is_active: true
    });
    setShowUserModal(true);
  };

  const handleEditUser = (user) => {
    // Clear any previous errors
    setError(null);
    setSuccess(null);
    
    setEditingUser(user);
    setUserForm({
      username: user.username || '',
      email: user.email || '',
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      phone: user.phone || '',
      role: user.role || '',
      password: '', // Don't pre-fill password for security
      password_confirm: '', // Don't pre-fill password confirmation
      is_active: user.is_active !== undefined ? user.is_active : true
    });
    setShowUserModal(true);
  };

  const handleDeleteUser = (user) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  const handleViewDetails = (user) => {
    setSelectedUser(user);
    setShowDetailsModal(true);
  };

  const confirmDelete = async () => {
    try {
      await deleteUser(selectedUser.id);
      setSuccess('User deleted successfully');
      setShowDeleteModal(false);
      fetchUsers();
    } catch (err) {
      setError('Failed to delete user: ' + err.message);
    }
  };

  const handleUserSubmit = async (e) => {
    e.preventDefault();
    setError(null); // Clear any previous errors
    
    try {
      const submitData = { ...userForm };
      
      // Don't send empty password on updates
      if (editingUser && !submitData.password) {
        delete submitData.password;
        delete submitData.password_confirm;
      }
      
      // Client-side validation
      if (!editingUser) {
        if (!submitData.username || submitData.username.trim() === '') {
          setError('Username is required');
          return;
        }
        
        if (!submitData.password) {
          setError('Password is required');
          return;
        }
        
        if (submitData.password !== submitData.password_confirm) {
          setError('Passwords do not match');
          return;
        }
        
        const validRoles = ['owner', 'admin', 'warehouse', 'delivery'];
        if (submitData.role && !validRoles.includes(submitData.role)) {
          setError(`Invalid role: ${submitData.role}. Valid roles: ${validRoles.join(', ')}`);
          return;
        }
      }
      
      if (editingUser) {
        await updateUser(editingUser.id, submitData);
        setSuccess('User updated successfully');
      } else {
        const response = await createUser(submitData);
        // Handle new API response format
        if (response.success && response.user) {
          setSuccess(response.message || `User "${response.user.username}" created successfully`);
        } else {
          setSuccess('User created successfully');
        }
      }
      
      // Close modal and reset form
      setShowUserModal(false);
      setEditingUser(null);
      setError(null);
      fetchUsers();
    } catch (err) {
      setError('Failed to save user: ' + err.message);
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

  const getRoleBadge = (role) => {
    const config = roleConfig[role] || { label: role, color: 'secondary', icon: FaUserShield };
    const IconComponent = config.icon;
    return (
      <Badge bg={config.color} className="d-flex align-items-center gap-1">
        <IconComponent size={12} />
        {config.label}
      </Badge>
    );
  };

  const getStatusBadge = (isActive) => {
    return (
      <Badge bg={isActive ? 'success' : 'danger'}>
        {isActive ? 'Active' : 'Inactive'}
      </Badge>
    );
  };

  const getRoleStats = () => {
    return {
      owner: users.filter(u => u.role === 'owner').length,
      admin: users.filter(u => u.role === 'admin').length,
      warehouse: users.filter(u => u.role === 'warehouse').length,
      delivery: users.filter(u => u.role === 'delivery').length,
      active: users.filter(u => u.is_active).length,
      inactive: users.filter(u => !u.is_active).length
    };
  };

  const stats = getRoleStats();

  if (loading && users.length === 0) {
    return (
      <Container fluid className="py-4 text-center">
        <FaUsers size={48} className="text-muted mb-3" />
        <h5 className="text-muted">Loading users...</h5>
      </Container>
    );
  }

  return (
    <>
      <style>
        {`
          /* Disable all form validation feedback to prevent vibrations */
          input:invalid,
          input:valid,
          select:invalid,
          select:valid,
          textarea:invalid,
          textarea:valid {
            box-shadow: none !important;
            border-color: #dee2e6 !important;
          }
          
          /* Disable focus outline vibrations */
          input:focus,
          select:focus,
          textarea:focus {
            box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25) !important;
          }
          
          /* Disable any browser validation tooltips */
          input::-webkit-validation-bubble-message,
          input::-webkit-validation-bubble-arrow,
          input::-webkit-validation-bubble-top-outer-arrow,
          input::-webkit-validation-bubble-top-inner-arrow {
            display: none !important;
          }
        `}
      </style>
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
          title="OOX Furniture - Team Management"
          subtitle="OOX Furniture user accounts, roles, and system access permissions management"
          icon={FaUsers}
          onRefresh={fetchUsers}
          accentColor="#8b5cf6"
        >
          <div className="d-flex gap-2 justify-content-end">
            {user?.role === 'owner' && (
              <Button 
                variant="primary" 
                onClick={handleCreateUser}
                className="d-flex align-items-center"
                style={{
                  background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                  border: 'none',
                borderRadius: '12px',
                padding: '0.75rem 1.5rem',
                fontWeight: '600',
                boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
              onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
            >
              <FaPlus className="me-2" />
              Add User
            </Button>
            )}
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
          <Col md={2}>
            <Card className="border-0 shadow-sm">
              <Card.Body className="text-center">
                <FaUsers size={30} className="text-primary mb-2" />
                <h4 className="mb-1">{users.length}</h4>
                <small className="text-muted">Total Users</small>
              </Card.Body>
            </Card>
          </Col>
          <Col md={2}>
            <Card className="border-0 shadow-sm">
              <Card.Body className="text-center">
                <FaCrown size={30} className="text-warning mb-2" />
                <h4 className="mb-1">{stats.owner}</h4>
                <small className="text-muted">Owners</small>
              </Card.Body>
            </Card>
          </Col>
          <Col md={2}>
            <Card className="border-0 shadow-sm">
              <Card.Body className="text-center">
                <FaCog size={30} className="text-primary mb-2" />
                <h4 className="mb-1">{stats.admin}</h4>
                <small className="text-muted">Admins</small>
              </Card.Body>
            </Card>
          </Col>
          <Col md={2}>
            <Card className="border-0 shadow-sm">
              <Card.Body className="text-center">
                <FaWrench size={30} className="text-success mb-2" />
                <h4 className="mb-1">{stats.warehouse}</h4>
                <small className="text-muted">Warehouse</small>
              </Card.Body>
            </Card>
          </Col>
          <Col md={2}>
            <Card className="border-0 shadow-sm">
              <Card.Body className="text-center">
                <FaTruck size={30} className="text-info mb-2" />
                <h4 className="mb-1">{stats.delivery}</h4>
                <small className="text-muted">Delivery</small>
              </Card.Body>
            </Card>
          </Col>
          <Col md={2}>
            <Card className="border-0 shadow-sm">
              <Card.Body className="text-center">
                <FaUserCheck size={30} className="text-success mb-2" />
                <h4 className="mb-1">{stats.active}</h4>
                <small className="text-muted">Active</small>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Search and Filters */}
        <Card className="mb-4">
          <Card.Body>
            <Row className="g-3">
              <Col md={4}>
                <Form.Control
                  type="text"
                  placeholder="Search users by name, username, or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </Col>
              <Col md={3}>
                <Form.Select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                >
                  <option value="all">All Roles</option>
                  <option value="owner">Owner</option>
                  <option value="admin">Admin</option>
                  <option value="warehouse">Warehouse</option>
                  <option value="delivery">Delivery</option>
                </Form.Select>
              </Col>
              <Col md={5} className="text-end">
                <Button variant="outline-secondary" className="me-2">
                  <FaDownload className="me-1" />
                  Export CSV
                </Button>
                <Button variant="outline-secondary">
                  <FaKey className="me-1" />
                  Reset Passwords
                </Button>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        {/* Users Table */}
        <Card>
          <Card.Body className="p-0">
            <div className="table-responsive">
              <Table hover className="mb-0">
                <thead className="bg-light">
                  <tr>
                    <th 
                      style={{ cursor: 'pointer' }}
                      onClick={() => handleSort('full_name')}
                    >
                      User {getSortIcon('full_name')}
                    </th>
                    <th 
                      style={{ cursor: 'pointer' }}
                      onClick={() => handleSort('username')}
                    >
                      Username {getSortIcon('username')}
                    </th>
                    <th>Email</th>
                    <th 
                      style={{ cursor: 'pointer' }}
                      onClick={() => handleSort('role')}
                    >
                      Role {getSortIcon('role')}
                    </th>
                    <th>Status</th>
                    <th>Last Login</th>
                    <th 
                      style={{ cursor: 'pointer' }}
                      onClick={() => handleSort('date_joined')}
                    >
                      Joined {getSortIcon('date_joined')}
                    </th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentUsers.map(userItem => (
                    <tr key={userItem.id}>
                      <td>
                        <div className="d-flex align-items-center">
                          <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-3" 
                               style={{ width: '40px', height: '40px', fontSize: '1.2rem', fontWeight: 'bold' }}>
                            {userItem.first_name?.charAt(0)?.toUpperCase() || userItem.username?.charAt(0)?.toUpperCase() || 'U'}
                          </div>
                          <div>
                            <div className="fw-medium">
                              {userItem.first_name || userItem.last_name 
                                ? `${userItem.first_name} ${userItem.last_name}`.trim()
                                : userItem.username
                              }
                            </div>
                            <small className="text-muted">ID: {userItem.id}</small>
                          </div>
                        </div>
                      </td>
                      <td>
                        <code className="bg-light px-2 py-1 rounded">
                          {userItem.username}
                        </code>
                      </td>
                      <td>
                        <div className="d-flex align-items-center">
                          <FaEnvelope className="me-2 text-muted" size={12} />
                          <span>{userItem.email}</span>
                        </div>
                      </td>
                      <td>{getRoleBadge(userItem.role)}</td>
                      <td>{getStatusBadge(userItem.is_active)}</td>
                      <td>
                        <small className="text-muted">
                          {userItem.last_login 
                            ? formatDate(userItem.last_login)
                            : 'Never'
                          }
                        </small>
                      </td>
                      <td>
                        <small className="text-muted">
                          {formatDate(userItem.date_joined)}
                        </small>
                      </td>
                      <td>
                        <ButtonGroup size="sm">
                          <Button 
                            variant="outline-primary" 
                            onClick={() => handleViewDetails(userItem)}
                          >
                            <FaEye />
                          </Button>
                          <Button 
                            variant="outline-secondary" 
                            onClick={() => handleEditUser(userItem)}
                          >
                            <FaEdit />
                          </Button>
                          {userItem.id !== user?.id && (
                            <Button 
                              variant="outline-danger" 
                              onClick={() => handleDeleteUser(userItem)}
                            >
                              <FaTrash />
                            </Button>
                          )}
                        </ButtonGroup>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>

              {filteredUsers.length === 0 && (
                <div className="text-center py-5">
                  <FaUsers size={48} className="text-muted mb-3" />
                  <h5 className="text-muted">No users found</h5>
                  <p className="text-muted">
                    {searchTerm ? 'Try adjusting your search criteria' : 'No users have been added yet'}
                  </p>
                  {user?.role === 'owner' && (
                    <Button variant="primary" onClick={handleCreateUser}>
                      <FaPlus className="me-1" />
                      Add First User
                    </Button>
                  )}
                </div>
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="d-flex justify-content-between align-items-center p-3 border-top">
                <div className="text-muted">
                  Showing {indexOfFirstUser + 1} to {Math.min(indexOfLastUser, filteredUsers.length)} of {filteredUsers.length} users
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

        {/* User Form Modal */}
        <Modal 
          show={showUserModal} 
          onHide={() => {
            setShowUserModal(false);
            setError(null);
            setSuccess(null);
            setEditingUser(null);
          }} 
          size="lg"
        >
          <Modal.Header closeButton>
            <Modal.Title>
              {editingUser ? 'Edit User' : 'Add New User'}
            </Modal.Title>
          </Modal.Header>
          <Form onSubmit={handleUserSubmit} noValidate>
            <Modal.Body>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Username *</Form.Label>
                    <Form.Control
                      type="text"
                      value={userForm.username}
                      onChange={(e) => setUserForm({...userForm, username: e.target.value})}
                      placeholder="Enter username"
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Email Address *</Form.Label>
                    <Form.Control
                      type="email"
                      value={userForm.email}
                      onChange={(e) => setUserForm({...userForm, email: e.target.value})}
                      placeholder="user@example.com"
                    />
                  </Form.Group>
                </Col>
              </Row>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>First Name</Form.Label>
                    <Form.Control
                      type="text"
                      value={userForm.first_name}
                      onChange={(e) => setUserForm({...userForm, first_name: e.target.value})}
                      placeholder="First name"
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Last Name</Form.Label>
                    <Form.Control
                      type="text"
                      value={userForm.last_name}
                      onChange={(e) => setUserForm({...userForm, last_name: e.target.value})}
                      placeholder="Last name"
                    />
                  </Form.Group>
                </Col>
              </Row>
              <Row>
                <Col md={12}>
                  <Form.Group className="mb-3">
                    <Form.Label>Phone Number</Form.Label>
                    <Form.Control
                      type="tel"
                      value={userForm.phone}
                      onChange={(e) => setUserForm({...userForm, phone: e.target.value})}
                      placeholder="+1234567890"
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
                    >
                      <option value="">Select role...</option>
                      {Object.entries(roleConfig).map(([key, config]) => (
                        <option key={key} value={key}>
                          {config.label} - {config.description}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>
                      Password {editingUser ? '(leave blank to keep current)' : '*'}
                    </Form.Label>
                    <Form.Control
                      type="password"
                      value={userForm.password}
                      onChange={(e) => setUserForm({...userForm, password: e.target.value})}
                      placeholder={editingUser ? "Leave blank to keep current password" : "Enter password"}
                    />
                  </Form.Group>
                </Col>
              </Row>
              {!editingUser && (
                <Row>
                  <Col md={12}>
                    <Form.Group className="mb-3">
                      <Form.Label>Confirm Password *</Form.Label>
                      <Form.Control
                        type="password"
                        value={userForm.password_confirm}
                        onChange={(e) => setUserForm({...userForm, password_confirm: e.target.value})}
                        placeholder="Confirm password"
                      />
                    </Form.Group>
                  </Col>
                </Row>
              )}
              <Row>
                <Col md={12}>
                  <Form.Group className="mb-3">
                    <Form.Check
                      type="checkbox"
                      id="is_active"
                      label="Active User (can login to the system)"
                      checked={userForm.is_active}
                      onChange={(e) => setUserForm({...userForm, is_active: e.target.checked})}
                    />
                  </Form.Group>
                </Col>
              </Row>
            </Modal.Body>
            <Modal.Footer>
              <Button 
                variant="secondary" 
                onClick={() => {
                  setShowUserModal(false);
                  setError(null);
                  setSuccess(null);
                  setEditingUser(null);
                }}
              >
                Cancel
              </Button>
              <Button variant="primary" type="submit">
                {editingUser ? 'Update User' : 'Create User'}
              </Button>
            </Modal.Footer>
          </Form>
        </Modal>

        {/* User Details Modal */}
        <Modal show={showDetailsModal} onHide={() => setShowDetailsModal(false)} size="lg">
          <Modal.Header closeButton>
            <Modal.Title>User Details</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {selectedUser && (
              <Row>
                <Col md={6}>
                  <Card className="h-100">
                    <Card.Header>
                      <h6 className="mb-0">User Information</h6>
                    </Card.Header>
                    <Card.Body>
                      <div className="mb-3">
                        <strong>Name:</strong><br />
                        {selectedUser.first_name || selectedUser.last_name 
                          ? `${selectedUser.first_name} ${selectedUser.last_name}`.trim()
                          : 'Not provided'
                        }
                      </div>
                      <div className="mb-3">
                        <strong>Username:</strong><br />
                        <code className="bg-light px-2 py-1 rounded">
                          {selectedUser.username}
                        </code>
                      </div>
                      <div className="mb-3">
                        <strong>Email:</strong><br />
                        <FaEnvelope className="me-2" />
                        {selectedUser.email}
                      </div>
                      <div className="mb-3">
                        <strong>Role:</strong><br />
                        {getRoleBadge(selectedUser.role)}
                        <br />
                        <small className="text-muted">
                          {roleConfig[selectedUser.role]?.description || 'No description available'}
                        </small>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={6}>
                  <Card className="h-100">
                    <Card.Header>
                      <h6 className="mb-0">Account Status</h6>
                    </Card.Header>
                    <Card.Body>
                      <div className="mb-3">
                        <strong>Status:</strong><br />
                        {getStatusBadge(selectedUser.is_active)}
                      </div>
                      <div className="mb-3">
                        <strong>Last Login:</strong><br />
                        {selectedUser.last_login 
                          ? formatDate(selectedUser.last_login)
                          : 'Never logged in'
                        }
                      </div>
                      <div className="mb-3">
                        <strong>Account Created:</strong><br />
                        {formatDate(selectedUser.date_joined)}
                      </div>
                      <div className="mb-3">
                        <strong>User ID:</strong><br />
                        <code className="bg-light px-2 py-1 rounded">
                          {selectedUser.id}
                        </code>
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
              handleEditUser(selectedUser);
            }}>
              Edit User
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
              <h5>Delete User?</h5>
              <p className="text-muted">
                Are you sure you want to delete user <strong>{selectedUser?.username}</strong>?
                This action cannot be undone.
              </p>
              <Alert variant="warning">
                <FaExclamationTriangle className="me-2" />
                Deleting this user will revoke their system access immediately.
              </Alert>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={confirmDelete}>
              Delete User
            </Button>
          </Modal.Footer>
        </Modal>
        </Container>
      </div>
    </>
  );
};

export default Users;