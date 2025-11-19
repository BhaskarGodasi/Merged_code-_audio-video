import { useState, useEffect, useCallback } from 'react';
import Toast from './Toast';

const ToastContainer = () => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 5000) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type, duration }]);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  useEffect(() => {
    // Listen for auth events
    const handleIdleLogout = (event) => {
      addToast(event.detail.message || 'You have been logged out due to inactivity', 'warning', 6000);
    };

    const handleTokenExpired = (event) => {
      addToast(event.detail.message || 'Your session has expired. Please login again.', 'error', 6000);
    };

    const handleUnauthorized = (event) => {
      addToast(event.detail.message || 'Unauthorized access. Please login again.', 'error', 6000);
    };

    window.addEventListener('auth:idle-logout', handleIdleLogout);
    window.addEventListener('auth:token-expired', handleTokenExpired);
    window.addEventListener('auth:unauthorized', handleUnauthorized);

    return () => {
      window.removeEventListener('auth:idle-logout', handleIdleLogout);
      window.removeEventListener('auth:token-expired', handleTokenExpired);
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
    };
  }, [addToast]);

  return (
    <div style={{ position: 'fixed', top: 0, right: 0, zIndex: 10000 }}>
      {toasts.map((toast, index) => (
        <div key={toast.id} style={{ marginTop: index > 0 ? '12px' : '0' }}>
          <Toast
            message={toast.message}
            type={toast.type}
            duration={toast.duration}
            onClose={() => removeToast(toast.id)}
          />
        </div>
      ))}
    </div>
  );
};

export default ToastContainer;
