const API_BASE = process.env.REACT_APP_API_BASE || 'https://internaloox-1.onrender.com/api';

async function apiRequest(endpoint, { method = 'GET', data, isForm = false } = {}) {
  const url = `${API_BASE}${endpoint}`;
  const options = {
    method,
    headers: {},
    // credentials: 'include', // Remove this for JWT
  };
  // Add JWT token if available
  const token = localStorage.getItem('oox_token');
  if (token) {
    options.headers['Authorization'] = `Bearer ${token}`;
  }
  if (data) {
    if (isForm) {
      options.body = data;
    } else {
      options.headers['Content-Type'] = 'application/json';
      options.body = JSON.stringify(data);
    }
  }
  const res = await fetch(url, options);
  if (!res.ok) {
    let errMsg = 'Unknown error';
    let errorData = {};
    try { 
      errorData = await res.json();
      errMsg = errorData.error || errorData.detail || res.statusText;
      
      // Handle Django validation errors (field-specific errors)
      if (res.status === 400 && typeof errorData === 'object' && !errorData.error) {
        const fieldErrors = [];
        Object.keys(errorData).forEach(field => {
          const fieldErrorArray = Array.isArray(errorData[field]) ? errorData[field] : [errorData[field]];
          fieldErrorArray.forEach(error => {
            fieldErrors.push(`${field}: ${error}`);
          });
        });
        if (fieldErrors.length > 0) {
          errMsg = fieldErrors.join('; ');
        }
      }
      
      // For validation errors, provide more context
      if (res.status === 400 && errorData.required_fields) {
        errMsg += ` (Required: ${errorData.required_fields.join(', ')})`;
      }
      if (res.status === 400 && errorData.valid_roles) {
        errMsg += ` (Valid roles: ${errorData.valid_roles.join(', ')})`;
      }
      if (res.status === 403 && errorData.required_role) {
        errMsg += ` (Required role: ${errorData.required_role})`;
      }
    } catch {}
    
    // Create enhanced error object
    const error = new Error(errMsg);
    error.status = res.status;
    error.data = errorData;
    throw error;
  }
  return res.json();
}

// Orders
export const getOrders = () => apiRequest('/orders/');
export const getOrder = (id) => apiRequest(`/orders/${id}/`);
export const createOrder = (data) => apiRequest('/orders/', { method: 'POST', data });
export const updateOrder = (id, data) => apiRequest(`/orders/${id}/`, { method: 'PUT', data });
export const deleteOrder = (id) => apiRequest(`/orders/${id}/`, { method: 'DELETE' });
// Order workflow helpers
export const getWorkflowDashboard = () => apiRequest('/orders/workflow_dashboard/');
export const getOrderManagementData = () => apiRequest('/orders/management_data/');
export const getOrderStatusOptions = () => apiRequest('/orders/status_options/');
export const advanceOrderWorkflow = (orderId) => apiRequest(`/orders/${orderId}/advance_workflow/`, { method: 'POST' });
export const assignOrder = (orderId, assignment_type, assigned_user_id) => 
  apiRequest(`/orders/${orderId}/assign/`, { method: 'POST', data: { assignment_type, assigned_user_id } });
export const patchOrderStatus = (orderId, data) => apiRequest(`/orders/${orderId}/update_status/`, { method: 'PATCH', data });
export const cancelOrder = (orderId, reason) => apiRequest(`/orders/${orderId}/cancel/`, { method: 'POST', data: { reason } });
// Payments dashboard and updates
export const getPaymentsDashboard = () => apiRequest('/orders/payments_dashboard/');
export const updateOrderPayment = (orderId, data) => apiRequest(`/orders/${orderId}/update_payment/`, { method: 'PATCH', data });
export const markPaymentOverdue = (orderId) => apiRequest(`/orders/${orderId}/mark_overdue/`, { method: 'POST' });

// Role dashboards
export const getOwnerOrdersDashboard = () => apiRequest('/orders/owner_dashboard/');
export const getAdminOrdersDashboard = () => apiRequest('/orders/admin_dashboard/');
export const getWarehouseOrdersDashboard = () => apiRequest('/orders/warehouse_dashboard/');
export const getDeliveryOrdersDashboard = () => apiRequest('/orders/delivery_dashboard/');
export const getAdminWarehouseOverview = () => apiRequest('/orders/admin_warehouse_overview/');

// Customers
export const getCustomers = () => apiRequest('/customers/');
export const createCustomer = (data) => apiRequest('/customers/', { method: 'POST', data });
export const updateCustomer = (id, data) => apiRequest(`/customers/${id}/`, { method: 'PUT', data });
export const deleteCustomer = (id) => apiRequest(`/customers/${id}/`, { method: 'DELETE' });

// Payments (PaymentProofs)
export const getPayments = () => apiRequest('/payment-proofs/');
export const createPayment = (data, isForm = false) => apiRequest('/payment-proofs/', { method: 'POST', data, isForm });
export const updatePayment = (id, data, isForm = false) => apiRequest(`/payment-proofs/${id}/`, { method: 'PUT', data, isForm });
export const deletePayment = (id) => apiRequest(`/payment-proofs/${id}/`, { method: 'DELETE' });

// Dashboard stats
export const getDashboardStats = () => apiRequest('/dashboard-stats/');
// Users
export const getUsers = () => apiRequest('/users/users/');
export const getUsersQuery = (query = '') => {
  const qs = query ? (query.startsWith('?') ? query : `?${query}`) : '';
  return apiRequest(`/users/users/${qs}`);
};
// Optional helper to fetch tasks filtered by worker (requires backend support)
export const getTasksByWorker = (workerId) => apiRequest(`/tasks/tasks/?assigned_worker=${workerId}`);

/**
 * Create a new user with enhanced security and validation
 * 
 * Endpoint: POST /api/users/users/
 * Authorization: Bearer token required
 * Access Control: Only users with 'owner' role can create users
 * 
 * @param {Object} data - User creation data
 * @param {string} data.username - Required: Unique username
 * @param {string} data.password - Required: User password
 * @param {string} data.password_confirm - Required: Password confirmation
 * @param {string} [data.email] - Optional: Unique email address
 * @param {string} [data.role='delivery'] - Optional: User role (owner, admin, warehouse, delivery)
 * @param {string} [data.first_name] - Optional: First name
 * @param {string} [data.last_name] - Optional: Last name
 * @param {string} [data.phone] - Optional: Phone number
 * 
 * @returns {Promise<Object>} Enhanced response with user data
 * @example
 * {
 *   "success": true,
 *   "message": "User \"john_doe\" created successfully",
 *   "user": {
 *     "id": 9,
 *     "username": "john_doe",
 *     "email": "john@example.com",
 *     "role": "admin",
 *     "role_display": "Admin",
 *     "date_joined": "2025-07-22T15:30:00Z"
 *   }
 * }
 */
export const createUser = (data) => apiRequest('/users/users/', { method: 'POST', data });

export const updateUser = (id, data) => apiRequest(`/users/users/${id}/`, { method: 'PUT', data });
export const deleteUser = (id) => apiRequest(`/users/users/${id}/`, { method: 'DELETE' });

// Products
export const getProducts = () => apiRequest('/products/');
export const getColors = () => apiRequest('/colors/');
export const getFabrics = () => apiRequest('/fabrics/');
export const createProduct = (data) => apiRequest('/products/', { method: 'POST', data });

// MVP: Reference Boards
export const getColorReferences = () => apiRequest('/color-references/');
export const getFabricReferences = () => apiRequest('/fabric-references/');

// Production Status Updates
export const updateProductionStatus = (orderId, data) => apiRequest(`/orders/${orderId}/update_production_status/`, { method: 'POST', data });
export const updateOrderStatus = (orderId, data) => apiRequest(`/orders/${orderId}/update_status/`, { method: 'POST', data });

// Order Items
export const getOrderItems = (orderId = null) => {
    const endpoint = orderId ? `/order-items/?order=${orderId}` : '/order-items/';
    return apiRequest(endpoint);
};
export const createOrderItem = (data) => apiRequest('/order-items/', { method: 'POST', data });
export const updateOrderItem = (id, data) => apiRequest(`/order-items/${id}/`, { method: 'PUT', data });
export const deleteOrderItem = (id) => apiRequest(`/order-items/${id}/`, { method: 'DELETE' });

// =====================================
// WAREHOUSE DASHBOARD API ENDPOINTS
// =====================================

// Task Management System
export const getTasks = () => apiRequest('/tasks/tasks/');
export const getTask = (id) => apiRequest(`/tasks/tasks/${id}/`);
export const createTask = (data) => apiRequest('/tasks/tasks/', { method: 'POST', data });
// Moved updateTask and deleteTask functions to avoid duplication

// Task Actions (Start/Pause/Resume/Complete)
export const taskAction = (taskId, action, data = {}) => 
  apiRequest(`/tasks/tasks/${taskId}/perform_action/`, { method: 'POST', data: { action, ...data } });

// Worker Dashboard
export const getWorkerDashboard = () => apiRequest('/tasks/dashboard/worker_dashboard/');
export const quickStartNextTask = () => apiRequest('/tasks/dashboard/quick_start_next_task/', { method: 'POST' });
export const quickPauseActiveTask = (data = {}) => apiRequest('/tasks/dashboard/quick_pause_active_task/', { method: 'POST', data });
export const quickCompleteActiveTask = (data = {}) => apiRequest('/tasks/dashboard/quick_complete_active_task/', { method: 'POST', data });
export const getMyTasks = () => apiRequest('/tasks/tasks/my_tasks/');
export const workerAction = (taskId, action, data = {}) => 
  apiRequest(`/tasks/tasks/${taskId}/worker_action/`, { method: 'POST', data: { action, ...data } });
export const getTasksByOrder = () => apiRequest('/tasks/dashboard/tasks_by_order/');

// Supervisor Dashboard  
export const getSupervisorDashboard = () => apiRequest('/tasks/dashboard/supervisor_dashboard/');
export const quickTaskAssign = (data) => apiRequest('/tasks/dashboard/quick_task_assign/', { method: 'POST', data });
export const getTaskAssignmentData = () => apiRequest('/tasks/dashboard/task_assignment_data/');
// Moved getRealTimeUpdates function to avoid duplication

// Notifications
export const getUnreadNotifications = async () => {
  const data = await apiRequest('/tasks/notifications/');
  // Normalize and filter unread
  const items = Array.isArray(data) ? data : (Array.isArray(data?.results) ? data.results : []);
  return items.filter(n => !n.is_read);
};
export const markNotificationRead = (id) => apiRequest(`/tasks/notifications/${id}/mark_read/`, { method: 'POST' });
export const markAllNotificationsRead = () => apiRequest('/tasks/notifications/mark_all_read/', { method: 'POST' });

// Order-Task Management
export const getWarehouseOrders = () => apiRequest('/orders/warehouse_orders/');
export const getOrderDetailsForTasks = (orderId) => apiRequest(`/orders/${orderId}/order_details_for_tasks/`);
export const assignTasksToOrder = (orderId, data) => 
  apiRequest(`/orders/${orderId}/assign_tasks_to_order/`, { method: 'POST', data });

// Inventory Management
export const getMaterials = () => apiRequest('/inventory/materials/');
export const getMaterial = (id) => apiRequest(`/inventory/materials/${id}/`);
export const createMaterial = (data) => apiRequest('/inventory/materials/', { method: 'POST', data });
export const updateMaterial = (id, data) => apiRequest(`/inventory/materials/${id}/`, { method: 'PUT', data });
export const deleteMaterial = (id) => apiRequest(`/inventory/materials/${id}/`, { method: 'DELETE' });

// Warehouse Inventory Dashboard
export const getWarehouseDashboard = () => apiRequest('/inventory/materials/warehouse_dashboard/');
export const quickStockEntry = (data) => apiRequest('/inventory/materials/quick_stock_entry/', { method: 'POST', data });
export const getStockLocations = () => apiRequest('/inventory/materials/stock_locations/');
export const getLowStockAlerts = () => apiRequest('/inventory/materials/low_stock/');

// Stock Movements
export const getStockMovements = () => apiRequest('/inventory/stock-movements/');
export const createStockMovement = (data) => apiRequest('/inventory/stock-movements/', { method: 'POST', data });

// Material Categories & Suppliers
export const getMaterialCategories = () => apiRequest('/inventory/material-categories/');
export const getSuppliers = () => apiRequest('/inventory/suppliers/');

// Task Types and Templates
// Moved getTaskTypes function to avoid duplication
// Moved getTaskTemplates function to avoid duplication

// Worker Productivity
export const getWorkerProductivity = (workerId = null) => {
  const endpoint = workerId ? `/tasks/productivity/${workerId}/` : '/tasks/productivity/';
  return apiRequest(endpoint);
};

// Time Tracking
export const getTaskTimeSessions = (taskId) => apiRequest(`/tasks/tasks/${taskId}/time_sessions/`);
export const startTaskTimer = (taskId) => apiRequest(`/tasks/tasks/${taskId}/start_timer/`, { method: 'POST' });
export const pauseTaskTimer = (taskId) => apiRequest(`/tasks/tasks/${taskId}/pause_timer/`, { method: 'POST' });
export const resumeTaskTimer = (taskId) => apiRequest(`/tasks/tasks/${taskId}/resume_timer/`, { method: 'POST' });
export const stopTaskTimer = (taskId) => apiRequest(`/tasks/tasks/${taskId}/stop_timer/`, { method: 'POST' });

// Real-time Updates (WebSocket fallback with polling)
export const pollForUpdates = (lastUpdate = null) => {
  const endpoint = lastUpdate ? `/tasks/dashboard/updates/?since=${lastUpdate}` : '/tasks/dashboard/updates/';
  return apiRequest(endpoint);
};

export const getRealTimeUpdates = (params = '') => {
  return apiRequest(`/tasks/dashboard/real_time_updates/${params}`);
};

// Task Management API Endpoints
export const getTaskTypes = () => apiRequest('/tasks/task_types/');
export const getTaskTemplates = () => apiRequest('/tasks/templates/');
export const createTaskInOrder = (orderId, taskData) => 
  apiRequest(`/orders/${orderId}/create_task/`, { method: 'POST', data: taskData });
export const updateTask = (taskId, taskData) => 
  apiRequest(`/tasks/tasks/${taskId}/`, { method: 'PUT', data: taskData });
export const deleteTask = (taskId) => 
  apiRequest(`/tasks/tasks/${taskId}/`, { method: 'DELETE' });
export const getTasksByStatus = (status) => {
  if (!status || status === 'all') return apiRequest('/tasks/tasks/');
  return apiRequest(`/tasks/tasks/?status=${status}`);
};
export const assignWorkerToTask = (taskId, workerId) => 
  apiRequest(`/tasks/tasks/${taskId}/assign_worker/`, { method: 'POST', data: { worker_id: workerId } });
export const bulkAssignTasks = (taskIds, workerId) => 
  apiRequest('/tasks/tasks/bulk_assign/', { method: 'POST', data: { task_ids: taskIds, worker_id: workerId } });

// Utility Functions for Warehouse Dashboard
export const warehouseAPI = {
  // Get complete dashboard data based on user role
  getDashboardData: async (userRole) => {
    switch (userRole) {
      case 'warehouse_manager':
        return await getSupervisorDashboard();
      case 'warehouse':
      case 'warehouse_worker':
        return await getWorkerDashboard();
      case 'admin':
      case 'owner':
        return await getSupervisorDashboard();
      default:
        return await getWorkerDashboard();
    }
  },

  // Handle task actions with error handling
  handleTaskAction: async (taskId, action, additionalData = {}) => {
    try {
      const result = await taskAction(taskId, action, additionalData);
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Get orders ready for task assignment
  getOrdersForTaskAssignment: async () => {
    const orders = await getWarehouseOrders();
    return orders.filter(order => 
      order.production_status === 'not_started' || 
      order.production_status === 'in_production'
    );
  },

  // Assign multiple tasks to an order
  assignOrderTasks: async (orderId, tasks) => {
    try {
      const result = await assignTasksToOrder(orderId, { tasks });
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Get real-time dashboard updates
  getUpdates: async (lastUpdateTime = null) => {
    try {
      const updates = await pollForUpdates(lastUpdateTime);
      return { success: true, data: updates };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}; 

// Approval Queue (manager/admin)
export const getPendingApprovalTasks = async () => {
  try {
    // Preferred: status filter
    const res = await apiRequest(`/tasks/tasks/?status=pending_review`);
    return Array.isArray(res?.results) ? res.results : (Array.isArray(res) ? res : []);
  } catch (e) {
    // Fallback endpoint if provided by backend
    try {
      const res2 = await apiRequest(`/tasks/tasks/pending_approval/`);
      return Array.isArray(res2?.results) ? res2.results : (Array.isArray(res2) ? res2 : []);
    } catch {
      return [];
    }
  }
};
export const managerAction = (taskId, action, data = {}) => 
  apiRequest(`/tasks/tasks/${taskId}/manager_action/`, { method: 'POST', data: { action, ...data } }); 