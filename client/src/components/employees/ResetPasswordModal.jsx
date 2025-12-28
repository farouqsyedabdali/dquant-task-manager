import { useState } from 'react';
import useUserStore from '../../stores/userStore';

const ResetPasswordModal = ({ isOpen, onClose, employee }) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  const { resetUserPassword } = useUserStore();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    // Validation
    if (!newPassword || newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      const result = await resetUserPassword(employee.id, newPassword);
      
      if (result.success) {
        setSuccess(true);
        setNewPassword('');
        setConfirmPassword('');
        // Close modal after 2 seconds
        setTimeout(() => {
          onClose();
          setSuccess(false);
        }, 2000);
      } else {
        setError(result.error || 'Failed to reset password');
      }
    } catch (error) {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setNewPassword('');
      setConfirmPassword('');
      setError('');
      setSuccess(false);
      onClose();
    }
  };

  if (!isOpen || !employee) return null;

  return (
    <div className="modal modal-open backdrop-blur-sm">
      <div 
        className="modal-box"
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
            Reset Password for {employee.name}
          </h3>
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="btn btn-ghost btn-sm transition-colors duration-200 disabled:opacity-50"
            style={{ 
              color: 'var(--color-text-secondary)',
            }}
            onMouseEnter={(e) => {
              if (!isLoading) {
                e.currentTarget.style.color = 'var(--color-text-primary)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--color-text-secondary)';
            }}
          >
            ✕
          </button>
        </div>

        {success ? (
          <div className="text-center py-8">
            <div 
              className="text-6xl mb-4"
              style={{ color: '#10b981' }}
            >
              ✓
            </div>
            <h4 
              className="text-xl font-semibold mb-2"
              style={{ color: 'var(--color-text-primary)' }}
            >
              Password Reset Successfully!
            </h4>
            <p style={{ color: 'var(--color-text-secondary)' }}>
              The password for {employee.name} has been reset successfully.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div 
              className="rounded-lg p-4 mb-6"
              style={{
                backgroundColor: 'var(--color-bg-tertiary)',
              }}
            >
              <div className="flex items-center space-x-3">
                <div className="avatar placeholder">
                  <div 
                    className="rounded-full w-12"
                    style={{
                      backgroundColor: 'var(--color-primary)',
                      color: '#ffffff',
                    }}
                  >
                    <span className="text-lg">{employee.name.charAt(0)}</span>
                  </div>
                </div>
                <div>
                  <div 
                    className="font-medium"
                    style={{ color: 'var(--color-text-primary)' }}
                  >
                    {employee.name}
                  </div>
                  <div 
                    className="text-sm"
                    style={{ color: 'var(--color-text-secondary)' }}
                  >
                    {employee.email}
                  </div>
                  <div 
                    className="text-xs"
                    style={{ color: 'var(--color-text-tertiary)' }}
                  >
                    {employee.role === 'SYSDMIN' ? 'System Administrator' : 
                     employee.role === 'ADMIN' ? 'Admin' : 'Employee'}
                  </div>
                </div>
              </div>
            </div>

            <style>{`
              #reset-password-new::placeholder,
              #reset-password-confirm::placeholder {
                color: var(--color-text-tertiary);
              }
            `}</style>
            <div>
              <label 
                className="block text-sm font-medium mb-2 transition-colors duration-200"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                New Password
              </label>
              <input
                id="reset-password-new"
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
                id="reset-password-confirm"
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

            {error && (
              <div className="alert alert-error">
                <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={handleClose}
                disabled={isLoading}
                className="btn transition-colors duration-200 disabled:opacity-50"
                style={{
                  backgroundColor: 'var(--color-bg-tertiary)',
                  borderColor: 'var(--color-border-default)',
                  color: 'var(--color-text-primary)',
                }}
                onMouseEnter={(e) => {
                  if (!isLoading) {
                    e.currentTarget.style.backgroundColor = 'var(--color-bg-secondary)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--color-bg-tertiary)';
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading || !newPassword || !confirmPassword}
                className="btn border-0 transition-colors duration-200 disabled:opacity-50"
                style={{
                  backgroundColor: '#ef4444',
                  color: '#ffffff',
                }}
                onMouseEnter={(e) => {
                  if (!isLoading && newPassword && confirmPassword) {
                    e.currentTarget.style.backgroundColor = '#dc2626';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#ef4444';
                }}
              >
                {isLoading ? (
                  <>
                    <span className="loading loading-spinner loading-sm"></span>
                    Resetting...
                  </>
                ) : (
                  'Reset Password'
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ResetPasswordModal;
