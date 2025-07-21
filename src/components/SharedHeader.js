import React, { useState, useEffect } from 'react';
import { Navbar, Nav, NavDropdown, Container, Badge } from 'react-bootstrap';
import { 
  FaUserShield, FaSignOutAlt, FaCog, FaUser, 
  FaBell, FaClock, FaChevronDown, FaCouch
} from 'react-icons/fa';

const SharedHeader = ({ user, onLogout, dashboardType = 'default' }) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000); // Update every second for dynamic clock
    return () => clearInterval(timer);
  }, []);

  const getDashboardConfig = () => {
    switch (dashboardType) {
      case 'owner':
        return {
          title: 'OOX Furniture - Executive Portal',
          bgColor: '#1e293b',
          textColor: 'white',
          accentColor: '#f59e0b'
        };
      case 'admin':
        return {
          title: 'OOX Furniture - Operations Control',
          bgColor: '#64748b',
          textColor: 'white',
          accentColor: '#3b82f6'
        };
      case 'warehouse':
        return {
          title: 'OOX Furniture - Production Floor',
          bgColor: '#1f2937',
          textColor: 'white',
          accentColor: '#10b981'
        };
      case 'delivery':
        return {
          title: 'OOX Furniture - Delivery Hub',
          bgColor: '#ffffff',
          textColor: '#1f2937',
          accentColor: '#fbbf24'
        };
      default:
        return {
          title: 'OOX Furniture System',
          bgColor: '#6b7280',
          textColor: 'white',
          accentColor: '#3b82f6'
        };
    }
  };

  const config = getDashboardConfig();

  return (
    <>
      {/* Enhanced Header Styles */}
      <style>{`
        .user-dropdown .dropdown-toggle {
          border: none !important;
          background: none !important;
          box-shadow: none !important;
          padding: 0.5rem 0.75rem !important;
          border-radius: 25px !important;
          transition: all 0.3s ease !important;
        }
        .user-dropdown .dropdown-toggle:hover {
          background: rgba(255,255,255,0.1) !important;
          transform: translateY(-1px);
        }
        .user-dropdown .dropdown-toggle:focus {
          box-shadow: 0 0 0 2px ${config.accentColor}40 !important;
        }
        .navbar-toggler {
          border: 1px solid ${config.accentColor} !important;
          padding: 0.5rem !important;
        }
        .navbar-toggler:focus {
          box-shadow: 0 0 0 2px ${config.accentColor}40 !important;
        }
        .navbar-toggler-icon {
          background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 30 30'%3e%3cpath stroke='${config.accentColor.replace('#', '%23')}' stroke-linecap='round' stroke-miterlimit='10' stroke-width='2' d='M4 7h22M4 15h22M4 23h22'/%3e%3c/svg%3e") !important;
        }
        @media (max-width: 991px) {
          .navbar-brand {
            font-size: 1.2rem !important;
          }
        }
        @media (max-width: 576px) {
          .navbar-brand {
            font-size: 1rem !important;
          }
        }
      `}</style>
      
    <Navbar 
      expand="lg" 
      className="mb-4 shadow-lg"
      style={{ 
        background: `linear-gradient(135deg, ${config.bgColor} 0%, ${config.bgColor}dd 100%)`,
        borderBottom: `4px solid ${config.accentColor}`,
        borderRadius: '0 0 20px 20px',
        padding: '1rem 0'
      }}
    >
      <Container fluid className="px-4">
        {/* Left Section - Logo/Brand */}
        <Navbar.Brand 
          className="d-flex align-items-center"
          style={{ 
            color: config.textColor,
            fontWeight: '800',
            fontSize: '1.5rem',
            cursor: 'pointer',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => e.target.style.transform = 'scale(1.02)'}
          onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
        >
          <div 
            className="d-flex align-items-center justify-content-center me-3"
            style={{
              width: '45px',
              height: '45px',
              backgroundColor: config.accentColor,
              borderRadius: '12px',
              color: 'white',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
            }}
          >
            <FaCouch size={20} />
          </div>
          <div className="d-none d-sm-block">
            {config.title}
          </div>
          <div className="d-block d-sm-none">
            OOX
          </div>
        </Navbar.Brand>
        
        <Navbar.Toggle 
          aria-controls="basic-navbar-nav"
          style={{ borderColor: config.accentColor }}
        />
        
        <Navbar.Collapse id="basic-navbar-nav">
          {/* Center Section - Dynamic Clock */}
          <div className="d-flex justify-content-center flex-grow-1">
            <div 
              className="d-none d-lg-flex align-items-center px-4 py-2"
              style={{
                backgroundColor: 'rgba(255,255,255,0.1)',
                borderRadius: '25px',
                border: `1px solid ${config.accentColor}40`,
                backdropFilter: 'blur(10px)'
              }}
            >
              <FaClock className="me-2" style={{ color: config.accentColor }} />
              <span style={{ 
                color: config.textColor, 
                fontWeight: '600',
                fontSize: '1.1rem',
                fontFamily: 'monospace'
              }}>
                {currentTime.toLocaleTimeString([], {
                  hour: '2-digit', 
                  minute: '2-digit', 
                  second: '2-digit'
                })}
              </span>
            </div>
          </div>
          
          {/* Right Section - User Info */}
          <div className="d-flex align-items-center">
            <NavDropdown
              title={
                <div className="d-flex align-items-center">
                  {/* Circle Avatar */}
                  <div 
                    className="rounded-circle d-flex align-items-center justify-content-center me-2"
                    style={{
                      width: '40px',
                      height: '40px',
                      backgroundColor: config.accentColor,
                      color: 'white',
                      fontSize: '16px',
                      fontWeight: '600',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                      border: '2px solid rgba(255,255,255,0.2)'
                    }}
                  >
                    {(user?.first_name?.[0] || user?.username?.[0] || 'U').toUpperCase()}
                  </div>
                  {/* User Name - Hidden on mobile */}
                  <div className="d-none d-md-block">
                    <div style={{ 
                      color: config.textColor, 
                      fontWeight: '600',
                      fontSize: '0.95rem'
                    }}>
                      {user?.first_name || user?.username || 'User'}
                    </div>
                    <div style={{ 
                      color: `${config.textColor}cc`, 
                      fontSize: '0.8rem'
                    }}>
                      {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1) || 'User'}
                    </div>
                  </div>
                  <FaChevronDown 
                    className="ms-2" 
                    size={10} 
                    style={{ color: config.accentColor }}
                  />
                </div>
              }
              id="user-dropdown"
              align="end"
              menuVariant={dashboardType === 'delivery' ? 'light' : 'dark'}
              className="user-dropdown"
            >
              <NavDropdown.Header>
                <div className="text-center">
                  <div className="mb-2">
                    <div 
                      className="rounded-circle mx-auto d-flex align-items-center justify-content-center"
                      style={{ 
                        width: '50px', 
                        height: '50px', 
                        backgroundColor: config.accentColor,
                        color: 'white'
                      }}
                    >
                      <FaUser size={20} />
                    </div>
                  </div>
                  <div className="fw-bold">{user?.first_name} {user?.last_name}</div>
                  <Badge 
                    style={{ backgroundColor: config.accentColor, color: 'white' }}
                    className="mb-2"
                  >
                    {user?.role?.toUpperCase() || 'USER'}
                  </Badge>
                  <div className="small text-muted">@{user?.username}</div>
                  <div className="small text-muted">{user?.email}</div>
                </div>
              </NavDropdown.Header>
              
              <NavDropdown.Divider />
              
              <NavDropdown.Item>
                <FaClock className="me-2" />
                Last Login: {new Date().toLocaleDateString()}
              </NavDropdown.Item>
              
              <NavDropdown.Item>
                <FaBell className="me-2" />
                Notifications
                <Badge bg="danger" className="ms-2">3</Badge>
              </NavDropdown.Item>
              
              <NavDropdown.Divider />
              
              <NavDropdown.Item href="#settings">
                <FaCog className="me-2" />
                Settings
              </NavDropdown.Item>
              
              <NavDropdown.Divider />
              
              <NavDropdown.Item 
                onClick={onLogout}
                className="text-danger"
              >
                <FaSignOutAlt className="me-2" />
                Logout
              </NavDropdown.Item>
            </NavDropdown>
          </div>
        </Navbar.Collapse>
      </Container>
      
      {/* Mobile Time Display */}
      <div className="d-md-none position-absolute" style={{ 
        top: '10px', 
        right: '60px',
        color: config.textColor,
        fontSize: '0.8rem',
        fontWeight: '600'
      }}>
        {currentTime.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}
      </div>

      {/* Custom Styles */}
      <style jsx>{`
        .navbar-nav .nav-link.disabled {
          opacity: 1 !important;
        }
        .dropdown-menu {
          border-radius: 15px;
          box-shadow: 0 10px 25px rgba(0,0,0,0.15);
          border: none;
          min-width: 280px;
        }
        .dropdown-header {
          padding: 1rem;
          background: linear-gradient(135deg, ${config.accentColor}15 0%, ${config.accentColor}05 100%);
          border-radius: 10px 10px 0 0;
          margin: -0.5rem -0.5rem 0.5rem -0.5rem;
        }
        .dropdown-item {
          padding: 0.75rem 1rem;
          border-radius: 8px;
          margin: 0 0.5rem;
          transition: all 0.2s ease;
        }
        .dropdown-item:hover {
          background-color: ${config.accentColor}20;
          transform: translateX(5px);
        }
        @media (max-width: 768px) {
          .navbar-brand {
            font-size: 1.1rem !important;
          }
        }
      `}</style>
    </Navbar>
    </>
  );
};

export default SharedHeader;