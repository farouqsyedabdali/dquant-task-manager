import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import useAuthStore from '../context/authStore';
import PasswordStrengthIndicator from '../components/common/PasswordStrengthIndicator';
import LegalDocumentModal from '../components/legal/LegalDocumentModal';
import { validatePassword } from '../utils/passwordValidation';
import tialzLogo from '../assets/Cover (1)-Photoroom.png';

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
  const [showLegalModal, setShowLegalModal] = useState(false);
  const [legalDocumentType, setLegalDocumentType] = useState('terms'); // 'terms' or 'privacy'
  
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
      <div className="absolute top-6 left-6 flex items-center">
        <img 
          src={tialzLogo}
          alt="TIALZ Logo"
          className="h-20 w-auto object-contain"
          style={{ maxHeight: '80px' }}
        />
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
            <span className="font-medium">Sign up with Google</span>
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
              <label className="flex items-center mt-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="acceptTerms"
                  checked={formData.acceptTerms}
                  onChange={handleChange}
                  className={`checkbox checkbox-sm mr-2 ${errors.acceptTerms ? 'checkbox-error' : ''}`}
                  style={{
                    border: '2px solid var(--color-text-tertiary)',
                    backgroundColor: formData.acceptTerms ? 'var(--color-accent)' : 'transparent',
                    '--chkbg': 'var(--color-accent)'
                  }}
                />
                <span 
                  className="text-sm"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  I agree to the{' '}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      setLegalDocumentType('terms');
                      setShowLegalModal(true);
                    }}
                    style={{ color: 'var(--color-primary)' }}
                    className="underline hover:opacity-80 transition-opacity"
                  >
                    Terms of Service
                  </button>{' '}
                  and{' '}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      setLegalDocumentType('privacy');
                      setShowLegalModal(true);
                    }}
                    style={{ color: 'var(--color-primary)' }}
                    className="underline hover:opacity-80 transition-opacity"
                  >
                    Privacy Policy
                  </button>
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

      {/* Legal Document Modal */}
      <LegalDocumentModal
        isOpen={showLegalModal}
        onClose={() => setShowLegalModal(false)}
        documentType={legalDocumentType}
      />
    </div>
  );
};

export default PersonalSignup;
