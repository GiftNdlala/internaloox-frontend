import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Container, Row, Col, Card, Button, Badge, 
  Alert, Modal, Spinner, Form
} from 'react-bootstrap';
import { 
  FaWrench, FaBoxes, FaClock, FaPlay, FaPause, 
  FaCheck, FaExclamationTriangle, FaQrcode,
  FaEye, FaTasks, FaUsers, FaBell, FaChartBar,
  FaPlus, FaFilter, FaSync, FaMapMarkerAlt
} from 'react-icons/fa';
import { 
  warehouseAPI, getWarehouseOrders, getTasksByOrder,
  getWorkerDashboard, getSupervisorDashboard, getUnreadNotifications,
  getWarehouseDashboard, getLowStockAlerts
} from '../components/api';
import WarehouseNavbar from '../components/warehouse/WarehouseNavbar';
import TaskCard from '../components/warehouse/TaskCard';
import OrderTaskAssignment from '../components/warehouse/OrderTaskAssignment';
import StockEntry from '../components/warehouse/StockEntry';
import TaskManagement from '../components/warehouse/TaskManagement';
import WarehouseOrders from '../components/warehouse/WarehouseOrders';
import WorkerOrderTasks from '../components/warehouse/WorkerOrderTasks';

const EnhancedWarehouseDashboard = ({ user, onLogout }) => {
  const navigate = useNavigate();
  
  // Core State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [lastUpdate, setLastUpdate] = useState(null);
  
  // Dashboard Data
  const [dashboardData, setDashboardData] = useState(null);
  const [orders, setOrders] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [inventoryData, setInventoryData] = useState(null);
  const [lowStockAlerts, setLowStockAlerts] = useState([]);
  
  // UI State - Role-based default tab
  const [activeTab, setActiveTab] = useState(() => {
    console.log('Setting default tab for role:', user?.role);
    if (user?.role === 'warehouse_worker') return 'my-tasks';
    if (['owner', 'admin', 'warehouse_manager', 'warehouse'].includes(user?.role)) return 'overview';
    return 'overview';
  });
  
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showTaskAssignment, setShowTaskAssignment] = useState(false);
  const [showOrderDetail, setShowOrderDetail] = useState(false);
  const [showStockEntry, setShowStockEntry] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');

  // Real-time clock
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Auto-refresh data
  useEffect(() => {
    const interval = setInterval(() => {
      loadDashboardData(true); // Silent refresh
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [user]);

  // Initial load
  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  // Role-based access control
  const canManageTasks = () => {
    // Debug: Log the user role
    console.log('Current user role:', user?.role);
    return ['owner', 'admin', 'warehouse_manager', 'warehouse'].includes(user?.role);
  };

  const canViewAnalytics = () => {
    return ['owner', 'admin', 'warehouse_manager', 'warehouse'].includes(user?.role);
  };

  const getOrdersPathForRole = () => {
    if (user?.role === 'owner') return '/owner/orders';
    if (user?.role === 'admin') return '/admin/orders';
    if (user?.role === 'warehouse' || user?.role === 'warehouse_worker' || user?.role === 'warehouse_manager') return '/warehouse/orders';
    return '/';
  };

  const getAnalyticsPathForRole = () => {
    if (user?.role === 'owner' || user?.role === 'admin') return '/owner/analytics';
    // No direct analytics route for warehouse/delivery; fallback to overview
    return '/warehouse';
  };

  const canManageInventory = () => {
    return ['owner', 'admin', 'warehouse_manager', 'warehouse_worker', 'warehouse'].includes(user?.role);
  };

  const loadDashboardData = async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);

    try {
      const data = await warehouseAPI.getDashboardData(user?.role);
      setDashboardData(data);
      
      // Load role-specific data
      if (user?.role === 'warehouse_worker') {
        await loadWorkerDashboard();
      } else if (canManageTasks()) {
        await loadSupervisorDashboard();
      }
      
      await loadNotifications();
      
      if (canManageInventory()) {
        await loadInventoryData();
      }
      
      setLastUpdate(new Date().toISOString());
    } catch (err) {
      setError('Failed to load dashboard data: ' + err.message);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const loadWorkerDashboard = async () => {
    try {
      const data = await getWorkerDashboard();
      setTasks(data.tasks || []);
    } catch (err) {
      console.error('Failed to load worker dashboard:', err);
    }
  };

  const loadSupervisorDashboard = async () => {
    try {
      const [ordersData, supervisorData] = await Promise.all([
        getWarehouseOrders(),
        getSupervisorDashboard()
      ]);
      
      setOrders(ordersData.orders || []);
      setTasks(supervisorData.tasks || []);
    } catch (err) {
      console.error('Failed to load supervisor dashboard:', err);
    }
  };

  const loadNotifications = async () => {
    try {
      const data = await getUnreadNotifications();
      setNotifications(data.notifications || []);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    }
  };

  const loadInventoryData = async () => {
    try {
      const [warehouseData, alertsData] = await Promise.all([
        getWarehouseDashboard(),
        getLowStockAlerts()
      ]);
      
      setInventoryData(warehouseData);
      setLowStockAlerts(alertsData.alerts || []);
    } catch (err) {
      console.error('Failed to load inventory data:', err);
    }
  };

  const handleTaskUpdate = useCallback((updatedTask) => {
    setTasks(prevTasks => 
      prevTasks.map(taskGroup => ({
        ...taskGroup,
        tasks: taskGroup.tasks.map(task => 
          task.id === updatedTask.id ? { ...task, ...updatedTask } : task
        )
      }))
    );
  }, []);

  const handleOrderTaskAssignment = (order) => {
    setSelectedOrder(order);
    setShowTaskAssignment(true);
  };

  const handleTasksAssigned = () => {
    setShowTaskAssignment(false);
    setSelectedOrder(null);
    loadDashboardData(true); // Refresh data
    setSuccess('Tasks assigned successfully!');
  };

  const handleOrderDetail = (order) => {
    setSelectedOrder(order);
    setShowOrderDetail(true);
  };

  const handleStockUpdated = () => {
    setShowStockEntry(false);
    loadInventoryData(); // Refresh inventory data
    setSuccess('Stock updated successfully!');
  };

  // Main content renderer based on active tab
  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return user?.role === 'warehouse_worker' ? <WorkerDashboard /> : <SupervisorDashboard />;
      
      case 'task-management':
        return canManageTasks() ? (
          <TaskManagement user={user} />
        ) : (
          <Card className="text-center py-5">
            <Card.Body>
              <FaExclamationTriangle size={50} className="text-warning mb-3" />
              <h5>Access Denied</h5>
              <p className="text-muted">You don't have permission to access task management.</p>
            </Card.Body>
          </Card>
        );
      
      case 'my-tasks':
        return user?.role === 'warehouse_worker' ? (
          <WorkerOrderTasks />
        ) : (
          <Card className="text-center py-5">
            <Card.Body>
              <FaExclamationTriangle size={50} className="text-warning mb-3" />
              <h5>Access Denied</h5>
              <p className="text-muted">This section is only available for warehouse workers.</p>
            </Card.Body>
          </Card>
        );
      
      case 'inventory':
        return canManageInventory() ? <InventoryDashboard /> : (
          <Card className="text-center py-5">
            <Card.Body>
              <FaExclamationTriangle size={50} className="text-warning mb-3" />
              <h5>Access Denied</h5>
              <p className="text-muted">You don't have permission to access inventory management.</p>
            </Card.Body>
          </Card>
        );
      
      case 'analytics':
        return canViewAnalytics() ? (
          <Card>
            <Card.Body className="text-center py-5">
              <FaChartBar size={50} className="text-muted mb-3" />
              <h5>Analytics Dashboard</h5>
              <p className="text-muted mb-4">Comprehensive warehouse analytics and reporting</p>
              <Button variant="primary" onClick={() => navigate(getAnalyticsPathForRole())}>
                View Full Analytics
              </Button>
            </Card.Body>
          </Card>
        ) : (
          <Card className="text-center py-5">
            <Card.Body>
              <FaExclamationTriangle size={50} className="text-warning mb-3" />
              <h5>Access Denied</h5>
              <p className="text-muted">You don't have permission to access analytics.</p>
            </Card.Body>
          </Card>
        );
      
      case 'workers':
        return canManageTasks() ? (
          <Card>
            <Card.Body className="text-center py-5">
              <FaUsers size={50} className="text-muted mb-3" />
              <h5>Worker Management</h5>
              <p className="text-muted mb-4">Manage warehouse workers, schedules, and assignments</p>
              <Button variant="primary" disabled>
                Coming Soon
              </Button>
            </Card.Body>
          </Card>
        ) : (
          <Card className="text-center py-5">
            <Card.Body>
              <FaExclamationTriangle size={50} className="text-warning mb-3" />
              <h5>Access Denied</h5>
              <p className="text-muted">You don't have permission to access worker management.</p>
            </Card.Body>
          </Card>
        );
      
      default:
        return (
          <Card className="text-center py-5">
            <Card.Body>
              <FaExclamationTriangle size={50} className="text-muted mb-3" />
              <h5>Page Not Found</h5>
              <p className="text-muted">The requested page could not be found.</p>
            </Card.Body>
          </Card>
        );
    }
  };

  // Worker Dashboard Component
  const WorkerDashboard = () => (
    <div>
      <Row className="mb-4">
        <Col>
          <Card className="bg-primary text-white">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h5 className="mb-1">My Active Tasks</h5>
                  <h2 className="mb-0">{tasks.filter(t => t.status === 'started').length}</h2>
                </div>
                <FaTasks size={40} className="opacity-75" />
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col>
          <Card className="bg-success text-white">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h5 className="mb-1">Completed Today</h5>
                  <h2 className="mb-0">{tasks.filter(t => t.status === 'completed').length}</h2>
                </div>
                <FaCheck size={40} className="opacity-75" />
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col>
          <Card className="bg-warning text-white">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h5 className="mb-1">Pending Tasks</h5>
                  <h2 className="mb-0">{tasks.filter(t => t.status === 'assigned').length}</h2>
                </div>
                <FaClock size={40} className="opacity-75" />
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      <Card>
        <Card.Header>
          <h5 className="mb-0">
            <FaTasks className="me-2" />
            My Tasks Overview
          </h5>
        </Card.Header>
        <Card.Body>
          <p className="text-muted">
            View and manage your assigned tasks in the "My Tasks" section.
          </p>
          <Button 
            variant="primary" 
            onClick={() => setActiveTab('my-tasks')}
          >
            View My Tasks
          </Button>
        </Card.Body>
      </Card>
    </div>
  );

  // Supervisor Dashboard Component
  const SupervisorDashboard = () => (
    <div>
      <Row className="mb-4">
        <Col md={3}>
          <Card className="bg-primary text-white">
            <Card.Body className="text-center">
              <FaBoxes size={30} className="mb-2" />
              <h6>Total Orders</h6>
              <h3>{orders.length}</h3>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="bg-success text-white">
            <Card.Body className="text-center">
              <FaTasks size={30} className="mb-2" />
              <h6>Active Tasks</h6>
              <h3>{tasks.filter(t => t.status === 'started').length}</h3>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="bg-warning text-white">
            <Card.Body className="text-center">
              <FaUsers size={30} className="mb-2" />
              <h6>Workers Online</h6>
              <h3>8</h3>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="bg-danger text-white">
            <Card.Body className="text-center">
              <FaExclamationTriangle size={30} className="mb-2" />
              <h6>Urgent Orders</h6>
              <h3>{orders.filter(o => o.urgency === 'critical').length}</h3>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row>
        <Col md={6}>
          <Card className="mb-4">
            <Card.Header>
              <h6 className="mb-0">
                <FaTasks className="me-2" />
                Task Management
              </h6>
            </Card.Header>
            <Card.Body>
              <p className="text-muted">Create and assign tasks to warehouse workers within specific orders.</p>
              <Button 
                variant="primary" 
                onClick={() => setActiveTab('task-management')}
              >
                Manage Tasks
              </Button>
            </Card.Body>
          </Card>
        </Col>
        <Col md={6}>
          <Card className="mb-4">
            <Card.Header>
              <h6 className="mb-0">
                <FaBoxes className="me-2" />
                Recent Orders
              </h6>
            </Card.Header>
            <Card.Body>
              <p className="text-muted">
                {orders.length > 0 
                  ? `${orders.length} orders ready for processing`
                  : 'No orders available'
                }
              </p>
              <Button 
                variant="outline-primary" 
                onClick={() => navigate(getOrdersPathForRole())}
              >
                View All Orders
              </Button>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );

  // Inventory Dashboard Component
  const InventoryDashboard = () => (
    <div>
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <h4>
              <FaBoxes className="me-2 text-primary" />
              Inventory Management
            </h4>
            <div className="d-flex gap-2">
              <Button 
                variant="outline-success" 
                onClick={() => navigate('/warehouse/products/new')}
              >
                <FaPlus className="me-2" />
                Add Product
              </Button>
              <Button 
                variant="outline-primary" 
                onClick={() => navigate('/warehouse/inventory/materials')}
              >
                Manage Materials
              </Button>
              <Button 
                variant="outline-warning" 
                onClick={() => navigate('/warehouse/inventory/stock-in-house')}
              >
                Update Stock In-House
              </Button>
              <Button 
                variant="primary" 
                onClick={() => setShowStockEntry(true)}
              >
                <FaPlus className="me-2" />
                Quick Stock Entry
              </Button>
            </div>
          </div>
        </Col>
      </Row>

      {lowStockAlerts.length > 0 && (
        <Alert variant="warning" className="mb-4">
          <FaExclamationTriangle className="me-2" />
          <strong>Low Stock Alert:</strong> {lowStockAlerts.length} items are running low.
        </Alert>
      )}

      <Row>
        <Col md={4}>
          <Card className="text-center">
            <Card.Body>
              <h3 className="text-primary">{inventoryData?.total_materials || 0}</h3>
              <p className="text-muted">Total Materials</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="text-center">
            <Card.Body>
              <h3 className="text-success">{inventoryData?.in_stock || 0}</h3>
              <p className="text-muted">In Stock</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="text-center">
            <Card.Body>
              <h3 className="text-danger">{lowStockAlerts.length}</h3>
              <p className="text-muted">Low Stock</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );

  if (loading) {
    return (
      <div className="warehouse-dashboard">
        <WarehouseNavbar 
          user={user}
          onLogout={onLogout}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          notifications={notifications}
          currentTime={currentTime}
        />
        <Container fluid className="d-flex justify-content-center align-items-center" style={{ minHeight: '80vh' }}>
          <div className="text-center">
            <Spinner animation="border" variant="primary" style={{ width: '3rem', height: '3rem' }} />
            <p className="mt-3 h5">Loading warehouse dashboard...</p>
          </div>
        </Container>
      </div>
    );
  }

  return (
    <div className="warehouse-dashboard" style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
      {/* Enhanced Navbar */}
      <WarehouseNavbar 
        user={user}
        onLogout={onLogout}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        notifications={notifications}
        currentTime={currentTime}
      />
      
      {/* Main Content */}
      <Container fluid className="p-4">
        {/* Alerts */}
        {error && (
          <Alert variant="danger" dismissible onClose={() => setError(null)} className="mb-4">
            <FaExclamationTriangle className="me-2" />
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert variant="success" dismissible onClose={() => setSuccess(null)} className="mb-4">
            <FaCheck className="me-2" />
            {success}
          </Alert>
        )}

        {/* Dynamic Content Based on Active Tab */}
        {renderTabContent()}
      </Container>

      {/* Modals */}
      <OrderTaskAssignment 
        show={showTaskAssignment}
        onHide={() => setShowTaskAssignment(false)}
        order={selectedOrder}
        onTasksAssigned={handleTasksAssigned}
      />

      <StockEntry 
        show={showStockEntry}
        onHide={() => setShowStockEntry(false)}
        onStockUpdated={handleStockUpdated}
      />

      <Modal 
        show={showOrderDetail} 
        onHide={() => setShowOrderDetail(false)} 
        size="lg"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Order Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedOrder && (
            <div>
              <h6>Order: {selectedOrder.order_number}</h6>
              <p>Customer: {selectedOrder.customer_name}</p>
              <p>Total: R{selectedOrder.total_amount}</p>
              <p>Status: {selectedOrder.status}</p>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowOrderDetail(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Last Update Indicator */}
      {lastUpdate && (
        <div className="position-fixed bottom-0 end-0 p-3">
          <small className="text-muted bg-white px-2 py-1 rounded shadow-sm">
            Last updated: {new Date(lastUpdate).toLocaleTimeString()}
          </small>
        </div>
      )}

      <style jsx>{`
        .warehouse-dashboard .card {
          border: none;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          transition: all 0.3s ease;
        }
        
        .warehouse-dashboard .card:hover {
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }
        
        .btn {
          transition: all 0.2s ease;
          border-radius: 8px;
        }
        
        .btn:hover {
          transform: translateY(-1px);
        }
        
        .badge {
          font-size: 0.75em;
          padding: 0.5em 0.75em;
        }
        
        @media (max-width: 768px) {
          .warehouse-dashboard .container-fluid {
            padding: 1rem !important;
          }
        }
      `}</style>
    </div>
  );
};

export default EnhancedWarehouseDashboard;