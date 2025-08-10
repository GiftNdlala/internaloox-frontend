import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FaEye, 
  FaEyeSlash, 
  FaUser, 
  FaLock, 
  FaSpinner,
  FaExclamationTriangle,
  FaCheckCircle,
  FaCouch,
  FaUserShield,
  FaCog,
  FaWarehouse,
  FaTruck,
  FaStar,
  FaBolt,
  FaGem
} from 'react-icons/fa';
import '../styles/MobileFirst.css';

// API configuration
const API_BASE = process.env.REACT_APP_API_BASE || 'https://internaloox-1.onrender.com/api';

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
  const [currentTime, setCurrentTime] = useState(new Date());

  // Check screen size for mobile responsiveness
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    
    // Update time every minute
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    
    return () => {
      window.removeEventListener('resize', checkScreenSize);
      clearInterval(timer);
    };
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
      const response = await fetch(`${API_BASE}/users/login/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: formData.username,
          password: formData.password,
          // Do not send client-selected role; trust backend role
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
      
      // Trust backend-provided user.role
      const backendUser = data.user || {};
      localStorage.setItem('oox_user', JSON.stringify(backendUser));

      const role = backendUser.role;
      const prettyRole = role ? role.charAt(0).toUpperCase() + role.slice(1) : 'Dashboard';
      setSuccess(`Welcome to OOX Furniture ${prettyRole}!`);
      onLogin(backendUser);

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

      setTimeout(() => {
        navigate(getDefaultRouteForRole(role));
      }, 1500);
    } catch (err) {
      setError('Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };



  const getRoleConfig = (role) => {
    const configs = {
      owner: {
        icon: FaUserShield,
        color: '#f59e0b',
        gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
        title: 'Executive Portal',
        description: 'Full system control & analytics'
      },
      admin: {
        icon: FaCog,
        color: '#3b82f6',
        gradient: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
        title: 'Operations Control',
        description: 'Manage orders & customers'
      },
      warehouse: {
        icon: FaWarehouse,
        color: '#10b981',
        gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
        title: 'Production Floor',
        description: 'Handle manufacturing workflow'
      },
      delivery: {
        icon: FaTruck,
        color: '#06b6d4',
        gradient: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
        title: 'Delivery Hub',
        description: 'Coordinate deliveries & routes'
      }
    };
    return configs[role] || configs.admin;
  };

  return (
    <div 
      className="oox-mobile-container"
      style={{
        minHeight: '100vh',
        background: '#f8f9fa',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Animated Background Elements */}
      <div 
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `
            radial-gradient(circle at 20% 80%, rgba(245, 158, 11, 0.3) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(16, 185, 129, 0.3) 0%, transparent 50%),
            radial-gradient(circle at 40% 40%, rgba(59, 130, 246, 0.2) 0%, transparent 50%)
          `,
          animation: 'float 20s ease-in-out infinite'
        }}
      />

      {/* Floating Particles */}
      <div className="oox-floating-particles">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              width: `${Math.random() * 10 + 5}px`,
              height: `${Math.random() * 10 + 5}px`,
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '50%',
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animation: `float ${Math.random() * 10 + 10}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 5}s`
            }}
          />
        ))}
      </div>

      <div 
        className="oox-animate-fadeInUp"
        style={{
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          minHeight: '100vh',
          padding: isMobile ? '1rem' : '2rem'
        }}
      >
        {/* OOX Brand Header */}
        <div className="oox-mobile-text-center oox-mobile-mb-4">
          <div 
            className="oox-logo"
            style={{
              width: isMobile ? '100px' : '120px',
              height: isMobile ? '100px' : '120px',
              margin: '0 auto 1.5rem',
              position: 'relative'
            }}
          >
            <FaCouch 
              size={isMobile ? 50 : 60} 
              style={{ color: 'white' }}
            />
            {/* Pulsing Ring */}
            <div 
              style={{
                position: 'absolute',
                top: '-10px',
                left: '-10px',
                right: '-10px',
                bottom: '-10px',
                border: '3px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '50%',
                animation: 'pulse 2s ease-in-out infinite'
              }}
            />
          </div>
          
          <h1 
            className="oox-brand-gradient"
            style={{
              fontSize: isMobile ? '2.5rem' : '3.5rem',
              fontWeight: '900',
              margin: '0 0 0.5rem 0',
              textShadow: '0 4px 8px rgba(0, 0, 0, 0.3)',
              background: 'linear-gradient(135deg, #ffffff 0%, #f59e0b 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}
          >
            OOX FURNITURE
          </h1>
          
          <p 
            style={{
              color: 'rgba(255, 255, 255, 0.9)',
              fontSize: isMobile ? '1.1rem' : '1.3rem',
              fontWeight: '600',
              margin: '0 0 0.5rem 0',
              textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'
            }}
          >
            Internal Order Management System
          </p>
          
          <div 
            style={{
              color: 'rgba(255, 255, 255, 0.7)',
              fontSize: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem'
            }}
          >
            <FaBolt style={{ color: '#f59e0b' }} />
            <span>Powered by Innovation</span>
            <FaGem style={{ color: '#10b981' }} />
          </div>
        </div>

        {/* Main Login Card */}
        <div className="oox-mobile-card oox-animate-slideInLeft" style={{ maxWidth: '400px', margin: '0 auto', position: 'relative' }}>
          {/* Login Header */}
          <div className="oox-mobile-text-center oox-mobile-mb-4">
            <div className="oox-mobile-flex-center oox-mobile-mb-3">
              <FaStar style={{ color: '#f59e0b', fontSize: '1.5rem', marginRight: '0.5rem' }} />
              <h2 style={{ margin: 0, color: '#1e293b', fontWeight: '700', fontSize: '1.5rem' }}>
                Welcome Back
              </h2>
              <FaStar style={{ color: '#f59e0b', fontSize: '1.5rem', marginLeft: '0.5rem' }} />
            </div>
            <p style={{ color: '#6b7280', margin: 0, fontSize: '0.95rem' }}>
              Access your OOX Furniture dashboard
            </p>
            <div 
              style={{
                fontSize: '0.8rem',
                color: '#9ca3af',
                marginTop: '0.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}
            >
              <span>{currentTime.toLocaleDateString()}</span>
              <span>•</span>
              <span>{currentTime.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}</span>
            </div>
          </div>

          {/* Error/Success Messages */}
          {error && (
            <div className="oox-mobile-mb-3" style={{
              padding: '0.875rem',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <FaExclamationTriangle style={{ color: '#dc2626', flexShrink: 0 }} />
              <span style={{ color: '#dc2626', fontSize: '0.875rem', fontWeight: '500' }}>{error}</span>
            </div>
          )}

          {success && (
            <div className="oox-mobile-mb-3" style={{
              padding: '0.875rem',
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.2)',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <FaCheckCircle style={{ color: '#059669', flexShrink: 0 }} />
              <span style={{ color: '#059669', fontSize: '0.875rem', fontWeight: '500' }}>{success}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit}>
            {/* Username Field */}
            <div className="oox-mobile-form-group">
              <label className="oox-mobile-form-label">
                <FaUser style={{ marginRight: '0.5rem', color: '#f59e0b' }} />
                Username
              </label>
              <input
                name="username"
                type="text"
                value={formData.username}
                onChange={handleInputChange}
                className="oox-mobile-form-input"
                placeholder="Enter your username"
                disabled={loading}
                style={{ 
                  paddingLeft: '1rem',
                  fontSize: isMobile ? '16px' : '0.875rem' // Prevent iOS zoom
                }}
              />
            </div>

            {/* Role Selection */}
            <div className="oox-mobile-form-group">
              <label className="oox-mobile-form-label">
                <FaUserShield style={{ marginRight: '0.5rem', color: '#f59e0b' }} />
                Access Level
              </label>
              <select
                name="role"
                value={formData.role}
                onChange={handleInputChange}
                className="oox-mobile-form-input"
                disabled={loading}
                style={{ fontSize: isMobile ? '16px' : '0.875rem' }}
              >
                <option value="admin">Admin - Operations Control</option>
                <option value="warehouse">Warehouse - Production Floor</option>
                <option value="delivery">Delivery - Distribution Hub</option>
                <option value="owner">Owner - Executive Portal</option>
              </select>
            </div>

            {/* Password Field */}
            <div className="oox-mobile-form-group">
              <label className="oox-mobile-form-label">
                <FaLock style={{ marginRight: '0.5rem', color: '#f59e0b' }} />
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleInputChange}
                  className="oox-mobile-form-input"
                  placeholder="Enter your password"
                  disabled={loading}
                  style={{ 
                    paddingRight: '3rem',
                    fontSize: isMobile ? '16px' : '0.875rem'
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                  style={{
                    position: 'absolute',
                    right: '1rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: '#6b7280',
                    cursor: 'pointer',
                    padding: 0
                  }}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="oox-mobile-btn"
              style={{
                width: '100%',
                marginBottom: '1.5rem',
                fontSize: '1rem',
                fontWeight: '700'
              }}
            >
              {loading ? (
                <>
                  <FaSpinner style={{ animation: 'spin 1s linear infinite' }} />
                  Authenticating...
                </>
              ) : (
                <>
                  <FaUserShield />
                  Access OOX Dashboard
                </>
              )}
            </button>
          </form>



          {/* Footer */}
          <div className="oox-mobile-text-center" style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid rgba(0, 0, 0, 0.06)' }}>
            <p style={{ 
              fontSize: '0.75rem', 
              color: '#9ca3af',
              margin: '0 0 0.25rem 0',
              fontWeight: '500'
            }}>
              © 2024 OOX Furniture Management System
            </p>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              fontSize: '0.7rem',
              color: '#d1d5db'
            }}>
              <span>Secure</span>
              <span>•</span>
              <span>Reliable</span>
              <span>•</span>
              <span>Mobile-First</span>
            </div>
          </div>
        </div>

        {/* Mobile-specific bottom message */}
        {isMobile && (
          <div 
            className="oox-mobile-text-center oox-animate-fadeInUp"
            style={{
              marginTop: '1.5rem',
              padding: '1rem',
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '12px',
              backdropFilter: 'blur(10px)'
            }}
          >
            <p style={{
              color: 'rgba(255, 255, 255, 0.9)',
              fontSize: '0.9rem',
              margin: 0,
              fontWeight: '500'
            }}>
              📱 Optimized for mobile experience
            </p>
            <p style={{
              color: 'rgba(255, 255, 255, 0.7)',
              fontSize: '0.8rem',
              margin: '0.25rem 0 0 0'
            }}>
              Tap any dashboard above for instant access
            </p>
          </div>
        )}
      </div>

      {/* Additional CSS for animations */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          33% { transform: translateY(-10px) rotate(1deg); }
          66% { transform: translateY(5px) rotate(-1deg); }
        }
        
        @keyframes pulse {
          0%, 100% { 
            transform: scale(1);
            opacity: 0.7;
          }
          50% { 
            transform: scale(1.05);
            opacity: 1;
          }
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default LoginPage; 