import React, { useState } from 'react';
import { Container, Row, Col, Card, Button, Alert, Nav } from 'react-bootstrap';
import { FaTasks, FaBoxes, FaUsers, FaChartBar } from 'react-icons/fa';
import SimpleTaskManagement from '../components/warehouse/SimpleTaskManagement';
import SimpleNotificationBell from '../components/warehouse/SimpleNotificationBell';

const TestWarehouseDashboard = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState('overview');

  console.log('TestWarehouseDashboard - User:', user);
  console.log('TestWarehouseDashboard - User Role:', user?.role);

  const canManageTasks = () => {
    const allowedRoles = ['owner', 'admin', 'warehouse_manager', 'warehouse'];
    const canManage = allowedRoles.includes(user?.role);
    console.log('Can manage tasks:', canManage, 'for role:', user?.role);
    return canManage;
  };

  const renderContent = () => {
    console.log('Rendering content for tab:', activeTab);
    
    switch (activeTab) {
      case 'overview':
        return (
          <Card>
            <Card.Header>
              <h5>Dashboard Overview</h5>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={3}>
                  <Card className="bg-primary text-white text-center">
                    <Card.Body>
                      <h3>12</h3>
                      <p>Total Orders</p>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={3}>
                  <Card className="bg-success text-white text-center">
                    <Card.Body>
                      <h3>8</h3>
                      <p>Active Tasks</p>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={3}>
                  <Card className="bg-warning text-white text-center">
                    <Card.Body>
                      <h3>5</h3>
                      <p>Workers Online</p>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={3}>
                  <Card className="bg-danger text-white text-center">
                    <Card.Body>
                      <h3>3</h3>
                      <p>Urgent Orders</p>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        );
      
      case 'task-management':
        console.log('Rendering TaskManagement component');
        return canManageTasks() ? (
          <div>
            <Alert variant="info" className="mb-4">
              <strong>Task Management Active!</strong> You can create and assign tasks here.
            </Alert>
            <SimpleTaskManagement user={user} />
          </div>
        ) : (
          <Alert variant="warning">
            <strong>Access Denied!</strong> You don't have permission to manage tasks.
            <br />Your role: {user?.role}
            <br />Required roles: owner, admin, warehouse_manager, warehouse
          </Alert>
        );
      
      case 'inventory':
        return (
          <Card>
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Inventory Management</h5>
              <Button variant="outline-success" onClick={() => window.location.assign('/warehouse/products/new')}>
                Add Product
              </Button>
            </Card.Header>
            <Card.Body>
              <p>Inventory features will be displayed here.</p>
            </Card.Body>
          </Card>
        );
      
      default:
        return <div>Unknown tab: {activeTab}</div>;
    }
  };

  return (
    <div style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
      {/* Simple Navbar */}
      <nav className="navbar navbar-expand-lg navbar-light bg-white shadow-sm">
        <Container fluid>
          <span className="navbar-brand">
            <FaTasks className="me-2" />
            OOX Warehouse - Test Dashboard
          </span>
          
          <div className="d-flex align-items-center">
            <SimpleNotificationBell />
            <span className="ms-3">
              Welcome, {user?.first_name} ({user?.role})
            </span>
            <Button variant="outline-danger" className="ms-3" onClick={onLogout}>
              Logout
            </Button>
          </div>
        </Container>
      </nav>

      {/* Tab Navigation */}
      <Container fluid className="p-4">
        <Nav variant="tabs" className="mb-4">
          <Nav.Item>
            <Nav.Link 
              active={activeTab === 'overview'}
              onClick={() => setActiveTab('overview')}
            >
              <FaChartBar className="me-2" />
              Overview
            </Nav.Link>
          </Nav.Item>
          
          {canManageTasks() && (
            <Nav.Item>
              <Nav.Link 
                active={activeTab === 'task-management'}
                onClick={() => setActiveTab('task-management')}
              >
                <FaTasks className="me-2" />
                Task Management
              </Nav.Link>
            </Nav.Item>
          )}
          
          <Nav.Item>
            <Nav.Link 
              active={activeTab === 'inventory'}
              onClick={() => setActiveTab('inventory')}
            >
              <FaBoxes className="me-2" />
              Inventory
            </Nav.Link>
          </Nav.Item>
        </Nav>

        {/* Debug Info */}
        <Alert variant="info" className="mb-4">
          <strong>Debug Info:</strong>
          <br />User: {user?.first_name} {user?.last_name}
          <br />Role: {user?.role}
          <br />Can Manage Tasks: {canManageTasks() ? 'Yes' : 'No'}
          <br />Active Tab: {activeTab}
        </Alert>

        {/* Content */}
        {renderContent()}
      </Container>
    </div>
  );
};

export default TestWarehouseDashboard;