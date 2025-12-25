import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import useAuthStore from '../context/authStore';
import PasswordStrengthIndicator from '../components/common/PasswordStrengthIndicator';
import { validatePassword } from '../utils/passwordValidation';

const PersonalSignup = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  
  const { registerPersonal, error, clearError, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated()) {
      navigate('/dashboard');
    }
    clearError();
  }, [isAuthenticated, navigate, clearError]);

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
    
    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }
    
    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    // Password validation with enhanced requirements
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else {
      const passwordValidation = validatePassword(formData.password);
      if (!passwordValidation.isValid) {
        newErrors.password = passwordValidation.errors[0]; // Show first error
      }
    }
    
    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    // Terms validation
    if (!formData.acceptTerms) {
      newErrors.acceptTerms = 'You must accept the terms and conditions';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    
    try {
      const result = await registerPersonal({
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password
      });

      if (result.success) {
        // Redirect to email verification page
        navigate(`/verify-email?email=${encodeURIComponent(formData.email.trim().toLowerCase())}`);
      } else {
        setErrors({ submit: result.error || 'Registration failed' });
      }
    } catch (error) {
      setErrors({ submit: 'An unexpected error occurred. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4"
      style={{ backgroundColor: 'var(--color-bg-primary)' }}
    >
      {/* Company Branding */}
      <div className="absolute top-6 left-6 flex items-center space-x-3">
        <div 
          className="w-10 h-10 rounded-lg flex items-center justify-center"
          style={{ 
            background: 'linear-gradient(to right, var(--color-primary), #9333ea)'
          }}
        >
          <span 
            className="font-bold text-lg"
            style={{ color: 'white' }}
          >
            CN
          </span>
        </div>
        <div>
          <h1 
            className="text-2xl font-bold"
            style={{ color: 'var(--color-text-primary)' }}
          >
            Tialz
          </h1>
          <p 
            className="text-sm"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            Task Manager
          </p>
        </div>
      </div>

      <div className="max-w-2xl w-full animate-[fadeIn_0.4s_ease-out]">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 
            className="text-3xl font-bold mb-2"
            style={{ color: 'var(--color-text-primary)' }}
          >
            Create Personal Account
          </h1>
          <p style={{ color: 'var(--color-text-secondary)' }}>
            Start managing your personal tasks with full control
          </p>
        </div>

        {/* Form */}
        <div 
          className="border rounded-lg shadow-lg p-8 transition-all duration-300"
          style={{ 
            backgroundColor: 'var(--color-bg-secondary)',
            borderColor: 'var(--color-border-default)'
          }}
        >
          {/* Google Sign-Up Button */}
          <button
            type="button"
            onClick={() => {
              const API_BASE_URL = import.meta.env.VITE_API_URL || 
                (import.meta.env.MODE === 'production' 
                  ? 'https://dquant-task-manager-production.up.railway.app/api' 
                  : 'http://localhost:3000/api');
              window.location.href = `${API_BASE_URL}/auth/google?signupType=personal`;
            }}
            className="btn border-0 w-full mb-6"
            style={{ 
              backgroundColor: '#4285F4',
              color: 'white'
            }}
            onMouseEnter={(e) => e.target.style.opacity = '0.9'}
            onMouseLeave={(e) => e.target.style.opacity = '1'}
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Sign up with Google
          </button>

          <div className="divider" style={{ color: 'var(--color-text-tertiary)' }}>OR</div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name */}
            <div>
              <label 
                className="block text-sm font-medium mb-2"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                Full Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={`input w-full ${errors.name ? 'border-red-500' : ''}`}
                style={{
                  backgroundColor: 'var(--color-bg-tertiary)',
                  borderColor: errors.name ? '#ef4444' : 'var(--color-border-default)',
                  color: 'var(--color-text-primary)',
                }}
                placeholder="Enter your full name"
              />
              {errors.name && (
                <p className="text-red-400 text-sm mt-1">{errors.name}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label 
                className="block text-sm font-medium mb-2"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                Email Address *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`input w-full ${errors.email ? 'border-red-500' : ''}`}
                style={{
                  backgroundColor: 'var(--color-bg-tertiary)',
                  borderColor: errors.email ? '#ef4444' : 'var(--color-border-default)',
                  color: 'var(--color-text-primary)',
                }}
                placeholder="Enter your email address"
              />
              {errors.email && (
                <p className="text-red-400 text-sm mt-1">{errors.email}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <label 
                  className="text-sm font-medium"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  Password *
                </label>
                <div className="tooltip tooltip-right" data-tip="Password Requirements:&#10;• At least 6 characters&#10;• One uppercase letter (A-Z)&#10;• One lowercase letter (a-z)&#10;• One number (0-9)&#10;• One special character (!@#$%^&*)">
                  <svg 
                    className="w-4 h-4 cursor-help" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                    style={{ color: 'var(--color-text-tertiary)' }}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={`input w-full ${errors.password ? 'border-red-500' : ''}`}
                style={{
                  backgroundColor: 'var(--color-bg-tertiary)',
                  borderColor: errors.password ? '#ef4444' : 'var(--color-border-default)',
                  color: 'var(--color-text-primary)',
                }}
                placeholder="Create a password"
              />
              {errors.password && (
                <p className="text-red-400 text-sm mt-1">{errors.password}</p>
              )}
              
              {/* Password Strength Indicator */}
              <PasswordStrengthIndicator password={formData.password} showRequirements={false} />
            </div>

            {/* Confirm Password */}
            <div>
              <label 
                className="block text-sm font-medium mb-2"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                Confirm Password *
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className={`input w-full ${errors.confirmPassword ? 'border-red-500' : ''}`}
                style={{
                  backgroundColor: 'var(--color-bg-tertiary)',
                  borderColor: errors.confirmPassword ? '#ef4444' : 'var(--color-border-default)',
                  color: 'var(--color-text-primary)',
                }}
                placeholder="Confirm your password"
              />
              {errors.confirmPassword && (
                <p className="text-red-400 text-sm mt-1">{errors.confirmPassword}</p>
              )}
            </div>

            {/* Terms and Conditions */}
            <div>
              <label className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  name="acceptTerms"
                  checked={formData.acceptTerms}
                  onChange={handleChange}
                  className={`checkbox mt-1 ${errors.acceptTerms ? 'checkbox-error' : ''}`}
                  style={{
                    accentColor: 'var(--color-primary)',
                    borderColor: 'var(--color-border-default)'
                  }}
                />
                <span 
                  className="text-sm"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  I agree to the{' '}
                  <Link 
                    to="/terms" 
                    style={{ color: 'var(--color-primary)' }}
                    onMouseEnter={(e) => e.target.style.opacity = '0.8'}
                    onMouseLeave={(e) => e.target.style.opacity = '1'}
                  >
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link 
                    to="/privacy" 
                    style={{ color: 'var(--color-primary)' }}
                    onMouseEnter={(e) => e.target.style.opacity = '0.8'}
                    onMouseLeave={(e) => e.target.style.opacity = '1'}
                  >
                    Privacy Policy
                  </Link>
                </span>
              </label>
              {errors.acceptTerms && (
                <p className="text-red-400 text-sm mt-1">{errors.acceptTerms}</p>
              )}
            </div>

            {/* Submit Error */}
            {errors.submit && (
              <div 
                className="border rounded-lg p-4"
                style={{ 
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  borderColor: '#ef4444'
                }}
              >
                <p className="text-red-400 text-sm">{errors.submit}</p>
              </div>
            )}

            {/* Global Error */}
            {error && (
              <div 
                className="border rounded-lg p-4"
                style={{ 
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  borderColor: '#ef4444'
                }}
              >
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="btn border-0 w-full py-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ 
                backgroundColor: 'var(--color-primary)',
                color: 'white'
              }}
              onMouseEnter={(e) => !isLoading && (e.target.style.opacity = '0.9')}
              onMouseLeave={(e) => !isLoading && (e.target.style.opacity = '1')}
            >
              {isLoading ? (
                <>
                  <span className="loading loading-spinner loading-sm mr-2"></span>
                  Creating Account...
                </>
              ) : (
                'Create Personal Account'
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-6 text-center">
            <p 
              className="text-sm"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              Already have an account?{' '}
              <Link 
                to="/login" 
                className="font-medium"
                style={{ color: 'var(--color-primary)' }}
                onMouseEnter={(e) => e.target.style.opacity = '0.8'}
                onMouseLeave={(e) => e.target.style.opacity = '1'}
              >
                Sign in here
              </Link>
            </p>
            <p 
              className="text-sm mt-2"
              style={{ color: 'var(--color-text-muted)' }}
            >
              Want to create a company account instead?{' '}
              <Link 
                to="/company-signup" 
                className="font-medium"
                style={{ color: 'var(--color-primary)' }}
                onMouseEnter={(e) => e.target.style.opacity = '0.8'}
                onMouseLeave={(e) => e.target.style.opacity = '1'}
              >
                Company Signup
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PersonalSignup;
