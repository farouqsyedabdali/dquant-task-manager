import React, { useState } from 'react';
import { superAdminAPI } from '../../services/api';

const UserDetailsModal = ({ user, isOpen, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  const handleResetPassword = async () => {
    const newPassword = prompt('Enter new password for user:');
    if (newPassword && newPassword.length >= 6) {
      try {
        setLoading(true);
        await superAdminAPI.resetUserPassword(user.id, newPassword);
        setMessage('Password reset successfully');
        setTimeout(() => setMessage(null), 3000);
      } catch (err) {
        setError('Failed to reset password');
        console.error('Reset password error:', err);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleToggleVerification = async () => {
    try {
      setLoading(true);
      // This would need a new API endpoint to toggle email verification
      setMessage('Email verification toggle not implemented yet');
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      setError('Failed to toggle email verification');
      console.error('Toggle verification error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 border border-gray-700 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white">User Details</h2>
            <button
              onClick={onClose}
              className="btn btn-sm btn-circle btn-ghost text-gray-400 hover:text-white"
            >
              ✕
            </button>
          </div>

          {message && (
            <div className="alert alert-success mb-4">
              <span>{message}</span>
            </div>
          )}

          {error && (
            <div className="alert alert-error mb-4">
              <span>{error}</span>
            </div>
          )}

          {loading && (
            <div className="flex justify-center py-4">
              <div className="loading loading-spinner loading-md text-indigo-500"></div>
            </div>
          )}

          <div className="space-y-6">
            {/* User Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-700 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-white mb-3">Personal Information</h3>
                <div className="space-y-2">
                  <div>
                    <span className="text-gray-400">Name:</span>
                    <span className="text-white ml-2">{user.name}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Email:</span>
                    <span className="text-white ml-2">{user.email}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Role:</span>
                    <span className={`badge ml-2 ${
                      user.role === 'SUPER_ADMIN' ? 'badge-error' :
                      user.role === 'SYSDMIN' ? 'badge-warning' :
                      user.role === 'ADMIN' ? 'badge-info' :
                      'badge-outline'
                    }`}>
                      {user.role}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">Email Verified:</span>
                    <span className={`badge ml-2 ${
                      user.isEmailVerified ? 'badge-success' : 'badge-error'
                    }`}>
                      {user.isEmailVerified ? 'Verified' : 'Unverified'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-700 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-white mb-3">Company Information</h3>
                <div className="space-y-2">
                  <div>
                    <span className="text-gray-400">Company:</span>
                    <span className="text-white ml-2">{user.company.name}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Company Email:</span>
                    <span className="text-white ml-2">{user.company.email}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Plan:</span>
                    <span className={`badge ml-2 ${
                      user.company.subscriptionPlan === 'free' ? 'badge-outline' : 'badge-success'
                    }`}>
                      {user.company.subscriptionPlan}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">Company Created:</span>
                    <span className="text-white ml-2">
                      {new Date(user.company.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Account Details */}
            <div className="bg-gray-700 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-white mb-3">Account Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="text-gray-400">User ID:</span>
                  <span className="text-white ml-2 font-mono text-sm">{user.id}</span>
                </div>
                <div>
                  <span className="text-gray-400">Company ID:</span>
                  <span className="text-white ml-2 font-mono text-sm">{user.companyId}</span>
                </div>
                <div>
                  <span className="text-gray-400">Account Created:</span>
                  <span className="text-white ml-2">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400">Last Updated:</span>
                  <span className="text-white ml-2">
                    {new Date(user.updatedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3">
              <button
                onClick={onClose}
                className="btn btn-outline"
              >
                Close
              </button>
              <button
                onClick={handleToggleVerification}
                className="btn btn-warning"
                disabled={loading}
              >
                {user.isEmailVerified ? 'Mark as Unverified' : 'Mark as Verified'}
              </button>
              <button
                onClick={handleResetPassword}
                className="btn btn-error"
                disabled={loading}
              >
                Reset Password
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDetailsModal;
