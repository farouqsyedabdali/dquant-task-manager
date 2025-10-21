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
      <div className="modal-box bg-gray-800 border border-gray-700">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-white">
            Reset Password for {employee.name}
          </h3>
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="btn btn-ghost btn-sm text-gray-400 hover:text-white disabled:opacity-50"
          >
            ✕
          </button>
        </div>

        {success ? (
          <div className="text-center py-8">
            <div className="text-green-400 text-6xl mb-4">✓</div>
            <h4 className="text-xl font-semibold text-white mb-2">Password Reset Successfully!</h4>
            <p className="text-gray-400">
              The password for {employee.name} has been reset successfully.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-gray-700 rounded-lg p-4 mb-6">
              <div className="flex items-center space-x-3">
                <div className="avatar placeholder">
                  <div className="bg-indigo-600 text-white rounded-full w-12">
                    <span className="text-lg">{employee.name.charAt(0)}</span>
                  </div>
                </div>
                <div>
                  <div className="font-medium text-white">{employee.name}</div>
                  <div className="text-gray-400 text-sm">{employee.email}</div>
                  <div className="text-gray-500 text-xs">
                    {employee.role === 'SYSDMIN' ? 'System Administrator' : 
                     employee.role === 'ADMIN' ? 'Admin' : 'Employee'}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                New Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="input input-bordered bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-indigo-500 focus:ring-indigo-500 w-full"
                placeholder="Enter new password (min 6 characters)"
                disabled={isLoading}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Confirm New Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="input input-bordered bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-indigo-500 focus:ring-indigo-500 w-full"
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
                className="btn bg-gray-700 hover:bg-gray-600 text-white border-gray-600 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading || !newPassword || !confirmPassword}
                className="btn bg-red-600 hover:bg-red-700 text-white border-0 disabled:opacity-50"
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
