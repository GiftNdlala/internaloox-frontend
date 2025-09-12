import React, { useState, useEffect } from 'react';
import { 
  Container, Row, Col, Card, Button, Badge, Alert, 
  Modal, Form, Table, Tabs, Tab, Spinner, InputGroup,
  Dropdown, ProgressBar, Accordion
} from 'react-bootstrap';
import { 
  FaTasks, FaPlus, FaSearch, FaFilter, FaEye, FaEdit,
  FaTrash, FaUser, FaClock, FaCalendarAlt, FaExclamationTriangle,
  FaCheck, FaPlay, FaPause, FaStop, FaClipboardList, FaBox,
  FaUsers, FaSortAmountDown, FaSortAmountUp, FaSync
} from 'react-icons/fa';
import { usePolling } from '../../hooks/usePolling';
import { 
  getWarehouseOrders, getTaskTypes, getUsersQuery, getWarehouseWorkersList, createTaskInOrder,
  updateTask, deleteTask, getTasksByStatus, assignWorkerToTask,
  getTaskTemplates, bulkAssignTasks, getOrderDetailsForTasks, getProductionReadyOrders
} from '../api';
import { confirmDelete } from '../../utils/confirm';
import { useNotify } from '../../hooks/useNotify';

const TaskManagement = ({ user }) => {
  // State Management
  const [activeTab, setActiveTab] = useState('orders');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // Data State
  const [orders, setOrders] = useState([]);
  const [allTasks, setAllTasks] = useState([]);
  const [taskTypes, setTaskTypes] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [orderItems, setOrderItems] = useState([]);
  
  // UI State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [workerFilter, setWorkerFilter] = useState('all');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  
  // Modal State
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [showEditTask, setShowEditTask] = useState(false);
  const [showBulkAssign, setShowBulkAssign] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [selectedTasks, setSelectedTasks] = useState([]);

  // Form State
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    task_type_name: '',
    assigned_worker: '',
    priority: 'medium',
    estimated_duration: 60,
    deadline: '',
    materials_needed: [],
    instructions: '',
    template_id: null,
    order_item_id: ''
  });

  const FALLBACK_TASK_TYPES = [
    'Material Preparation',
    'Cutting',
    'Frame Assembly',
    'Foam Installation',
    'Upholstery',
    'Finishing',
    'Quality Check',
    'Packaging',
    'Maintenance',
    'Stock Management'
  ];

  // Load data with polling
  const { data: ordersData, refresh: refreshOrders } = usePolling(
    // Prefer production-ready list if backend supports it; fallback to warehouseOrders
    async () => {
      try {
        const ready = await getProductionReadyOrders();
        return { orders: (ready?.results || ready || []).map(o => o) };
      } catch {
        return await getWarehouseOrders();
      }
    },
    30000
  );

  const { data: tasksData, refresh: refreshTasks } = usePolling(
    () => getTasksByStatus(),
    15000
  );

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (ordersData) setOrders(ordersData.orders || []);
  }, [ordersData]);

  useEffect(() => {
    if (!tasksData) return;
    const normalized = (Array.isArray(tasksData) && tasksData)
      || (Array.isArray(tasksData?.results) && tasksData.results)
      || (Array.isArray(tasksData?.tasks) && tasksData.tasks)
      || [];
    setAllTasks(normalized);
  }, [tasksData]);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const rolesQuery = 'role=warehouse_worker,warehouse';
      const [typesData, workersDataRaw] = await Promise.all([
        getTaskTypes('is_active=true'),
        (user?.role === 'warehouse' ? getWarehouseWorkersList() : getUsersQuery(rolesQuery))
      ]);
      // Normalize task types (support arrays under different keys)
      const typesArr = (Array.isArray(typesData?.task_types) && typesData.task_types)
        || (Array.isArray(typesData?.results) && typesData.results)
        || (Array.isArray(typesData) && typesData)
        || [];
      setTaskTypes(typesArr);

      // Normalize workers list and provide name fallbacks
      const workersArr = (workersDataRaw?.warehouse_workers && Array.isArray(workersDataRaw.warehouse_workers) && workersDataRaw.warehouse_workers)
        || (workersDataRaw?.users && Array.isArray(workersDataRaw.users) && workersDataRaw.users)
        || (Array.isArray(workersDataRaw?.results) && workersDataRaw.results)
        || (Array.isArray(workersDataRaw) && workersDataRaw)
        || [];
      const normalizedWorkers = workersArr.map(w => ({
        id: w.id,
        first_name: w.first_name || w.username || '',
        last_name: w.last_name || '',
        username: w.username || '',
        role: w.role || ''
      }));
      // If current user is a warehouse manager (canonical 'warehouse'), show only workers
      const visibleWorkers = (user?.role === 'warehouse')
        ? normalizedWorkers.filter(w => w.role === 'warehouse_worker' || w.role === 'warehouse')
        : normalizedWorkers;
      setWorkers(visibleWorkers);
      // Load templates non-blocking
      try {
        const templatesData = await getTaskTemplates();
        const templatesArr = (templatesData?.templates && Array.isArray(templatesData.templates) && templatesData.templates)
          || (Array.isArray(templatesData?.results) && templatesData.results)
          || (Array.isArray(templatesData) && templatesData)
          || [];
        setTemplates(templatesArr);
      } catch (e) {
        // Templates not critical for assignment; ignore failure
      }
    } catch (err) {
      setError('Failed to load initial data: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!selectedOrder) return;

    setLoading(true);
    try {
      const taskData = {
        title: taskForm.title,
        description: taskForm.description,
        task_type_name: taskForm.task_type_name || undefined,
        assigned_to_id: taskForm.assigned_worker ? Number(taskForm.assigned_worker) : undefined,
        priority: taskForm.priority,
        estimated_duration: parseInt(taskForm.estimated_duration),
        due_date: taskForm.deadline ? new Date(taskForm.deadline).toISOString() : null,
        instructions: taskForm.instructions,
      };
      // Fallback: if name is not set but a type id was somehow stored, include id
      if (!taskData.task_type_name && taskForm.task_type) {
        taskData.task_type_id = Number(taskForm.task_type);
      }
      if (taskForm.order_item_id) {
        taskData.order_item_id = Number(taskForm.order_item_id);
      }

      await createTaskInOrder(selectedOrder.id, taskData);
      
      setSuccess('Task created successfully!');
      setShowCreateTask(false);
      resetTaskForm();
      refreshOrders();
      refreshTasks();
    } catch (err) {
      setError('Failed to create task: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditTask = async (e) => {
    e.preventDefault();
    if (!selectedTask) return;

    setLoading(true);
    try {
      await updateTask(selectedTask.id, taskForm);
      
      setSuccess('Task updated successfully!');
      setShowEditTask(false);
      resetTaskForm();
      refreshTasks();
    } catch (err) {
      setError('Failed to update task: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const { notifySuccess, notifyError } = useNotify();

  const handleDeleteTask = async (taskId) => {
    const ok = await confirmDelete('Are you sure you want to delete this task?');
    if (!ok) return;

    setLoading(true);
    try {
      await deleteTask(taskId);
      setSuccess('Task deleted successfully!');
      notifySuccess('Task deleted');
      refreshTasks();
    } catch (err) {
      const msg = 'Failed to delete task: ' + err.message;
      setError(msg);
      notifyError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleBulkAssign = async (workerId) => {
    if (selectedTasks.length === 0) return;

    setLoading(true);
    try {
      await bulkAssignTasks(selectedTasks, workerId);
      setSuccess(`${selectedTasks.length} tasks assigned successfully!`);
      setSelectedTasks([]);
      setShowBulkAssign(false);
      refreshTasks();
    } catch (err) {
      setError('Failed to assign tasks: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const resetTaskForm = () => {
    setTaskForm({
      title: '',
      description: '',
      task_type_name: '',
      assigned_worker: '',
      priority: 'medium',
      estimated_duration: 60,
      deadline: '',
      materials_needed: [],
      instructions: '',
      template_id: null,
      order_item_id: ''
    });
    setSelectedOrder(null);
    setSelectedTask(null);
    setOrderItems([]);
  };

  const openCreateTaskModal = (order) => {
    setSelectedOrder(order);
    setOrderItems([]);
    // Fetch order details (items) for selection
    getOrderDetailsForTasks(order.id)
      .then((data) => {
        const items = Array.isArray(data?.items) ? data.items : (Array.isArray(data?.results) ? data.results : []);
        setOrderItems(items);
      })
      .catch(() => setOrderItems([]));
    setShowCreateTask(true);
  };

  const openEditTaskModal = (task) => {
    setSelectedTask(task);
    setTaskForm({
      title: task.title || '',
      description: task.description || '',
      task_type_name: task.task_type?.name || '',
      assigned_worker: task.assigned_worker?.id || '',
      priority: task.priority || 'medium',
      estimated_duration: task.estimated_duration || 60,
      deadline: task.deadline || '',
      materials_needed: task.materials_needed ? task.materials_needed.split(',') : [],
      instructions: task.instructions || '',
      template_id: null
    });
    setShowEditTask(true);
  };

  const applyTemplate = (templateId) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setTaskForm(prev => ({
        ...prev,
        title: template.title,
        description: template.description,
        task_type_name: template.task_type_name || '',
        priority: template.priority,
        estimated_duration: template.estimated_duration,
        instructions: template.instructions,
        materials_needed: template.materials_needed ? template.materials_needed.split(',') : [],
        template_id: templateId
      }));
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'assigned': 'secondary',
      'started': 'primary',
      'paused': 'warning',
      'completed': 'success',
      'approved': 'info',
      'rejected': 'danger'
    };
    return colors[status] || 'secondary';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      'critical': 'danger',
      'high': 'warning',
      'medium': 'info',
      'low': 'success'
    };
    return colors[priority] || 'secondary';
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.order_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.customer_name?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const filteredTasks = allTasks.filter(task => {
    const matchesSearch = task.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
    const matchesWorker = workerFilter === 'all' || task.assigned_worker?.id.toString() === workerFilter;
    
    return matchesSearch && matchesStatus && matchesPriority && matchesWorker;
  });

  if (loading && orders.length === 0) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <div className="text-center">
          <Spinner animation="border" variant="primary" style={{ width: '3rem', height: '3rem' }} />
          <p className="mt-3 h5">Loading task management...</p>
        </div>
      </div>
    );
  }

  return (
    <Container fluid className="task-management p-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-1">
            <FaTasks className="me-2 text-primary" />
            Task Management
          </h2>
          <p className="text-muted mb-0">
            Create, assign, and manage warehouse tasks within orders
          </p>
        </div>
        <div className="d-flex gap-2">
          <Button variant="outline-primary" onClick={() => { refreshOrders(); refreshTasks(); }}>
            <FaSync className="me-2" />
            Refresh
          </Button>
          {selectedTasks.length > 0 && (
            <Button variant="success" onClick={() => setShowBulkAssign(true)}>
              <FaUsers className="me-2" />
              Bulk Assign ({selectedTasks.length})
            </Button>
          )}
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <Alert variant="danger" dismissible onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert variant="success" dismissible onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {/* Search and Filters */}
      <Card className="mb-4">
        <Card.Body>
          <Row>
            <Col md={4}>
              <InputGroup>
                <InputGroup.Text>
                  <FaSearch />
                </InputGroup.Text>
                <Form.Control
                  type="text"
                  placeholder="Search orders or tasks..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>
              {taskTypes.length === 0 && (
                <div className="small text-muted mt-2">No task types found. Ensure backend returns /api/tasks/task_types/?is_active=true.</div>
              )}
            </Col>
            <Col md={2}>
              <Form.Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="assigned">Assigned</option>
                <option value="started">Started</option>
                <option value="paused">Paused</option>
                <option value="completed">Completed</option>
                <option value="approved">Approved</option>
              </Form.Select>
            </Col>
            <Col md={2}>
              <Form.Select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
              >
                <option value="all">All Priority</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </Form.Select>
            </Col>
            <Col md={2}>
              <Form.Select
                value={workerFilter}
                onChange={(e) => setWorkerFilter(e.target.value)}
              >
                <option value="all">All Workers</option>
                {workers.map(worker => (
                  <option key={worker.id} value={worker.id}>
                    {worker.first_name} {worker.last_name}
                  </option>
                ))}
              </Form.Select>
              {workers.length === 0 && (
                <div className="small text-muted mt-2">No workers found. Managers see warehouse workers only.</div>
              )}
            </Col>
            <Col md={2}>
              <Form.Select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [field, order] = e.target.value.split('-');
                  setSortBy(field);
                  setSortOrder(order);
                }}
              >
                <option value="created_at-desc">Newest First</option>
                <option value="created_at-asc">Oldest First</option>
                <option value="priority-desc">High Priority First</option>
                <option value="deadline-asc">Deadline Soon</option>
              </Form.Select>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Main Content Tabs */}
      <Tabs activeKey={activeTab} onSelect={setActiveTab} className="mb-4">
        {/* Orders Tab */}
        <Tab eventKey="orders" title={
          <span>
            <FaBox className="me-2" />
            Orders ({filteredOrders.length})
          </span>
        }>
          <Row>
            {filteredOrders.map(order => (
              <Col lg={6} xl={4} key={order.id} className="mb-4">
                <Card className="h-100 shadow-sm order-card">
                  <Card.Header className="d-flex justify-content-between align-items-center">
                    <div>
                      <h6 className="mb-0 fw-bold">{order.order_number}</h6>
                      <small className="text-muted">{order.customer_name}</small>
                    </div>
                    <Badge bg={getPriorityColor(order.urgency)}>
                      {order.urgency?.toUpperCase()}
                    </Badge>
                  </Card.Header>
                  <Card.Body>
                    <div className="mb-3">
                      <small className="text-muted">Task Progress</small>
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <span className="small">
                          {order.task_counts?.completed || 0} / {order.task_counts?.total || 0} completed
                        </span>
                        <span className="small text-muted">
                          {order.task_counts?.total > 0 
                            ? Math.round(((order.task_counts?.completed || 0) / order.task_counts.total) * 100)
                            : 0}%
                        </span>
                      </div>
                      <ProgressBar 
                        now={order.task_counts?.total > 0 
                          ? ((order.task_counts?.completed || 0) / order.task_counts.total) * 100
                          : 0
                        }
                        variant="success"
                        style={{ height: '6px' }}
                      />
                    </div>
                    
                    <div className="mb-3">
                      <Row className="g-2 text-center">
                        <Col xs={6}>
                          <div className="border rounded p-2">
                            <div className="fw-bold text-primary">{order.items_count}</div>
                            <small className="text-muted">Items</small>
                          </div>
                        </Col>
                        <Col xs={6}>
                          <div className="border rounded p-2">
                            <div className="fw-bold text-success">R{order.total_amount?.toFixed(2)}</div>
                            <small className="text-muted">Value</small>
                          </div>
                        </Col>
                      </Row>
                    </div>

                    {/* Order Items with Specifications and Revamp/Repair info */}
                    {order.items && order.items.length > 0 && (
                      <div className="mb-3">
                        <small className="text-muted fw-semibold d-block mb-2">Order Items:</small>
                        <div className="space-y-2">
                          {order.items.map((item, idx) => (
                            <div key={idx} className="p-2 bg-light rounded border">
                              <div className="d-flex align-items-center flex-wrap gap-2">
                                <FaBox className="text-primary" />
                                <span className="fw-semibold">
                                  {item.quantity}x {item.product_name}
                                </span>
                                {item.color_name && (
                                  <Badge 
                                    bg="light" 
                                    text="dark" 
                                    className="border"
                                    style={{
                                      backgroundColor: item.hex_color || undefined,
                                      color: item.hex_color ? '#000' : undefined,
                                      cursor: 'pointer',
                                      boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.05)'
                                    }}
                                  >
                                    Color: {item.color_name}
                                  </Badge>
                                )}
                                {item.fabric_name && (
                                  <Badge bg="light" text="dark" className="border">
                                    Fabric: {item.fabric_name}
                                  </Badge>
                                )}
                              </div>
                              <div className="mt-1">
                                <small className="text-muted">
                                  Unit: R{item.unit_price?.toFixed(2)} | Total: R{item.total_price?.toFixed(2)}
                                </small>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {(order.order_type === 'revamp' || order.order_type === 'repair') && (
                      <div className="mb-3">
                        <small className="text-muted fw-semibold d-block mb-2">{order.order_type === 'repair' ? 'Repair' : 'Revamp'}:</small>
                        <div className="p-2 bg-light rounded border">
                          <div className="fw-semibold">{order.revamp_name}</div>
                          {order.revamp_description && (
                            <div className="small text-muted">{order.revamp_description}</div>
                          )}
                          <div className="small">Price: R{Number(order.revamp_price || 0).toFixed(2)}</div>
                          {order.revamp_image && (
                            <img src={order.revamp_image} alt="revamp" style={{ maxWidth: '120px', borderRadius: '6px', border: '1px solid #eee', marginTop: '6px' }} />
                          )}
                        </div>
                      </div>
                    )}

                    <div className="d-grid gap-2">
                      <Button
                        variant="primary"
                        onClick={() => openCreateTaskModal(order)}
                        className="d-flex align-items-center justify-content-center"
                      >
                        <FaPlus className="me-2" />
                        Create Task
                      </Button>
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => {
                          // Navigate to order details
                        }}
                        className="d-flex align-items-center justify-content-center"
                      >
                        <FaEye className="me-2" />
                        View Details
                      </Button>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>

          {filteredOrders.length === 0 && (
            <div className="text-center py-5">
              <FaBox size={60} className="text-muted mb-3" />
              <h4 className="text-muted mb-2">No orders found</h4>
              <p className="text-muted">
                {searchTerm ? 'Try adjusting your search criteria.' : 'No orders available for task creation.'}
              </p>
            </div>
          )}
        </Tab>

        {/* All Tasks Tab */}
        <Tab eventKey="tasks" title={
          <span>
            <FaTasks className="me-2" />
            All Tasks ({filteredTasks.length})
          </span>
        }>
          <Card>
            <Card.Body className="p-0">
              <Table responsive hover className="mb-0">
                <thead className="bg-light">
                  <tr>
                    <th width="30">
                      <Form.Check
                        type="checkbox"
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedTasks(filteredTasks.map(t => t.id));
                          } else {
                            setSelectedTasks([]);
                          }
                        }}
                        checked={selectedTasks.length === filteredTasks.length && filteredTasks.length > 0}
                      />
                    </th>
                    <th>Task</th>
                    <th>Order</th>
                    <th>Worker</th>
                    <th>Status</th>
                    <th>Priority</th>
                    <th>Progress</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTasks.map(task => (
                    <tr key={task.id}>
                      <td>
                        <Form.Check
                          type="checkbox"
                          checked={selectedTasks.includes(task.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedTasks(prev => [...prev, task.id]);
                            } else {
                              setSelectedTasks(prev => prev.filter(id => id !== task.id));
                            }
                          }}
                        />
                      </td>
                      <td>
                        <div>
                          <div className="fw-semibold">{task.title}</div>
                          <small className="text-muted d-block">{task.description}</small>
                          {task.order_item_details && (
                            <small className="text-muted">
                              {task.order_item_details.order_items ? (
                                // New format with multiple order items
                                <>
                                  {task.order_item_details.total_items} item{task.order_item_details.total_items !== 1 ? 's' : ''}
                                  {task.order_item_details.order_items.slice(0, 2).map((item, idx) => (
                                    <span key={idx}>
                                      {idx > 0 ? ' • ' : ' • '}
                                      {item.product_name}
                                      {item.fabric_name ? ` (${item.fabric_name})` : ''}
                                      {item.color_name ? ` - ${item.color_name}` : ''}
                                      {` x${item.quantity}`}
                                    </span>
                                  ))}
                                  {task.order_item_details.total_items > 2 && (
                                    <span> • +{task.order_item_details.total_items - 2} more</span>
                                  )}
                                </>
                              ) : (
                                // Old format with single order item
                                <>
                                  {task.order_item_details.product_name}
                                  {task.order_item_details.fabric_name ? ` • ${task.order_item_details.fabric_name}` : ''}
                                  {task.order_item_details.color_name ? ` • ${task.order_item_details.color_name}` : ''}
                                  {` • Qty ${task.order_item_details.quantity}`}
                                </>
                              )}
                            </small>
                          )}
                        </div>
                      </td>
                      <td>
                        <div>
                          <div className="fw-semibold">{task.order_number || task.order?.order_number || '-'}</div>
                        </div>
                      </td>
                      <td>
                        {task.assigned_to || task.assigned_to_name ? (
                          <div className="d-flex align-items-center">
                            <FaUser className="me-2 text-muted" />
                            <div className="fw-semibold">{task.assigned_to_name || task.assigned_to}</div>
                          </div>
                        ) : (
                          <Badge bg="light" text="dark">Unassigned</Badge>
                        )}
                      </td>
                      <td>
                        <Badge bg={getStatusColor(task.status)}>
                          {task.status?.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </td>
                      <td>
                        <Badge bg={getPriorityColor(task.priority)}>
                          {task.priority?.toUpperCase()}
                        </Badge>
                      </td>
                      <td>
                        <div className="d-flex align-items-center">
                          <div className="progress me-2" style={{ width: '60px', height: '6px' }}>
                            <div
                              className="progress-bar bg-success"
                              style={{ width: `${task.progress_percentage || 0}%` }}
                            ></div>
                          </div>
                          <small className="text-muted">{task.progress_percentage || 0}%</small>
                        </div>
                      </td>
                      <td>
                        <div className="d-flex gap-1">
                          <Button
                            variant="outline-primary"
                            size="sm"
                            onClick={() => openEditTaskModal(task)}
                          >
                            <FaEdit />
                          </Button>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => handleDeleteTask(task.id)}
                          >
                            <FaTrash />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>

              {filteredTasks.length === 0 && (
                <div className="text-center py-5">
                  <FaTasks size={60} className="text-muted mb-3" />
                  <h4 className="text-muted mb-2">No tasks found</h4>
                  <p className="text-muted">
                    {searchTerm ? 'Try adjusting your search criteria.' : 'No tasks have been created yet.'}
                  </p>
                </div>
              )}
            </Card.Body>
          </Card>
        </Tab>
      </Tabs>

      {/* Create Task Modal */}
      <Modal show={showCreateTask} onHide={() => setShowCreateTask(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            <FaPlus className="me-2" />
            Create Task in Order: {selectedOrder?.order_number}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleCreateTask}>
          <Modal.Body>
            {/* Template Selection */}
            {templates.length > 0 && (
              <Row className="mb-3">
                <Col>
                  <Form.Label>Use Template (Optional)</Form.Label>
                  <Form.Select
                    value={taskForm.template_id || ''}
                    onChange={(e) => e.target.value && applyTemplate(e.target.value)}
                  >
                    <option value="">Select a template...</option>
                    {templates.map(template => (
                      <option key={template.id} value={template.id}>
                        {template.name} - {template.description}
                      </option>
                    ))}
                  </Form.Select>
                </Col>
              </Row>
            )}

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Task Title *</Form.Label>
                  <Form.Control
                    type="text"
                    value={taskForm.title}
                    onChange={(e) => setTaskForm(prev => ({ ...prev, title: e.target.value }))}
                    required
                    placeholder="Enter task title"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Task Type *</Form.Label>
                  <Form.Select
                    value={taskForm.task_type_name}
                    onChange={(e) => setTaskForm(prev => ({ ...prev, task_type_name: e.target.value }))}
                    required
                  >
                    <option value="">Select task type...</option>
                    {(taskTypes.length > 0 ? taskTypes.map(t => t.name) : FALLBACK_TASK_TYPES).map(name => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Order Item (optional)</Form.Label>
                  <Form.Select
                    value={taskForm.order_item_id}
                    onChange={(e) => setTaskForm(prev => ({ ...prev, order_item_id: e.target.value }))}
                  >
                    <option value="">No specific item</option>
                    {orderItems.map(item => (
                      <option key={item.id} value={item.id}>
                        {`${item.product_name || item.product?.name || 'Item'}${item.fabric_name ? ' • ' + item.fabric_name : ''}${item.color_name ? ' • ' + item.color_name : ''} • Qty ${item.quantity}`}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={taskForm.description}
                onChange={(e) => setTaskForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe what needs to be done..."
              />
            </Form.Group>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Assign to Worker</Form.Label>
                  <Form.Select
                    value={taskForm.assigned_worker}
                    onChange={(e) => setTaskForm(prev => ({ ...prev, assigned_worker: e.target.value }))}
                  >
                    <option value="">Assign later...</option>
                    {workers.map(worker => (
                      <option key={worker.id} value={worker.id}>
                        {(worker.first_name || worker.username) + (worker.last_name ? ' ' + worker.last_name : '')} ({worker.role})
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Priority</Form.Label>
                  <Form.Select
                    value={taskForm.priority}
                    onChange={(e) => setTaskForm(prev => ({ ...prev, priority: e.target.value }))}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Estimated Duration (minutes)</Form.Label>
                  <Form.Control
                    type="number"
                    min="15"
                    max="480"
                    value={taskForm.estimated_duration}
                    onChange={(e) => setTaskForm(prev => ({ ...prev, estimated_duration: e.target.value }))}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Deadline (Optional)</Form.Label>
                  <Form.Control
                    type="datetime-local"
                    value={taskForm.deadline}
                    onChange={(e) => setTaskForm(prev => ({ ...prev, deadline: e.target.value }))}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Special Instructions</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                value={taskForm.instructions}
                onChange={(e) => setTaskForm(prev => ({ ...prev, instructions: e.target.value }))}
                placeholder="Any special instructions or notes..."
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowCreateTask(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={loading}>
              {loading ? <Spinner animation="border" size="sm" className="me-2" /> : <FaPlus className="me-2" />}
              Create Task
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Edit Task Modal */}
      <Modal show={showEditTask} onHide={() => setShowEditTask(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            <FaEdit className="me-2" />
            Edit Task: {selectedTask?.title}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleEditTask}>
          <Modal.Body>
            {/* Similar form fields as create task */}
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Task Title *</Form.Label>
                  <Form.Control
                    type="text"
                    value={taskForm.title}
                    onChange={(e) => setTaskForm(prev => ({ ...prev, title: e.target.value }))}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Task Type *</Form.Label>
                  <Form.Select
                    value={taskForm.task_type_name}
                    onChange={(e) => setTaskForm(prev => ({ ...prev, task_type_name: e.target.value }))}
                    required
                  >
                    <option value="">Select task type...</option>
                    {(taskTypes.length > 0 ? taskTypes.map(t => t.name) : FALLBACK_TASK_TYPES).map(name => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={taskForm.description}
                onChange={(e) => setTaskForm(prev => ({ ...prev, description: e.target.value }))}
              />
            </Form.Group>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Assign to Worker</Form.Label>
                  <Form.Select
                    value={taskForm.assigned_worker}
                    onChange={(e) => setTaskForm(prev => ({ ...prev, assigned_worker: e.target.value }))}
                  >
                    <option value="">Unassigned</option>
                    {workers.map(worker => (
                      <option key={worker.id} value={worker.id}>
                        {(worker.first_name || worker.username) + (worker.last_name ? ' ' + worker.last_name : '')}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Priority</Form.Label>
                  <Form.Select
                    value={taskForm.priority}
                    onChange={(e) => setTaskForm(prev => ({ ...prev, priority: e.target.value }))}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowEditTask(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={loading}>
              {loading ? <Spinner animation="border" size="sm" className="me-2" /> : <FaCheck className="me-2" />}
              Update Task
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Bulk Assign Modal */}
      <Modal show={showBulkAssign} onHide={() => setShowBulkAssign(false)}>
        <Modal.Header closeButton>
          <Modal.Title>
            <FaUsers className="me-2" />
            Bulk Assign Tasks ({selectedTasks.length})
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Select a worker to assign {selectedTasks.length} selected tasks:</p>
          <Form.Select
            onChange={(e) => e.target.value && handleBulkAssign(e.target.value)}
          >
            <option value="">Select worker...</option>
            {workers.map(worker => (
              <option key={worker.id} value={worker.id}>
                {(worker.first_name || worker.username) + (worker.last_name ? ' ' + worker.last_name : '')} ({worker.role})
              </option>
            ))}
          </Form.Select>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowBulkAssign(false)}>
            Cancel
          </Button>
        </Modal.Footer>
      </Modal>

      <style jsx>{`
        .order-card {
          transition: all 0.3s ease;
          border: 1px solid #e9ecef;
        }
        
        .order-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 15px rgba(0,0,0,0.1) !important;
        }
        
        .progress {
          border-radius: 10px;
        }
        
        .progress-bar {
          border-radius: 10px;
        }
        
        .table th {
          border-top: none;
          font-weight: 600;
          color: #495057;
        }
        
        .table td {
          vertical-align: middle;
        }
        
        @media (max-width: 768px) {
          .task-management .d-flex.gap-2 {
            flex-direction: column;
            gap: 0.5rem !important;
          }
        }
      `}</style>
    </Container>
  );
};

export default TaskManagement;