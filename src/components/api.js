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