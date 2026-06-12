import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../context/authStore';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { isAuthenticated, user, isAdmin, isEmployee, isSysAdmin, isSuperAdmin } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/login');
      return;
    }

    // Check if user has required role
    if (allowedRoles.length > 0) {
      const hasRequiredRole = allowedRoles.some(role => {
        if (role === 'SUPER_ADMIN') return isSuperAdmin();
        if (role === 'ADMIN') return isAdmin();
        if (role === 'SYSDMIN') return isSysAdmin();
        if (role === 'EMPLOYEE') return isEmployee();
        return false;
      });

      if (!hasRequiredRole) {
        // Redirect to appropriate dashboard based on user role
        if (isSuperAdmin()) {
          navigate('/super-admin');
        } else if (isAdmin()) {
          navigate('/admin');
        } else if (isEmployee()) {
          navigate('/employee');
        } else {
          navigate('/login');
        }
      }
    }
  }, [isAuthenticated, user, isAdmin, isEmployee, isSysAdmin, isSuperAdmin, allowedRoles, navigate]);

  // Show loading while checking authentication
  if (!isAuthenticated()) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;
