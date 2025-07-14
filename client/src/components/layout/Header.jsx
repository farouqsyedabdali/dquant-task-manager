import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../context/authStore';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { user, logout, isAdmin, deleteCompany } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleNavigation = (path) => {
    navigate(path);
    setIsMenuOpen(false);
  };

  const handleDeleteCompany = async () => {
    if (!window.confirm('Are you sure you want to delete your company? This action cannot be undone and will delete all data including tasks, employees, and projects.')) {
      return;
    }

    setIsDeleting(true);
    try {
      const result = await deleteCompany();
      if (result.success) {
        logout();
        navigate('/login');
      }
    } catch (error) {
      console.error('Error deleting company:', error);
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  return (
    <header className="bg-gray-800 shadow-lg border-b border-gray-700">
      <div className="max-w-[95%] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Brand */}
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <h1 className="text-xl font-bold text-white">
                {user?.companyName || 'DQuant Task Manager'}
              </h1>
            </div>
            
            {/* Navigation Links */}
            <nav className="hidden md:flex ml-8 space-x-4">
              <button
                onClick={() => handleNavigation('/dashboard')}
                className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
              >
                Dashboard
              </button>
              {isAdmin() && (
                <button
                  onClick={() => handleNavigation('/employees')}
                  className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
                >
                  Employees
                </button>
              )}
            </nav>
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            {/* User Info */}
            <div className="hidden md:flex items-center space-x-3">
              <div className="text-right">
                <p className="text-sm font-medium text-white">{user?.name}</p>
                <p className="text-xs text-gray-400 capitalize">{user?.role?.toLowerCase()}</p>
              </div>
              <div className="avatar placeholder">
                <div className="bg-indigo-600 text-white rounded-full w-8">
                  <span className="text-xs">{user?.name?.charAt(0)}</span>
                </div>
              </div>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="text-gray-300 hover:text-white focus:outline-none focus:text-white"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>

            {/* Admin Actions */}
            {isAdmin() && (
              <button
                onClick={() => setShowDeleteModal(true)}
                className="btn btn-error btn-sm bg-red-600 hover:bg-red-700 text-white border-0 mr-2"
              >
                Delete Company
              </button>
            )}

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="btn btn-primary btn-sm bg-indigo-600 hover:bg-indigo-700 text-white border-0"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 border-t border-gray-700">
              {/* Mobile Navigation */}
              <div className="space-y-1">
                <button
                  onClick={() => handleNavigation('/dashboard')}
                  className="text-gray-300 hover:text-white block px-3 py-2 rounded-md text-base font-medium"
                >
                  Dashboard
                </button>
                {isAdmin() && (
                  <button
                    onClick={() => handleNavigation('/employees')}
                    className="text-gray-300 hover:text-white block px-3 py-2 rounded-md text-base font-medium"
                  >
                    Employees
                  </button>
                )}
              </div>
              
              <div className="border-t border-gray-700 pt-4 mt-4">
                <div className="flex items-center space-x-3 px-3 py-2">
                  <div className="avatar placeholder">
                    <div className="bg-indigo-600 text-white rounded-full w-8">
                      <span className="text-xs">{user?.name?.charAt(0)}</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{user?.name}</p>
                    <p className="text-xs text-gray-400 capitalize">{user?.role?.toLowerCase()}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
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
                onClick={handleDeleteCompany}
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
    </header>
  );
};

export default Header; 