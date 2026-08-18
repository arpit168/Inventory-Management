import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingScreen from './LoadingScreen';

const PublicRoute = ({ children }) => {
  const { token, loading } = useAuth();

  if (loading) {
    return <LoadingScreen message="Checking session..." />;
  }

  if (token) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default PublicRoute;
