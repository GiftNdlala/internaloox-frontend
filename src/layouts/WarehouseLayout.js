import React, { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Container } from 'react-bootstrap';
import WarehouseSideNav from '../components/warehouse/WarehouseSideNav';

const WarehouseLayout = ({ user, onLogout }) => {
  const location = useLocation();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeTab, setActiveTab] = useState('overview');
  
  // Auto-detect active tab from URL
  useEffect(() => {
    const path = location.pathname;
    if (path.includes('/warehouse/products')) setActiveTab('inventory');
    else if (path.includes('/warehouse/orders')) setActiveTab('orders');
    else if (path.includes('/warehouse/tasks')) setActiveTab('task-management');
    else if (path.includes('/warehouse/workers')) setActiveTab('workers');
    else if (path.includes('/warehouse/analytics')) setActiveTab('analytics');
    else if (path.includes('/warehouse/delivery')) setActiveTab('delivery');
    else setActiveTab('overview');
  }, [location]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="warehouse-dashboard" style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
      <WarehouseSideNav 
        user={user}
        onLogout={onLogout}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        currentTime={currentTime}
      />
      <div style={{ marginLeft: '280px', minHeight: '100vh' }}>
        <Container fluid className="p-4">
          <Outlet />
        </Container>
      </div>
    </div>
  );
};

export default WarehouseLayout;