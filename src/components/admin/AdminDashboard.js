import React, { useState } from 'react';
import { Container, Row, Col, Nav, Card } from 'react-bootstrap';
import { FaClipboardList, FaMoneyBillWave, FaUsers, FaChartBar } from 'react-icons/fa';
import OrdersTable from './OrdersTable';
import PaymentsTable from './PaymentsTable';
import CustomersTable from './CustomersTable';
import ReportsTable from './ReportsTable';

const AdminDashboard = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState('orders');

  const renderTabContent = () => {
    switch (activeTab) {
      case 'orders':
        return (
          <Card className="mb-4">
            <Card.Body>
              <Card.Title><FaClipboardList className="me-2" />Order Management</Card.Title>
              <OrdersTable />
            </Card.Body>
          </Card>
        );
      case 'payments':
        return (
          <Card className="mb-4">
            <Card.Body>
              <Card.Title><FaMoneyBillWave className="me-2" />Payment Tracking</Card.Title>
              <PaymentsTable />
            </Card.Body>
          </Card>
        );
      case 'customers':
        return (
          <Card className="mb-4">
            <Card.Body>
              <Card.Title><FaUsers className="me-2" />Customer Management</Card.Title>
              <CustomersTable />
            </Card.Body>
          </Card>
        );
      case 'reports':
        return (
          <Card className="mb-4">
            <Card.Body>
              <Card.Title><FaChartBar className="me-2" />Basic Reporting</Card.Title>
              <ReportsTable />
            </Card.Body>
          </Card>
        );
      default:
        return null;
    }
  };

  return (
    <Container fluid className="mt-4">
      <Row>
        <Col md={2} className="mb-3">
          <Nav variant="pills" className="flex-column" activeKey={activeTab} onSelect={setActiveTab}>
            <Nav.Item>
              <Nav.Link eventKey="orders" className="d-flex align-items-center">
                <FaClipboardList className="me-2" /> Orders
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="payments" className="d-flex align-items-center">
                <FaMoneyBillWave className="me-2" /> Payments
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="customers" className="d-flex align-items-center">
                <FaUsers className="me-2" /> Customers
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="reports" className="d-flex align-items-center">
                <FaChartBar className="me-2" /> Reports
              </Nav.Link>
            </Nav.Item>
          </Nav>
        </Col>
        <Col md={10}>{renderTabContent()}</Col>
      </Row>
    </Container>
  );
};

export default AdminDashboard; 