import { useState } from 'react';
import { authAPI } from '../../services/api';

export default function ForgotPasswordModal({ isOpen, onClose }) {
  const [step, setStep] = useState(1); // 1: email, 2: code, 3: new password
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSendCode = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    setIsLoading(true);
    try {
      const response = await authAPI.forgotPassword(email);
      setSuccess(response.data.message);
      setStep(2);
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to send verification code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!code) {
      setError('Please enter the verification code');
      return;
    }

    setIsLoading(true);
    try {
      const response = await authAPI.verifyPasswordResetCode(email, code);
      setSuccess(response.data.message);
      setStep(3);
    } catch (error) {
      setError(error.response?.data?.error || 'Invalid verification code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!newPassword || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);
    try {
      const response = await authAPI.resetPasswordWithCode(email, code, newPassword);
      setSuccess(response.data.message);
      setTimeout(() => {
        onClose();
        // Reset form
        setStep(1);
        setEmail('');
        setCode('');
        setNewPassword('');
        setConfirmPassword('');
        setError('');
        setSuccess('');
      }, 2000);
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to reset password');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    onClose();
    // Reset form
    setStep(1);
    setEmail('');
    setCode('');
    setNewPassword('');
    setConfirmPassword('');
  };

  if (!isOpen) return null;

  return (
    <div className="modal modal-open backdrop-blur-sm">
      <div 
        className="modal-box max-w-md"
        style={{
          backgroundColor: 'var(--color-bg-secondary)',
          borderColor: 'var(--color-border-default)',
          borderWidth: 1,
        }}
      >
        <div className="flex justify-between items-center mb-6">
          <h3 
            className="text-2xl font-bold"
            style={{ color: 'var(--color-text-primary)' }}
          >
            {step === 1 && 'Forgot Password'}
            {step === 2 && 'Enter Verification Code'}
            {step === 3 && 'Create New Password'}
          </h3>
          <button
            onClick={handleClose}
            className="btn btn-ghost btn-sm btn-circle transition-colors duration-200"
            style={{ 
              color: 'var(--color-text-secondary)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--color-text-primary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--color-text-secondary)';
            }}
          >
            ✕
          </button>
        </div>

        {/* Step 1: Email */}
        {step === 1 && (
          <form onSubmit={handleSendCode} className="space-y-4">
            <style>{`
              #forgot-password-email::placeholder {
                color: var(--color-text-tertiary);
              }
            `}</style>
            <div>
              <label 
                className="block text-sm font-medium mb-2 transition-colors duration-200"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                Email Address
              </label>
              <input
                id="forgot-password-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input input-bordered w-full transition-colors duration-200"
                style={{
                  backgroundColor: 'var(--color-bg-tertiary)',
                  borderColor: 'var(--color-border-default)',
                  color: 'var(--color-text-primary)',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'var(--color-primary)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'var(--color-border-default)';
                }}
                placeholder="Enter your email address"
                disabled={isLoading}
                required
              />
            </div>

            {/* Error/Success Messages */}
            {error && (
              <div className="alert alert-error">
                <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{error}</span>
              </div>
            )}
            {success && (
              <div className="alert alert-success">
                <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{success}</span>
              </div>
            )}

            <div className="modal-action">
              <button
                type="submit"
                className="btn border-0 transition-colors duration-200"
                style={{
                  backgroundColor: 'var(--color-primary)',
                  color: '#ffffff',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = '0.9';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = '1';
                }}
                disabled={isLoading}
              >
                {isLoading ? 'Sending...' : 'Send Code'}
              </button>
              <button
                type="button"
                onClick={handleClose}
                className="btn btn-ghost transition-colors duration-200"
                style={{ 
                  color: 'var(--color-text-secondary)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = 'var(--color-text-primary)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'var(--color-text-secondary)';
                }}
                disabled={isLoading}
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Step 2: Verification Code */}
        {step === 2 && (
          <form onSubmit={handleVerifyCode} className="space-y-4">
            <style>{`
              #forgot-password-code::placeholder {
                color: var(--color-text-tertiary);
              }
            `}</style>
            <div className="text-center mb-4">
              <p style={{ color: 'var(--color-text-secondary)' }}>
                We've sent a 6-digit verification code to <strong style={{ color: 'var(--color-text-primary)' }}>{email}</strong>
              </p>
            </div>

            <div>
              <label 
                className="block text-sm font-medium mb-2 transition-colors duration-200"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                Verification Code
              </label>
              <input
                id="forgot-password-code"
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="input input-bordered w-full text-center text-2xl tracking-widest transition-colors duration-200"
                style={{
                  backgroundColor: 'var(--color-bg-tertiary)',
                  borderColor: 'var(--color-border-default)',
                  color: 'var(--color-text-primary)',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'var(--color-primary)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'var(--color-border-default)';
                }}
                placeholder="000000"
                disabled={isLoading}
                maxLength={6}
                required
              />
            </div>

            {/* Error/Success Messages */}
            {error && (
              <div className="alert alert-error">
                <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{error}</span>
              </div>
            )}
            {success && (
              <div className="alert alert-success">
                <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{success}</span>
              </div>
            )}

            <div className="modal-action">
              <button
                type="submit"
                className="btn border-0 transition-colors duration-200"
                style={{
                  backgroundColor: 'var(--color-primary)',
                  color: '#ffffff',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = '0.9';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = '1';
                }}
                disabled={isLoading || code.length !== 6}
              >
                {isLoading ? 'Verifying...' : 'Verify Code'}
              </button>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="btn btn-ghost transition-colors duration-200"
                style={{ 
                  color: 'var(--color-text-secondary)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = 'var(--color-text-primary)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'var(--color-text-secondary)';
                }}
                disabled={isLoading}
              >
                Back
              </button>
            </div>
          </form>
        )}

        {/* Step 3: New Password */}
        {step === 3 && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <style>{`
              #forgot-password-new::placeholder,
              #forgot-password-confirm::placeholder {
                color: var(--color-text-tertiary);
              }
            `}</style>
            <div className="text-center mb-4">
              <p style={{ color: 'var(--color-text-secondary)' }}>
                Create a new password for <strong style={{ color: 'var(--color-text-primary)' }}>{email}</strong>
              </p>
            </div>

            <div>
              <label 
                className="block text-sm font-medium mb-2 transition-colors duration-200"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                New Password
              </label>
              <input
                id="forgot-password-new"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="input input-bordered w-full transition-colors duration-200"
                style={{
                  backgroundColor: 'var(--color-bg-tertiary)',
                  borderColor: 'var(--color-border-default)',
                  color: 'var(--color-text-primary)',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'var(--color-primary)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'var(--color-border-default)';
                }}
                placeholder="Enter new password (min 6 characters)"
                disabled={isLoading}
                required
              />
            </div>

            <div>
              <label 
                className="block text-sm font-medium mb-2 transition-colors duration-200"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                Confirm New Password
              </label>
              <input
                id="forgot-password-confirm"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="input input-bordered w-full transition-colors duration-200"
                style={{
                  backgroundColor: 'var(--color-bg-tertiary)',
                  borderColor: 'var(--color-border-default)',
                  color: 'var(--color-text-primary)',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'var(--color-primary)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'var(--color-border-default)';
                }}
                placeholder="Confirm new password"
                disabled={isLoading}
                required
              />
            </div>

            {/* Error/Success Messages */}
            {error && (
              <div className="alert alert-error">
                <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{error}</span>
              </div>
            )}
            {success && (
              <div className="alert alert-success">
                <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{success}</span>
              </div>
            )}

            <div className="modal-action">
              <button
                type="submit"
                className="btn border-0 transition-colors duration-200"
                style={{
                  backgroundColor: 'var(--color-primary)',
                  color: '#ffffff',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = '0.9';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = '1';
                }}
                disabled={isLoading}
              >
                {isLoading ? 'Resetting...' : 'Reset Password'}
              </button>
              <button
                type="button"
                onClick={() => setStep(2)}
                className="btn btn-ghost transition-colors duration-200"
                style={{ 
                  color: 'var(--color-text-secondary)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = 'var(--color-text-primary)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'var(--color-text-secondary)';
                }}
                disabled={isLoading}
              >
                Back
              </button>
            </div>
          </form>
        )}

        {/* Progress indicator */}
        <div className="flex justify-center mt-4">
          <div className="flex space-x-2">
            {[1, 2, 3].map((stepNumber) => (
              <div
                key={stepNumber}
                className="w-3 h-3 rounded-full transition-colors duration-200"
                style={{
                  backgroundColor: step >= stepNumber 
                    ? 'var(--color-primary)' 
                    : 'var(--color-border-default)'
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
