import React, { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Container } from 'react-bootstrap';
import WarehouseSideNav from '../components/warehouse/WarehouseSideNav';

const WarehouseLayout = ({ user, onLogout }) => {
  const location = useLocation();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeTab, setActiveTab] = useState('overview');
  const [isMobile, setIsMobile] = useState(false);
  const [isNavCollapsed, setIsNavCollapsed] = useState(false);
  
  // Check if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Auto-detect active tab from URL
  useEffect(() => {
    const path = location.pathname;
    if (path.includes('/warehouse/products')) setActiveTab('inventory');
    else if (path.includes('/warehouse/orders')) setActiveTab('orders');
    else if (path.includes('/warehouse/tasks')) setActiveTab('task-management');
    else if (path.includes('/warehouse/workers')) setActiveTab('workers');
    else if (path.includes('/warehouse/analytics')) setActiveTab('analytics');
    else if (path.includes('/warehouse/delivery')) setActiveTab('delivery');
    else if (path.includes('/warehouse/stock')) setActiveTab('warehouse');
    else setActiveTab('overview');
  }, [location]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
  };

  return (
    <div className="warehouse-dashboard" style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
      <WarehouseSideNav 
        user={user}
        onLogout={onLogout}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        currentTime={currentTime}
        isMobile={isMobile}
        isNavCollapsed={isNavCollapsed}
        onNavToggle={(collapsed) => setIsNavCollapsed(collapsed)}
      />
      {/* Main content area with responsive margin */}
      <div style={{ 
        marginLeft: isMobile ? '0' : (isNavCollapsed ? '80px' : '280px'), 
        minHeight: '100vh',
        paddingTop: isMobile ? '60px' : '0', // Add top padding for mobile to account for toggle button
        transition: 'margin-left 0.3s ease'
      }}>
        <Container fluid className="p-4">
          {/* Pass user and onLogout to child components through Outlet */}
          <Outlet context={{ user, onLogout }} />
        </Container>
      </div>
    </div>
  );
};

export default WarehouseLayout;