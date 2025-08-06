import React, { useState } from 'react';
import { Badge, Button, Dropdown, Alert } from 'react-bootstrap';
import { FaBell, FaCircle } from 'react-icons/fa';

const SimpleNotificationBell = () => {
  const [showDropdown, setShowDropdown] = useState(false);
  
  // Mock notifications for testing
  const mockNotifications = [
    {
      id: 1,
      message: 'New task assigned: Cut fabric pieces',
      type: 'info',
      priority: 'normal',
      is_read: false,
      created_at: '2024-12-16T10:30:00Z'
    },
    {
      id: 2,
      message: 'Task completed: Quality check by John Worker',
      type: 'success',
      priority: 'normal',
      is_read: false,
      created_at: '2024-12-16T09:15:00Z'
    },
    {
      id: 3,
      message: 'Critical: Low stock alert for fabric material',
      type: 'warning',
      priority: 'high',
      is_read: true,
      created_at: '2024-12-16T08:45:00Z'
    }
  ];

  const unreadCount = mockNotifications.filter(n => !n.is_read).length;

  const getNotificationVariant = (type) => {
    const variants = {
      'info': 'primary',
      'success': 'success',
      'warning': 'warning',
      'error': 'danger'
    };
    return variants[type] || 'light';
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  const handleMarkAllRead = () => {
    console.log('Would mark all notifications as read');
    alert('All notifications marked as read (Demo mode)');
  };

  return (
    <Dropdown
      show={showDropdown}
      onToggle={setShowDropdown}
      align="end"
    >
      <Dropdown.Toggle
        as={Button}
        variant="link"
        className="position-relative p-2 border-0 notification-bell"
        style={{ color: '#6c757d' }}
      >
        <FaBell size={18} />
        {unreadCount > 0 && (
          <Badge
            bg="danger"
            className="position-absolute translate-middle badge rounded-pill"
            style={{
              top: '8px',
              right: '8px',
              fontSize: '0.7rem',
              minWidth: '18px',
              height: '18px',
              lineHeight: '18px'
            }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </Badge>
        )}
      </Dropdown.Toggle>

      <Dropdown.Menu
        className="notification-dropdown shadow-lg"
        style={{ minWidth: '350px', maxWidth: '400px' }}
      >
        <div className="px-3 py-2 bg-light border-bottom d-flex justify-content-between align-items-center">
          <h6 className="mb-0 fw-bold">Notifications</h6>
          {unreadCount > 0 && (
            <Button
              variant="link"
              size="sm"
              className="p-0 text-decoration-none"
              onClick={handleMarkAllRead}
            >
              Mark all read
            </Button>
          )}
        </div>

        <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
          {mockNotifications.length === 0 ? (
            <div className="text-center py-4 text-muted">
              <FaBell size={30} className="mb-2 opacity-50" />
              <p className="mb-0">No notifications</p>
            </div>
          ) : (
            mockNotifications.map(notification => (
              <div
                key={notification.id}
                className={`px-3 py-2 border-bottom notification-item ${
                  !notification.is_read ? 'bg-light' : ''
                }`}
                style={{ cursor: 'pointer' }}
              >
                <div className="d-flex align-items-start">
                  {!notification.is_read && (
                    <FaCircle
                      size={8}
                      className="text-primary mt-2 me-2 flex-shrink-0"
                    />
                  )}
                  <div className="flex-grow-1">
                    <Alert
                      variant={getNotificationVariant(notification.type)}
                      className="mb-1 p-2"
                    >
                      <div className="small fw-semibold">
                        {notification.message}
                      </div>
                    </Alert>
                    <small className="text-muted">
                      {formatTime(notification.created_at)}
                    </small>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {mockNotifications.length > 0 && (
          <div className="px-3 py-2 bg-light border-top text-center">
            <Button variant="link" size="sm" className="text-decoration-none">
              View all notifications
            </Button>
          </div>
        )}
      </Dropdown.Menu>

      <style jsx>{`
        .notification-bell:hover {
          background-color: rgba(0, 0, 0, 0.05) !important;
          border-radius: 50%;
        }

        .notification-item:hover {
          background-color: rgba(0, 123, 255, 0.05) !important;
        }

        .notification-dropdown {
          border: none;
          box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15) !important;
        }
      `}</style>
    </Dropdown>
  );
};

export default SimpleNotificationBell;