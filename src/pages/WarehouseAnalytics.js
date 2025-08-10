import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Spinner, Alert, Table, Badge, Button } from 'react-bootstrap';
import { 
  getWarehouseDashboard,
  getLowStockAlerts,
  getWarehouseOrders,
  getTasksByStatus
} from '../components/api';

const StatCard = ({ title, value, variant = 'primary', footer }) => (
  <Card className={`border-${variant}`}>
    <Card.Body>
      <div className="text-muted small mb-1">{title}</div>
      <div className="fs-3 fw-bold">{value}</div>
      {footer && <div className="text-muted small mt-2">{footer}</div>}
    </Card.Body>
  </Card>
);

const WarehouseAnalytics = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [inventory, setInventory] = useState({ total_materials: 0, in_stock: 0 });
  const [lowStock, setLowStock] = useState([]);
  const [orders, setOrders] = useState([]);
  const [taskCounts, setTaskCounts] = useState({ assigned: 0, started: 0, completed: 0 });

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [inv, low, ord] = await Promise.all([
        getWarehouseDashboard(),
        getLowStockAlerts(),
        getWarehouseOrders()
      ]);
      setInventory(inv || { total_materials: 0, in_stock: 0 });
      setLowStock(low?.alerts || []);
      const ordList = Array.isArray(ord?.orders) ? ord.orders : (Array.isArray(ord) ? ord : []);
      setOrders(ordList);

      const [assigned, started, completed] = await Promise.all([
        getTasksByStatus('assigned').catch(() => []),
        getTasksByStatus('started').catch(() => []),
        getTasksByStatus('completed').catch(() => [])
      ]);
      const count = (res) => Array.isArray(res?.results) ? res.results.length : (Array.isArray(res) ? res.length : 0);
      setTaskCounts({ assigned: count(assigned), started: count(started), completed: count(completed) });
    } catch (e) {
      setError(e?.message || 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (loading) return <div className="text-center py-5"><Spinner animation="border"/></div>;
  if (error) return <Alert variant="danger" onClose={()=>setError('')} dismissible>{error}</Alert>;

  const readyOrders = orders.filter(o => o.production_status === 'ready_for_delivery').length;
  const inProduction = orders.filter(o => o.production_status === 'in_production').length;

  return (
    <div>
      <Row className="g-3 mb-3">
        <Col md={3}><StatCard title="Total Materials" value={inventory.total_materials || 0} variant="primary" /></Col>
        <Col md={3}><StatCard title="Materials In Stock" value={inventory.in_stock || 0} variant="success" /></Col>
        <Col md={3}><StatCard title="Low Stock Items" value={lowStock.length} variant="warning" /></Col>
        <Col md={3}><StatCard title="Orders In Production" value={inProduction} variant="info" /></Col>
      </Row>
      <Row className="g-3 mb-4">
        <Col md={4}><StatCard title="Tasks Assigned" value={taskCounts.assigned} variant="secondary" /></Col>
        <Col md={4}><StatCard title="Tasks In Progress" value={taskCounts.started} variant="warning" /></Col>
        <Col md={4}><StatCard title="Tasks Completed Today" value={taskCounts.completed} variant="success" /></Col>
      </Row>

      <Row className="g-3">
        <Col md={6}>
          <Card>
            <Card.Header className="d-flex justify-content-between align-items-center">
              <span>Low Stock Alerts</span>
              <Badge bg={lowStock.length > 0 ? 'warning' : 'secondary'}>{lowStock.length}</Badge>
            </Card.Header>
            <Card.Body className="p-0">
              <Table responsive hover className="mb-0">
                <thead>
                  <tr>
                    <th>Material</th>
                    <th>Current</th>
                    <th>Threshold</th>
                  </tr>
                </thead>
                <tbody>
                  {lowStock.slice(0, 8).map(a => (
                    <tr key={a.id}>
                      <td>{a.material_name}</td>
                      <td>{a.current_stock} {a.unit}</td>
                      <td>{a.threshold}</td>
                    </tr>
                  ))}
                  {lowStock.length === 0 && (
                    <tr><td colSpan={3} className="text-center text-muted py-3">No low stock alerts</td></tr>
                  )}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>
        <Col md={6}>
          <Card>
            <Card.Header className="d-flex justify-content-between align-items-center">
              <span>Orders Snapshot</span>
              <Badge bg="success">Ready: {readyOrders}</Badge>
            </Card.Header>
            <Card.Body className="p-0">
              <Table responsive hover className="mb-0">
                <thead>
                  <tr>
                    <th>Order #</th>
                    <th>Customer</th>
                    <th>Production</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.slice(0, 8).map(o => (
                    <tr key={o.id}>
                      <td>{o.order_number}</td>
                      <td>{o.customer_name}</td>
                      <td>
                        <Badge bg={
                          o.production_status === 'ready_for_delivery' ? 'success' :
                          o.production_status === 'in_production' ? 'warning' : 'secondary'
                        }>{o.production_status}</Badge>
                      </td>
                    </tr>
                  ))}
                  {orders.length === 0 && (
                    <tr><td colSpan={3} className="text-center text-muted py-3">No orders</td></tr>
                  )}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default WarehouseAnalytics;