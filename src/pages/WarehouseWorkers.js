import React, { useEffect, useMemo, useState } from 'react';
import { Button, Card, Table, Spinner, Alert, Form, Modal, InputGroup } from 'react-bootstrap';
import { FaUserPlus, FaTrash, FaEdit, FaSearch, FaHistory } from 'react-icons/fa';
import { getUsersQuery, createUser, updateUser, deleteUser, getTasksByWorker } from '../components/api';

const ROLE_OPTIONS = ['warehouse_worker', 'warehouse', 'delivery', 'admin', 'owner'];

function getAllowedCreateRoles(currentRole) {
  const role = currentRole === 'warehouse_manager' ? 'warehouse' : currentRole;
  if (role === 'owner') return ROLE_OPTIONS;
  if (role === 'admin') return ['warehouse', 'warehouse_worker', 'delivery'];
  if (role === 'warehouse') return ['warehouse_worker'];
  return [];
}

const WarehouseWorkers = ({ currentUser }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [users, setUsers] = useState([]);
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('warehouse_worker');

  const [showEdit, setShowEdit] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [form, setForm] = useState({ username: '', password: '', confirmPassword: '', role: 'warehouse_worker', first_name: '', last_name: '', email: '' });
  const [submitting, setSubmitting] = useState(false);

  const [showHistory, setShowHistory] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [taskHistory, setTaskHistory] = useState([]);

  const allowedRoles = useMemo(() => getAllowedCreateRoles(currentUser?.role), [currentUser]);

  const loadUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const roleParam = roleFilter === 'warehouse_manager' ? 'warehouse' : roleFilter;
      const data = await getUsersQuery(`role=${roleParam}`);
      const list = Array.isArray(data?.results) ? data.results : (Array.isArray(data) ? data : []);
      setUsers(list);
    } catch (e) {
      setError(e?.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadUsers(); }, [roleFilter]);

  const filteredUsers = users.filter(u => {
    const q = query.toLowerCase();
    return !q || `${u.username} ${u.first_name||''} ${u.last_name||''} ${u.email||''}`.toLowerCase().includes(q);
  });

  const openCreate = () => {
    setEditingUser(null);
    setForm({ username: '', password: '', confirmPassword: '', role: allowedRoles[0] || 'warehouse_worker', first_name: '', last_name: '', email: '' });
    setShowEdit(true);
  };

  const openEdit = (u) => {
    setEditingUser(u);
    setForm({ username: u.username, password: '', confirmPassword: '', role: u.role, first_name: u.first_name||'', last_name: u.last_name||'', email: u.email||'' });
    setShowEdit(true);
  };

  const handleDelete = async (u) => {
    if (!window.confirm(`Delete user ${u.username}?`)) return;
    try {
      await deleteUser(u.id);
      await loadUsers();
    } catch (e) {
      alert(e?.message || 'Failed to delete user');
    }
  };

  const handleSave = async () => {
    // Frontend confirm-password validation when setting/updating password
    if (!editingUser) {
      if (!form.password || form.password.length < 4) {
        alert('Password is required (min 4 chars)');
        return;
      }
      if (form.password !== form.confirmPassword) {
        alert('Passwords do not match');
        return;
      }
    } else if (form.password) {
      if (form.password !== form.confirmPassword) {
        alert('Passwords do not match');
        return;
      }
    }

    setSubmitting(true);
    try {
      if (editingUser) {
        const payload = { ...form };
        if (!payload.password) {
          delete payload.password;
        } else {
          payload.password_confirm = form.confirmPassword;
        }
        delete payload.confirmPassword;
        await updateUser(editingUser.id, payload);
      } else {
        const payload = { ...form };
        payload.password_confirm = form.confirmPassword;
        delete payload.confirmPassword;
        await createUser(payload);
      }
      setShowEdit(false);
      await loadUsers();
    } catch (e) {
      alert(e?.message || 'Save failed');
    } finally { setSubmitting(false); }
  };

  const openHistory = async (u) => {
    setShowHistory(true);
    setHistoryLoading(true);
    setTaskHistory([]);
    try {
      const data = await getTasksByWorker(u.id).catch(() => ({ results: [] }));
      const list = Array.isArray(data?.results) ? data.results : (Array.isArray(data) ? data : []);
      setTaskHistory(list);
    } catch { setTaskHistory([]); }
    finally { setHistoryLoading(false); }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 className="mb-0">Workers</h4>
        <div className="d-flex gap-2">
          <Form.Select size="sm" value={roleFilter} onChange={(e)=>setRoleFilter(e.target.value)}>
            <option value="warehouse_worker">Warehouse Workers</option>
            <option value="warehouse">Warehouse Staff (Managers)</option>
            <option value="delivery">Delivery Personnel</option>
          </Form.Select>
          {allowedRoles.length > 0 && (
            <Button onClick={openCreate} variant="primary"><FaUserPlus className="me-2"/>Add</Button>
          )}
        </div>
      </div>

      <Card className="mb-3">
        <Card.Body>
          <InputGroup>
            <InputGroup.Text><FaSearch/></InputGroup.Text>
            <Form.Control placeholder="Search workers..." value={query} onChange={(e)=>setQuery(e.target.value)} />
          </InputGroup>
        </Card.Body>
      </Card>

      {error && <Alert variant="danger" dismissible onClose={()=>setError('')}>{error}</Alert>}

      {loading ? (
        <div className="text-center py-5"><Spinner animation="border"/></div>
      ) : (
        <Card>
          <Table responsive hover className="mb-0">
            <thead>
              <tr>
                <th>Username</th>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th style={{width: 220}}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(u => (
                <tr key={u.id}>
                  <td>{u.username}</td>
                  <td>{u.first_name} {u.last_name}</td>
                  <td>{u.email}</td>
                  <td className="text-capitalize">{u.role?.replace('_',' ')}</td>
                  <td>
                    <Button size="sm" variant="outline-secondary" className="me-2" onClick={()=>openHistory(u)}><FaHistory className="me-1"/>History</Button>
                    {allowedRoles.includes(u.role) && (
                      <Button size="sm" variant="outline-primary" className="me-2" onClick={()=>openEdit(u)}><FaEdit className="me-1"/>Edit</Button>
                    )}
                    {allowedRoles.includes(u.role) && (
                      <Button size="sm" variant="outline-danger" onClick={()=>handleDelete(u)}><FaTrash className="me-1"/>Delete</Button>
                    )}
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr><td colSpan={5} className="text-center text-muted py-4">No users found</td></tr>
              )}
            </tbody>
          </Table>
        </Card>
      )}

      {/* Create/Edit Modal */}
      <Modal show={showEdit} onHide={()=>setShowEdit(false)}>
        <Modal.Header closeButton><Modal.Title>{editingUser ? 'Edit User' : 'Create User'}</Modal.Title></Modal.Header>
        <Modal.Body>
          <Form>
            <div className="mb-3">
              <Form.Label>Username</Form.Label>
              <Form.Control value={form.username} onChange={(e)=>setForm({...form, username: e.target.value})} />
            </div>
            <div className="mb-3">
              <Form.Label>Password {editingUser ? '(leave blank to keep)' : ''}</Form.Label>
              <Form.Control type="password" value={form.password} onChange={(e)=>setForm({...form, password: e.target.value})} />
            </div>
            <div className="mb-3">
              <Form.Label>Confirm Password {editingUser ? '(leave blank if unchanged)' : ''}</Form.Label>
              <Form.Control type="password" value={form.confirmPassword} onChange={(e)=>setForm({...form, confirmPassword: e.target.value})} />
            </div>
            <div className="mb-3">
              <Form.Label>First Name</Form.Label>
              <Form.Control value={form.first_name} onChange={(e)=>setForm({...form, first_name: e.target.value})} />
            </div>
            <div className="mb-3">
              <Form.Label>Last Name</Form.Label>
              <Form.Control value={form.last_name} onChange={(e)=>setForm({...form, last_name: e.target.value})} />
            </div>
            <div className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control type="email" value={form.email} onChange={(e)=>setForm({...form, email: e.target.value})} />
            </div>
            <div className="mb-2">
              <Form.Label>Role</Form.Label>
              <Form.Select value={form.role} onChange={(e)=>setForm({...form, role: e.target.value})}>
                {allowedRoles.map(r => <option key={r} value={r}>{r.replace('_',' ')}</option>)}
              </Form.Select>
            </div>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={()=>setShowEdit(false)}>Cancel</Button>
          <Button variant="primary" disabled={submitting} onClick={handleSave}>{submitting ? 'Saving...' : 'Save'}</Button>
        </Modal.Footer>
      </Modal>

      {/* Task History Modal */}
      <Modal show={showHistory} onHide={()=>setShowHistory(false)} size="lg">
        <Modal.Header closeButton><Modal.Title>Task History</Modal.Title></Modal.Header>
        <Modal.Body>
          {historyLoading ? (
            <div className="text-center py-5"><Spinner animation="border"/></div>
          ) : (
            <Table responsive hover>
              <thead>
                <tr>
                  <th>Task</th>
                  <th>Status</th>
                  <th>Order</th>
                  <th>Updated</th>
                </tr>
              </thead>
              <tbody>
                {taskHistory.map(t => (
                  <tr key={t.id}>
                    <td>{t.title || t.name || `Task ${t.id}`}</td>
                    <td>{t.status}</td>
                    <td>{t.order_number || t.order || '-'}</td>
                    <td>{new Date(t.updated_at || t.modified || Date.now()).toLocaleString()}</td>
                  </tr>
                ))}
                {taskHistory.length === 0 && <tr><td colSpan={4} className="text-center text-muted py-4">No history</td></tr>}
              </tbody>
            </Table>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={()=>setShowHistory(false)}>Close</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default WarehouseWorkers;