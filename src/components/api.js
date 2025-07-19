const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:8000/api';

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
    try { errMsg = (await res.json()).detail || res.statusText; } catch {}
    throw new Error(errMsg);
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
export const createUser = (data) => apiRequest('/users/users/', { method: 'POST', data });
export const updateUser = (id, data) => apiRequest(`/users/users/${id}/`, { method: 'PUT', data });
export const deleteUser = (id) => apiRequest(`/users/users/${id}/`, { method: 'DELETE' });

// Products
export const getProducts = () => apiRequest('/products/');
export const getColors = () => apiRequest('/colors/');
export const getFabrics = () => apiRequest('/fabrics/'); 