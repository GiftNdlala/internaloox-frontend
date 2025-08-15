import React from 'react';
import { Card, Button, Row, Col, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { FaBoxes, FaWarehouse, FaPlus, FaExchangeAlt, FaChartLine, FaExclamationTriangle } from 'react-icons/fa';

const WarehouseStock = () => {
  const navigate = useNavigate();
  
  return (
    <div style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
      <div className="p-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h4 className="mb-0">
            <FaBoxes className="me-2 text-primary" />
            Stock Management
          </h4>
        </div>

        <Alert variant="info" className="mb-4">
          <FaExclamationTriangle className="me-2" />
          <strong>Stock Management Hub:</strong> Choose from the options below to manage your warehouse inventory and stock movements.
        </Alert>

        <Row className="g-4">
          <Col lg={4} md={6}>
            <Card className="h-100 shadow-sm">
              <Card.Body className="d-flex flex-column">
                <div className="text-center mb-3">
                  <FaBoxes className="text-primary" size={48} />
                </div>
                <h5 className="text-center mb-3">Materials Management</h5>
                <p className="text-muted text-center flex-grow-1">
                  Manage materials catalog, suppliers, and inventory thresholds. Add new materials, update specifications, and set minimum stock levels.
                </p>
                <Button 
                  variant="primary" 
                  className="w-100"
                  onClick={() => navigate('/warehouse/inventory/materials')}
                >
                  <FaBoxes className="me-2" />
                  Open Materials
                </Button>
              </Card.Body>
            </Card>
          </Col>

          <Col lg={4} md={6}>
            <Card className="h-100 shadow-sm">
              <Card.Body className="d-flex flex-column">
                <div className="text-center mb-3">
                  <FaExchangeAlt className="text-warning" size={48} />
                </div>
                <h5 className="text-center mb-3">Stock In-House</h5>
                <p className="text-muted text-center flex-grow-1">
                  Record stock movements, track inventory levels, and manage stock coming in and out of the warehouse.
                </p>
                <Button 
                  variant="warning" 
                  className="w-100"
                  onClick={() => navigate('/warehouse/inventory/stock-in-house')}
                >
                  <FaExchangeAlt className="me-2" />
                  Manage Stock Movements
                </Button>
              </Card.Body>
            </Card>
          </Col>

          <Col lg={4} md={6}>
            <Card className="h-100 shadow-sm">
              <Card.Body className="d-flex flex-column">
                <div className="text-center mb-3">
                  <FaPlus className="text-success" size={48} />
                </div>
                <h5 className="text-center mb-3">Quick Stock Entry</h5>
                <p className="text-muted text-center flex-grow-1">
                  Add stock quickly from the dashboard. Fast entry for common materials and bulk stock updates.
                </p>
                <Button 
                  variant="success" 
                  className="w-100"
                  onClick={() => navigate('/warehouse')}
                >
                  <FaPlus className="me-2" />
                  Quick Entry
                </Button>
              </Card.Body>
            </Card>
          </Col>

          <Col lg={4} md={6}>
            <Card className="h-100 shadow-sm">
              <Card.Body className="d-flex flex-column">
                <div className="text-center mb-3">
                  <FaChartLine className="text-info" size={48} />
                </div>
                <h5 className="text-center mb-3">Stock Analytics</h5>
                <p className="text-muted text-center flex-grow-1">
                  View stock analytics, low stock alerts, and inventory reports. Monitor stock trends and performance.
                </p>
                <Button 
                  variant="info" 
                  className="w-100"
                  onClick={() => navigate('/warehouse/analytics')}
                >
                  <FaChartLine className="me-2" />
                  View Analytics
                </Button>
              </Card.Body>
            </Card>
          </Col>

          <Col lg={4} md={6}>
            <Card className="h-100 shadow-sm">
              <Card.Body className="d-flex flex-column">
                <div className="text-center mb-3">
                  <FaWarehouse className="text-secondary" size={48} />
                </div>
                <h5 className="text-center mb-3">Warehouse Dashboard</h5>
                <p className="text-muted text-center flex-grow-1">
                  Return to the main warehouse dashboard for an overview of all operations and quick access to key functions.
                </p>
                <Button 
                  variant="secondary" 
                  className="w-100"
                  onClick={() => navigate('/warehouse')}
                >
                  <FaWarehouse className="me-2" />
                  Go to Dashboard
                </Button>
          </Card.Body>
        </Card>
          </Col>

          <Col lg={4} md={6}>
            <Card className="h-100 shadow-sm">
              <Card.Body className="d-flex flex-column">
                <div className="text-center mb-3">
                  <FaExclamationTriangle className="text-danger" size={48} />
                </div>
                <h5 className="text-center mb-3">Low Stock Alerts</h5>
                <p className="text-muted text-center flex-grow-1">
                  View and manage low stock alerts. Get notified when materials are running low and need restocking.
                </p>
                <Button 
                  variant="outline-danger" 
                  className="w-100"
                  onClick={() => navigate('/warehouse/inventory/materials')}
                >
                  <FaExclamationTriangle className="me-2" />
                  View Alerts
                </Button>
          </Card.Body>
        </Card>
          </Col>
        </Row>

        <div className="mt-5">
          <Card className="shadow-sm">
            <Card.Header>
              <h5 className="mb-0">Quick Actions</h5>
            </Card.Header>
          <Card.Body>
              <Row className="g-3">
                <Col md={3}>
                  <Button 
                    variant="outline-primary" 
                    className="w-100"
                    onClick={() => navigate('/warehouse/inventory/stock-in-house')}
                  >
                    <FaExchangeAlt className="me-2" />
                    Record Stock Movement
                  </Button>
                </Col>
                <Col md={3}>
                  <Button 
                    variant="outline-success" 
                    className="w-100"
                    onClick={() => navigate('/warehouse/inventory/materials')}
                  >
                    <FaPlus className="me-2" />
                    Add New Material
                  </Button>
                </Col>
                <Col md={3}>
                  <Button 
                    variant="outline-warning" 
                    className="w-100"
                    onClick={() => navigate('/warehouse/analytics')}
                  >
                    <FaChartLine className="me-2" />
                    View Reports
                  </Button>
                </Col>
                <Col md={3}>
                  <Button 
                    variant="outline-info" 
                    className="w-100"
                    onClick={() => navigate('/warehouse')}
                  >
                    <FaWarehouse className="me-2" />
                    Dashboard Overview
                  </Button>
                </Col>
              </Row>
          </Card.Body>
        </Card>
        </div>
      </div>
    </div>
  );
};

export default WarehouseStock;