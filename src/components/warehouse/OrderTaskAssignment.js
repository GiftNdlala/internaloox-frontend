import React, { useState, useEffect } from 'react';
import { 
  Modal, Button, Card, Row, Col, Form, Badge, Alert,
  ListGroup, Accordion, Spinner 
} from 'react-bootstrap';
import { 
  FaPlus, FaTrash, FaUser, FaClock, FaBox, 
  FaExclamationTriangle, FaCheck, FaTasks 
} from 'react-icons/fa';
import { 
  getOrderDetailsForTasks, assignTasksToOrder, getTaskTypes, 
  getUsers, getTaskTemplates 
} from '../api';

const OrderTaskAssignment = ({ 
  show, 
  onHide, 
  order, 
  onTasksAssigned 
}) => {
  const [loading, setLoading] = useState(false);
  const [orderDetails, setOrderDetails] = useState(null);
  const [taskTypes, setTaskTypes] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    if (show && order) {
      loadData();
    }
  }, [show, order]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const [orderData, taskTypesData, usersData, templatesData] = await Promise.all([
        getOrderDetailsForTasks(order.id),
        getTaskTypes(),
        getUsers(),
        getTaskTemplates().catch(() => []) // Templates might not exist yet
      ]);

      setOrderDetails(orderData);
      setTaskTypes(taskTypesData);
      setWorkers(usersData.filter(user => 
        user.role === 'warehouse' || user.role === 'admin'
      ));
      setTemplates(templatesData);

      // Initialize with one empty task
      if (tasks.length === 0) {
        setTasks([createEmptyTask()]);
      }
    } catch (err) {
      setError('Failed to load assignment data: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const createEmptyTask = () => ({
    id: Date.now() + Math.random(),
    task_type_id: '',
    assigned_to_id: '',
    title: '',
    description: '',
    priority: 'medium',
    estimated_duration: 2,
    deadline: ''
  });

  const addTask = () => {
    setTasks([...tasks, createEmptyTask()]);
  };

  const removeTask = (taskId) => {
    setTasks(tasks.filter(task => task.id !== taskId));
  };

  const updateTask = (taskId, field, value) => {
    setTasks(tasks.map(task => 
      task.id === taskId ? { ...task, [field]: value } : task
    ));
  };

  const applyTemplate = (template) => {
    const templateTasks = template.tasks.map(templateTask => ({
      id: Date.now() + Math.random(),
      task_type_id: templateTask.task_type_id,
      assigned_to_id: '',
      title: templateTask.title,
      description: templateTask.description,
      priority: templateTask.priority || 'medium',
      estimated_duration: templateTask.estimated_duration || 2,
      deadline: ''
    }));
    
    setTasks(templateTasks);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validate tasks
    const validTasks = tasks.filter(task => 
      task.task_type_id && task.assigned_to_id && task.title.trim()
    );

    if (validTasks.length === 0) {
      setError('Please add at least one valid task with type, assignee, and title.');
      setLoading(false);
      return;
    }

    try {
      const result = await assignTasksToOrder(order.id, { tasks: validTasks });
      setSuccess(`Successfully assigned ${validTasks.length} tasks to order ${order.order_number}`);
      
      setTimeout(() => {
        onTasksAssigned && onTasksAssigned(result);
        onHide();
      }, 1500);
    } catch (err) {
      setError('Failed to assign tasks: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case 'critical': return 'danger';
      case 'high': return 'warning';
      case 'medium': return 'info';
      case 'low': return 'success';
      default: return 'secondary';
    }
  };

  if (!order) return null;

  return (
    <Modal 
      show={show} 
      onHide={onHide} 
      size="xl" 
      centered
      backdrop="static"
    >
      <Modal.Header closeButton className="bg-primary text-white">
        <Modal.Title>
          <FaTasks className="me-2" />
          Assign Tasks to Order {order.order_number}
        </Modal.Title>
      </Modal.Header>

      <Modal.Body className="p-0">
        {loading && !orderDetails ? (
          <div className="text-center p-5">
            <Spinner animation="border" variant="primary" />
            <p className="mt-3">Loading order details...</p>
          </div>
        ) : (
          <>
            {/* Order Information Header */}
            <div className="bg-light p-4 border-bottom">
              <Row>
                <Col md={8}>
                  <h5 className="mb-2">
                    <FaBox className="me-2 text-primary" />
                    {order.customer_name || orderDetails?.customer?.name}
                  </h5>
                  <div className="d-flex gap-3 mb-2">
                    <Badge bg={getUrgencyColor(orderDetails?.urgency)}>
                      {orderDetails?.urgency?.toUpperCase() || 'NORMAL'}
                    </Badge>
                    <small className="text-muted">
                      Due: {order.delivery_deadline || 'No deadline'}
                    </small>
                    <small className="text-muted">
                      Total: R{order.total_amount}
                    </small>
                  </div>
                </Col>
                <Col md={4} className="text-end">
                  {orderDetails?.existing_tasks?.length > 0 && (
                    <div>
                      <small className="text-info">
                        {orderDetails.existing_tasks.length} existing task(s)
                      </small>
                    </div>
                  )}
                </Col>
              </Row>

              {/* Order Items Summary */}
              {orderDetails?.items && (
                <div className="mt-3">
                  <h6 className="text-muted mb-2">Order Items:</h6>
                  <div className="d-flex flex-wrap gap-2">
                    {orderDetails.items.map((item, index) => (
                      <Badge key={index} bg="outline-secondary" className="p-2">
                        {item.quantity}x {item.product_name}
                        {item.fabric && ` (${item.fabric})`}
                        {item.color && ` - ${item.color}`}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="p-4">
              {/* Error/Success Messages */}
              {error && (
                <Alert variant="danger" dismissible onClose={() => setError(null)}>
                  {error}
                </Alert>
              )}
              {success && (
                <Alert variant="success">{success}</Alert>
              )}

              {/* Task Templates */}
              {templates.length > 0 && (
                <div className="mb-4">
                  <h6 className="mb-3">Quick Templates:</h6>
                  <div className="d-flex gap-2 flex-wrap">
                    {templates.map(template => (
                      <Button
                        key={template.id}
                        variant="outline-info"
                        size="sm"
                        onClick={() => applyTemplate(template)}
                        disabled={loading}
                      >
                        {template.name} ({template.tasks?.length || 0} tasks)
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Task Assignment Form */}
              <Form onSubmit={handleSubmit}>
                <Row className="mb-3">
                  <Col>
                    <h6>Tasks to Assign:</h6>
                  </Col>
                  <Col xs="auto">
                    <Button 
                      variant="success" 
                      size="sm" 
                      onClick={addTask}
                      disabled={loading}
                    >
                      <FaPlus className="me-1" />
                      Add Task
                    </Button>
                  </Col>
                </Row>

                {tasks.map((task, index) => (
                  <Card key={task.id} className="mb-3 border">
                    <Card.Header className="bg-light py-2">
                      <div className="d-flex justify-content-between align-items-center">
                        <span className="fw-bold">Task #{index + 1}</span>
                        {tasks.length > 1 && (
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => removeTask(task.id)}
                            disabled={loading}
                          >
                            <FaTrash />
                          </Button>
                        )}
                      </div>
                    </Card.Header>
                    <Card.Body>
                      <Row className="g-3">
                        <Col md={6}>
                          <Form.Group>
                            <Form.Label>Task Type *</Form.Label>
                            <Form.Select
                              value={task.task_type_id}
                              onChange={(e) => updateTask(task.id, 'task_type_id', e.target.value)}
                              required
                            >
                              <option value="">Select task type...</option>
                              {taskTypes.map(type => (
                                <option key={type.id} value={type.id}>
                                  {type.name}
                                </option>
                              ))}
                            </Form.Select>
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group>
                            <Form.Label>Assign to Worker *</Form.Label>
                            <Form.Select
                              value={task.assigned_to_id}
                              onChange={(e) => updateTask(task.id, 'assigned_to_id', e.target.value)}
                              required
                            >
                              <option value="">Select worker...</option>
                              {workers.map(worker => (
                                <option key={worker.id} value={worker.id}>
                                  <FaUser className="me-1" />
                                  {worker.first_name || worker.username}
                                  {worker.role === 'admin' && ' (Admin)'}
                                </option>
                              ))}
                            </Form.Select>
                          </Form.Group>
                        </Col>
                        <Col md={12}>
                          <Form.Group>
                            <Form.Label>Task Title *</Form.Label>
                            <Form.Control
                              type="text"
                              value={task.title}
                              onChange={(e) => updateTask(task.id, 'title', e.target.value)}
                              placeholder="e.g., Cut fabric for L-shaped couch"
                              required
                            />
                          </Form.Group>
                        </Col>
                        <Col md={12}>
                          <Form.Group>
                            <Form.Label>Description</Form.Label>
                            <Form.Control
                              as="textarea"
                              rows={2}
                              value={task.description}
                              onChange={(e) => updateTask(task.id, 'description', e.target.value)}
                              placeholder="Additional task details..."
                            />
                          </Form.Group>
                        </Col>
                        <Col md={4}>
                          <Form.Group>
                            <Form.Label>Priority</Form.Label>
                            <Form.Select
                              value={task.priority}
                              onChange={(e) => updateTask(task.id, 'priority', e.target.value)}
                            >
                              <option value="low">Low</option>
                              <option value="medium">Medium</option>
                              <option value="high">High</option>
                              <option value="critical">Critical</option>
                            </Form.Select>
                          </Form.Group>
                        </Col>
                        <Col md={4}>
                          <Form.Group>
                            <Form.Label>
                              <FaClock className="me-1" />
                              Est. Hours
                            </Form.Label>
                            <Form.Control
                              type="number"
                              min="0.5"
                              max="24"
                              step="0.5"
                              value={task.estimated_duration}
                              onChange={(e) => updateTask(task.id, 'estimated_duration', parseFloat(e.target.value))}
                            />
                          </Form.Group>
                        </Col>
                        <Col md={4}>
                          <Form.Group>
                            <Form.Label>Deadline</Form.Label>
                            <Form.Control
                              type="datetime-local"
                              value={task.deadline}
                              onChange={(e) => updateTask(task.id, 'deadline', e.target.value)}
                            />
                          </Form.Group>
                        </Col>
                      </Row>
                    </Card.Body>
                  </Card>
                ))}

                {/* Task Dependencies Info */}
                {tasks.length > 1 && (
                  <Alert variant="info">
                    <FaExclamationTriangle className="me-2" />
                    Tasks will be created in sequence. Later tasks may depend on earlier ones being completed.
                  </Alert>
                )}
              </Form>
            </div>
          </>
        )}
      </Modal.Body>

      <Modal.Footer className="bg-light">
        <Button variant="secondary" onClick={onHide} disabled={loading}>
          Cancel
        </Button>
        <Button 
          variant="primary" 
          onClick={handleSubmit}
          disabled={loading || tasks.length === 0}
        >
          {loading ? (
            <>
              <Spinner animation="border" size="sm" className="me-2" />
              Assigning Tasks...
            </>
          ) : (
            <>
              <FaCheck className="me-2" />
              Assign {tasks.length} Task{tasks.length !== 1 ? 's' : ''}
            </>
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default OrderTaskAssignment;