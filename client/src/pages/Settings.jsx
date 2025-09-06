import { useState } from 'react';
import useAuthStore from '../context/authStore';
import DeleteConfirmModal from '../components/common/DeleteConfirmModal';

const Settings = () => {
  const { user, isAdmin, isSysAdmin, deleteCompany } = useAuthStore();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteCompany = async () => {
    setShowDeleteModal(true);
  };

  const confirmDeleteCompany = async () => {
    setIsDeleting(true);
    try {
      console.log('Attempting to delete company...');
      const result = await deleteCompany();
      console.log('Delete company result:', result);
      if (result.success) {
        // Redirect will be handled by the auth store
        console.log('Company deletion successful, redirecting...');
      } else {
        console.error('Company deletion failed:', result.error);
        alert(`Failed to delete company: ${result.error}`);
      }
    } catch (error) {
      console.error('Error deleting company:', error);
      alert(`Error deleting company: ${error.message}`);
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
        <p className="text-gray-400">Manage your account and company settings</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Section */}
        <div className="lg:col-span-2">
          <div className="card bg-gray-800 border border-gray-700">
            <div className="card-body">
              <h2 className="card-title text-xl text-white mb-6">Profile Information</h2>
              
              <div className="space-y-6">
                {/* Profile Picture */}
                <div className="flex items-center space-x-4">
                  <div className="avatar placeholder">
                    <div className="bg-indigo-600 text-white rounded-full w-20">
                      <span className="text-2xl font-bold">{user?.name?.charAt(0)}</span>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">{user?.name}</h3>
                    <p className="text-gray-400 capitalize">{user?.role?.toLowerCase()}</p>
                  </div>
                </div>

                {/* User Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="label">
                      <span className="label-text text-gray-300">Full Name</span>
                    </label>
                    <input
                      type="text"
                      value={user?.name || ''}
                      disabled
                      className="input input-bordered w-full bg-gray-700 border-gray-600 text-white"
                    />
                  </div>
                  
                  <div>
                    <label className="label">
                      <span className="label-text text-gray-300">Email</span>
                    </label>
                    <input
                      type="email"
                      value={user?.email || ''}
                      disabled
                      className="input input-bordered w-full bg-gray-700 border-gray-600 text-white"
                    />
                  </div>
                  
                  <div>
                    <label className="label">
                      <span className="label-text text-gray-300">Role</span>
                    </label>
                    <input
                      type="text"
                      value={user?.role || ''}
                      disabled
                      className="input input-bordered w-full bg-gray-700 border-gray-600 text-white"
                    />
                  </div>
                  
                  <div>
                    <label className="label">
                      <span className="label-text text-gray-300">Company</span>
                    </label>
                    <input
                      type="text"
                      value={user?.companyName || ''}
                      disabled
                      className="input input-bordered w-full bg-gray-700 border-gray-600 text-white"
                    />
                  </div>
                </div>

                {/* Future Settings Placeholder */}
                <div className="pt-4 border-t border-gray-700">
                  <p className="text-gray-400 text-sm">
                    More profile settings coming soon...
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Company Management Section - Only for SYSDMIN */}
        {isSysAdmin() && (
          <div className="lg:col-span-1">
            <div className="card bg-gray-800 border border-gray-700">
              <div className="card-body">
                <h2 className="card-title text-xl text-white mb-6">Company Management</h2>
                
                <div className="space-y-4">
                  <div className="alert alert-warning">
                    <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <span className="text-sm">Danger Zone</span>
                  </div>
                  
                  <button
                    onClick={() => setShowDeleteModal(true)}
                    className="btn btn-error btn-outline w-full"
                  >
                    Delete Company
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Credits & Copyright Section */}
      <div className="mt-12 pt-8 border-t border-gray-700">
        <div className="text-center text-gray-500 text-sm">
          <p className="mb-2">
            <strong className="text-gray-400">Task Manager</strong> v0.0.1
          </p>
          <p className="mb-1">
            © 2025 COMPANY NAME. All rights reserved.
          </p>
        </div>
      </div>

      {/* Delete Company Modal */}
      {showDeleteModal && (
        <div className="modal modal-open">
          <div className="modal-box bg-gray-800 border border-gray-700">
            <h3 className="font-bold text-lg text-white mb-4">
              Delete Company
            </h3>
            <p className="text-gray-300 mb-6">
              Are you sure you want to delete your company? This action will permanently delete:
            </p>
            <ul className="text-gray-300 mb-6 list-disc list-inside space-y-1">
              <li>All tasks and projects</li>
              <li>All employees and their data</li>
              <li>All comments and activity</li>
              <li>Company settings and configuration</li>
            </ul>
            <p className="text-red-400 font-semibold mb-6">
              This action cannot be undone!
            </p>
            
            <div className="modal-action">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="btn btn-ghost text-gray-300 hover:text-white"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteCompany}
                className="btn btn-error bg-red-600 hover:bg-red-700 text-white border-0"
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <span className="loading loading-spinner loading-sm"></span>
                    Deleting...
                  </>
                ) : (
                  'Delete Company'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
