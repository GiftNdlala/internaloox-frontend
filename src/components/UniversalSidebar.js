import React, { useState } from 'react';
import { Offcanvas, Nav, Badge, Button } from 'react-bootstrap';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  FaHome, FaClipboardList, FaUsers, FaUserCog, FaMoneyBillWave, 
  FaTruck, FaChartLine, FaBars, FaTimes, FaCouch, FaWarehouse,
  FaRoute, FaCog, FaSignOutAlt, FaUserShield, FaChevronLeft, FaChevronRight
} from 'react-icons/fa';

const UniversalSidebar = ({ user, userRole, onLogout }) => {
  const [show, setShow] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);
  const toggleCollapse = () => setIsCollapsed(!isCollapsed);

  // Get role-specific navigation items
  const getNavigationItems = () => {
    const baseItems = [
      {
        key: 'dashboard',
        label: 'Dashboard',
        icon: FaHome,
        path: `/${userRole}`,
        roles: ['owner', 'admin', 'warehouse', 'delivery']
      }
    ];

    const roleSpecificItems = {
      owner: [
        {
          key: 'orders',
          label: 'Orders Management',
          icon: FaClipboardList,
          path: '/owner/orders',
          badge: 'New'
        },
        {
          key: 'customers',
          label: 'Customers',
          icon: FaUsers,
          path: '/owner/customers'
        },
        {
          key: 'users',
          label: 'Team Management', 
          icon: FaUserCog,
          path: '/owner/users'
        },
        {
          key: 'payments',
          label: 'Payments',
          icon: FaMoneyBillWave,
          path: '/owner/payments'
        },
        {
          key: 'deliveries',
          label: 'Deliveries',
          icon: FaTruck,
          path: '/owner/deliveries'
        },
        {
          key: 'analytics',
          label: 'Analytics',
          icon: FaChartLine,
          path: '/owner/analytics',
          badge: 'Pro'
        }
      ],
      admin: [
        {
          key: 'orders',
          label: 'Orders Management',
          icon: FaClipboardList,
          path: '/admin/orders'
        },
        {
          key: 'customers',
          label: 'Customers',
          icon: FaUsers,
          path: '/admin/customers'
        },
        {
          key: 'payments',
          label: 'Payments',
          icon: FaMoneyBillWave,
          path: '/admin/payments'
        },
        {
          key: 'deliveries',
          label: 'Deliveries',
          icon: FaTruck,
          path: '/admin/deliveries'
        }
      ],
      warehouse: [
        {
          key: 'orders',
          label: 'Production Queue',
          icon: FaClipboardList,
          path: '/warehouse/orders'
        },
        {
          key: 'queue',
          label: 'Queue Management',
          icon: FaWarehouse,
          path: '/warehouse/queue'
        }
      ],
      delivery: [
        {
          key: 'orders',
          label: 'Delivery Orders',
          icon: FaClipboardList,
          path: '/delivery/orders'
        },
        {
          key: 'routes',
          label: 'Route Planning',
          icon: FaRoute,
          path: '/delivery/routes'
        }
      ]
    };

    return [...baseItems, ...(roleSpecificItems[userRole] || [])];
  };

  const navigationItems = getNavigationItems();

  const handleNavigation = (path) => {
    navigate(path);
    handleClose();
  };

  const isActiveRoute = (path) => {
    return location.pathname === path;
  };

  const getRoleColor = () => {
    const colors = {
      owner: '#f59e0b',
      admin: '#3b82f6', 
      warehouse: '#10b981',
      delivery: '#06b6d4'
    };
    return colors[userRole] || '#6b7280';
  };

  const getRoleIcon = () => {
    const icons = {
      owner: FaUserShield,
      admin: FaCog,
      warehouse: FaWarehouse,
      delivery: FaTruck
    };
    const IconComponent = icons[userRole] || FaUserShield;
    return <IconComponent />;
  };

  // Dark theme colors matching the header
  const darkTheme = {
    primary: '#1e293b',      // Main dark color from header
    secondary: '#334155',    // Lighter shade
    accent: '#475569',       // Even lighter for hover states
    border: 'rgba(255,255,255,0.1)'
  };

  const sidebarWidth = isCollapsed ? '80px' : '280px';

  return (
    <>
      {/* Mobile Menu Button - Fixed Position */}
      <Button
        variant="light"
        onClick={handleShow}
        className="d-lg-none position-fixed"
        style={{
          top: '20px',
          left: '20px',
          zIndex: 1030,
          width: '50px',
          height: '50px',
          borderRadius: '50%',
          border: `2px solid ${getRoleColor()}`,
          backgroundColor: 'white',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <FaBars style={{ color: getRoleColor() }} />
      </Button>

      {/* Desktop Sidebar */}
      <div 
        className="d-none d-lg-block position-fixed"
        style={{
          top: 0,
          left: 0,
          width: sidebarWidth,
          height: '100vh',
          background: `linear-gradient(180deg, ${darkTheme.primary} 0%, ${darkTheme.secondary} 100%)`,
          boxShadow: '4px 0 20px rgba(0,0,0,0.2)',
          zIndex: 1020,
          overflowY: 'auto',
          overflowX: 'hidden',
          transition: 'width 0.3s ease-in-out',
          borderRight: `1px solid ${darkTheme.border}`
        }}
      >
        {/* Collapse/Expand Toggle Button */}
        <Button
          onClick={toggleCollapse}
          className="position-absolute"
          style={{
            top: '20px',
            right: '-15px',
            width: '30px',
            height: '30px',
            borderRadius: '50%',
            border: `2px solid ${darkTheme.border}`,
            backgroundColor: darkTheme.primary,
            color: 'white',
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
            zIndex: 1021,
            padding: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = getRoleColor();
            e.target.style.transform = 'scale(1.1)';
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = darkTheme.primary;
            e.target.style.transform = 'scale(1)';
          }}
        >
          {isCollapsed ? <FaChevronRight /> : <FaChevronLeft />}
        </Button>

        <SidebarContent 
          navigationItems={navigationItems}
          user={user}
          userRole={userRole}
          onLogout={onLogout}
          onNavigate={handleNavigation}
          isActiveRoute={isActiveRoute}
          getRoleColor={getRoleColor}
          getRoleIcon={getRoleIcon}
          isMobile={false}
          isCollapsed={isCollapsed}
          darkTheme={darkTheme}
        />
      </div>

      {/* Mobile Offcanvas Sidebar */}
      <Offcanvas 
        show={show} 
        onHide={handleClose} 
        placement="start"
        style={{ width: '320px' }}
      >
        <Offcanvas.Header 
          closeButton
          style={{ 
            background: darkTheme.primary,
            color: 'white',
            borderBottom: `1px solid ${darkTheme.border}`
          }}
        >
          <Offcanvas.Title className="d-flex align-items-center">
            <FaCouch className="me-2" />
            OOX Furniture
          </Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body 
          style={{ 
            background: `linear-gradient(180deg, ${darkTheme.primary} 0%, ${darkTheme.secondary} 100%)`,
            padding: 0 
          }}
        >
          <SidebarContent 
            navigationItems={navigationItems}
            user={user}
            userRole={userRole}
            onLogout={onLogout}
            onNavigate={handleNavigation}
            isActiveRoute={isActiveRoute}
            getRoleColor={getRoleColor}
            getRoleIcon={getRoleIcon}
            isMobile={true}
            isCollapsed={false}
            darkTheme={darkTheme}
          />
        </Offcanvas.Body>
      </Offcanvas>

      {/* Desktop Content Margin with dynamic adjustment */}
      <style jsx>{`
        @media (min-width: 992px) {
          .main-content {
            margin-left: ${sidebarWidth};
            transition: margin-left 0.3s ease-in-out;
          }
        }
      `}</style>
    </>
  );
};

// Shared Sidebar Content Component
const SidebarContent = ({ 
  navigationItems, 
  user, 
  userRole, 
  onLogout, 
  onNavigate, 
  isActiveRoute, 
  getRoleColor,
  getRoleIcon,
  isMobile,
  isCollapsed,
  darkTheme
}) => {
  return (
    <div className="h-100 d-flex flex-column">
      {/* User Profile Section */}
      <div 
        className="p-4 border-bottom"
        style={{ 
          borderColor: darkTheme.border,
          backgroundColor: 'rgba(255,255,255,0.05)',
          paddingTop: isCollapsed && !isMobile ? '70px' : '1.5rem' // Account for toggle button
        }}
      >
        {!isCollapsed || isMobile ? (
          <div className="d-flex align-items-center mb-3">
            <div 
              className="rounded-circle d-flex align-items-center justify-content-center me-3"
              style={{
                width: '50px',
                height: '50px',
                backgroundColor: getRoleColor(),
                color: 'white',
                fontSize: '18px',
                fontWeight: '600',
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
              }}
            >
              {(user?.first_name?.[0] || user?.username?.[0] || 'U').toUpperCase()}
            </div>
            <div>
              <div style={{ color: 'white', fontWeight: '600', fontSize: '1rem' }}>
                {user?.first_name || user?.username || 'User'}
              </div>
              <div 
                className="d-flex align-items-center"
                style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.85rem' }}
              >
                {getRoleIcon()}
                <span className="ms-1">
                  {userRole?.charAt(0).toUpperCase() + userRole?.slice(1) || 'User'}
                </span>
              </div>
            </div>
          </div>
        ) : (
          // Collapsed version - just the avatar
          <div className="d-flex justify-content-center mb-3">
            <div 
              className="rounded-circle d-flex align-items-center justify-content-center"
              style={{
                width: '40px',
                height: '40px',
                backgroundColor: getRoleColor(),
                color: 'white',
                fontSize: '16px',
                fontWeight: '600',
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
              }}
            >
              {(user?.first_name?.[0] || user?.username?.[0] || 'U').toUpperCase()}
            </div>
          </div>
        )}
        
        {(!isCollapsed || isMobile) && !isMobile && (
          <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem' }}>
            {user?.email}
          </div>
        )}
      </div>

      {/* Navigation Items */}
      <Nav className="flex-column flex-grow-1 p-3">
        {navigationItems.map((item) => {
          const IconComponent = item.icon;
          const isActive = isActiveRoute(item.path);
          
          return (
            <Nav.Link
              key={item.key}
              onClick={() => onNavigate(item.path)}
              className="d-flex align-items-center mb-2"
              style={{
                backgroundColor: isActive 
                  ? getRoleColor() 
                  : 'transparent',
                color: 'white',
                borderRadius: '12px',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                fontWeight: isActive ? '600' : '500',
                border: isActive ? `1px solid ${getRoleColor()}` : '1px solid transparent',
                padding: isCollapsed && !isMobile ? '12px' : '12px 16px',
                justifyContent: isCollapsed && !isMobile ? 'center' : 'flex-start',
                position: 'relative'
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.target.style.backgroundColor = darkTheme.accent;
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.target.style.backgroundColor = 'transparent';
                }
              }}
              title={isCollapsed && !isMobile ? item.label : ''}
            >
              <IconComponent 
                size={20} 
                style={{ 
                  minWidth: '20px',
                  marginRight: isCollapsed && !isMobile ? '0' : '12px'
                }}
              />
              {(!isCollapsed || isMobile) && (
                <>
                  <span className="flex-grow-1">{item.label}</span>
                  {item.badge && (
                    <Badge 
                      bg={item.badge === 'New' ? 'success' : 'warning'}
                      className="ms-2"
                      style={{ fontSize: '0.7rem' }}
                    >
                      {item.badge}
                    </Badge>
                  )}
                </>
              )}
              {isCollapsed && !isMobile && item.badge && (
                <div
                  style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    width: '8px',
                    height: '8px',
                    backgroundColor: item.badge === 'New' ? '#10b981' : '#f59e0b',
                    borderRadius: '50%',
                    border: '2px solid white'
                  }}
                />
              )}
            </Nav.Link>
          );
        })}
      </Nav>

      {/* Logout Section */}
      <div 
        className="p-3 border-top" 
        style={{ borderColor: darkTheme.border }}
      >
        <Nav.Link
          onClick={onLogout}
          className="d-flex align-items-center"
          style={{
            color: 'white',
            borderRadius: '12px',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            fontWeight: '500',
            padding: isCollapsed && !isMobile ? '12px' : '12px 16px',
            justifyContent: isCollapsed && !isMobile ? 'center' : 'flex-start'
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = 'rgba(220, 38, 38, 0.2)';
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = 'transparent';
          }}
          title={isCollapsed && !isMobile ? 'Logout' : ''}
        >
          <FaSignOutAlt 
            size={20} 
            style={{ 
              minWidth: '20px',
              marginRight: isCollapsed && !isMobile ? '0' : '12px'
            }} 
          />
          {(!isCollapsed || isMobile) && <span>Logout</span>}
        </Nav.Link>
      </div>
    </div>
  );
};

export default UniversalSidebar;