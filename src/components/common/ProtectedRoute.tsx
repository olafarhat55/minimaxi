import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getDefaultRoute } from '../../utils/permissions';
import Loading from './Loading';
import type { ReactNode } from 'react';

interface ProtectedRouteProps {
  children: ReactNode;
  roles?: string[];
}

const ProtectedRoute = ({ children, roles = [] }: ProtectedRouteProps) => {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (loading) {
    return <Loading fullScreen />;
  }

  // Not authenticated — redirect to login
  if (!isAuthenticated || !user) {
    console.log('[Route Guard] Not authenticated, redirecting to /login from', location.pathname);
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // User has no valid role — corrupt session, send to login
  if (!user.role) {
    console.warn('[Route Guard] User has no role — clearing session');
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('token');
    return <Navigate to="/login" replace />;
  }

  // Check role-based access if roles are specified
  if (roles.length > 0 && !roles.includes(user.role)) {
    const defaultRoute = getDefaultRoute(user);
    console.log(
      '[Route Guard] Role "%s" not in allowed %o for %s → redirecting to %s',
      user.role, roles, location.pathname, defaultRoute
    );
    // Prevent infinite redirect if already on the default route
    if (location.pathname === defaultRoute) {
      return children;
    }
    return <Navigate to={defaultRoute} replace />;
  }

  return children;
};

export default ProtectedRoute;
