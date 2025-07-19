import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FaEye, 
  FaEyeSlash, 
  FaUser, 
  FaLock, 
  FaSpinner,
  FaExclamationTriangle,
  FaCheckCircle
} from 'react-icons/fa';

// Helper to get CSRF token from cookie
//function getCookie(name) {
//  let cookieValue = null;
//  if (document.cookie && document.cookie !== '') {
//    const cookies = document.cookie.split(';');
//    for (let i = 0; i < cookies.length; i++) {
//      const cookie = cookies[i].trim();
//      if (cookie.substring(0, name.length + 1) === (name + '=')) {
//        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
//        break;
//      }
 //   }
//  }
//  return cookieValue;
//}

const LoginPage = ({ onLogin }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    role: 'admin',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isMobile, setIsMobile] = useState(false);

  // Check screen size for mobile responsiveness
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (error) setError('');
  };

  const validateForm = () => {
    if (!formData.username.trim()) {
      setError('Username is required');
      return false;
    }
    if (!formData.password.trim()) {
      setError('Password is required');
      return false;
    }
    if (!formData.role) {
      setError('Role is required');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('http://localhost:8000/api/users/login/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: formData.username,
          password: formData.password,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || 'Login failed');
        setLoading(false);
        return;
      }

      const data = await response.json();
      // Save tokens to localStorage
      localStorage.setItem('oox_token', data.access);
      localStorage.setItem('oox_refresh', data.refresh);
      localStorage.setItem('oox_user', JSON.stringify(data.user));

      // Fetch current user info with Authorization header
      const userRes = await fetch('http://localhost:8000/api/users/current-user/', {
        headers: {
          'Authorization': `Bearer ${data.access}`,
        },
      });
      const userData = await userRes.json();

      setSuccess('Login successful! Redirecting...');
      onLogin(userData);

      setTimeout(() => {
        navigate(`/${userData.role}`);
      }, 1000);
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = (role) => {
    setLoading(true);
    setError('');
    
    // Create mock user data based on role
    const mockUserData = {
      id: 1,
      username: role,
      email: `${role}@oox.com`,
      first_name: role.charAt(0).toUpperCase() + role.slice(1),
      last_name: 'User',
      role: role,
      phone: '',
      is_active: true
    };
    
    setTimeout(() => {
      localStorage.setItem('oox_user', JSON.stringify(mockUserData));
      onLogin(mockUserData);
      
      setTimeout(() => {
        navigate(`/${role}`);
      }, 500);
      
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo and Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full mb-4">
            <FaUser className="text-white text-2xl" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            OOX Furniture
          </h1>
          <p className="text-gray-600">
            Internal Order Management System
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              Welcome Back
            </h2>
            <p className="text-gray-600">
              Sign in to your account
            </p>
          </div>

          {/* Error/Success Messages */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center">
              <FaExclamationTriangle className="text-red-500 mr-2 flex-shrink-0" />
              <span className="text-red-700 text-sm">{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center">
              <FaCheckCircle className="text-green-500 mr-2 flex-shrink-0" />
              <span className="text-green-700 text-sm">{success}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username Field */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaUser className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="username"
                  name="username"
                  type="text"
                  value={formData.username}
                  onChange={handleInputChange}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                  placeholder="Enter your username"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Role Selection Field */}
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
                Role
              </label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleInputChange}
                className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                disabled={loading}
              >
                <option value="admin">Admin</option>
                <option value="warehouse">Warehouse</option>
                <option value="delivery">Delivery</option>
                <option value="owner">Owner</option>
              </select>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaLock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleInputChange}
                  className="block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                  placeholder="Enter your password"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  disabled={loading}
                >
                  {showPassword ? (
                    <FaEyeSlash className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <FaEye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? (
                <>
                  <FaSpinner className="animate-spin mr-2" />
                  Signing In...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Demo Login Buttons */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-600 text-center mb-3">
              Quick Access (No Authentication Required)
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleDemoLogin('owner')}
                disabled={loading}
                className="px-3 py-2 text-xs bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors duration-200 disabled:opacity-50 font-medium"
              >
                Owner Dashboard
              </button>
              <button
                onClick={() => handleDemoLogin('admin')}
                disabled={loading}
                className="px-3 py-2 text-xs bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors duration-200 disabled:opacity-50 font-medium"
              >
                Admin Dashboard
              </button>
              <button
                onClick={() => handleDemoLogin('warehouse')}
                disabled={loading}
                className="px-3 py-2 text-xs bg-yellow-100 text-yellow-700 rounded-md hover:bg-yellow-200 transition-colors duration-200 disabled:opacity-50 font-medium"
              >
                Warehouse Dashboard
              </button>
              <button
                onClick={() => handleDemoLogin('delivery')}
                disabled={loading}
                className="px-3 py-2 text-xs bg-purple-100 text-purple-700 rounded-md hover:bg-purple-200 transition-colors duration-200 disabled:opacity-50 font-medium"
              >
                Delivery Dashboard
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              © 2024 OOX Furniture. All rights reserved.
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Authentication disabled for development
            </p>
          </div>
        </div>

        {/* Mobile-specific features */}
        {isMobile && (
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600">
              💡 Tip: Use the quick access buttons for instant dashboard access
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoginPage; 