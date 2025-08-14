import React, { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Container } from 'react-bootstrap';
import WarehouseSideNav from '../components/warehouse/WarehouseSideNav';

const WarehouseLayout = ({ user, onLogout }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeTab, setActiveTab] = useState('overview');

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