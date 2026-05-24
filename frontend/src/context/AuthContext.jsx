import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('inventory-user') || 'null'));
  const [token, setToken] = useState(() => localStorage.getItem('inventory-auth-token') || '');
  const [theme, setTheme] = useState(() => localStorage.getItem('inventory-theme') || 'dark');
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('inventory-theme', theme);
  }, [theme]);

  const fetchProfile = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const response = await api.get('/auth/me');
      setUser(response.data.user);
      localStorage.setItem('inventory-user', JSON.stringify(response.data.user));
    } catch (err) {
      setError(err.response?.data?.message || 'Session expired');
      setToken('');
      setUser(null);
      localStorage.removeItem('inventory-auth-token');
      localStorage.removeItem('inventory-user');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchProfile(); // eslint-disable-line react-hooks/set-state-in-effect
  }, [fetchProfile]);

  const login = useCallback(async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    const nextToken = response.data.token;
    localStorage.setItem('inventory-auth-token', nextToken);
    localStorage.setItem('inventory-user', JSON.stringify(response.data.user));
    setToken(nextToken);
    setUser(response.data.user);
    return response.data;
  }, []);

  const register = useCallback(async (payload) => {
    const response = await api.post('/auth/register', payload);
    const nextToken = response.data.token;
    localStorage.setItem('inventory-auth-token', nextToken);
    localStorage.setItem('inventory-user', JSON.stringify(response.data.user));
    setToken(nextToken);
    setUser(response.data.user);
    return response.data;
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      localStorage.removeItem('inventory-auth-token');
      localStorage.removeItem('inventory-user');
      setToken('');
      setUser(null);
      setNotifications([]);
      toast.success('Logout Successful');
    }
  }, []);

  const refreshNotifications = useCallback(async () => {
    if (!token) return;

    try {
      const response = await api.get('/notifications');
      setNotifications(response.data.notifications || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load notifications');
    }
  }, [token]);

  useEffect(() => {
    refreshNotifications(); // eslint-disable-line react-hooks/set-state-in-effect
    const timer = window.setInterval(refreshNotifications, 30000);
    return () => window.clearInterval(timer);
  }, [refreshNotifications]);

  const toggleTheme = useCallback(() => setTheme((current) => (current === 'dark' ? 'light' : 'dark')), []);

  const value = useMemo(
    () => ({
      user,
      token,
      theme,
      notifications,
      loading,
      error,
      setError,
      login,
      register,
      logout,
      toggleTheme,
      refreshNotifications,
      setNotifications,
    }),
    [user, token, theme, notifications, loading, error, login, register, logout, toggleTheme, refreshNotifications]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);
