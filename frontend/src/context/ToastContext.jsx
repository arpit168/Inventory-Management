import { createContext, useContext, useMemo } from 'react';
import toast from 'react-hot-toast';

const ToastContext = createContext();

export const ToastProvider = ({ children }) => {
  const showToast = (message, type = 'info') => {
    switch (type) {
      case 'success':
        toast.success(message);
        break;
      case 'error':
        toast.error(message);
        break;
      default:
        toast(message);
        break;
    }
  };

  const value = useMemo(() => ({ showToast }), []);

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useToast = () => useContext(ToastContext);
