import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import useAuthStore from '../context/authStore';
import PasswordStrengthIndicator from '../components/common/PasswordStrengthIndicator';
import { validatePassword } from '../utils/passwordValidation';

const CompanySignup = () => {
  const [formData, setFormData] = useState({
    companyName: '',
    companyEmail: '',
    adminName: '',
    adminEmail: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  
  const { registerCompany, error, clearError, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [urlError, setUrlError] = useState('');

  useEffect(() => {
    if (isAuthenticated()) {
      navigate('/dashboard');
    }
    clearError();
    
    // Check for error in URL params
    const params = new URLSearchParams(location.search);
    const errorParam = params.get('error');
    if (errorParam) {
      setUrlError(errorParam);
      // Clear from URL
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
    
    // Company validation
    if (!formData.companyName.trim()) {
      newErrors.companyName = 'Company name is required';
    }
    
    if (!formData.companyEmail.trim()) {
      newErrors.companyEmail = 'Contact email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.companyEmail)) {
      newErrors.companyEmail = 'Contact email is invalid';
    }
    
    // Admin validation
    if (!formData.adminName.trim()) {
      newErrors.adminName = 'Admin name is required';
    }
    
    if (!formData.adminEmail.trim()) {
      newErrors.adminEmail = 'Admin email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.adminEmail)) {
      newErrors.adminEmail = 'Admin email is invalid';
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
    
    if (formData.password !== formData.confirmPassword) {
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
      const result = await registerCompany({
        name: formData.companyName,
        email: formData.companyEmail,
        adminName: formData.adminName,
        adminEmail: formData.adminEmail,
        password: formData.password
      });
      
      if (result.success) {
        // Redirect to email verification page
        navigate(`/verify-email?email=${encodeURIComponent(formData.adminEmail.trim().toLowerCase())}`);
      }
    } catch (error) {
      console.error('Registration error:', error);
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

      <div className="max-w-2xl w-full space-y-8 animate-[fadeIn_0.4s_ease-out]">
        <div 
          className="border rounded-lg shadow-xl p-8 transition-all duration-300"
          style={{ 
            backgroundColor: 'var(--color-bg-secondary)',
            borderColor: 'var(--color-border-default)'
          }}
        >
          {/* Header */}
          <div className="text-center mb-8">
            <h2 
              className="text-3xl font-bold mb-2"
              style={{ color: 'var(--color-text-primary)' }}
            >
              Create Your Company
            </h2>
            <p style={{ color: 'var(--color-text-secondary)' }}>
              Set up your company workspace and create your System Administrator account
            </p>
          </div>

          {/* Error Alert */}
          {(error || urlError) && (
            <div 
              className="alert mb-6"
              style={{ 
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                borderColor: '#ef4444',
                color: '#fca5a5'
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error || urlError}</span>
            </div>
          )}

          {/* Signup Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Company Information */}
            <div className="space-y-4">
              <h3 
                className="text-lg font-semibold pb-2 border-b"
                style={{ 
                  color: 'var(--color-text-primary)',
                  borderColor: 'var(--color-border-light)'
                }}
              >
                Company Information
              </h3>
              
              <div>
                <label 
                  htmlFor="companyName" 
                  className="block text-sm font-medium mb-2"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  Company Name *
                </label>
                <input
                  id="companyName"
                  name="companyName"
                  type="text"
                  required
                  value={formData.companyName}
                  onChange={handleChange}
                  className={`input w-full ${errors.companyName ? 'border-red-500' : ''}`}
                  style={{
                    backgroundColor: 'var(--color-bg-tertiary)',
                    borderColor: errors.companyName ? '#ef4444' : 'var(--color-border-default)',
                    color: 'var(--color-text-primary)',
                  }}
                  placeholder="Enter company name"
                />
                {errors.companyName && (
                  <p className="text-red-400 text-sm mt-1">{errors.companyName}</p>
                )}
              </div>

              <div>
                <label 
                  htmlFor="companyEmail" 
                  className="block text-sm font-medium mb-2"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  Contact Email *
                </label>
                <input
                  id="companyEmail"
                  name="companyEmail"
                  type="email"
                  required
                  value={formData.companyEmail}
                  onChange={handleChange}
                  className={`input w-full ${errors.companyEmail ? 'border-red-500' : ''}`}
                  style={{
                    backgroundColor: 'var(--color-bg-tertiary)',
                    borderColor: errors.companyEmail ? '#ef4444' : 'var(--color-border-default)',
                    color: 'var(--color-text-primary)',
                  }}
                  placeholder="contact@example.com"
                />
                {errors.companyEmail && (
                  <p className="text-red-400 text-sm mt-1">{errors.companyEmail}</p>
                )}
              </div>
            </div>

            {/* System Administrator Information */}
            <div className="space-y-4">
              <h3 
                className="text-lg font-semibold pb-2 border-b"
                style={{ 
                  color: 'var(--color-text-primary)',
                  borderColor: 'var(--color-border-light)'
                }}
              >
                System Administrator Account
              </h3>
              
              <div>
                <label 
                  htmlFor="adminName" 
                  className="block text-sm font-medium mb-2"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  System Administrator Name *
                </label>
                <input
                  id="adminName"
                  name="adminName"
                  type="text"
                  required
                  value={formData.adminName}
                  onChange={handleChange}
                  className={`input w-full ${errors.adminName ? 'border-red-500' : ''}`}
                  style={{
                    backgroundColor: 'var(--color-bg-tertiary)',
                    borderColor: errors.adminName ? '#ef4444' : 'var(--color-border-default)',
                    color: 'var(--color-text-primary)',
                  }}
                  placeholder="Enter admin name"
                />
                {errors.adminName && (
                  <p className="text-red-400 text-sm mt-1">{errors.adminName}</p>
                )}
              </div>

              <div>
                <label 
                  htmlFor="adminEmail" 
                  className="block text-sm font-medium mb-2"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  System Administrator Email *
                </label>
                <input
                  id="adminEmail"
                  name="adminEmail"
                  type="email"
                  required
                  value={formData.adminEmail}
                  onChange={handleChange}
                  className={`input w-full ${errors.adminEmail ? 'border-red-500' : ''}`}
                  style={{
                    backgroundColor: 'var(--color-bg-tertiary)',
                    borderColor: errors.adminEmail ? '#ef4444' : 'var(--color-border-default)',
                    color: 'var(--color-text-primary)',
                  }}
                  placeholder="admin@example.com"
                />
                {errors.adminEmail && (
                  <p className="text-red-400 text-sm mt-1">{errors.adminEmail}</p>
                )}
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <label 
                    htmlFor="password" 
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
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className={`input w-full ${errors.password ? 'border-red-500' : ''}`}
                  style={{
                    backgroundColor: 'var(--color-bg-tertiary)',
                    borderColor: errors.password ? '#ef4444' : 'var(--color-border-default)',
                    color: 'var(--color-text-primary)',
                  }}
                  placeholder="Enter password"
                />
                {errors.password && (
                  <p className="text-red-400 text-sm mt-1">{errors.password}</p>
                )}
                
                {/* Password Strength Indicator */}
                <PasswordStrengthIndicator password={formData.password} showRequirements={false} />
              </div>

              <div>
                <label 
                  htmlFor="confirmPassword" 
                  className="block text-sm font-medium mb-2"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  Confirm Password *
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`input w-full ${errors.confirmPassword ? 'border-red-500' : ''}`}
                  style={{
                    backgroundColor: 'var(--color-bg-tertiary)',
                    borderColor: errors.confirmPassword ? '#ef4444' : 'var(--color-border-default)',
                    color: 'var(--color-text-primary)',
                  }}
                  placeholder="Confirm password"
                />
                {errors.confirmPassword && (
                  <p className="text-red-400 text-sm mt-1">{errors.confirmPassword}</p>
                )}
              </div>
            </div>

            {/* Terms and Conditions */}
            <div className="space-y-4">
              <div className="flex items-start">
                <input
                  id="acceptTerms"
                  name="acceptTerms"
                  type="checkbox"
                  checked={formData.acceptTerms}
                  onChange={handleChange}
                  className="mt-1 h-4 w-4 rounded"
                  style={{
                    accentColor: 'var(--color-primary)',
                    borderColor: 'var(--color-border-default)'
                  }}
                />
                <label 
                  htmlFor="acceptTerms" 
                  className="ml-2 block text-sm"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  I agree to the{' '}
                  <a 
                    href="#" 
                    style={{ color: 'var(--color-primary)' }}
                    onMouseEnter={(e) => e.target.style.opacity = '0.8'}
                    onMouseLeave={(e) => e.target.style.opacity = '1'}
                  >
                    Terms of Service
                  </a>{' '}
                  and{' '}
                  <a 
                    href="#" 
                    style={{ color: 'var(--color-primary)' }}
                    onMouseEnter={(e) => e.target.style.opacity = '0.8'}
                    onMouseLeave={(e) => e.target.style.opacity = '1'}
                  >
                    Privacy Policy
                  </a>
                </label>
              </div>
              {errors.acceptTerms && (
                <p className="text-red-400 text-sm">{errors.acceptTerms}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn border-0 w-full"
              style={{ 
                backgroundColor: 'var(--color-primary)',
                color: 'white'
              }}
              onMouseEnter={(e) => e.target.style.opacity = '0.9'}
              onMouseLeave={(e) => e.target.style.opacity = '1'}
            >
              {isLoading ? (
                <>
                  <span className="loading loading-spinner loading-sm"></span>
                  Creating Company...
                </>
              ) : (
                'Create Company'
              )}
            </button>
          </form>

          {/* Login Link */}
          <div className="mt-6 text-center">
            <p style={{ color: 'var(--color-text-secondary)' }}>
              Already have an account?{' '}
              <Link 
                to="/login" 
                className="font-medium"
                style={{ color: 'var(--color-primary)' }}
                onMouseEnter={(e) => e.target.style.opacity = '0.8'}
                onMouseLeave={(e) => e.target.style.opacity = '1'}
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanySignup; 