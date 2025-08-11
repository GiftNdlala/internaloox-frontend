import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Spinner, Alert, Badge, Button, ListGroup, Modal, Form } from 'react-bootstrap';
import { getWorkflowDashboard, getOrderManagementData, advanceOrderWorkflow, assignOrder } from '../components/api';
import SharedHeader from '../components/SharedHeader';
import UniversalSidebar from '../components/UniversalSidebar';

const StageColumn = ({ title, count, orders, onAdvance }) => (
  <Card className="h-100">
    <Card.Header className="d-flex justify-content-between align-items-center">
      <span>{title}</span>
      <Badge bg="secondary">{count || 0}</Badge>
    </Card.Header>
    <ListGroup variant="flush">
      {(orders || []).map(o => (
        <ListGroup.Item key={o.id} className="d-flex justify-content-between align-items-center">
          <div>
            <div className="fw-semibold">{o.order_number}</div>
            <small className="text-muted">{o.customer_name}</small>
          </div>
          {onAdvance && <Button size="sm" variant="outline-primary" onClick={() => onAdvance(o.id)}>Advance</Button>}
        </ListGroup.Item>
      ))}
      {(!orders || orders.length === 0) && <ListGroup.Item className="text-muted">None</ListGroup.Item>}
    </ListGroup>
  </Card>
);

const OrdersWorkflowDashboard = ({ user, onLogout, userRole = 'owner' }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState(null);
  const [assignShow, setAssignShow] = useState(false);
  const [assignOrderId, setAssignOrderId] = useState(null);
  const [assignType, setAssignType] = useState('warehouse');
  const [assignUserId, setAssignUserId] = useState('');
  const [assignOptions, setAssignOptions] = useState({ warehouse_users: [], delivery_users: [] });

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const dash = await getWorkflowDashboard();
      setData(dash);
      const mgmt = await getOrderManagementData().catch(()=>null);
      if (mgmt?.assignment_options) setAssignOptions(mgmt.assignment_options);
    } catch (e) { setError(e?.message || 'Failed to load workflow dashboard'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const onAdvance = async (orderId) => {
    try { await advanceOrderWorkflow(orderId); await load(); } catch (e) { setError(e?.message || 'Advance failed'); }
  };

  const openAssign = (orderId, type) => { setAssignOrderId(orderId); setAssignType(type); setAssignShow(true); };
  const doAssign = async () => {
    try { await assignOrder(assignOrderId, assignType, Number(assignUserId)); setAssignShow(false); await load(); } catch (e) { setError(e?.message || 'Assign failed'); }
  };

  if (loading) return <div className="text-center py-5"><Spinner animation="border"/></div>;
  if (error) return <Alert variant="danger" onClose={()=>setError('')} dismissible>{error}</Alert>;

  const stages = data?.workflow_stages || {};

  const content = (
    <div className="p-3">
      <Row className="g-3">
        <Col md={4}><StageColumn title="New" count={stages.new_orders?.count} orders={stages.new_orders?.orders} onAdvance={onAdvance} /></Col>
        <Col md={4}><StageColumn title="Paid" count={stages.paid_orders?.count} orders={stages.paid_orders?.orders} onAdvance={onAdvance} /></Col>
        <Col md={4}><StageColumn title="In Production" count={stages.in_production?.count} orders={stages.in_production?.orders} onAdvance={onAdvance} /></Col>
      </Row>
      <Row className="g-3 mt-3">
        <Col md={4}><StageColumn title="Ready for Delivery" count={stages.ready_for_delivery?.count} orders={stages.ready_for_delivery?.orders} onAdvance={onAdvance} /></Col>
        <Col md={4}><StageColumn title="Out for Delivery" count={stages.out_for_delivery?.count} orders={stages.out_for_delivery?.orders} onAdvance={onAdvance} /></Col>
        <Col md={4}><StageColumn title="Completed" count={stages.completed?.count} orders={stages.completed?.orders} /></Col>
      </Row>

      <Modal show={assignShow} onHide={()=>setAssignShow(false)}>
        <Modal.Header closeButton><Modal.Title>Assign Order</Modal.Title></Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Assignment Type</Form.Label>
              <Form.Select value={assignType} onChange={(e)=>setAssignType(e.target.value)}>
                <option value="warehouse">Warehouse</option>
                <option value="delivery">Delivery</option>
              </Form.Select>
            </Form.Group>
            <Form.Group>
              <Form.Label>Assign To</Form.Label>
              <Form.Select value={assignUserId} onChange={(e)=>setAssignUserId(e.target.value)}>
                <option value="">Select user...</option>
                {(assignType === 'warehouse' ? assignOptions.warehouse_users : assignOptions.delivery_users).map(u => (
                  <option key={u.id} value={u.id}>{u.first_name} {u.last_name} ({u.role})</option>
                ))}
              </Form.Select>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={()=>setAssignShow(false)}>Cancel</Button>
          <Button variant="primary" disabled={!assignUserId} onClick={doAssign}>Assign</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
  return (
    <>
      <UniversalSidebar user={user} userRole={userRole} onLogout={onLogout} />
      <div className="main-content">
        <SharedHeader user={user} onLogout={onLogout} dashboardType={userRole} />
        {content}
      </div>
    </>
  );
};

export default OrdersWorkflowDashboard;