import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import PublicRoute from './components/PublicRoute';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import Dashboard from './pages/Dashboard';
import ForgotPassword from './pages/ForgotPassword';
import Login from './pages/Login';
import Notifications from './pages/Notifications';
import NotFound from './pages/NotFound';
import OutOfStock from './pages/OutOfStock';
import Products from './pages/Products';
import Profile from './pages/Profile';
import Register from './pages/Register';
import Reports from './pages/Reports';
import ResetPassword from './pages/ResetPassword';
import Invoices from './pages/Invoices';
import CustomersLedger from './pages/CustomersLedger';
import Expenses from './pages/Expenses';
import BusinessProfile from './pages/BusinessProfile';

const App = () => (
  <AuthProvider>
    <ToastProvider>
      <BrowserRouter>
        <Toaster position="top-right" />
        <Routes>
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
          <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
          <Route path="/reset-password" element={<PublicRoute><ResetPassword /></PublicRoute>} />


          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/products" element={<Products />} />
            <Route path="/invoices" element={<Invoices />} />
            <Route path="/customers" element={<CustomersLedger />} />
            <Route path="/expenses" element={<Expenses />} />
            <Route path="/out-of-stock" element={<OutOfStock />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/business-profile" element={<BusinessProfile />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  </AuthProvider>
);

export default App;
