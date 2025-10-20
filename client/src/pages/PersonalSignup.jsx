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
      navigate('/personal-dashboard');
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
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      {/* Company Branding */}
      <div className="absolute top-6 left-6 flex items-center space-x-3">
        <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
          <span className="text-white font-bold text-lg">CN</span>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">COMPANY NAME</h1>
          <p className="text-gray-400 text-sm">Task Manager</p>
        </div>
      </div>

      <div className="max-w-2xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Create Personal Account
          </h1>
          <p className="text-gray-400">
            Start managing your personal tasks with full control
          </p>
        </div>

        {/* Form */}
        <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-lg p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Full Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={`input bg-gray-700 border-gray-600 text-white placeholder-gray-400 w-full focus:border-indigo-500 focus:ring-indigo-500 ${
                  errors.name ? 'border-red-500' : ''
                }`}
                placeholder="Enter your full name"
              />
              {errors.name && (
                <p className="text-red-400 text-sm mt-1">{errors.name}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Email Address *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`input bg-gray-700 border-gray-600 text-white placeholder-gray-400 w-full focus:border-indigo-500 focus:ring-indigo-500 ${
                  errors.email ? 'border-red-500' : ''
                }`}
                placeholder="Enter your email address"
              />
              {errors.email && (
                <p className="text-red-400 text-sm mt-1">{errors.email}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <label className="text-sm font-medium text-gray-300">
                  Password *
                </label>
                <div className="tooltip tooltip-right" data-tip="Password Requirements:&#10;• At least 6 characters&#10;• One uppercase letter (A-Z)&#10;• One lowercase letter (a-z)&#10;• One number (0-9)&#10;• One special character (!@#$%^&*)">
                  <svg className="w-4 h-4 text-gray-400 hover:text-gray-300 cursor-help" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={`input bg-gray-700 border-gray-600 text-white placeholder-gray-400 w-full focus:border-indigo-500 focus:ring-indigo-500 ${
                  errors.password ? 'border-red-500' : ''
                }`}
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
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Confirm Password *
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className={`input bg-gray-700 border-gray-600 text-white placeholder-gray-400 w-full focus:border-indigo-500 focus:ring-indigo-500 ${
                  errors.confirmPassword ? 'border-red-500' : ''
                }`}
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
                  className={`checkbox mt-1 bg-gray-700 border-gray-600 checked:bg-indigo-600 checked:border-indigo-600 ${
                    errors.acceptTerms ? 'checkbox-error' : ''
                  }`}
                />
                <span className="text-sm text-gray-300">
                  I agree to the{' '}
                  <Link to="/terms" className="text-indigo-400 hover:text-indigo-300">
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link to="/privacy" className="text-indigo-400 hover:text-indigo-300">
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
              <div className="bg-red-900/20 border border-red-500 rounded-lg p-4">
                <p className="text-red-400 text-sm">{errors.submit}</p>
              </div>
            )}

            {/* Global Error */}
            {error && (
              <div className="bg-red-900/20 border border-red-500 rounded-lg p-4">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="btn bg-indigo-600 hover:bg-indigo-700 text-white border-0 w-full py-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
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
            <p className="text-gray-400 text-sm">
              Already have an account?{' '}
              <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-medium">
                Sign in here
              </Link>
            </p>
            <p className="text-gray-500 text-sm mt-2">
              Want to create a company account instead?{' '}
              <Link to="/company-signup" className="text-indigo-400 hover:text-indigo-300 font-medium">
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
