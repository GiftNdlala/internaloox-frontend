import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import { Navbar, Nav, NavDropdown, Badge, Button, Container } from 'react-bootstrap';
import { 
  FaWarehouse, FaTasks, FaBoxes, FaUsers, FaChartBar, 
  FaBell, FaCog, FaSignOutAlt, FaUserCircle, FaClock,
  FaHome, FaClipboardList, FaIndustry
} from 'react-icons/fa';
import NotificationBell from './NotificationBell';

const WarehouseNavbar = ({ 
  user, 
  onLogout, 
  activeTab, 
  onTabChange, 
  notifications = [],
  currentTime 
}) => {
  const [expanded, setExpanded] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const pathname = location.pathname || '';
  const isOverview = pathname.endsWith('/warehouse');
  const isInventory = pathname.includes('/warehouse/inventory');
  const isProducts = pathname.includes('/warehouse/products');
  const isStock = pathname.includes('/warehouse/stock');
  const isOrders = pathname.includes('/warehouse/orders');
  const isWorkers = pathname.includes('/warehouse/workers');

  const getRoleDisplayName = (role) => {
    const roleNames = {
      'owner': 'Owner',
      'admin': 'Admin', 
      'warehouse_manager': 'Warehouse Manager',
      'warehouse_worker': 'Warehouse Worker',
      'warehouse': 'Warehouse Staff', // Legacy role
      'delivery': 'Delivery'
    };
    return roleNames[role] || role;
  };

  const canManageTasks = () => {
    return ['owner', 'admin', 'warehouse_manager', 'warehouse'].includes(user?.role);
  };

  const canViewAnalytics = () => {
    return ['owner', 'admin', 'warehouse_manager', 'warehouse'].includes(user?.role);
  };

  const canManageInventory = () => {
    return ['owner', 'admin', 'warehouse_manager', 'warehouse_worker', 'warehouse'].includes(user?.role);
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'short',
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <Navbar 
      bg="white" 
      variant="light" 
      expand="lg" 
      className="warehouse-navbar shadow-sm border-bottom"
      expanded={expanded}
      onToggle={setExpanded}
      sticky="top"
    >
      <Container fluid>
        {/* Brand */}
        <Navbar.Brand className="d-flex align-items-center" onClick={() => { navigate('/warehouse'); setExpanded(false); }} style={{ cursor: 'pointer' }}>
          <FaWarehouse className="me-2 text-primary" size={24} />
          <div>
            <div className="fw-bold text-primary">OOX Warehouse</div>
            <small className="text-muted d-none d-md-block">
              {formatDate(currentTime)} • {formatTime(currentTime)}
            </small>
          </div>
        </Navbar.Brand>

        {/* Mobile Time Display */}
        <div className="d-md-none text-muted small">
          <FaClock className="me-1" />
          {formatTime(currentTime)}
        </div>

        {/* Always-visible navigation (no collapse) */}
        <div className="d-flex w-100 align-items-center" id="warehouse-navbar-nav">
          {/* Main Navigation */}
          <Nav className="me-auto">
            <Nav.Link 
              active={isOverview || activeTab === 'overview'}
              onClick={() => {
                onTabChange?.('overview');
                navigate('/warehouse');
                setExpanded(false);
              }}
              className="d-flex align-items-center"
            >
              <FaHome className="me-2" />
              <span>Overview</span>
            </Nav.Link>

            {/* Task Management - Admin/Owner/Manager only */}
            {canManageTasks() && (
              <Nav.Link 
                active={isOverview && activeTab === 'task-management'}
                onClick={() => {
                  onTabChange?.('task-management');
                  navigate('/warehouse');
                  setExpanded(false);
                }}
                className="d-flex align-items-center"
              >
                <FaTasks className="me-2" />
                <span>Task Management</span>
              </Nav.Link>
            )}

            {/* My Tasks - Workers only */}
            {user?.role === 'warehouse_worker' && (
              <Nav.Link 
                active={isOverview && activeTab === 'my-tasks'}
                onClick={() => {
                  onTabChange?.('my-tasks');
                  navigate('/warehouse');
                  setExpanded(false);
                }}
                className="d-flex align-items-center"
              >
                <FaClipboardList className="me-2" />
                <span>My Tasks</span>
              </Nav.Link>
            )}

            {/* Inventory */}
            {canManageInventory() && (
              <Nav.Link 
                active={isInventory}
                onClick={() => {
                  onTabChange?.('inventory');
                  navigate('/warehouse/inventory/materials');
                  setExpanded(false);
                }}
                className="d-flex align-items-center"
              >
                <FaBoxes className="me-2" />
                <span>Inventory</span>
              </Nav.Link>
            )}

            {/* Products */}
            <Nav.Link 
              active={isProducts}
              onClick={() => {
                navigate('/warehouse/products');
                setExpanded(false);
              }}
              className="d-flex align-items-center"
            >
              <FaIndustry className="me-2" />
              <span>Products</span>
            </Nav.Link>

            {/* Stock Management */}
            <Nav.Link 
              active={isStock}
              onClick={() => {
                navigate('/warehouse/stock');
                setExpanded(false);
              }}
              className="d-flex align-items-center"
            >
              <FaBoxes className="me-2" />
              <span>Stock</span>
            </Nav.Link>

            {/* Orders */}
            <Nav.Link 
              active={isOrders}
              onClick={() => {
                navigate('/warehouse/orders');
                setExpanded(false);
              }}
              className="d-flex align-items-center"
            >
              <FaClipboardList className="me-2" />
              <span>Orders</span>
            </Nav.Link>

            {/* Analytics - Management only */}
            {canViewAnalytics() && (
              <Nav.Link 
                active={isOverview && activeTab === 'analytics'}
                onClick={() => {
                  onTabChange?.('analytics');
                  navigate('/warehouse');
                  setExpanded(false);
                }}
                className="d-flex align-items-center"
              >
                <FaChartBar className="me-2" />
                <span>Analytics</span>
              </Nav.Link>
            )}

            {/* Workers - Management only */}
            {canManageTasks() && (
              <Nav.Link 
                active={isWorkers}
                onClick={() => {
                  onTabChange?.('workers');
                  navigate('/warehouse/workers');
                  setExpanded(false);
                }}
                className="d-flex align-items-center"
              >
                <FaUsers className="me-2" />
                <span>Workers</span>
              </Nav.Link>
            )}
          </Nav>

          {/* Right Side Navigation */}
          <Nav className="align-items-center ms-auto">
            {/* Notifications */}
            <div className="me-3">
              <NotificationBell />
            </div>

            {/* User Profile Dropdown */}
            <NavDropdown
              title={
                <div className="d-flex align-items-center">
                  <FaUserCircle className="me-2" size={20} />
                  <div className="d-none d-lg-block">
                    <div className="fw-semibold">{user?.first_name} {user?.last_name}</div>
                    <small className="text-muted">{getRoleDisplayName(user?.role)}</small>
                  </div>
                </div>
              }
              id="user-dropdown"
              align="end"
            >
              <NavDropdown.Header>
                <div className="d-flex align-items-center">
                  <FaUserCircle className="me-2 text-primary" size={24} />
                  <div>
                    <div className="fw-bold">{user?.first_name} {user?.last_name}</div>
                    <small className="text-muted">{user?.email}</small>
                    <div>
                      <Badge bg="primary" className="small">
                        {getRoleDisplayName(user?.role)}
                      </Badge>
                    </div>
                  </div>
                </div>
              </NavDropdown.Header>
              
              <NavDropdown.Divider />
              
              <NavDropdown.Item 
                onClick={() => {
                  // Navigate to profile settings
                  setExpanded(false);
                }}
                className="d-flex align-items-center"
              >
                <FaCog className="me-2" />
                Settings
              </NavDropdown.Item>
              
              <NavDropdown.Divider />
              
              <NavDropdown.Item 
                onClick={() => {
                  onLogout();
                  setExpanded(false);
                }}
                className="d-flex align-items-center text-danger"
              >
                <FaSignOutAlt className="me-2" />
                Sign Out
              </NavDropdown.Item>
            </NavDropdown>
          </Nav>
        </div>
      </Container>

      <style jsx>{`
        .warehouse-navbar {
          min-height: 70px;
          background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%) !important;
        }
        
        .warehouse-navbar .navbar-brand {
          font-weight: 600;
        }
        
        .warehouse-navbar .nav-link {
          font-weight: 500;
          padding: 0.75rem 1rem !important;
          border-radius: 8px;
          margin: 0 0.25rem;
          transition: all 0.3s ease;
        }
        
        .warehouse-navbar .nav-link:hover {
          background-color: rgba(13, 110, 253, 0.1);
          color: #0d6efd !important;
        }
        
        .warehouse-navbar .nav-link.active {
          background-color: #0d6efd;
          color: white !important;
        }
        
        .warehouse-navbar .dropdown-toggle::after {
          display: none;
        }
        
        .warehouse-navbar .dropdown-menu {
          border: none;
          box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
          border-radius: 12px;
          padding: 0.5rem;
          min-width: 250px;
        }
        
        .warehouse-navbar .dropdown-item {
          border-radius: 8px;
          padding: 0.75rem 1rem;
          margin: 0.125rem 0;
        }
        
        .warehouse-navbar .dropdown-item:hover {
          background-color: rgba(13, 110, 253, 0.1);
        }
        
        @media (max-width: 991px) {
          .warehouse-navbar .navbar-nav {
            padding: 1rem 0;
          }
          
          .warehouse-navbar .nav-link {
            margin: 0.25rem 0;
          }
        }
      `}</style>
    </Navbar>
  );
};

export default WarehouseNavbar;