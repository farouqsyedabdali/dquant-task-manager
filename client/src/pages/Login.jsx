import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import useAuthStore from '../context/authStore';
import ForgotPasswordModal from '../components/modals/ForgotPasswordModal';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import useThemeLogo from '../hooks/useThemeLogo';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');
  const [isForgotPasswordModalOpen, setIsForgotPasswordModalOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const { login, isLoading, error, clearError, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const tialzLogo = useThemeLogo();

  useEffect(() => {
    if (isAuthenticated()) {
      navigate('/dashboard');
    }
    clearError();
    
    // Check for success message from signup
    if (location.state?.message) {
      setSuccessMessage(location.state.message);
      // Clear the message from location state
      navigate(location.pathname, { replace: true });
    }
  }, [isAuthenticated, navigate, clearError, location]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear field error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const result = await login(formData);
    if (result.success) {
      navigate('/dashboard');
    } else if (result.requiresVerification) {
      // Redirect to email verification page with email parameter
      navigate(`/verify-email?email=${encodeURIComponent(result.email)}&resend=true`);
    } else if (result.companySuspended) {
      // Company is suspended - show error message (already handled by error display)
      // The error message will be displayed in the UI
    }
  };

  const handleGoogleSignIn = () => {
    const API_BASE_URL = import.meta.env.VITE_API_URL || 
      (import.meta.env.MODE === 'production' 
        ? 'https://dquant-task-manager-production.up.railway.app/api' 
        : 'http://localhost:3000/api');
    window.location.href = `${API_BASE_URL}/auth/google`;
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ backgroundColor: 'var(--color-bg-primary)' }}
    >
      {/* Company Branding */}
      <div className="absolute top-6 left-6 flex items-center">
        <img 
          src={tialzLogo}
          alt="TIALZ Logo"
          className="h-20 w-auto object-contain"
          style={{ maxHeight: '80px' }}
        />
      </div>

      <div className="max-w-lg w-full space-y-8 animate-[fadeIn_0.4s_ease-out]">
        <div
          className="rounded-lg shadow-xl p-8 transition-all duration-300"
          style={{
            backgroundColor: 'var(--color-bg-secondary)',
            borderColor: 'var(--color-border-default)',
            borderWidth: 1,
          }}
        >
          {/* Header */}
          <div className="text-center mb-8">
            <h2
              className="text-3xl font-bold mb-2"
              style={{ color: 'var(--color-text-primary)' }}
            >
              Welcome Back
            </h2>
            <p style={{ color: 'var(--color-text-secondary)' }}>
              Sign in to your account to continue
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="alert bg-red-900 border-red-700 text-red-200 mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* Success Alert */}
          {successMessage && (
            <div className="alert bg-green-900 border-green-700 text-green-200 mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{successMessage}</span>
            </div>
          )}

          {/* Google Sign-In Button (Personal Accounts Only) */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            className="btn border w-full mb-6 flex items-center justify-center gap-3"
            style={{ 
              backgroundColor: 'white',
              color: '#000000',
              borderColor: '#dadce0'
            }}
            onMouseEnter={(e) => {
              e.target.style.boxShadow = '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)';
            }}
            onMouseLeave={(e) => {
              e.target.style.boxShadow = 'none';
            }}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
              <g fill="none" fillRule="evenodd">
                <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/>
                <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"/>
                <path fill="#FBBC05" d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957C.348 6.175 0 7.55 0 9s.348 2.825.957 4.039l3.007-2.332z"/>
                <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z"/>
              </g>
            </svg>
            <span className="font-medium">Sign in with Google</span>
            <span className="text-sm" style={{ color: '#5f6368' }}>(Personal Accounts)</span>
          </button>

          <div className="divider" style={{ color: 'var(--color-text-tertiary)' }}>OR</div>

          {/* Login Form */}
          <style>{`
            #login-email-input::placeholder,
            #login-password-input::placeholder {
              color: var(--color-text-tertiary);
            }
          `}</style>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label 
                htmlFor="email" 
                className="block text-sm font-medium mb-2 transition-colors duration-200"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                Your Email Address
              </label>
              <input
                id="login-email-input"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={handleChange}
                className={`input w-full transition-colors duration-200 ${errors.email ? 'border-red-500' : ''}`}
                style={{
                  backgroundColor: 'var(--color-bg-tertiary)',
                  borderColor: errors.email ? '#ef4444' : 'var(--color-border-default)',
                  color: 'var(--color-text-primary)',
                }}
                onFocus={(e) => {
                  if (!errors.email) {
                    e.currentTarget.style.borderColor = 'var(--color-primary)';
                  }
                }}
                onBlur={(e) => {
                  if (!errors.email) {
                    e.currentTarget.style.borderColor = 'var(--color-border-default)';
                  }
                }}
                placeholder="Enter your email"
              />
              {errors.email && (
                <p className="text-red-400 text-sm mt-1">{errors.email}</p>
              )}
            </div>

            <div>
              <label 
                htmlFor="password" 
                className="block text-sm font-medium mb-2 transition-colors duration-200"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="login-password-input"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className={`input w-full pr-10 transition-colors duration-200 ${errors.password ? 'border-red-500' : ''}`}
                  style={{
                    backgroundColor: 'var(--color-bg-tertiary)',
                    borderColor: errors.password ? '#ef4444' : 'var(--color-border-default)',
                    color: 'var(--color-text-primary)',
                  }}
                  onFocus={(e) => {
                    if (!errors.password) {
                      e.currentTarget.style.borderColor = 'var(--color-primary)';
                    }
                  }}
                  onBlur={(e) => {
                    if (!errors.password) {
                      e.currentTarget.style.borderColor = 'var(--color-border-default)';
                    }
                  }}
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 z-10 transition-colors duration-200"
                  style={{ color: 'var(--color-text-tertiary)' }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--color-text-primary)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--color-text-tertiary)'; }}
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-400 text-sm mt-1">{errors.password}</p>
              )}
            </div>

            {/* Remember Me Checkbox and Forgot Password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="rememberMe"
                  checked={formData.rememberMe}
                  onChange={handleChange}
                  className="h-4 w-4 rounded"
                  style={{
                    accentColor: 'var(--color-primary)',
                    borderColor: 'var(--color-border-default)',
                  }}
                />
                <span 
                  className="ml-2 text-sm transition-colors duration-200"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  Remember me for 30 days
                </span>
              </label>
              <button
                type="button"
                onClick={() => setIsForgotPasswordModalOpen(true)}
                className="text-sm font-medium transition-colors duration-200"
                style={{ 
                  color: 'var(--color-primary)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = '0.8';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = '1';
                }}
              >
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn bg-indigo-600 hover:bg-indigo-700 text-white border-0 w-full"
            >
              {isLoading ? (
                <>
                  <span className="loading loading-spinner loading-sm"></span>
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Signup Link */}
          <div className="mt-6 text-center">
            <p style={{ color: 'var(--color-text-secondary)' }}>
              Don't have an account?{' '}
              <Link 
                to="/signup" 
                className="font-medium transition-colors duration-200"
                style={{ color: 'var(--color-primary)' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = '0.8';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = '1';
                }}
              >
                Sign up now
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      <ForgotPasswordModal
        isOpen={isForgotPasswordModalOpen}
        onClose={() => setIsForgotPasswordModalOpen(false)}
      />
    </div>
  );
};

export default Login;
