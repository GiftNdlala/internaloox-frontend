import React, { useState, useEffect } from 'react';
import { Navbar, Nav, NavDropdown, Container, Badge } from 'react-bootstrap';
import { 
  FaUserShield, FaSignOutAlt, FaCog, FaUser, 
  FaBell, FaClock, FaChevronDown 
} from 'react-icons/fa';

const SharedHeader = ({ user, onLogout, dashboardType = 'default' }) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getDashboardConfig = () => {
    switch (dashboardType) {
      case 'owner':
        return {
          title: 'Executive Portal',
          bgColor: '#1e293b',
          textColor: 'white',
          accentColor: '#f59e0b'
        };
      case 'admin':
        return {
          title: 'Operations Control',
          bgColor: '#64748b',
          textColor: 'white',
          accentColor: '#3b82f6'
        };
      case 'warehouse':
        return {
          title: 'Production Floor',
          bgColor: '#1f2937',
          textColor: 'white',
          accentColor: '#10b981'
        };
      case 'delivery':
        return {
          title: 'Delivery Hub',
          bgColor: '#ffffff',
          textColor: '#1f2937',
          accentColor: '#fbbf24'
        };
      default:
        return {
          title: 'OOX System',
          bgColor: '#6b7280',
          textColor: 'white',
          accentColor: '#3b82f6'
        };
    }
  };

  const config = getDashboardConfig();

  return (
    <Navbar 
      expand="lg" 
      className="mb-3 shadow-sm"
      style={{ 
        background: `linear-gradient(135deg, ${config.bgColor} 0%, ${config.bgColor}dd 100%)`,
        borderBottom: `3px solid ${config.accentColor}`,
        borderRadius: '0 0 15px 15px'
      }}
    >
      <Container fluid>
        <Navbar.Brand 
          style={{ 
            color: config.textColor,
            fontWeight: '700',
            fontSize: '1.3rem'
          }}
        >
          <FaUserShield className="me-2" style={{ color: config.accentColor }} />
          {config.title}
        </Navbar.Brand>
        
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            {/* Live Clock - Desktop */}
            <Nav.Item className="d-none d-md-block">
              <Nav.Link disabled style={{ color: config.textColor }}>
                <FaClock className="me-2" />
                {currentTime.toLocaleTimeString()}
              </Nav.Link>
            </Nav.Item>
          </Nav>
          
          <Nav>
            {/* User Info Dropdown */}
            <NavDropdown
              title={
                <span style={{ color: config.textColor }}>
                  <FaUser className="me-2" />
                  {user?.first_name || user?.username || 'User'}
                  <FaChevronDown className="ms-2" size={12} />
                </span>
              }
              id="user-dropdown"
              align="end"
              menuVariant={dashboardType === 'delivery' ? 'light' : 'dark'}
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
          </Nav>
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
        {currentTime.toLocaleTimeString()}
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
  );
};

export default SharedHeader;