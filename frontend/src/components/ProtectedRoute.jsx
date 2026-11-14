import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import TrackMateLoader from './TrackMateLoader';

const ProtectedRoute = ({ children, roles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <TrackMateLoader message="Authenticating..." />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !roles.includes(user.role)) {
    const fallbackPath = user.role === 'admin' ? '/admin' : (user.role === 'driver' ? '/driver' : '/student');
    return <Navigate to={fallbackPath} replace />;
  }

  return children;
};

export default ProtectedRoute;
