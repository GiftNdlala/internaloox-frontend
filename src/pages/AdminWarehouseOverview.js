import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Spinner, Alert, Button, ListGroup } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { getAdminWarehouseOverview } from '../components/api';
import SharedHeader from '../components/SharedHeader';
import UniversalSidebar from '../components/UniversalSidebar';

const StatCard = ({ title, value, color = 'primary' }) => (
  <Card className="h-100 shadow-sm">
    <Card.Body className="text-center">
      <div className={`text-${color} fs-3 fw-bold`}>{value}</div>
      <div className="text-muted">{title}</div>
    </Card.Body>
  </Card>
);

const AdminWarehouseOverview = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await getAdminWarehouseOverview();
        setData(res);
      } catch (e) { setError(e?.message || 'Failed to load overview'); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  if (loading) return <div className="text-center py-5"><Spinner animation="border"/></div>;
  if (error) return <Alert variant="danger">{error}</Alert>;

  const p = data?.production_pipeline || {};
  const t = data?.task_overview || {};
  const wf = data?.workforce_summary || {};
  const navMsg = data?.navigation_message || {};

  return (
    <>
      <UniversalSidebar user={user} userRole="admin" onLogout={onLogout} />
      <div className="main-content">
        <SharedHeader user={user} onLogout={onLogout} dashboardType="admin" />
        <div className="p-3">
          <Row className="g-3 mb-3">
            <Col md={2}><StatCard title="Cutting" value={p.cutting ?? 0} color="primary"/></Col>
            <Col md={2}><StatCard title="Sewing" value={p.sewing ?? 0} color="info"/></Col>
            <Col md={2}><StatCard title="Finishing" value={p.finishing ?? 0} color="warning"/></Col>
            <Col md={2}><StatCard title="Quality" value={p.quality_check ?? 0} color="secondary"/></Col>
            <Col md={2}><StatCard title="Completed" value={p.completed ?? 0} color="success"/></Col>
            <Col md={2}><StatCard title="In Prod" value={p.total_in_production ?? 0} color="dark"/></Col>
          </Row>
          <Row className="g-3 mb-3">
            <Col md={3}><StatCard title="Active Tasks" value={t.total_active_tasks ?? 0} color="primary"/></Col>
            <Col md={3}><StatCard title="Pending" value={t.pending_tasks ?? 0} color="secondary"/></Col>
            <Col md={3}><StatCard title="In Progress" value={t.in_progress_tasks ?? 0} color="info"/></Col>
            <Col md={3}><StatCard title="Paused" value={t.paused_tasks ?? 0} color="warning"/></Col>
          </Row>
          <Row className="g-3 mb-3">
            <Col md={3}><StatCard title="Workers" value={wf.total_workers ?? 0} color="dark"/></Col>
            <Col md={3}><StatCard title="Managers" value={wf.managers ?? 0} color="secondary"/></Col>
            <Col md={3}><StatCard title="Workers" value={wf.workers ?? 0} color="primary"/></Col>
            <Col md={3}><StatCard title="Active" value={wf.active_workers ?? 0} color="success"/></Col>
          </Row>
          <Card className="mb-3">
            <Card.Header>Warehouse Bottlenecks</Card.Header>
            <ListGroup variant="flush">
              {(data?.bottleneck_analysis || []).map((b, idx) => (
                <ListGroup.Item key={idx}>{b}</ListGroup.Item>
              ))}
              {(!data?.bottleneck_analysis || data.bottleneck_analysis.length === 0) && (
                <ListGroup.Item className="text-muted">No bottlenecks</ListGroup.Item>
              )}
            </ListGroup>
          </Card>
          <Card className="border-success">
            <Card.Body className="d-flex justify-content-between align-items-center">
              <div>
                <div className="fw-bold">{navMsg.title || 'Warehouse Operations'}</div>
                <div className="text-muted">{navMsg.description || 'Use the Warehouse Dashboard for operations.'}</div>
              </div>
              <Button variant="success" onClick={() => navigate(navMsg.action_url || '/warehouse')}>
                {navMsg.action_text || 'Go to Warehouse Dashboard'}
              </Button>
            </Card.Body>
          </Card>
        </div>
      </div>
    </>
  );
};

export default AdminWarehouseOverview;