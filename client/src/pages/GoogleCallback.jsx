import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import useAuthStore from '../context/authStore';
import { authAPI } from '../services/api';

const GoogleCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();

  useEffect(() => {
    const token = searchParams.get('token');
    const error = searchParams.get('error');
    const newUser = searchParams.get('newUser');
    const incremental = searchParams.get('incremental');
    const contacts = searchParams.get('contacts');

    // Handle incremental authorization (user was already logged in)
    if (incremental === 'true') {
      console.log('Incremental auth completed, contacts access:', contacts);
      // Redirect back to contacts page to continue the flow
      navigate('/app/contacts?googleAuth=success');
      return;
    }

    if (error) {
      // Handle errors
      if (error === 'oauth_cancelled') {
        navigate('/login?error=Google sign-in was cancelled');
      } else if (error === 'oauth_failed') {
        navigate('/login?error=Google sign-in failed. Please try again.');
      } else if (error === 'company_suspended') {
        navigate('/login?error=Your account has been suspended. Please contact support.');
      } else {
        navigate(`/login?error=${encodeURIComponent(error)}`);
      }
      return;
    }

    if (token) {
      // Store token
      localStorage.setItem('token', token);
      
      // Fetch user info
      authAPI.getMe()
        .then(response => {
          if (response.data.user) {
            setAuth({
              token,
              user: response.data.user
            });
            
            // Redirect to dashboard (same for all account types)
            if (newUser === 'true') {
              navigate('/app?welcome=true');
            } else {
              navigate('/app');
            }
          } else {
            navigate('/login?error=Failed to authenticate');
          }
        })
        .catch(err => {
          console.error('Auth error:', err);
          navigate('/login?error=Failed to authenticate');
        });
    } else {
      navigate('/login?error=No authentication token received');
    }
  }, [searchParams, navigate, setAuth]);

  return (
    <div 
      className="min-h-screen flex items-center justify-center"
      style={{ backgroundColor: 'var(--color-bg-primary)' }}
    >
      <div className="text-center">
        <div 
          className="loading loading-spinner loading-lg mb-4"
          style={{ color: 'var(--color-primary)' }}
        ></div>
        <p style={{ color: 'var(--color-text-primary)' }}>Completing sign in...</p>
      </div>
    </div>
  );
};

export default GoogleCallback;

