import React, { useEffect, useState } from 'react';

// Lightweight toast component using Bootstrap alerts styled as toasts
const ToastItem = ({ id, type, message, onClose }) => {
  const [show, setShow] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShow(false), 3500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!show) {
      const timer = setTimeout(() => onClose(id), 300);
      return () => clearTimeout(timer);
    }
  }, [show, id, onClose]);

  const variant = type === 'success' ? 'success'
    : type === 'error' ? 'danger'
    : type === 'warning' ? 'warning'
    : 'info';

  return (
    <div className={`alert alert-${variant} shadow-sm py-2 px-3 mb-2`} role="alert" style={{ opacity: show ? 1 : 0, transition: 'opacity 0.3s ease' }}>
      {message}
      <button type="button" className="btn-close float-end" aria-label="Close" onClick={() => setShow(false)} />
    </div>
  );
};

const GlobalToaster = () => {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const handler = (e) => {
      const { id, type, message } = e.detail || {};
      if (!message) return;
      setToasts((prev) => [{ id: id || Date.now() + Math.random(), type, message }, ...prev].slice(0, 5));
    };
    window.addEventListener('oox:toast', handler);
    return () => window.removeEventListener('oox:toast', handler);
  }, []);

  const handleClose = (id) => setToasts((prev) => prev.filter((t) => t.id !== id));

  return (
    <div className="position-fixed top-0 start-50 translate-middle-x mt-3" style={{ zIndex: 1060, minWidth: '300px', maxWidth: '90vw' }}>
      {toasts.map((t) => (
        <ToastItem key={t.id} id={t.id} type={t.type} message={t.message} onClose={handleClose} />
      ))}
    </div>
  );
};

export default GlobalToaster;

