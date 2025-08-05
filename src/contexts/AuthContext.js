import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { api } from '../components/api';

const AuthContext = createContext();

const authReducer = (state, action) => {
  switch (action.type) {
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        isAuthenticated: true,
        user: action.payload.user,
        role: action.payload.role,
        loading: false,
      };
    case 'LOGOUT':
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        role: null,
        loading: false,
      };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    default:
      return state;
  }
};

// Auth Manager utility class
export class AuthManager {
  static getToken() {
    return localStorage.getItem('oox_token');
  }
  
  static getRefreshToken() {
    return localStorage.getItem('oox_refresh_token');
  }
  
  static async refreshToken() {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) throw new Error('No refresh token');
    
    const response = await fetch('/api/token/refresh/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh: refreshToken })
    });
    
    if (response.ok) {
      const data = await response.json();
      localStorage.setItem('oox_token', data.access);
      return data.access;
    }
    throw new Error('Token refresh failed');
  }
  
  static getUserRole() {
    const token = this.getToken();
    if (!token) return null;
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.role;
    } catch {
      return null;
    }
  }
  
  static canAssignTasks() {
    const role = this.getUserRole();
    return ['owner', 'admin', 'warehouse'].includes(role);
  }

  static hasPermission(requiredRole) {
    const userRole = this.getUserRole();
    const roleHierarchy = {
      'delivery': 1,
      'warehouse': 2,
      'admin': 3,
      'owner': 4
    };
    
    return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
  }
}

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, {
    isAuthenticated: false,
    user: null,
    role: null,
    loading: true,
  });

  useEffect(() => {
    const token = AuthManager.getToken();
    const role = AuthManager.getUserRole();
    
    if (token && role) {
      // Verify token is still valid
      api.get('/users/me/')
        .then(userData => {
          dispatch({
            type: 'LOGIN_SUCCESS',
            payload: { user: userData, role: userData.role },
          });
        })
        .catch(() => {
          // Token invalid, clear storage
          localStorage.removeItem('oox_token');
          localStorage.removeItem('oox_refresh_token');
          dispatch({ type: 'SET_LOADING', payload: false });
        });
    } else {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  const login = async (credentials) => {
    try {
      const response = await api.post('/token/', credentials);
      
      localStorage.setItem('oox_token', response.access);
      localStorage.setItem('oox_refresh_token', response.refresh);
      
      // Get user data
      const userData = await api.get('/users/me/');
      
      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: { user: userData, role: userData.role },
      });
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const logout = () => {
    localStorage.removeItem('oox_token');
    localStorage.removeItem('oox_refresh_token');
    dispatch({ type: 'LOGOUT' });
  };

  return (
    <AuthContext.Provider value={{ ...state, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};