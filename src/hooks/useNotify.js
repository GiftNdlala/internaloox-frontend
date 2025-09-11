import { useCallback } from 'react';
import { useWarehouse } from '../contexts/WarehouseContext';

/**
 * useNotify provides simple helpers to emit global toasts and persist notifications.
 * It leverages WarehouseContext for notification history and a window event for toasts.
 */
export const useNotify = () => {
  const { addNotification } = useWarehouse();

  const emitToast = useCallback((type, message, options = {}) => {
    try {
      const detail = { type, message, ...options, id: Date.now() + Math.random() };
      window.dispatchEvent(new CustomEvent('oox:toast', { detail }));
    } catch {}
  }, []);

  const baseNotify = useCallback((type, message, options = {}) => {
    const notification = {
      id: Date.now(),
      message,
      type,
      priority: options.priority || (type === 'error' ? 'high' : undefined),
      is_read: false,
      created_at: new Date().toISOString(),
    };
    addNotification(notification);
    emitToast(type, message, options);
  }, [addNotification, emitToast]);

  const notifySuccess = useCallback((message, options) => baseNotify('success', message, options), [baseNotify]);
  const notifyError = useCallback((message, options) => baseNotify('error', message, options), [baseNotify]);
  const notifyInfo = useCallback((message, options) => baseNotify('info', message, options), [baseNotify]);
  const notifyWarning = useCallback((message, options) => baseNotify('warning', message, options), [baseNotify]);

  return { notifySuccess, notifyError, notifyInfo, notifyWarning };
};

