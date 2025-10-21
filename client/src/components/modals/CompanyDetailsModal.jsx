import React, { useState, useEffect } from 'react';
import { superAdminAPI } from '../../services/api';

const CompanyDetailsModal = ({ company, isOpen, onClose }) => {
  const [companyDetails, setCompanyDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && company) {
      fetchCompanyDetails();
    }
  }, [isOpen, company]);

  const fetchCompanyDetails = async () => {
    try {
      setLoading(true);
      const response = await superAdminAPI.getCompanyById(company.id);
      setCompanyDetails(response.data.data);
    } catch (err) {
      setError('Failed to fetch company details');
      console.error('Company details error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSuspendCompany = async () => {
    try {
      await superAdminAPI.toggleCompanyStatus(company.id, 'suspend');
      onClose();
    } catch (err) {
      setError('Failed to suspend company');
      console.error('Suspend company error:', err);
    }
  };

  const handleRestoreCompany = async () => {
    try {
      await superAdminAPI.toggleCompanyStatus(company.id, 'activate');
      onClose();
    } catch (err) {
      setError('Failed to restore company');
      console.error('Restore company error:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 border border-gray-700 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white">Company Details</h2>
            <button
              onClick={onClose}
              className="btn btn-sm btn-circle btn-ghost text-gray-400 hover:text-white"
            >
              ✕
            </button>
          </div>

          {loading && (
            <div className="flex justify-center py-8">
              <div className="loading loading-spinner loading-lg text-indigo-500"></div>
            </div>
          )}

          {error && (
            <div className="alert alert-error mb-4">
              <span>{error}</span>
            </div>
          )}

          {companyDetails && (
            <div className="space-y-6">
              {/* Company Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-700 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-white mb-3">Basic Information</h3>
                  <div className="space-y-2">
                    <div>
                      <span className="text-gray-400">Name:</span>
                      <span className="text-white ml-2">{companyDetails.name}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Email:</span>
                      <span className="text-white ml-2">{companyDetails.email}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Plan:</span>
                      <span className={`badge ml-2 ${
                        companyDetails.subscriptionPlan === 'free' ? 'badge-outline' : 'badge-success'
                      }`}>
                        {companyDetails.subscriptionPlan}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400">Created:</span>
                      <span className="text-white ml-2">
                        {new Date(companyDetails.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400">Status:</span>
                      <span className={`badge ml-2 ${
                        companyDetails.markedForDeletion ? 'badge-error' : 'badge-success'
                      }`}>
                        {companyDetails.markedForDeletion ? 'Marked for Deletion' : 'Active'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-700 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-white mb-3">Health Metrics</h3>
                  <div className="space-y-2">
                    <div>
                      <span className="text-gray-400">Health Score:</span>
                      <span className={`ml-2 ${
                        companyDetails.healthScore >= 80 ? 'text-green-500' :
                        companyDetails.healthScore >= 60 ? 'text-yellow-500' :
                        'text-red-500'
                      }`}>
                        {companyDetails.healthScore}%
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400">Status:</span>
                      <span className={`badge ml-2 ${
                        companyDetails.healthStatus === 'healthy' ? 'badge-success' :
                        companyDetails.healthStatus === 'warning' ? 'badge-warning' :
                        'badge-error'
                      }`}>
                        {companyDetails.healthStatus}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400">Users:</span>
                      <span className="text-white ml-2">{companyDetails.userCount}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Tasks:</span>
                      <span className="text-white ml-2">{companyDetails.taskCount}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Audit Logs:</span>
                      <span className="text-white ml-2">{companyDetails.auditCount}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Users List */}
              <div className="bg-gray-700 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-white mb-3">Company Users</h3>
                <div className="overflow-x-auto">
                  <table className="table w-full">
                    <thead>
                      <tr>
                        <th className="text-gray-300">Name</th>
                        <th className="text-gray-300">Email</th>
                        <th className="text-gray-300">Role</th>
                        <th className="text-gray-300">Verified</th>
                        <th className="text-gray-300">Created</th>
                      </tr>
                    </thead>
                    <tbody>
                      {companyDetails.users?.map((user) => (
                        <tr key={user.id} className="border-b border-gray-600">
                          <td className="text-white">{user.name}</td>
                          <td className="text-gray-300">{user.email}</td>
                          <td>
                            <span className={`badge text-xs ${
                              user.role === 'SUPER_ADMIN' ? 'badge-error' :
                              user.role === 'SYSDMIN' ? 'badge-warning' :
                              user.role === 'ADMIN' ? 'badge-info' :
                              'badge-outline'
                            }`}>
                              {user.role}
                            </span>
                          </td>
                          <td>
                            <span className={`badge text-xs ${
                              user.isEmailVerified ? 'badge-success' : 'badge-error'
                            }`}>
                              {user.isEmailVerified ? 'Verified' : 'Unverified'}
                            </span>
                          </td>
                          <td className="text-gray-300">
                            {new Date(user.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
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
                {companyDetails.markedForDeletion ? (
                  <button
                    onClick={handleRestoreCompany}
                    className="btn btn-success"
                  >
                    Restore Company
                  </button>
                ) : (
                  <button
                    onClick={handleSuspendCompany}
                    className="btn btn-error"
                  >
                    Suspend Company
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CompanyDetailsModal;
