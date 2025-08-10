import React, { useEffect, useState } from 'react';
import { Card, Table, Button, Spinner, Alert, Badge } from 'react-bootstrap';
import { getPendingApprovalTasks, managerAction } from '../components/api';

const ApprovalQueue = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [tasks, setTasks] = useState([]);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const list = await getPendingApprovalTasks();
      setTasks(list);
    } catch (e) { setError(e?.message || 'Failed to load approvals'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const doApprove = async (taskId) => {
    try { await managerAction(taskId, 'approve'); setSuccess('Task approved'); load(); } catch (e) { setError(e?.message || 'Failed to approve'); }
  };
  const doReject = async (taskId) => {
    const reason = window.prompt('Rejection reason (optional):') || '';
    try { await managerAction(taskId, 'reject', { reason }); setSuccess('Task rejected'); load(); } catch (e) { setError(e?.message || 'Failed to reject'); }
  };

  if (loading) return <div className="text-center py-5"><Spinner animation="border"/></div>;

  return (
    <div>
      {error && <Alert variant="danger" onClose={()=>setError('')} dismissible>{error}</Alert>}
      {success && <Alert variant="success" onClose={()=>setSuccess('')} dismissible>{success}</Alert>}

      <Card>
        <Card.Header className="d-flex justify-content-between align-items-center">
          <span>Tasks Pending Approval</span>
          <Badge bg={tasks.length ? 'warning' : 'secondary'}>{tasks.length}</Badge>
        </Card.Header>
        <Card.Body className="p-0">
          <Table responsive hover className="mb-0">
            <thead>
              <tr>
                <th>Task</th>
                <th>Worker</th>
                <th>Order</th>
                <th>Completed</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map(t => (
                <tr key={t.id}>
                  <td>{t.title}</td>
                  <td>{t.assigned_worker_name || '-'}</td>
                  <td>{t.order_number || '-'}</td>
                  <td>{t.completed_at ? new Date(t.completed_at).toLocaleString() : '-'}</td>
                  <td className="text-end">
                    <Button size="sm" variant="outline-success" className="me-2" onClick={()=>doApprove(t.id)}>Approve</Button>
                    <Button size="sm" variant="outline-danger" onClick={()=>doReject(t.id)}>Reject</Button>
                  </td>
                </tr>
              ))}
              {tasks.length === 0 && <tr><td colSpan={5} className="text-center text-muted py-4">No tasks pending approval</td></tr>}
            </tbody>
          </Table>
        </Card.Body>
      </Card>
    </div>
  );
};

export default ApprovalQueue;