import React, { useState } from 'react';
import { 
  Container, Row, Col, Card, Button, Badge, Alert, 
  Modal, Form, Table, Tabs, Tab, InputGroup
} from 'react-bootstrap';
import { 
  FaTasks, FaPlus, FaSearch, FaEye, FaEdit,
  FaTrash, FaUser, FaBox, FaSync
} from 'react-icons/fa';

const SimpleTaskManagement = ({ user }) => {
  const [activeTab, setActiveTab] = useState('orders');
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Mock data for testing
  const mockOrders = [
    {
      id: 1,
      order_number: 'OOX000045',
      customer_name: 'John Doe',
      urgency: 'high',
      total_amount: 2500,
      items_count: 3,
      task_counts: { total: 0, completed: 0, in_progress: 0 }
    },
    {
      id: 2,
      order_number: 'OOX000046',
      customer_name: 'Jane Smith',
      urgency: 'critical',
      total_amount: 1800,
      items_count: 2,
      task_counts: { total: 2, completed: 1, in_progress: 1 }
    },
    {
      id: 3,
      order_number: 'OOX000047',
      customer_name: 'Bob Johnson',
      urgency: 'medium',
      total_amount: 3200,
      items_count: 4,
      task_counts: { total: 3, completed: 0, in_progress: 2 }
    }
  ];

  const mockTasks = [
    {
      id: 1,
      title: 'Cut fabric pieces',
      description: 'Cut all fabric pieces according to pattern',
      status: 'started',
      priority: 'high',
      assigned_worker: { first_name: 'Mary', last_name: 'Johnson' },
      order: { order_number: 'OOX000045', customer_name: 'John Doe' },
      progress_percentage: 65
    },
    {
      id: 2,
      title: 'Upholstery work',
      description: 'Complete upholstery for L-shaped couch',
      status: 'assigned',
      priority: 'medium',
      assigned_worker: null,
      order: { order_number: 'OOX000046', customer_name: 'Jane Smith' },
      progress_percentage: 0
    },
    {
      id: 3,
      title: 'Quality check',
      description: 'Final quality inspection',
      status: 'completed',
      priority: 'low',
      assigned_worker: { first_name: 'John', last_name: 'Worker' },
      order: { order_number: 'OOX000047', customer_name: 'Bob Johnson' },
      progress_percentage: 100
    }
  ];

  const getUrgencyColor = (urgency) => {
    const colors = {
      critical: 'danger',
      high: 'warning',
      medium: 'info',
      low: 'success',
    };
    return colors[urgency] || 'secondary';
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

  const handleCreateTask = (order) => {
    setSelectedOrder(order);
    setShowCreateTask(true);
  };

  const handleSubmitTask = (e) => {
    e.preventDefault();
    alert('Task would be created here (API not connected)');
    setShowCreateTask(false);
  };

  return (
    <Container fluid className="task-management p-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-1">
            <FaTasks className="me-2 text-primary" />
            Task Management (Demo Mode)
          </h2>
          <p className="text-muted mb-0">
            Create, assign, and manage warehouse tasks within orders
          </p>
        </div>
        <div className="d-flex gap-2">
          <Button variant="outline-primary">
            <FaSync className="me-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Success Alert */}
      <Alert variant="success" className="mb-4">
        <strong>🎉 Task Management is Working!</strong> This is the task management interface. 
        You can create tasks inside orders and assign them to workers.
      </Alert>

      {/* Search and Filters */}
      <Card className="mb-4">
        <Card.Body>
          <Row>
            <Col md={6}>
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
            </Col>
            <Col md={6}>
              <div className="d-flex gap-2">
                <Form.Select>
                  <option>All Status</option>
                  <option>Assigned</option>
                  <option>Started</option>
                  <option>Completed</option>
                </Form.Select>
                <Form.Select>
                  <option>All Priority</option>
                  <option>Critical</option>
                  <option>High</option>
                  <option>Medium</option>
                  <option>Low</option>
                </Form.Select>
              </div>
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
            Orders ({mockOrders.length})
          </span>
        }>
          <Row>
            {mockOrders.map(order => (
              <Col lg={6} xl={4} key={order.id} className="mb-4">
                <Card className="h-100 shadow-sm">
                  <Card.Header className="d-flex justify-content-between align-items-center">
                    <div>
                      <h6 className="mb-0 fw-bold">{order.order_number}</h6>
                      <small className="text-muted">{order.customer_name}</small>
                    </div>
                    <Badge bg={getUrgencyColor(order.urgency)}>
                      {order.urgency?.toUpperCase()}
                    </Badge>
                  </Card.Header>
                  <Card.Body>
                    <div className="mb-3">
                      <small className="text-muted">Task Progress</small>
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <span className="small">
                          {order.task_counts.completed} / {order.task_counts.total} completed
                        </span>
                        <span className="small text-muted">
                          {order.task_counts.total > 0 
                            ? Math.round((order.task_counts.completed / order.task_counts.total) * 100)
                            : 0}%
                        </span>
                      </div>
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

                    <div className="d-grid gap-2">
                      <Button
                        variant="primary"
                        onClick={() => handleCreateTask(order)}
                        className="d-flex align-items-center justify-content-center"
                      >
                        <FaPlus className="me-2" />
                        Create Task
                      </Button>
                      <Button
                        variant="outline-primary"
                        size="sm"
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
        </Tab>

        {/* All Tasks Tab */}
        <Tab eventKey="tasks" title={
          <span>
            <FaTasks className="me-2" />
            All Tasks ({mockTasks.length})
          </span>
        }>
          <Card>
            <Card.Body className="p-0">
              <Table responsive hover className="mb-0">
                <thead className="bg-light">
                  <tr>
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
                  {mockTasks.map(task => (
                    <tr key={task.id}>
                      <td>
                        <div>
                          <div className="fw-semibold">{task.title}</div>
                          <small className="text-muted">{task.description}</small>
                        </div>
                      </td>
                      <td>
                        <div>
                          <div className="fw-semibold">{task.order.order_number}</div>
                          <small className="text-muted">{task.order.customer_name}</small>
                        </div>
                      </td>
                      <td>
                        {task.assigned_worker ? (
                          <div className="d-flex align-items-center">
                            <FaUser className="me-2 text-muted" />
                            <div>
                              <div className="fw-semibold">
                                {task.assigned_worker.first_name} {task.assigned_worker.last_name}
                              </div>
                            </div>
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
                          <Button variant="outline-primary" size="sm">
                            <FaEdit />
                          </Button>
                          <Button variant="outline-danger" size="sm">
                            <FaTrash />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
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
        <Form onSubmit={handleSubmitTask}>
          <Modal.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Task Title *</Form.Label>
                  <Form.Control
                    type="text"
                    required
                    placeholder="Enter task title"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Task Type *</Form.Label>
                  <Form.Select required>
                    <option value="">Select task type...</option>
                    <option value="cutting">Cutting</option>
                    <option value="upholstery">Upholstery</option>
                    <option value="assembly">Assembly</option>
                    <option value="quality_check">Quality Check</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                placeholder="Describe what needs to be done..."
              />
            </Form.Group>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Assign to Worker</Form.Label>
                  <Form.Select>
                    <option value="">Assign later...</option>
                    <option value="1">Mary Johnson (Warehouse Worker)</option>
                    <option value="2">John Worker (Warehouse Worker)</option>
                    <option value="3">Sarah Smith (Warehouse Worker)</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Priority</Form.Label>
                  <Form.Select>
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
                    defaultValue="60"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Deadline (Optional)</Form.Label>
                  <Form.Control type="datetime-local" />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Special Instructions</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                placeholder="Any special instructions or notes..."
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowCreateTask(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              <FaPlus className="me-2" />
              Create Task
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
};

export default SimpleTaskManagement;