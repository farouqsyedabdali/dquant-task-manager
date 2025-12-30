import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { authAPI } from '../services/api';

const EmailVerification = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('waiting'); // waiting, verifying, success, error
  const [message, setMessage] = useState('');
  const [isResending, setIsResending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');

  const emailParam = searchParams.get('email');
  const resendParam = searchParams.get('resend');

  useEffect(() => {
    if (emailParam && resendParam) {
      // Handle resend case from login redirect
      setEmail(emailParam);
      setStatus('waiting');
      setMessage('Please check your email for the verification code and enter it below.');
    } else if (emailParam) {
      // Handle direct access with email
      setEmail(emailParam);
      setStatus('waiting');
      setMessage('Please check your email for the verification code and enter it below.');
    } else {
      setStatus('error');
      setMessage('No email provided. Please go back to login and try again.');
    }
  }, [emailParam, resendParam]);

  const handleCodeChange = (e) => {
    const value = e.target.value.replace(/\D/g, ''); // Only allow digits
    if (value.length <= 6) {
      setCode(value);
    }
  };

  const verifyCode = async () => {
    if (code.length !== 6) {
      setMessage('Please enter a 6-digit verification code');
      return;
    }

    try {
      setIsVerifying(true);
      setStatus('verifying');
      
      const response = await authAPI.verifyEmail({ 
        code, 
        email: email.toLowerCase() 
      });
      
      if (response.data) {
        setStatus('success');
        setMessage('Email verified successfully! You can now log in to your account.');
      }
    } catch (error) {
      console.error('Verification error:', error);
      const errorMessage = error.response?.data?.error || 'Failed to verify code';
      setStatus('error');
      setMessage(errorMessage);
    } finally {
      setIsVerifying(false);
    }
  };

  const resendVerification = async () => {
    if (!email) {
      setMessage('Please enter your email address to resend verification');
      return;
    }

    try {
      setIsResending(true);
      const response = await authAPI.sendVerificationEmail({ email });
      setMessage('New verification code sent! Please check your email and enter the code below.');
      setStatus('waiting');
      setCode(''); // Clear the code input
    } catch (error) {
      console.error('Resend error:', error);
      const errorMessage = error.response?.data?.error || 'Failed to resend verification code';
      setMessage(errorMessage);
    } finally {
      setIsResending(false);
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'verifying':
        return (
          <div className="loading loading-spinner loading-lg" style={{ color: 'var(--color-primary)' }}></div>
        );
      case 'success':
        return (
          <div 
            className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{ backgroundColor: 'rgba(16, 185, 129, 0.2)' }}
          >
            <svg className="w-8 h-8" style={{ color: '#10b981' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        );
      case 'error':
        return (
          <div 
            className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)' }}
          >
            <svg className="w-8 h-8" style={{ color: '#ef4444' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        );
      case 'waiting':
        return (
          <div className="relative w-16 h-16">
            <div 
              className="absolute inset-0 rounded-full"
              style={{ 
                backgroundColor: 'var(--color-primary)',
                opacity: 0.2
              }}
            />
            <div className="relative w-full h-full flex items-center justify-center">
              <svg className="w-8 h-8" style={{ color: 'var(--color-primary)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'success':
        return { color: '#10b981' };
      case 'error':
        return { color: '#ef4444' };
      case 'verifying':
        return { color: 'var(--color-primary)' };
      default:
        return { color: 'var(--color-primary)' };
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
            background: 'linear-gradient(to right, var(--color-primary), #8b5cf6)'
          }}
        >
          <span className="font-bold text-lg text-white">CN</span>
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

      <div className="max-w-md w-full">
        <div 
          className="border rounded-lg shadow-lg p-8 text-center"
          style={{
            backgroundColor: 'var(--color-bg-secondary)',
            borderColor: 'var(--color-border-default)'
          }}
        >
          {/* Status Icon */}
          <div className="flex justify-center mb-6">
            {getStatusIcon()}
          </div>

          {/* Title */}
          <h1 
            className="text-2xl font-bold mb-4"
            style={getStatusColor()}
          >
            {status === 'verifying' && 'Verifying Code...'}
            {status === 'success' && 'Email Verified!'}
            {status === 'error' && 'Verification Failed'}
            {status === 'waiting' && 'Enter Verification Code'}
          </h1>

          {/* Message */}
          <p 
            className="mb-6"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            {message}
          </p>

          {/* Code Input Form */}
          {status === 'waiting' && (
            <div className="space-y-6">
              <div className="text-left">
                <label 
                  className="block text-sm font-medium mb-2"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  Verification Code
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={handleCodeChange}
                  className="input w-full text-center text-2xl font-mono tracking-widest"
                  style={{
                    backgroundColor: 'var(--color-bg-tertiary)',
                    borderColor: 'var(--color-border-default)',
                    color: 'var(--color-text-primary)',
                  }}
                  placeholder="000000"
                  maxLength={6}
                  autoComplete="one-time-code"
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = 'var(--color-primary)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = 'var(--color-border-default)';
                  }}
                />
                <p 
                  className="text-xs mt-2"
                  style={{ color: 'var(--color-text-tertiary)' }}
                >
                  Enter the 6-digit code sent to {email}
                </p>
              </div>

              <button
                onClick={verifyCode}
                disabled={isVerifying || code.length !== 6}
                className="btn text-white border-0 w-full disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ 
                  backgroundColor: 'var(--color-primary)',
                }}
                onMouseEnter={(e) => {
                  if (!e.currentTarget.disabled) {
                    e.currentTarget.style.opacity = '0.9';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!e.currentTarget.disabled) {
                    e.currentTarget.style.opacity = '1';
                  }
                }}
              >
                {isVerifying ? (
                  <>
                    <span className="loading loading-spinner loading-sm mr-2"></span>
                    Verifying...
                  </>
                ) : (
                  'Verify Code'
                )}
              </button>

              <div className="text-center">
                <button
                  onClick={resendVerification}
                  disabled={isResending}
                  className="font-medium text-sm transition-colors"
                  style={{ 
                    color: 'var(--color-primary)',
                  }}
                  onMouseEnter={(e) => {
                    if (!e.currentTarget.disabled) {
                      e.currentTarget.style.opacity = '0.8';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!e.currentTarget.disabled) {
                      e.currentTarget.style.opacity = '1';
                    }
                  }}
                >
                  {isResending ? 'Sending...' : "Didn't receive code? Resend"}
                </button>
              </div>
            </div>
          )}

          {/* Success Actions */}
          {status === 'success' && (
            <div className="space-y-4">
              <Link
                to="/login"
                className="btn text-white border-0 w-full"
                style={{ 
                  backgroundColor: 'var(--color-primary)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = '0.9';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = '1';
                }}
              >
                Continue to Login
              </Link>
            </div>
          )}

          {/* Error Actions */}
          {status === 'error' && (
            <div className="space-y-4">
              <button
                onClick={resendVerification}
                disabled={isResending}
                className="btn text-white border-0 w-full disabled:opacity-50"
                style={{ 
                  backgroundColor: 'var(--color-primary)',
                }}
                onMouseEnter={(e) => {
                  if (!e.currentTarget.disabled) {
                    e.currentTarget.style.opacity = '0.9';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!e.currentTarget.disabled) {
                    e.currentTarget.style.opacity = '1';
                  }
                }}
              >
                {isResending ? 'Sending...' : 'Resend Verification Code'}
              </button>

              <div className="text-center">
                <Link
                  to="/login"
                  className="font-medium transition-colors"
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
                  Back to Login
                </Link>
              </div>
            </div>
          )}

          {/* Verifying State */}
          {status === 'verifying' && (
            <div className="text-center">
              <p 
                className="text-sm"
                style={{ color: 'var(--color-text-tertiary)' }}
              >
                Please wait while we verify your code...
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p 
            className="text-sm"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            Need help?{' '}
            <Link 
              to="/contact" 
              className="font-medium transition-colors"
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
              Contact Support
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default EmailVerification;