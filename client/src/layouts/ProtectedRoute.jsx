import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../context/authStore';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { isAuthenticated, user, isAdmin, isEmployee, isSysAdmin, isSuperAdmin } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    console.log('🛡️ PROTECTED ROUTE CHECK:', {
      path: window.location.pathname,
      isAuthenticated: isAuthenticated(),
      userRole: user?.role,
      allowedRoles,
      isSuperAdmin: isSuperAdmin(),
      isAdmin: isAdmin(),
      isSysAdmin: isSysAdmin(),
      isEmployee: isEmployee()
    });

    if (!isAuthenticated()) {
      console.log('❌ NOT AUTHENTICATED, redirecting to login');
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

      console.log('🔍 ROLE CHECK RESULT:', {
        hasRequiredRole,
        allowedRoles,
        userRole: user?.role
      });

      if (!hasRequiredRole) {
        console.log('❌ INSUFFICIENT PERMISSIONS, redirecting...');
        // Redirect to appropriate dashboard based on user role
        if (isSuperAdmin()) {
          console.log('🔄 Redirecting to /super-admin');
          navigate('/super-admin');
        } else if (isAdmin()) {
          console.log('🔄 Redirecting to /admin');
          navigate('/admin');
        } else if (isEmployee()) {
          console.log('🔄 Redirecting to /employee');
          navigate('/employee');
        } else {
          console.log('🔄 Redirecting to /login');
          navigate('/login');
        }
      } else {
        console.log('✅ ROLE CHECK PASSED');
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
