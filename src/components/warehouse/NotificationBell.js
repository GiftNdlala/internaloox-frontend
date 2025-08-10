import React, { useState, useRef, useEffect, useContext } from 'react';
import { Button, Dropdown, Badge, ListGroup } from 'react-bootstrap';
import { FaBell, FaCheck, FaTrash, FaExclamationTriangle, FaInfo, FaCheckCircle } from 'react-icons/fa';
import { useRealTimeUpdates } from '../../hooks/useRealTimeUpdates';
import { WarehouseContext } from '../../contexts/WarehouseContext';
import { markNotificationRead, markAllNotificationsRead } from '../api';

const NotificationBell = () => {
  const [show, setShow] = useState(false);
  const dropdownRef = useRef(null);
  const { updates } = useRealTimeUpdates();
  const warehouseCtx = useContext(WarehouseContext);
  const notifications = Array.isArray(warehouseCtx?.notifications) ? warehouseCtx.notifications : [];
  const markLocalRead = warehouseCtx?.markNotificationRead || (() => {});

  // Get unread count
  const unreadCount = notifications.filter(n => !n.is_read).length;

  const handleMarkAsRead = async (notificationId, event) => {
    event.stopPropagation();
    try {
      await markNotificationRead(notificationId);
      markLocalRead(notificationId);
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsRead();
      // Mark all local notifications as read
      notifications.forEach(notification => {
        if (!notification.is_read) {
          markLocalRead(notification.id);
        }
      });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const getNotificationIcon = (type, priority) => {
    if (priority === 'critical' || type === 'error') {
      return <FaExclamationTriangle className="text-danger" />;
    }
    if (type === 'warning') {
      return <FaExclamationTriangle className="text-warning" />;
    }
    if (type === 'success') {
      return <FaCheckCircle className="text-success" />;
    }
    return <FaInfo className="text-info" />;
  };

  const formatTimeAgo = (dateString) => {
    const now = new Date();
    const notificationDate = new Date(dateString);
    const diffInMinutes = Math.floor((now - notificationDate) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShow(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="notification-bell position-relative" ref={dropdownRef}>
      <Button
        variant="outline-light"
        className="position-relative border-0"
        onClick={() => setShow(!show)}
        style={{ color: '#6c757d' }}
      >
        <FaBell size={20} />
        {unreadCount > 0 && (
          <Badge 
            bg="danger" 
            className="position-absolute top-0 start-100 translate-middle rounded-pill"
            style={{ fontSize: '0.6rem', padding: '0.25em 0.4em' }}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </Button>

      {show && (
        <div 
          className="notification-dropdown position-absolute end-0 mt-2 bg-white border rounded shadow-lg"
          style={{ 
            width: '380px', 
            maxWidth: '90vw',
            zIndex: 1050,
            maxHeight: '500px',
            overflowY: 'auto'
          }}
        >
          {/* Header */}
          <div className="p-3 border-bottom d-flex justify-content-between align-items-center">
            <h6 className="mb-0 fw-bold">
              Notifications
              {unreadCount > 0 && (
                <Badge bg="primary" className="ms-2">
                  {unreadCount}
                </Badge>
              )}
            </h6>
            {unreadCount > 0 && (
              <Button
                variant="link"
                size="sm"
                className="text-decoration-none p-0"
                onClick={handleMarkAllAsRead}
              >
                <FaCheck className="me-1" />
                Mark all read
              </Button>
            )}
          </div>

          {/* Notifications List */}
          <div className="notifications-list">
            {notifications.length > 0 ? (
              notifications.slice(0, 10).map((notification) => (
                <div
                  key={notification.id}
                  className={`notification-item p-3 border-bottom ${
                    !notification.is_read ? 'bg-light' : ''
                  } hover-bg-light`}
                  style={{ cursor: 'pointer' }}
                  onClick={(e) => !notification.is_read && handleMarkAsRead(notification.id, e)}
                >
                  <div className="d-flex align-items-start">
                    <div className="me-3 mt-1">
                      {getNotificationIcon(notification.type, notification.priority)}
                    </div>
                    
                    <div className="flex-grow-1">
                      <div className="d-flex justify-content-between align-items-start mb-1">
                        <p className={`mb-1 ${!notification.is_read ? 'fw-semibold' : ''}`} 
                           style={{ fontSize: '0.9rem', lineHeight: '1.3' }}>
                          {notification.message}
                        </p>
                        {!notification.is_read && (
                          <div 
                            className="bg-primary rounded-circle ms-2"
                            style={{ width: '8px', height: '8px', flexShrink: 0 }}
                          />
                        )}
                      </div>
                      
                      <div className="d-flex justify-content-between align-items-center">
                        <small className="text-muted">
                          {formatTimeAgo(notification.created_at)}
                        </small>
                        
                        {notification.priority && (
                          <Badge 
                            bg={
                              notification.priority === 'critical' ? 'danger' :
                              notification.priority === 'high' ? 'warning' :
                              'info'
                            }
                            className="small"
                          >
                            {notification.priority}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-4">
                <FaBell size={40} className="text-muted mb-3" />
                <p className="text-muted mb-0">No notifications</p>
                <small className="text-muted">You're all caught up!</small>
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 10 && (
            <div className="p-3 text-center border-top">
              <Button variant="outline-primary" size="sm">
                View All Notifications
              </Button>
            </div>
          )}
        </div>
      )}

      <style jsx>{`
        .notification-bell .btn:hover {
          background-color: rgba(0,0,0,0.05) !important;
        }
        
        .notification-dropdown {
          box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15) !important;
        }
        
        .notification-item:hover {
          background-color: rgba(0,0,0,0.02) !important;
        }
        
        .hover-bg-light:hover {
          background-color: rgba(0,0,0,0.03) !important;
        }
        
        .notifications-list {
          max-height: 400px;
          overflow-y: auto;
        }
        
        .notifications-list::-webkit-scrollbar {
          width: 6px;
        }
        
        .notifications-list::-webkit-scrollbar-track {
          background: #f1f1f1;
        }
        
        .notifications-list::-webkit-scrollbar-thumb {
          background: #c1c1c1;
          border-radius: 3px;
        }
        
        .notifications-list::-webkit-scrollbar-thumb:hover {
          background: #a8a8a8;
        }
        
        @media (max-width: 768px) {
          .notification-dropdown {
            width: 320px !important;
          }
          
          .notification-item {
            padding: 0.75rem !important;
          }
          
          .notification-item p {
            font-size: 0.85rem !important;
          }
        }
      `}</style>
    </div>
  );
};

export default NotificationBell;