import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Container, Row, Col, Card, Button, Badge, 
  Alert, Modal, Tabs, Tab, Spinner, Form
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
import TaskCard from '../components/warehouse/TaskCard';
import OrderTaskAssignment from '../components/warehouse/OrderTaskAssignment';
import StockEntry from '../components/warehouse/StockEntry';

const WarehouseDashboard = ({ user, onLogout }) => {
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
  
  // UI State
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showTaskAssignment, setShowTaskAssignment] = useState(false);
  const [showOrderDetail, setShowOrderDetail] = useState(false);
  const [showStockEntry, setShowStockEntry] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');

  // Real-time clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Initial data load
  useEffect(() => {
    loadDashboardData();
  }, [user]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      loadDashboardData(true); // Silent refresh
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    
    try {
      const userRole = user?.role || 'warehouse';
      
      // Load data based on user role
      if (userRole === 'warehouse') {
        await loadWorkerDashboard();
      } else if (userRole === 'admin' || userRole === 'owner') {
        await loadSupervisorDashboard();
      }
      
      // Load notifications for all users
      await loadNotifications();
      
      // Load inventory data
      await loadInventoryData();
      
      setLastUpdate(new Date());
    } catch (err) {
      console.error('Dashboard load error:', err);
      setError('Failed to load dashboard data: ' + err.message);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const loadWorkerDashboard = async () => {
    try {
      const [dashboardResult, tasksResult] = await Promise.all([
        warehouseAPI.getDashboardData('warehouse'),
        getTasksByOrder()
      ]);
      
      setDashboardData(dashboardResult);
      setTasks(tasksResult.orders_with_tasks || []);
    } catch (err) {
      throw new Error('Failed to load worker dashboard');
    }
  };

  const loadSupervisorDashboard = async () => {
    try {
      const [dashboardResult, ordersResult] = await Promise.all([
        warehouseAPI.getDashboardData('admin'),
        getWarehouseOrders()
      ]);
      
      setDashboardData(dashboardResult);
      setOrders(ordersResult);
    } catch (err) {
      throw new Error('Failed to load supervisor dashboard');
    }
  };

  const loadNotifications = async () => {
    try {
      const notificationsResult = await getUnreadNotifications();
      setNotifications(notificationsResult.slice(0, 5)); // Show top 5
    } catch (err) {
      console.error('Failed to load notifications:', err);
    }
  };

  const loadInventoryData = async () => {
    try {
      const [inventoryResult, lowStockResult] = await Promise.all([
        getWarehouseDashboard(),
        getLowStockAlerts()
      ]);
      
      setInventoryData(inventoryResult);
      setLowStockAlerts(lowStockResult.slice(0, 10)); // Show top 10 alerts
    } catch (err) {
      console.error('Failed to load inventory data:', err);
    }
  };

  const handleTaskUpdate = useCallback((updatedTask) => {
    setTasks(prevTasks => 
      prevTasks.map(orderTask => ({
        ...orderTask,
        tasks: orderTask.tasks.map(task => 
          task.id === updatedTask.id ? updatedTask : task
        )
      }))
    );
    
    // Show success message
    setSuccess(`Task "${updatedTask.title}" updated successfully`);
    setTimeout(() => setSuccess(null), 3000);
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
    setTimeout(() => setSuccess(null), 3000);
  };

  const handleOrderDetail = (order) => {
    setSelectedOrder(order);
    setShowOrderDetail(true);
  };

  const handleStockUpdated = () => {
    loadInventoryData(); // Refresh inventory data
    setSuccess('Stock updated successfully!');
    setTimeout(() => setSuccess(null), 3000);
  };

  // Filter functions
  const filterTasks = (orderTasks) => {
    return orderTasks.filter(orderTask => {
      const filteredTasks = orderTask.tasks.filter(task => {
        const statusMatch = filterStatus === 'all' || task.status === filterStatus;
        const priorityMatch = filterPriority === 'all' || task.priority === filterPriority;
        return statusMatch && priorityMatch;
      });
      return filteredTasks.length > 0;
    }).map(orderTask => ({
      ...orderTask,
      tasks: orderTask.tasks.filter(task => {
        const statusMatch = filterStatus === 'all' || task.status === filterStatus;
        const priorityMatch = filterPriority === 'all' || task.priority === filterPriority;
        return statusMatch && priorityMatch;
      })
    }));
  };

  const filterOrders = (orders) => {
    if (filterStatus === 'all') return orders;
    return orders.filter(order => order.production_status === filterStatus);
  };

  // Dashboard Header Component
  const DashboardHeader = () => (
    <div className="warehouse-header mb-4 p-4 rounded" style={{
      background: 'linear-gradient(135deg, #1f2937 0%, #374151 100%)',
      border: '3px solid #10b981',
      color: 'white'
    }}>
      <Row className="align-items-center">
        <Col md={8}>
          <div className="d-flex align-items-center mb-2">
            <div className="me-3 p-3 rounded-circle" style={{ backgroundColor: '#10b981' }}>
              <FaWrench size={30} />
            </div>
            <div>
              <h2 className="mb-1">OOX Warehouse Dashboard</h2>
              <p className="mb-0 text-light">
                {user?.first_name || 'Worker'} • {user?.role?.toUpperCase()} • 
                {currentTime.toLocaleString()}
              </p>
            </div>
          </div>
        </Col>
        <Col md={4} className="text-end">
          <div className="d-flex justify-content-end gap-2">
            <Button 
              variant="outline-light" 
              onClick={() => loadDashboardData()}
              disabled={loading}
            >
              <FaSync className={loading ? 'fa-spin' : ''} />
            </Button>
            {notifications.length > 0 && (
              <Button variant="warning" className="position-relative">
                <FaBell />
                <Badge 
                  bg="danger" 
                  className="position-absolute top-0 start-100 translate-middle rounded-pill"
                >
                  {notifications.length}
                </Badge>
              </Button>
            )}
          </div>
        </Col>
      </Row>
      
      {/* Quick Stats */}
      {dashboardData && (
        <Row className="mt-3">
          <Col xs={6} md={3}>
            <div className="text-center">
              <div className="h4 mb-0">{dashboardData.active_tasks || 0}</div>
              <small>Active Tasks</small>
            </div>
          </Col>
          <Col xs={6} md={3}>
            <div className="text-center">
              <div className="h4 mb-0">{dashboardData.pending_orders || 0}</div>
              <small>Pending Orders</small>
            </div>
          </Col>
          <Col xs={6} md={3}>
            <div className="text-center">
              <div className="h4 mb-0">{dashboardData.completed_today || 0}</div>
              <small>Completed Today</small>
            </div>
          </Col>
          <Col xs={6} md={3}>
            <div className="text-center">
              <div className="h4 mb-0">{dashboardData.total_workers || 0}</div>
              <small>Active Workers</small>
            </div>
          </Col>
        </Row>
      )}
    </div>
  );

  // Worker Dashboard View
  const WorkerDashboard = () => (
    <div>
      {/* Active Task Timer */}
      {dashboardData?.active_task && (
        <Card className="mb-4 border-success">
          <Card.Header className="bg-success text-white">
            <h5 className="mb-0">
              <FaClock className="me-2" />
              Currently Working On
            </h5>
          </Card.Header>
          <Card.Body>
            <TaskCard 
              task={dashboardData.active_task}
              onTaskUpdate={handleTaskUpdate}
              showOrderInfo={true}
              compact={false}
            />
          </Card.Body>
        </Card>
      )}

      {/* My Tasks by Order */}
      <Card>
        <Card.Header className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0">
            <FaTasks className="me-2" />
            My Tasks by Order
          </h5>
          <div className="d-flex gap-2">
            <Form.Select 
              size="sm" 
              value={filterStatus} 
              onChange={(e) => setFilterStatus(e.target.value)}
              style={{ width: 'auto' }}
            >
              <option value="all">All Status</option>
              <option value="assigned">Assigned</option>
              <option value="started">Started</option>
              <option value="paused">Paused</option>
              <option value="completed">Completed</option>
            </Form.Select>
            <Form.Select 
              size="sm" 
              value={filterPriority} 
              onChange={(e) => setFilterPriority(e.target.value)}
              style={{ width: 'auto' }}
            >
              <option value="all">All Priority</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </Form.Select>
          </div>
        </Card.Header>
        <Card.Body>
          {filterTasks(tasks).length === 0 ? (
            <div className="text-center py-5 text-muted">
              <FaTasks size={50} className="mb-3" />
              <p>No tasks found matching your filters</p>
            </div>
          ) : (
            filterTasks(tasks).map(orderTask => (
              <div key={orderTask.order_info.id} className="mb-4">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h6 className="text-primary mb-0">
                    <FaBoxes className="me-2" />
                    {orderTask.order_info.order_number} - {orderTask.order_info.customer_name}
                  </h6>
                  <Badge bg={orderTask.order_info.urgency === 'high' ? 'danger' : 'info'}>
                    {orderTask.order_info.urgency?.toUpperCase() || 'NORMAL'}
                  </Badge>
                </div>
                <Row>
                  {orderTask.tasks.map(task => (
                    <Col md={6} lg={4} key={task.id} className="mb-3">
                      <TaskCard 
                        task={task}
                        onTaskUpdate={handleTaskUpdate}
                        showOrderInfo={false}
                        compact={true}
                      />
                    </Col>
                  ))}
                </Row>
              </div>
            ))
          )}
        </Card.Body>
      </Card>
    </div>
  );

  // Supervisor Dashboard View
  const SupervisorDashboard = () => (
    <div>
      {/* Orders for Task Assignment */}
      <Card className="mb-4">
        <Card.Header className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0">
            <FaBoxes className="me-2" />
            Orders Ready for Task Assignment
          </h5>
          <Form.Select 
            size="sm" 
            value={filterStatus} 
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{ width: 'auto' }}
          >
            <option value="all">All Orders</option>
            <option value="not_started">Not Started</option>
            <option value="in_production">In Production</option>
            <option value="ready_for_delivery">Ready for Delivery</option>
          </Form.Select>
        </Card.Header>
        <Card.Body>
          {filterOrders(orders).length === 0 ? (
            <div className="text-center py-5 text-muted">
              <FaBoxes size={50} className="mb-3" />
              <p>No orders found</p>
            </div>
          ) : (
            <Row>
              {filterOrders(orders).map(order => (
                <Col md={6} lg={4} key={order.id} className="mb-3">
                  <Card className="h-100 border-start border-4 border-primary">
                    <Card.Body>
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <h6 className="mb-0">{order.order_number}</h6>
                        <Badge bg={
                          order.production_status === 'not_started' ? 'secondary' :
                          order.production_status === 'in_production' ? 'warning' : 'success'
                        }>
                          {order.production_status?.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </div>
                      <p className="text-muted mb-2">{order.customer_name}</p>
                      <p className="small text-muted mb-3">
                        Due: {order.delivery_deadline || 'No deadline'}
                      </p>
                      <div className="d-grid gap-2">
                        <Button 
                          variant="primary" 
                          size="sm"
                          onClick={() => handleOrderTaskAssignment(order)}
                        >
                          <FaPlus className="me-1" />
                          Assign Tasks
                        </Button>
                        <Button 
                          variant="outline-primary" 
                          size="sm"
                          onClick={() => handleOrderDetail(order)}
                        >
                          <FaEye className="me-1" />
                          View Details
                        </Button>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          )}
        </Card.Body>
      </Card>

      {/* Worker Overview */}
      {dashboardData?.workers && (
        <Card>
          <Card.Header>
            <h5 className="mb-0">
              <FaUsers className="me-2" />
              Worker Overview
            </h5>
          </Card.Header>
          <Card.Body>
            <Row>
              {dashboardData.workers.map(worker => (
                <Col md={6} lg={4} key={worker.id} className="mb-3">
                  <Card className="border-0 bg-light">
                    <Card.Body className="text-center">
                      <h6>{worker.name}</h6>
                      <Badge bg={worker.active_task ? 'success' : 'secondary'}>
                        {worker.active_task ? 'Working' : 'Available'}
                      </Badge>
                      {worker.active_task && (
                        <p className="small text-muted mt-2 mb-0">
                          {worker.active_task.title}
                        </p>
                      )}
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          </Card.Body>
        </Card>
      )}
         </div>
   );

   // Inventory Dashboard View
   const InventoryDashboard = () => (
     <div>
       {/* Quick Actions */}
       <Card className="mb-4">
         <Card.Header className="d-flex justify-content-between align-items-center">
           <h5 className="mb-0">
             <FaBoxes className="me-2" />
             Inventory Management
           </h5>
           <Button 
             variant="primary"
             onClick={() => setShowStockEntry(true)}
           >
             <FaPlus className="me-2" />
             Quick Stock Entry
           </Button>
         </Card.Header>
         <Card.Body>
           <Row>
             <Col md={3}>
               <div className="text-center p-3 bg-light rounded">
                 <h4 className="text-primary mb-1">{inventoryData?.total_materials || 0}</h4>
                 <small className="text-muted">Total Materials</small>
               </div>
             </Col>
             <Col md={3}>
               <div className="text-center p-3 bg-light rounded">
                 <h4 className="text-success mb-1">{inventoryData?.total_stock_value || 0}</h4>
                 <small className="text-muted">Total Stock Value</small>
               </div>
             </Col>
             <Col md={3}>
               <div className="text-center p-3 bg-light rounded">
                 <h4 className="text-warning mb-1">{inventoryData?.low_stock_count || 0}</h4>
                 <small className="text-muted">Low Stock Items</small>
               </div>
             </Col>
             <Col md={3}>
               <div className="text-center p-3 bg-light rounded">
                 <h4 className="text-info mb-1">{inventoryData?.locations_count || 0}</h4>
                 <small className="text-muted">Storage Locations</small>
               </div>
             </Col>
           </Row>
         </Card.Body>
       </Card>

       {/* Low Stock Alerts */}
       {lowStockAlerts.length > 0 && (
         <Card className="mb-4">
           <Card.Header className="bg-warning text-dark">
             <h6 className="mb-0">
               <FaExclamationTriangle className="me-2" />
               Low Stock Alerts ({lowStockAlerts.length})
             </h6>
           </Card.Header>
           <Card.Body>
             <Row>
               {lowStockAlerts.map(alert => (
                 <Col md={6} lg={4} key={alert.id} className="mb-3">
                   <Card className="border-warning">
                     <Card.Body className="p-3">
                       <h6 className="mb-1">{alert.material_name}</h6>
                       <div className="d-flex justify-content-between align-items-center">
                         <small className="text-muted">
                           Current: {alert.current_stock} {alert.unit}
                         </small>
                         <Badge bg="warning">
                           Min: {alert.minimum_stock}
                         </Badge>
                       </div>
                       <div className="mt-2">
                         <small className="text-muted">
                           <FaMapMarkerAlt className="me-1" />
                           {alert.location || 'Multiple locations'}
                         </small>
                       </div>
                     </Card.Body>
                   </Card>
                 </Col>
               ))}
             </Row>
           </Card.Body>
         </Card>
       )}

       {/* Recent Stock Movements */}
       {inventoryData?.recent_movements && (
         <Card>
           <Card.Header>
             <h6 className="mb-0">Recent Stock Movements</h6>
           </Card.Header>
           <Card.Body>
             {inventoryData.recent_movements.length === 0 ? (
               <div className="text-center py-4 text-muted">
                 <FaBoxes size={40} className="mb-3" />
                 <p>No recent stock movements</p>
               </div>
             ) : (
               <div className="table-responsive">
                 <table className="table table-sm">
                   <thead>
                     <tr>
                       <th>Material</th>
                       <th>Type</th>
                       <th>Quantity</th>
                       <th>Location</th>
                       <th>Date</th>
                       <th>User</th>
                     </tr>
                   </thead>
                   <tbody>
                     {inventoryData.recent_movements.map(movement => (
                       <tr key={movement.id}>
                         <td>{movement.material_name}</td>
                         <td>
                           <Badge bg={movement.movement_type === 'in' ? 'success' : 'warning'}>
                             {movement.movement_type.toUpperCase()}
                           </Badge>
                         </td>
                         <td>
                           {movement.movement_type === 'in' ? '+' : '-'}{movement.quantity}
                         </td>
                         <td>{movement.location_name}</td>
                         <td>{new Date(movement.created_at).toLocaleDateString()}</td>
                         <td>{movement.user_name}</td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
             )}
           </Card.Body>
         </Card>
       )}
     </div>
   );

   if (loading) {
    return (
      <Container fluid className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
        <div className="text-center">
          <Spinner animation="border" variant="primary" style={{ width: '3rem', height: '3rem' }} />
          <p className="mt-3 h5">Loading warehouse dashboard...</p>
        </div>
      </Container>
    );
  }

  return (
    <Container fluid className="warehouse-dashboard p-4" style={{ 
      backgroundColor: '#f8f9fa', 
      minHeight: '100vh' 
    }}>
      <DashboardHeader />

      {/* Error/Success Alerts */}
      {error && (
        <Alert variant="danger" dismissible onClose={() => setError(null)} className="mb-4">
          {error}
        </Alert>
      )}
      {success && (
        <Alert variant="success" dismissible onClose={() => setSuccess(null)} className="mb-4">
          {success}
        </Alert>
      )}

      {/* Main Dashboard Content */}
      <Tabs 
        activeKey={activeTab} 
        onSelect={setActiveTab}
        className="mb-4"
      >
        <Tab eventKey="overview" title={
          <span>
            <FaChartBar className="me-2" />
            Overview
          </span>
        }>
          {user?.role === 'warehouse' ? <WorkerDashboard /> : <SupervisorDashboard />}
        </Tab>
        
        <Tab eventKey="inventory" title={
          <span>
            <FaBoxes className="me-2" />
            Inventory
            {lowStockAlerts.length > 0 && (
              <Badge bg="danger" className="ms-2">
                {lowStockAlerts.length}
              </Badge>
            )}
          </span>
        }>
          <InventoryDashboard />
        </Tab>
        
        {(user?.role === 'admin' || user?.role === 'owner') && (
          <Tab eventKey="analytics" title={
            <span>
              <FaChartBar className="me-2" />
              Analytics
            </span>
          }>
            <Card>
              <Card.Body className="text-center py-5">
                <FaChartBar size={50} className="text-muted mb-3" />
                <p className="text-muted">Analytics dashboard coming soon...</p>
                <Button variant="outline-primary" onClick={() => navigate('/analytics')}>
                  View Full Analytics
                </Button>
              </Card.Body>
            </Card>
          </Tab>
        )}
      </Tabs>

             {/* Task Assignment Modal */}
       <OrderTaskAssignment 
         show={showTaskAssignment}
         onHide={() => setShowTaskAssignment(false)}
         order={selectedOrder}
         onTasksAssigned={handleTasksAssigned}
       />

       {/* Stock Entry Modal */}
       <StockEntry 
         show={showStockEntry}
         onHide={() => setShowStockEntry(false)}
         onStockUpdated={handleStockUpdated}
       />

      {/* Order Detail Modal */}
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
              <p>Due: {selectedOrder.delivery_deadline || 'No deadline'}</p>
              <p>Status: {selectedOrder.production_status}</p>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowOrderDetail(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Real-time update indicator */}
      {lastUpdate && (
        <div className="position-fixed bottom-0 end-0 p-3">
          <small className="text-muted">
            Last updated: {lastUpdate.toLocaleTimeString()}
          </small>
        </div>
      )}

      <style jsx>{`
        .warehouse-dashboard {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        }
        
        .warehouse-header {
          animation: slideInDown 0.6s ease-out;
        }
        
        @keyframes slideInDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .card {
          transition: all 0.3s ease;
          border: none;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .card:hover {
          transform: translateY(-2px);
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
        
        .nav-tabs .nav-link {
          border-radius: 8px 8px 0 0;
          border: none;
          color: #6c757d;
        }
        
        .nav-tabs .nav-link.active {
          background-color: #fff;
          border-bottom: 3px solid #0d6efd;
          color: #0d6efd;
          font-weight: 600;
        }
        
        @media (max-width: 768px) {
          .warehouse-header {
            padding: 1rem !important;
          }
          
          .warehouse-header h2 {
            font-size: 1.5rem;
          }
        }
      `}</style>
    </Container>
  );
};

export default WarehouseDashboard; 