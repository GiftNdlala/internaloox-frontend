import React from 'react';
import { Nav, Badge } from 'react-bootstrap';
import { 
  FaBoxes, FaTasks, FaUsers, FaChartBar, FaCog, 
  FaSignOutAlt, FaHome, FaClipboardList, FaTruck,
  FaWarehouse, FaBell
} from 'react-icons/fa';

const WarehouseSideNav = ({ user, onLogout, activeTab, onTabChange, notifications = [] }) => {
  const unreadCount = notifications.filter(n => !n.is_read).length;

  const navItems = [
    { id: 'overview', label: 'Overview', icon: FaHome, color: '#007bff' },
    { id: 'orders', label: 'Orders', icon: FaClipboardList, color: '#28a745' },
    { id: 'task-management', label: 'Task Management', icon: FaTasks, color: '#ffc107' },
    { id: 'inventory', label: 'Inventory', icon: FaBoxes, color: '#17a2b8' },
    { id: 'workers', label: 'Workers', icon: FaUsers, color: '#6f42c1' },
    { id: 'analytics', label: 'Analytics', icon: FaChartBar, color: '#fd7e14' },
    { id: 'delivery', label: 'Delivery', icon: FaTruck, color: '#e83e8c' },
    { id: 'warehouse', label: 'Warehouse', icon: FaWarehouse, color: '#20c997' },
  ];

  const handleTabChange = (tabId) => {
    onTabChange(tabId);
    // Update URL without page reload
    const url = new URL(window.location);
    url.searchParams.set('tab', tabId);
    window.history.pushState({}, '', url);
  };

  return (
    <div className="warehouse-side-nav" style={{
      width: '280px',
      height: '100vh',
      backgroundColor: '#2c3e50',
      color: 'white',
      position: 'fixed',
      left: 0,
      top: 0,
      zIndex: 1000,
      overflowY: 'auto',
      boxShadow: '2px 0 10px rgba(0,0,0,0.1)'
    }}>
      {/* Header */}
      <div style={{
        padding: '20px',
        borderBottom: '1px solid #34495e',
        textAlign: 'center'
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
        backgroundColor: '#34495e'
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

      {/* Navigation Items */}
      <Nav className="flex-column" style={{ padding: '20px 0' }}>
        {navItems.map((item) => {
          const IconComponent = item.icon;
          const isActive = activeTab === item.id;
          
          return (
            <Nav.Item key={item.id}>
              <Nav.Link
                onClick={() => handleTabChange(item.id)}
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

      {/* Bottom Section */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        width: '100%',
        padding: '20px',
        borderTop: '1px solid #34495e',
        backgroundColor: '#34495e'
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
          cursor: 'pointer'
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
            e.target.style.backgroundColor = '#c0392b';
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = '#e74c3c';
          }}
        >
          <FaSignOutAlt size={16} />
          <span style={{ fontSize: '14px' }}>Logout</span>
        </div>
      </div>
    </div>
  );
};

export default WarehouseSideNav;
