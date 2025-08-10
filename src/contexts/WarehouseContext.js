import React, { createContext, useContext, useReducer } from 'react';

export const WarehouseContext = createContext();

const warehouseReducer = (state, action) => {
  switch (action.type) {
    case 'SET_ORDERS':
      return { ...state, orders: action.payload };
    case 'SET_TASKS':
      return { ...state, tasks: action.payload };
    case 'SET_DASHBOARD_DATA':
      return { ...state, dashboardData: action.payload };
    case 'SET_INVENTORY_DATA':
      return { ...state, inventoryData: action.payload };
    case 'SET_NOTIFICATIONS':
      return { ...state, notifications: action.payload };
    case 'UPDATE_TASK':
      return {
        ...state,
        tasks: state.tasks.map(orderTask => ({
          ...orderTask,
          tasks: orderTask.tasks.map(task =>
            task.id === action.payload.id ? { ...task, ...action.payload } : task
          )
        }))
      };
    case 'UPDATE_ORDER':
      return {
        ...state,
        orders: state.orders.map(order =>
          order.id === action.payload.id ? { ...order, ...action.payload } : order
        ),
      };
    case 'ADD_NOTIFICATION':
      return {
        ...state,
        notifications: [action.payload, ...state.notifications.slice(0, 9)] // Keep last 10
      };
    case 'MARK_NOTIFICATION_READ':
      return {
        ...state,
        notifications: state.notifications.map(notification =>
          notification.id === action.payload ? { ...notification, is_read: true } : notification
        )
      };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    default:
      return state;
  }
};

export const WarehouseProvider = ({ children }) => {
  const [state, dispatch] = useReducer(warehouseReducer, {
    orders: [],
    tasks: [],
    dashboardData: null,
    inventoryData: null,
    notifications: [],
    loading: false,
    error: null,
  });

  const setOrders = (orders) => {
    dispatch({ type: 'SET_ORDERS', payload: orders });
  };

  const setTasks = (tasks) => {
    dispatch({ type: 'SET_TASKS', payload: tasks });
  };

  const setDashboardData = (data) => {
    dispatch({ type: 'SET_DASHBOARD_DATA', payload: data });
  };

  const setInventoryData = (data) => {
    dispatch({ type: 'SET_INVENTORY_DATA', payload: data });
  };

  const setNotifications = (notifications) => {
    dispatch({ type: 'SET_NOTIFICATIONS', payload: notifications });
  };

  const updateTask = (taskUpdate) => {
    dispatch({ type: 'UPDATE_TASK', payload: taskUpdate });
  };

  const updateOrder = (orderUpdate) => {
    dispatch({ type: 'UPDATE_ORDER', payload: orderUpdate });
  };

  const addNotification = (notification) => {
    dispatch({ type: 'ADD_NOTIFICATION', payload: notification });
  };

  const markNotificationRead = (notificationId) => {
    dispatch({ type: 'MARK_NOTIFICATION_READ', payload: notificationId });
  };

  const setLoading = (loading) => {
    dispatch({ type: 'SET_LOADING', payload: loading });
  };

  const setError = (error) => {
    dispatch({ type: 'SET_ERROR', payload: error });
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  return (
    <WarehouseContext.Provider value={{
      ...state,
      setOrders,
      setTasks,
      setDashboardData,
      setInventoryData,
      setNotifications,
      updateTask,
      updateOrder,
      addNotification,
      markNotificationRead,
      setLoading,
      setError,
      clearError,
    }}>
      {children}
    </WarehouseContext.Provider>
  );
};

export const useWarehouse = () => {
  const context = useContext(WarehouseContext);
  if (!context) {
    throw new Error('useWarehouse must be used within a WarehouseProvider');
  }
  return context;
};