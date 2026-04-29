import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../context/authStore';
import LandingPage from '../pages/LandingPage';

/**
 * Component that handles automatic authentication on app load
 * - If user has a valid token, validates it and redirects to dashboard
 * - If token is invalid/expired, clears auth and shows landing page
 * - If no token, shows landing page
 */
const AuthRedirect = () => {
  const navigate = useNavigate();
  const { token, isAuthenticated, getMe, logout, isLoading } = useAuthStore();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      // If no token exists, show landing page
      if (!token) {
        setIsChecking(false);
        return;
      }

      // If token exists, check if user is authenticated
      if (isAuthenticated()) {
        // Validate token by fetching user data
        try {
          const result = await getMe();
          if (result.success) {
            // Token is valid, redirect to dashboard
            navigate('/dashboard', { replace: true });
            return;
          } else {
            // Token is invalid, clear auth
            logout();
            setIsChecking(false);
          }
        } catch (error) {
          // Error validating token, clear auth
          console.error('Auth validation error:', error);
          logout();
          setIsChecking(false);
        }
      } else {
        // Token exists but is expired/invalid, clear auth
        logout();
        setIsChecking(false);
      }
    };

    checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  // Show loading spinner while checking authentication
  if (isChecking || isLoading) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: 'var(--color-bg-primary)' }}
      >
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  // Show landing page if not authenticated
  return <LandingPage />;
};

export default AuthRedirect;

