import React, { useState, useEffect } from 'react';
import { Nav, Badge, Offcanvas } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { 
  FaBoxes, FaTasks, FaUsers, FaChartBar, FaCog, 
  FaSignOutAlt, FaHome, FaClipboardList, FaTruck,
  FaWarehouse, FaBell, FaBars, FaTimes
} from 'react-icons/fa';

const WarehouseSideNav = ({ user, onLogout, activeTab, onTabChange, notifications = [], isMobile = false }) => {
  const [showMobileNav, setShowMobileNav] = useState(false);
  const [isMobileView, setIsMobileView] = useState(false);
  const navigate = useNavigate();
  const unreadCount = notifications.filter(n => !n.is_read).length;

  // Improved mobile detection
  useEffect(() => {
    const checkMobile = () => {
      // Check for mobile devices with better detection
      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const isSmallScreen = window.innerWidth <= 768;
      const isPortrait = window.innerHeight > window.innerWidth;
      
      // Consider it mobile if it's a mobile device OR small screen OR portrait orientation on small screens
      setIsMobileView(isMobileDevice || isSmallScreen || (isSmallScreen && isPortrait));
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    window.addEventListener('orientationchange', checkMobile);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
      window.removeEventListener('orientationchange', checkMobile);
    };
  }, []);

  const navItems = [
    { id: 'overview', label: 'Overview', icon: FaHome, color: '#007bff', route: '/warehouse' },
    { id: 'orders', label: 'Orders', icon: FaClipboardList, color: '#28a745', route: '/warehouse/orders' },
    { id: 'inventory', label: 'Inventory', icon: FaBoxes, color: '#17a2b8', route: '/warehouse/products' },
    { id: 'workers', label: 'Workers', icon: FaUsers, color: '#6f42c1', route: '/warehouse/workers' },
    { id: 'analytics', label: 'Analytics', icon: FaChartBar, color: '#fd7e14', route: '/warehouse/analytics' },
    { id: 'warehouse', label: 'Warehouse Stock', icon: FaWarehouse, color: '#20c997', route: '/warehouse/stock' },
  ];

  const handleTabChange = (tabId, route) => {
    onTabChange(tabId);
    if (route && window.location.pathname !== route) {
      navigate(route);
    }
    // Close mobile nav after selection
    if (isMobile) {
      setShowMobileNav(false);
    }
  };

  const sideNavContent = (
    <div className="warehouse-side-nav" style={{
      width: '100%',
      height: '100vh',
      backgroundColor: '#2c3e50',
      color: 'white',
      display: 'flex',
      flexDirection: 'column',
      overflowY: 'auto',
      boxShadow: '2px 0 10px rgba(0,0,0,0.1)'
    }}>
      {/* Header */}
      <div style={{
        padding: '20px',
        borderBottom: '1px solid #34495e',
        textAlign: 'center',
        flexShrink: 0
      }}>
        <div style={{
          fontSize: '24px',
          fontWeight: 'bold',
          color: '#3498db',
          marginBottom: '5px'
        }}>
          <FaWarehouse className="me-2" />
          OOX Warehouse
        </div>
        <div style={{
          fontSize: '14px',
          color: '#bdc3c7'
        }}>
          Production Management System
        </div>
      </div>

      {/* User Info */}
      <div style={{
        padding: '15px 20px',
        borderBottom: '1px solid #34495e',
        backgroundColor: '#34495e',
        flexShrink: 0
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            backgroundColor: '#3498db',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '18px',
            fontWeight: 'bold'
          }}>
            {user?.username?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div>
            <div style={{ fontWeight: 'bold', fontSize: '16px' }}>
              {user?.get_full_name?.() || user?.username || 'User'}
            </div>
            <div style={{ fontSize: '12px', color: '#bdc3c7' }}>
              {user?.role?.replace('_', ' ').toUpperCase() || 'ROLE'}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Items - Flexible grow area */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        <Nav className="flex-column" style={{ padding: '20px 0' }}>
        {navItems.map((item) => {
          const IconComponent = item.icon;
          const isActive = activeTab === item.id;
          
          return (
            <Nav.Item key={item.id}>
              <Nav.Link
                  onClick={() => handleTabChange(item.id, item.route)}
                style={{
                  color: isActive ? 'white' : '#bdc3c7',
                  backgroundColor: isActive ? item.color : 'transparent',
                  border: 'none',
                  padding: '15px 25px',
                  margin: '2px 15px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  fontSize: '16px'
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.target.style.backgroundColor = '#34495e';
                    e.target.style.color = 'white';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.target.style.backgroundColor = 'transparent';
                    e.target.style.color = '#bdc3c7';
                  }
                }}
              >
                <IconComponent size={18} />
                {item.label}
                {item.id === 'orders' && (
                  <Badge 
                    bg="danger" 
                    style={{ 
                      marginLeft: 'auto',
                      fontSize: '10px',
                      padding: '4px 6px'
                    }}
                  >
                    New
                  </Badge>
                )}
              </Nav.Link>
            </Nav.Item>
          );
        })}
      </Nav>
      </div>

      {/* Bottom Section - Fixed at bottom */}
      <div style={{
        padding: '20px',
        borderTop: '1px solid #34495e',
        backgroundColor: '#34495e',
        flexShrink: 0
      }}>
        {/* Notifications */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          marginBottom: '15px',
          padding: '10px',
          backgroundColor: '#2c3e50',
          borderRadius: '8px',
          cursor: 'pointer',
          transition: 'all 0.3s ease'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#1a252f';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = '#2c3e50';
        }}>
          <FaBell size={16} color="#3498db" />
          <span style={{ fontSize: '14px' }}>Notifications</span>
          {unreadCount > 0 && (
            <Badge 
              bg="danger" 
              style={{ 
                marginLeft: 'auto',
                fontSize: '10px',
                padding: '4px 6px'
              }}
            >
              {unreadCount}
            </Badge>
          )}
        </div>

        {/* Logout */}
        <div
          onClick={onLogout}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '10px',
            backgroundColor: '#e74c3c',
            borderRadius: '8px',
            cursor: 'pointer',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#c0392b';
            e.currentTarget.style.transform = 'translateY(-1px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#e74c3c';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          <FaSignOutAlt size={16} />
          <span style={{ fontSize: '14px' }}>Logout</span>
        </div>
      </div>
    </div>
  );

  // Mobile Toggle Button
  const MobileToggle = () => (
    <div 
      onClick={() => setShowMobileNav(true)}
      style={{
        position: 'fixed',
        top: '20px',
        left: '20px',
        zIndex: 1050,
        backgroundColor: '#2c3e50',
        color: 'white',
        padding: '12px',
        borderRadius: '8px',
        cursor: 'pointer',
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        display: isMobileView ? 'block' : 'none'
      }}
    >
      <FaBars size={20} />
    </div>
  );

  // For mobile devices, use Bootstrap Offcanvas
  if (isMobileView) {
    return (
      <>
        <MobileToggle />
        <Offcanvas 
          show={showMobileNav} 
          onHide={() => setShowMobileNav(false)}
          placement="start"
          style={{ width: '280px' }}
        >
          <Offcanvas.Header style={{ backgroundColor: '#2c3e50', color: 'white', border: 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <FaWarehouse color="#3498db" />
              <strong>OOX Warehouse</strong>
            </div>
            <div 
              onClick={() => setShowMobileNav(false)}
              style={{ 
                cursor: 'pointer', 
                padding: '5px',
                color: 'white',
                fontSize: '20px'
              }}
            >
              <FaTimes />
            </div>
          </Offcanvas.Header>
          <Offcanvas.Body style={{ padding: 0, backgroundColor: '#2c3e50' }}>
            {/* Mobile-specific navigation content */}
            <div style={{ padding: '20px 0' }}>
              {/* User Info */}
              <div style={{
                padding: '15px 20px',
                borderBottom: '1px solid #34495e',
                backgroundColor: '#34495e',
                marginBottom: '20px'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    backgroundColor: '#3498db',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '18px',
                    fontWeight: 'bold'
                  }}>
                    {user?.username?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <div>
                    <div style={{ fontWeight: 'bold', fontSize: '16px', color: 'white' }}>
                      {user?.get_full_name?.() || user?.username || 'User'}
                    </div>
                    <div style={{ fontSize: '12px', color: '#bdc3c7' }}>
                      {user?.role?.replace('_', ' ').toUpperCase() || 'ROLE'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Navigation Items */}
              <div style={{ padding: '0 20px' }}>
                {navItems.map((item) => {
                  const IconComponent = item.icon;
                  const isActive = activeTab === item.id;
                  
                  return (
                    <div 
                      key={item.id}
                      onClick={() => handleTabChange(item.id, item.route)}
                      style={{
                        color: isActive ? 'white' : '#bdc3c7',
                        backgroundColor: isActive ? item.color : 'transparent',
                        border: 'none',
                        padding: '18px 20px', // Increased padding for better touch targets
                        margin: '8px 0',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        fontSize: '16px',
                        minHeight: '48px', // Minimum touch target size
                        userSelect: 'none' // Prevent text selection on mobile
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive) {
                          e.target.style.backgroundColor = '#34495e';
                          e.target.style.color = 'white';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) {
                          e.target.style.backgroundColor = 'transparent';
                          e.target.style.color = '#bdc3c7';
                        }
                      }}
                    >
                      <IconComponent size={20} /> {/* Slightly larger icons for mobile */}
                      <span style={{ flex: 1 }}>{item.label}</span> {/* Ensure label takes available space */}
                      {item.id === 'orders' && (
                        <Badge 
                          bg="danger" 
                          style={{ 
                            fontSize: '10px',
                            padding: '4px 6px',
                            flexShrink: 0
                          }}
                        >
                          New
                        </Badge>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Logout Button */}
              <div style={{ padding: '20px', marginTop: '20px' }}>
                <div 
                  onClick={onLogout}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '18px 20px', // Consistent with navigation items
                    backgroundColor: '#e74c3c',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    color: 'white',
                    justifyContent: 'center',
                    minHeight: '48px', // Consistent touch target size
                    userSelect: 'none' // Prevent text selection
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#c0392b';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#e74c3c';
                  }}
                >
                  <FaSignOutAlt size={20} />
                  <span style={{ fontSize: '16px', fontWeight: '500' }}>Logout</span>
                </div>
              </div>
            </div>
          </Offcanvas.Body>
        </Offcanvas>
      </>
    );
  }

  // Desktop version - fixed sidebar
  return (
    <div style={{
      width: '280px',
      height: '100vh',
      position: 'fixed',
      left: 0,
      top: 0,
      zIndex: 1000
    }}>
      {sideNavContent}
    </div>
  );
};

export default WarehouseSideNav;
