import React, { useEffect, useRef, useState } from 'react';
import { Card, Button, Spinner, Alert, Row, Col, Badge, ListGroup } from 'react-bootstrap';
import { useNotify } from '../hooks/useNotify';
import { getMyTasks, getWorkerDashboard, workerAction } from '../components/api';

const WorkerDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const timerRef = useRef(null);
  const [elapsed, setElapsed] = useState(0);

  const { notifyError, notifySuccess } = useNotify();

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      // Use the proper worker dashboard endpoint that includes enhanced color/fabric data
      const d = await getWorkerDashboard();
      setData(d);
      const running = d?.active_task;
      const tt = d?.time_tracking || {};
      // Use server-provided total elapsed seconds for persistence across refresh/login
      if (running && (typeof tt.task_total_elapsed_seconds === 'number')) {
        setElapsed(tt.task_total_elapsed_seconds);
      } else if (running && (typeof tt.current_elapsed_seconds === 'number')) {
        setElapsed(tt.current_elapsed_seconds);
      } else { setElapsed(0); }
    } catch (e) {
      const msg = e?.message || 'Failed to load worker dashboard';
      setError(msg);
      notifyError(msg);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  // simple local ticker: increments elapsed locally while server persists real time
  useEffect(() => {
    if (data?.active_task && data?.time_tracking?.is_timer_running) {
      if (!timerRef.current) {
        timerRef.current = setInterval(() => setElapsed(prev => prev + 1), 1000);
      }
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
      setElapsed(0);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [data?.active_task, data?.time_tracking?.is_timer_running]);

  const fmtTime = (s) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${h}h ${m}m ${sec}s`;
  };

  const doAction = async (taskId, action, extra = {}) => {
    setSubmitting(true);
    try {
      await workerAction(taskId, action, extra);
      await load();
      notifySuccess(`Task ${action}ed`);
    } catch (e) {
      notifyError(e?.message || 'Action failed');
    } finally { setSubmitting(false); }
  };

  if (loading) return <div className="text-center py-5"><Spinner animation="border"/></div>;
  if (error) return <Alert variant="danger">{error}</Alert>;

  const summary = data?.task_summary || data?.summary || {};
  const assignedTasks = data?.assigned_tasks || [];
  const activeTasks = data?.active_tasks || [];
  const recentCompleted = data?.completed_tasks || [];
  const running = data?.active_task || null;

  return (
    <div className="worker-dashboard">
      <Row className="g-3 mb-3">
        <Col md={4}><Card><Card.Body className="text-center"><div className="text-muted">Assigned</div><div className="fs-3 fw-bold">{summary.assigned_count || 0}</div></Card.Body></Card></Col>
        <Col md={4}><Card><Card.Body className="text-center"><div className="text-muted">Active</div><div className="fs-3 fw-bold">{summary.active_count || 0}</div></Card.Body></Card></Col>
        <Col md={4}><Card><Card.Body className="text-center"><div className="text-muted">Completed Today</div><div className="fs-3 fw-bold">{summary.completed_today || 0}</div></Card.Body></Card></Col>
      </Row>

      <Row className="g-3">
        <Col md={6}>
          <Card className="border-warning">
            <Card.Header>Current Task</Card.Header>
            <Card.Body>
              {running ? (
                <div>
                  <div className="fw-semibold">{running.title}</div>
                  <div className="text-muted">Elapsed: {fmtTime(elapsed)}</div>
                  {running.order_item_details && (
                    <div className="mt-2">
                      <div className="small text-muted">
                        <strong>Product:</strong> {running.order_item_details.product_name}
                        {running.order_item_details.quantity && ` (Qty: ${running.order_item_details.quantity})`}
                      </div>
                      <div className="d-flex gap-2 mt-1">
                        {running.order_item_details.color_name && (
                          <Badge 
                            bg="light" 
                            text="dark" 
                            className="border"
                            style={{
                              backgroundColor: running.order_item_details.hex_color || '#f8f9fa',
                              color: running.order_item_details.hex_color ? '#000' : '#6c757d'
                            }}
                          >
                            {running.order_item_details.color_name}
                          </Badge>
                        )}
                        {running.order_item_details.fabric_name && (
                          <Badge bg="secondary" className="text-white">
                            {running.order_item_details.fabric_name}
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                  <div className="mt-3 d-flex gap-2">
                    <Button variant="warning" disabled={submitting} onClick={() => doAction(running.id, 'pause', { reason: 'Manual pause' })}>Pause</Button>
                    <Button variant="primary" disabled={submitting} onClick={() => doAction(running.id, 'complete', { completion_notes: '' })}>Complete</Button>
                    <Button variant="outline-danger" disabled={submitting} onClick={() => doAction(running.id, 'flag', { reason: 'Issue' })}>Flag</Button>
                  </div>
                </div>
              ) : <div className="text-muted">No current running task</div>}
            </Card.Body>
          </Card>
        </Col>
        <Col md={6}>
          <Card className="border-info">
            <Card.Header>Assigned Tasks</Card.Header>
            <ListGroup variant="flush">
              {assignedTasks.slice(0,5).map(t => (
                <ListGroup.Item key={t.id} className="d-flex justify-content-between align-items-start">
                  <div className="flex-grow-1">
                    <div className="fw-semibold">{t.title}</div>
                    <small className="text-muted">Due: {t.due_date ? new Date(t.due_date).toLocaleString() : '-'}</small>
                    {t.order_item_details && (
                      <div className="mt-1">
                        <div className="small text-muted">
                          {t.order_item_details.product_name}
                          {t.order_item_details.quantity && ` (Qty: ${t.order_item_details.quantity})`}
                        </div>
                        <div className="d-flex gap-1 mt-1">
                          {t.order_item_details.color_name && (
                            <Badge 
                              size="sm"
                              bg="light" 
                              text="dark" 
                              className="border"
                              style={{
                                backgroundColor: t.order_item_details.hex_color || '#f8f9fa',
                                color: t.order_item_details.hex_color ? '#000' : '#6c757d',
                                fontSize: '0.7rem'
                              }}
                            >
                              {t.order_item_details.color_name}
                            </Badge>
                          )}
                          {t.order_item_details.fabric_name && (
                            <Badge bg="secondary" className="text-white" style={{ fontSize: '0.7rem' }}>
                              {t.order_item_details.fabric_name}
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="d-flex gap-2 ms-2">
                    <Button size="sm" variant="success" disabled={submitting} onClick={() => doAction(t.id, 'start')}>Start</Button>
                    <Button size="sm" variant="outline-danger" disabled={submitting} onClick={() => doAction(t.id, 'flag', { reason: 'Issue' })}>Flag</Button>
                  </div>
                </ListGroup.Item>
              ))}
              {assignedTasks.length === 0 && <ListGroup.Item className="text-muted">No assigned tasks</ListGroup.Item>}
            </ListGroup>
          </Card>
        </Col>
      </Row>

      <Row className="g-3 mt-3">
        <Col md={6}>
          <Card>
            <Card.Header>Active Tasks</Card.Header>
            <ListGroup variant="flush">
              {activeTasks.slice(0,5).map(t => (
                <ListGroup.Item key={t.id} className="d-flex justify-content-between align-items-start">
                  <div className="flex-grow-1">
                    <div className="fw-semibold">{t.title}</div>
                    <small className="text-muted">Status: {t.status}</small>
                    {t.order_item_details && (
                      <div className="mt-1">
                        <div className="small text-muted">
                          {t.order_item_details.product_name}
                          {t.order_item_details.quantity && ` (Qty: ${t.order_item_details.quantity})`}
                        </div>
                        <div className="d-flex gap-1 mt-1">
                          {t.order_item_details.color_name && (
                            <Badge 
                              size="sm"
                              bg="light" 
                              text="dark" 
                              className="border"
                              style={{
                                backgroundColor: t.order_item_details.hex_color || '#f8f9fa',
                                color: t.order_item_details.hex_color ? '#000' : '#6c757d',
                                fontSize: '0.7rem'
                              }}
                            >
                              {t.order_item_details.color_name}
                            </Badge>
                          )}
                          {t.order_item_details.fabric_name && (
                            <Badge bg="secondary" className="text-white" style={{ fontSize: '0.7rem' }}>
                              {t.order_item_details.fabric_name}
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="d-flex gap-2 ms-2">
                    {t.status === 'paused' && <Button size="sm" variant="success" disabled={submitting} onClick={() => doAction(t.id, 'resume')}>Resume</Button>}
                    {t.status === 'started' && <Button size="sm" variant="warning" disabled={submitting} onClick={() => doAction(t.id, 'pause', { reason: 'Manual pause' })}>Pause</Button>}
                    <Button size="sm" variant="primary" disabled={submitting} onClick={() => doAction(t.id, 'complete', { completion_notes: '' })}>Complete</Button>
                  </div>
                </ListGroup.Item>
              ))}
              {activeTasks.length === 0 && <ListGroup.Item className="text-muted">No active tasks</ListGroup.Item>}
            </ListGroup>
          </Card>
        </Col>
        <Col md={6}>
          <Card>
            <Card.Header>Recently Completed</Card.Header>
            <ListGroup variant="flush">
              {recentCompleted.slice(0,5).map(t => (
                <ListGroup.Item key={t.id} className="d-flex justify-content-between align-items-start">
                  <div className="flex-grow-1">
                    <div className="fw-semibold">{t.title}</div>
                    <small className="text-muted">Completed</small>
                    {t.order_item_details && (
                      <div className="mt-1">
                        <div className="small text-muted">
                          {t.order_item_details.product_name}
                          {t.order_item_details.quantity && ` (Qty: ${t.order_item_details.quantity})`}
                        </div>
                        <div className="d-flex gap-1 mt-1">
                          {t.order_item_details.color_name && (
                            <Badge 
                              size="sm"
                              bg="light" 
                              text="dark" 
                              className="border"
                              style={{
                                backgroundColor: t.order_item_details.hex_color || '#f8f9fa',
                                color: t.order_item_details.hex_color ? '#000' : '#6c757d',
                                fontSize: '0.7rem'
                              }}
                            >
                              {t.order_item_details.color_name}
                            </Badge>
                          )}
                          {t.order_item_details.fabric_name && (
                            <Badge bg="secondary" className="text-white" style={{ fontSize: '0.7rem' }}>
                              {t.order_item_details.fabric_name}
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </ListGroup.Item>
              ))}
              {recentCompleted.length === 0 && <ListGroup.Item className="text-muted">No completed tasks</ListGroup.Item>}
            </ListGroup>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default WorkerDashboard;