import React, { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Container } from 'react-bootstrap';
import WarehouseNavbar from '../components/warehouse/WarehouseNavbar';

const WarehouseLayout = ({ user, onLogout }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="warehouse-dashboard" style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
      <WarehouseNavbar 
        user={user}
        onLogout={onLogout}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        currentTime={currentTime}
      />
      <Container fluid className="p-4">
        <Outlet />
      </Container>
    </div>
  );
};

export default WarehouseLayout;