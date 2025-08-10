import React, { useEffect, useState } from 'react';
import { Card, Button, Spinner, Alert, Row, Col, Badge } from 'react-bootstrap';
import { getWorkerDashboard, quickStartNextTask, quickPauseActiveTask, quickCompleteActiveTask } from '../components/api';

const WorkerDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const d = await getWorkerDashboard();
      setData(d);
    } catch (e) {
      setError(e?.message || 'Failed to load worker dashboard');
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); const i = setInterval(load, 15000); return () => clearInterval(i); }, []);

  const handleStartNext = async () => {
    setSubmitting(true);
    try { await quickStartNextTask(); await load(); } catch (e) { alert(e?.message || 'Failed'); } finally { setSubmitting(false); }
  };
  const handlePause = async () => {
    setSubmitting(true);
    try { await quickPauseActiveTask({ reason: 'Manual pause' }); await load(); } catch (e) { alert(e?.message || 'Failed'); } finally { setSubmitting(false); }
  };
  const handleComplete = async () => {
    setSubmitting(true);
    const notes = window.prompt('Completion notes (optional):') || '';
    try { await quickCompleteActiveTask({ completion_notes: notes }); await load(); } catch (e) { alert(e?.message || 'Failed'); } finally { setSubmitting(false); }
  };

  if (loading) return <div className="text-center py-5"><Spinner animation="border"/></div>;
  if (error) return <Alert variant="danger">{error}</Alert>;

  const info = data?.worker_info || {};
  const summary = data?.task_summary || {};
  const active = data?.active_task || null;
  const nextTask = data?.next_task || null;
  const quick = data?.quick_actions || {};

  return (
    <div className="worker-dashboard">
      <Row className="g-3">
        <Col md={6}>
          <Card>
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h5 className="mb-1">Welcome, {info.name || info.username || 'Worker'}</h5>
                  <div className="text-muted">Role: {info.role}</div>
                </div>
                <Badge bg="primary">ID: {info.employee_id || '-'}</Badge>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={6}>
          <Row className="g-3">
            <Col xs={6}><Card><Card.Body className="text-center"><div className="text-muted">Total</div><div className="fs-3 fw-bold">{summary.total_tasks||0}</div></Card.Body></Card></Col>
            <Col xs={6}><Card><Card.Body className="text-center"><div className="text-muted">In Progress</div><div className="fs-3 fw-bold">{summary.in_progress||0}</div></Card.Body></Card></Col>
          </Row>
        </Col>
        <Col md={6}><Card className="border-warning"><Card.Body>
          <h6 className="mb-2">Current Task</h6>
          {active ? (
            <div>
              <div className="fw-semibold">{active.title} <Badge bg="warning" className="text-dark ms-2">{active.priority}</Badge></div>
              <div className="text-muted">Order: {active.order_number}</div>
              <div className="mt-3 d-flex gap-2">
                {quick.can_pause && <Button variant="warning" onClick={handlePause} disabled={submitting}>Pause</Button>}
                {quick.can_complete_active || quick.can_complete ? (
                  <Button variant="primary" onClick={handleComplete} disabled={submitting}>Complete</Button>
                ) : null}
              </div>
            </div>
          ) : <div className="text-muted">No active task</div>}
        </Card.Body></Card></Col>
        <Col md={6}><Card className="border-info"><Card.Body>
          <h6 className="mb-2">Next Task</h6>
          {nextTask ? (
            <div>
              <div className="fw-semibold">{nextTask.title} <Badge bg="info" className="ms-2">{nextTask.priority}</Badge></div>
              <div className="text-muted">Order: {nextTask.order_number}</div>
              <div className="mt-3">
                {quick.can_start_task && <Button variant="success" onClick={handleStartNext} disabled={submitting}>Start Next Task</Button>}
              </div>
            </div>
          ) : <div className="text-muted">No next task assigned</div>}
        </Card.Body></Card></Col>
      </Row>
    </div>
  );
};

export default WorkerDashboard;