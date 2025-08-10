import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Container, Alert } from 'react-bootstrap';
import AdminDashboard from './components/admin/AdminDashboard';
import EnhancedWarehouseDashboard from './pages/EnhancedWarehouseDashboard';
import DeliveryDashboard from './pages/DeliveryDashboard';
import OwnerDashboard from './pages/OwnerDashboard';
import Orders from './pages/Orders';
import Customers from './pages/Customers';
import Users from './pages/Users';
import Payments from './pages/Payments';
import Deliveries from './pages/Deliveries';
import Analytics from './pages/Analytics';
import LoginPage from './pages/LoginPage';
import AddProduct from './pages/AddProduct';
import InventoryManagement from './pages/InventoryManagement';
import StockInHouse from './pages/StockInHouse';
import './App.css';
import './styles/MobileFirst.css';
import { WarehouseProvider } from './contexts/WarehouseContext';
import WarehouseLayout from './layouts/WarehouseLayout';
import WarehouseProducts from './pages/WarehouseProducts';
import WarehouseStock from './pages/WarehouseStock';
import WarehouseWorkers from './pages/WarehouseWorkers';
import WorkerDashboard from './pages/WorkerDashboard';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check if user is logged in from localStorage
    const savedUser = localStorage.getItem('oox_user');
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
      } catch (error) {
        console.error('Error parsing saved user:', error);
        localStorage.removeItem('oox_user');
        setError('Session expired. Please login again.');
      }
    }
    setLoading(false);
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    setError(null);
    localStorage.setItem('oox_user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    setError(null);
    localStorage.removeItem('oox_user');
    localStorage.removeItem('oox_token');
  };

  const ProtectedRoute = ({ children, allowedRoles }) => {
    if (!user) {
      return <Navigate to="/login" replace />;
    }
    
    if (allowedRoles && !allowedRoles.includes(user.role)) {
      return <Navigate to="/login" replace />;
    }
    
    return children;
  };

  // Map roles to their default dashboard route
  const getDefaultRouteForRole = (role) => {
    switch (role) {
      case 'owner':
        return '/owner';
      case 'admin':
        return '/admin';
      case 'delivery':
        return '/delivery';
      case 'warehouse':
      case 'warehouse_manager':
      case 'warehouse_worker':
        return '/warehouse';
      default:
        return '/login';
    }
  };

  if (loading) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </Container>
    );
  }

  return (
    <WarehouseProvider>
      <Router>
        <div className="App">
          {error && (
            <Alert 
              variant="danger" 
              dismissible 
              onClose={() => setError(null)}
              className="position-fixed top-0 start-50 translate-middle-x mt-3"
              style={{ zIndex: 9999 }}
            >
              {error}
            </Alert>
          )}
          
          <Routes>
            {/* Login Route */}
            <Route 
              path="/login" 
              element={
                user ? <Navigate to={getDefaultRouteForRole(user.role)} replace /> : <LoginPage onLogin={handleLogin} />
              } 
            />
            
            {/* Owner Dashboard Route */}
            <Route 
              path="/owner" 
              element={
                <ProtectedRoute allowedRoles={['owner']}>
                  <OwnerDashboard user={user} onLogout={handleLogout} />
                </ProtectedRoute>
              } 
            />
            
            {/* Admin Dashboard Route */}
            <Route 
              path="/admin" 
              element={
                <ProtectedRoute allowedRoles={['admin', 'owner']}>
                  <AdminDashboard user={user} onLogout={handleLogout} />
                </ProtectedRoute>
              } 
            />
            
            {/* Warehouse Dashboard Route */}
            <Route 
              path="/warehouse/*" 
              element={
                <ProtectedRoute allowedRoles={['warehouse', 'warehouse_manager', 'warehouse_worker', 'owner', 'admin']}>
                  <WarehouseLayout user={user} onLogout={handleLogout} />
                </ProtectedRoute>
              }
            >
              <Route index element={<EnhancedWarehouseDashboard user={user} onLogout={handleLogout} showNavbar={false} />} />
              <Route path="products" element={<WarehouseProducts />} />
              <Route path="products/new" element={<AddProduct user={user} />} />
              <Route path="stock" element={<WarehouseStock />} />
              <Route path="workers" element={<WarehouseWorkers currentUser={user} />} />
              <Route path="worker" element={<WorkerDashboard />} />
              {/* Keep existing inventory routes accessible under warehouse */}
              <Route path="inventory/materials" element={<InventoryManagement />} />
              <Route path="inventory/stock-in-house" element={<StockInHouse />} />
              <Route path="orders" element={<Orders user={user} userRole="warehouse" onLogout={handleLogout} />} />
            </Route>

            {/* Add Product (Warehouse Manager view) */}
            <Route
              path="/warehouse/products/new"
              element={
                <ProtectedRoute allowedRoles={['warehouse', 'warehouse_manager', 'owner', 'admin', 'warehouse_worker']}>
                  <AddProduct user={user} />
                </ProtectedRoute>
              }
            />

            {/* Inventory Management */}
            <Route
              path="/warehouse/inventory/materials"
              element={
                <ProtectedRoute allowedRoles={['warehouse', 'warehouse_manager', 'owner', 'admin', 'warehouse_worker']}>
                  <InventoryManagement />
                </ProtectedRoute>
              }
            />

            {/* Stock In-House Management */}
            <Route
              path="/warehouse/inventory/stock-in-house"
              element={
                <ProtectedRoute allowedRoles={['warehouse', 'warehouse_manager', 'owner', 'admin', 'warehouse_worker']}>
                  <StockInHouse />
                </ProtectedRoute>
              }
            />
            
            {/* Delivery Dashboard Route */}
            <Route 
              path="/delivery" 
              element={
                <ProtectedRoute allowedRoles={['delivery', 'owner', 'admin']}>
                  <DeliveryDashboard user={user} onLogout={handleLogout} />
                </ProtectedRoute>
              } 
            />

            {/* Orders Routes - Shared across roles */}
            <Route 
              path="/owner/orders" 
              element={
                <ProtectedRoute allowedRoles={['owner']}>
                  <Orders user={user} userRole="owner" onLogout={handleLogout} />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/orders" 
              element={
                <ProtectedRoute allowedRoles={['admin', 'owner']}>
                  <Orders user={user} userRole="admin" onLogout={handleLogout} />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/warehouse/orders" 
              element={
                <ProtectedRoute allowedRoles={['warehouse', 'warehouse_worker', 'owner', 'admin']}>
                  <Orders user={user} userRole="warehouse" onLogout={handleLogout} />
                </ProtectedRoute>
              } 
            />

            {/* Owner Management Routes */}
            <Route 
              path="/owner/customers" 
              element={
                <ProtectedRoute allowedRoles={['owner', 'admin']}>
                  <Customers user={user} userRole={user?.role || "owner"} onLogout={handleLogout} />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/owner/users" 
              element={
                <ProtectedRoute allowedRoles={['owner']}>
                  <Users user={user} userRole="owner" onLogout={handleLogout} />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/owner/payments" 
              element={
                <ProtectedRoute allowedRoles={['owner', 'admin']}>
                  <Payments user={user} userRole={user?.role || "owner"} onLogout={handleLogout} />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/owner/deliveries" 
              element={
                <ProtectedRoute allowedRoles={['owner', 'admin']}>
                  <Deliveries user={user} userRole={user?.role || "owner"} onLogout={handleLogout} />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/owner/analytics" 
              element={
                <ProtectedRoute allowedRoles={['owner', 'admin']}>
                  <Analytics user={user} userRole={user?.role || "owner"} onLogout={handleLogout} />
                </ProtectedRoute>
              } 
            />
            
            {/* Root Route - Always show login page */}
            <Route 
              path="/" 
              element={<LoginPage onLogin={handleLogin} />} 
            />
            
            {/* Catch all route - redirect to login */}
            <Route 
              path="*" 
              element={<Navigate to="/login" replace />} 
            />
          </Routes>
        </div>
      </Router>
    </WarehouseProvider>
  );
}

export default App; 