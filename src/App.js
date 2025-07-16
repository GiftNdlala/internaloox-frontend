import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Container, Alert } from 'react-bootstrap';
import AdminDashboard from './components/admin/AdminDashboard';
import WarehouseDashboard from './pages/WarehouseDashboard';
import DeliveryDashboard from './pages/DeliveryDashboard';
import OwnerDashboard from './pages/OwnerDashboard';
import LoginPage from './pages/LoginPage';
import './App.css';

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
              user ? <Navigate to={`/${user.role}`} replace /> : <LoginPage onLogin={handleLogin} />
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
            path="/warehouse" 
            element={
              <ProtectedRoute allowedRoles={['warehouse', 'owner', 'admin']}>
                <WarehouseDashboard user={user} onLogout={handleLogout} />
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
  );
}

export default App; 