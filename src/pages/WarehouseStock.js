import React from 'react';
import { Card, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { FaBoxes, FaWarehouse, FaPlus } from 'react-icons/fa';

const WarehouseStock = () => {
  const navigate = useNavigate();
  return (
    <div>
      <h4 className="mb-4">Stock Management</h4>
      <div className="d-flex flex-wrap gap-3">
        <Card style={{ minWidth: 280 }}>
          <Card.Body>
            <h5><FaBoxes className="me-2 text-primary" />Materials</h5>
            <p className="text-muted">Manage materials catalog, suppliers and inventory thresholds.</p>
            <Button variant="primary" onClick={() => navigate('/warehouse/inventory/materials')}>Open Materials</Button>
          </Card.Body>
        </Card>
        <Card style={{ minWidth: 280 }}>
          <Card.Body>
            <h5><FaWarehouse className="me-2 text-warning" />Stock In-House</h5>
            <p className="text-muted">Update and track stock levels at locations.</p>
            <Button variant="warning" onClick={() => navigate('/warehouse/inventory/stock-in-house')}>Open Stock In-House</Button>
          </Card.Body>
        </Card>
        <Card style={{ minWidth: 280 }}>
          <Card.Body>
            <h5><FaPlus className="me-2 text-success" />Quick Stock Entry</h5>
            <p className="text-muted">Add stock quickly from the dashboard.</p>
            <Button variant="success" onClick={() => navigate('/warehouse')}>Go to Dashboard</Button>
          </Card.Body>
        </Card>
      </div>
    </div>
  );
};

export default WarehouseStock;