import { useState } from 'react';
import useAuthStore from '../context/authStore';
import useFontSizeStore from '../context/fontSizeStore';
import DeleteConfirmModal from '../components/common/DeleteConfirmModal';
import AuditLogModal from '../components/audit/AuditLogModal';
import { feedbackAPI } from '../services/api';

const Settings = () => {
  const { user, isAdmin, isSysAdmin, deleteCompany } = useAuthStore();
  const { fontSize, setFontSize } = useFontSizeStore();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showAuditLog, setShowAuditLog] = useState(false);
  const [showChangelog, setShowChangelog] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('account'); // 'account' | 'preferences' | 'about' | 'feedback'
  
  // Feedback form state
  const [feedbackForm, setFeedbackForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    feedback: ''
  });
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState(false);
  const [feedbackError, setFeedbackError] = useState('');
  
  // Check if this is a personal account
  const isPersonalAccount = user?.isPersonal || false;


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

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    setFeedbackError('');
    setFeedbackSuccess(false);
    setIsSubmittingFeedback(true);

    try {
      const response = await feedbackAPI.submitFeedback(feedbackForm);
      
      if (response.data.success) {
        setFeedbackSuccess(true);
        setFeedbackForm({
          name: user?.name || '',
          email: user?.email || '',
          feedback: ''
        });
        
        // Hide success message after 5 seconds
        setTimeout(() => {
          setFeedbackSuccess(false);
        }, 5000);
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      setFeedbackError(
        error.response?.data?.error || 
        'Failed to submit feedback. Please try again.'
      );
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
        <p className="text-gray-400">
          {isPersonalAccount ? 'Manage your personal account settings' : 'Manage your account and company settings'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Sidebar */}
        <aside className="md:col-span-1">
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 sticky top-6">
            <nav className="flex md:block space-x-2 md:space-x-0 md:space-y-2">
              {[
                { id: 'account', label: 'Account' },
                { id: 'preferences', label: 'Preferences' },
                { id: 'feedback', label: 'Feedback' },
                { id: 'about', label: 'About' }
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setSelectedCategory(item.id)}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    selectedCategory === item.id
                      ? 'bg-indigo-600 text-white'
                      : 'text-gray-300 hover:text-white hover:bg-gray-700'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </nav>
          </div>
        </aside>

        {/* Content */}
        <section className="md:col-span-3 space-y-8">
          {selectedCategory === 'account' && (
            <div className="space-y-8">
              {/* Profile Information */}
              <div className="card bg-gray-800 border border-gray-700">
                <div className="card-body">
                  <h2 className="card-title text-xl text-white mb-6">Profile Information</h2>
                  <div className="space-y-6">
                    <div className="flex items-center space-x-4">
                      <div className="avatar placeholder">
                        <div className="bg-indigo-600 text-white rounded-full w-20">
                          <span className="text-2xl font-bold">{user?.name?.charAt(0)}</span>
                        </div>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white">{user?.name}</h3>
                        {!isPersonalAccount && (
                          <p className="text-gray-400 capitalize">{user?.role?.toLowerCase()}</p>
                        )}
                      </div>
                    </div>
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
                      {!isPersonalAccount && (
                        <>
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
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Admin Tools */}
              {(isAdmin() || isSysAdmin()) && (
                <div className="card bg-gray-800 border border-gray-700">
                  <div className="card-body">
                    <h2 className="card-title text-xl text-white mb-6">Admin Tools</h2>
                    <div className="space-y-4">
                      <button
                        onClick={() => setShowAuditLog(true)}
                        className="btn btn-primary w-full"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        View Audit Log
                      </button>
                      <div className="text-sm text-gray-400">
                        Track all user actions and system changes
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Account/Company Management */}
              {isSysAdmin() && (
                <div className="card bg-gray-800 border border-gray-700">
                  <div className="card-body">
                    <h2 className="card-title text-xl text-white mb-6">
                      {isPersonalAccount ? 'Account Management' : 'Company Management'}
                    </h2>
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
                        {isPersonalAccount ? 'Delete Account' : 'Delete Company'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {selectedCategory === 'preferences' && (
            <div className="space-y-8">
              <div className="card bg-gray-800 border border-gray-700">
                <div className="card-body">
                  <h2 className="card-title text-xl text-white mb-6">UI Preferences</h2>
                  <div className="space-y-6">
                    <div>
                      <label className="label">
                        <span className="label-text text-gray-300">Font Size</span>
                      </label>
                      <div className="flex space-x-2">
                        {['small', 'medium', 'large'].map((size) => (
                          <button
                            key={size}
                            onClick={() => setFontSize(size)}
                            className={`btn btn-sm capitalize ${
                              fontSize === size ? 'btn-primary' : 'btn-outline btn-outline-primary'
                            }`}
                          >
                            {size}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="pt-4 border-t border-gray-700">
                      <p className="text-gray-400 text-sm">
                        Font size changes will be applied across the entire application.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {selectedCategory === 'feedback' && (
            <div className="space-y-8">
              <div className="card bg-gray-800 border border-gray-700">
                <div className="card-body">
                  <h2 className="card-title text-xl text-white mb-6">💬 Send Us Feedback</h2>
                  
                  <p className="text-gray-400 mb-6">
                    We'd love to hear from you! Share your thoughts, suggestions, or report any issues you've encountered.
                  </p>

                  {feedbackSuccess && (
                    <div className="alert alert-success mb-6">
                      <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>Thank you! Your feedback has been sent successfully.</span>
                    </div>
                  )}

                  {feedbackError && (
                    <div className="alert alert-error mb-6">
                      <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>{feedbackError}</span>
                    </div>
                  )}

                  <form onSubmit={handleFeedbackSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="form-control">
                        <label className="label">
                          <span className="label-text text-gray-300">Your Name *</span>
                        </label>
                        <input
                          type="text"
                          value={feedbackForm.name}
                          onChange={(e) => setFeedbackForm({ ...feedbackForm, name: e.target.value })}
                          className="input input-bordered w-full bg-gray-700 border-gray-600 text-white"
                          placeholder="John Doe"
                          required
                          disabled={isSubmittingFeedback}
                        />
                      </div>

                      <div className="form-control">
                        <label className="label">
                          <span className="label-text text-gray-300">Your Email *</span>
                        </label>
                        <input
                          type="email"
                          value={feedbackForm.email}
                          onChange={(e) => setFeedbackForm({ ...feedbackForm, email: e.target.value })}
                          className="input input-bordered w-full bg-gray-700 border-gray-600 text-white"
                          placeholder="john@example.com"
                          required
                          disabled={isSubmittingFeedback}
                        />
                      </div>
                    </div>

                    <div className="form-control">
                      <label className="label">
                        <span className="label-text text-gray-300">Your Feedback *</span>
                      </label>
                      <textarea
                        value={feedbackForm.feedback}
                        onChange={(e) => setFeedbackForm({ ...feedbackForm, feedback: e.target.value })}
                        className="textarea textarea-bordered w-full bg-gray-700 border-gray-600 text-white h-40"
                        placeholder="Tell us what you think, what features you'd like, or any issues you've encountered..."
                        required
                        minLength={10}
                        maxLength={2000}
                        disabled={isSubmittingFeedback}
                      />
                      <label className="label">
                        <span className="label-text-alt text-gray-400">
                          {feedbackForm.feedback.length}/2000 characters (min: 10)
                        </span>
                      </label>
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={isSubmittingFeedback || feedbackForm.feedback.length < 10}
                      >
                        {isSubmittingFeedback ? (
                          <>
                            <span className="loading loading-spinner loading-sm"></span>
                            Sending...
                          </>
                        ) : (
                          <>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            Send Feedback
                          </>
                        )}
                      </button>
                    </div>
                  </form>

                  <div className="mt-6 p-4 bg-blue-900/20 border border-blue-700 rounded-lg">
                    <div className="flex">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-400 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-sm text-gray-300">
                        Your feedback will be sent directly to our team. We read every message and use your input to improve the app!
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {selectedCategory === 'about' && (
            <div className="space-y-8">
              <div className="card bg-gray-800 border border-gray-700">
                <div className="card-body">
                  <h2 className="card-title text-xl text-white mb-6">About</h2>
                  <div className="space-y-4 text-gray-300">
                    <button
                      onClick={() => setShowChangelog(true)}
                      className="btn btn-primary w-full md:w-auto"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      View Changelog
                    </button>
                    <div className="pt-4">
                      <p className="text-sm">
                        <strong className="text-gray-200">Task Manager</strong> v0.0.5
                      </p>
                      <p className="text-sm">© 2025 Tialz. All rights reserved.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>

      {/* Delete Company Modal */}
      {showDeleteModal && (
        <div className="modal modal-open">
          <div className="modal-box bg-gray-800 border border-gray-700">
            <h3 className="font-bold text-lg text-white mb-4">
              {isPersonalAccount ? 'Delete Account' : 'Delete Company'}
            </h3>
            <p className="text-gray-300 mb-6">
              {isPersonalAccount 
                ? 'Are you sure you want to delete your personal account? This action will permanently delete:'
                : 'Are you sure you want to delete your company? This action will permanently delete:'
              }
            </p>
            <ul className="text-gray-300 mb-6 list-disc list-inside space-y-1">
              <li>All tasks and projects</li>
              {!isPersonalAccount && <li>All employees and their data</li>}
              <li>All comments and activity</li>
              <li>{isPersonalAccount ? 'Account settings and configuration' : 'Company settings and configuration'}</li>
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

      {/* Audit Log Modal */}
      <AuditLogModal
        isOpen={showAuditLog}
        onClose={() => setShowAuditLog(false)}
      />

      {/* Changelog Modal */}
      {showChangelog && (
        <div className="modal modal-open">
          <div className="modal-box max-w-3xl bg-gray-800 border border-gray-700 max-h-[80vh]">
            <h3 className="font-bold text-2xl text-white mb-6">Changelog</h3>
            
            <div className="space-y-6 overflow-y-auto pr-2" style={{ maxHeight: 'calc(80vh - 150px)' }}>
              {/* Version 0.0.5 */}
              <div className="border-l-4 border-green-600 pl-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-lg font-semibold text-white">v0.0.5</h4>
                  <span className="text-sm text-gray-400">January 22, 2025</span>
                </div>
                <div className="space-y-2 text-gray-300 text-sm">
                  <div>
                    <p className="font-semibold text-green-400">✨ New Features</p>
                    <ul className="list-disc list-inside ml-4 space-y-1">
                      <li>External contact task assignments with automatic email invitations</li>
                      <li>Cross-company task collaboration system</li>
                      <li>Contact-based task invitations (not just email-based)</li>
                      <li>True collaborative task sharing between different companies</li>
                      <li>External contact management system</li>
                      <li>Personal account contact invitations</li>
                      <li>Company external contact invitations</li>
                    </ul>
                  </div>
                  <div>
                    <p className="font-semibold text-blue-400">🔧 Improvements</p>
                    <ul className="list-disc list-inside ml-4 space-y-1">
                      <li>Fixed external contact email notifications when tasks are assigned</li>
                      <li>Enhanced comment system for cross-company collaboration</li>
                      <li>Improved task assignment workflow for external contacts</li>
                      <li>Better permission handling for external collaborators</li>
                      <li>Seamless collaboration between personal and company accounts</li>
                    </ul>
                  </div>
                  <div>
                    <p className="font-semibold text-red-400">🐛 Bug Fixes</p>
                    <ul className="list-disc list-inside ml-4 space-y-1">
                      <li>Fixed "Failed to load comments" error for external collaborators</li>
                      <li>Resolved company permission issues in comments API</li>
                      <li>Fixed external contact assignment not sending email invitations</li>
                      <li>Corrected task update permissions for external contacts</li>
                    </ul>
                  </div>
                  <div>
                    <p className="font-semibold text-purple-400">🔒 Security</p>
                    <ul className="list-disc list-inside ml-4 space-y-1">
                      <li>Enhanced collaborator permission system</li>
                      <li>Improved cross-company data isolation</li>
                      <li>Secure external contact invitation system</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Version 0.0.4 */}
              <div className="border-l-4 border-indigo-600 pl-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-lg font-semibold text-white">v0.0.4</h4>
                  <span className="text-sm text-gray-400">October 9, 2025</span>
                </div>
                <div className="space-y-2 text-gray-300 text-sm">
                  <div>
                    <p className="font-semibold text-green-400">✨ New Features</p>
                    <ul className="list-disc list-inside ml-4 space-y-1">
                      <li>Email task invitations - Send tasks to anyone via email</li>
                      <li>Task invitation accept/decline workflow</li>
                      <li>User feedback form in Settings</li>
                      <li>Beautiful HTML email templates for invitations</li>
                      <li>Automatic task copying when invitations are accepted</li>
                      <li>Email notifications for invitation responses</li>
                    </ul>
                  </div>
                  <div>
                    <p className="font-semibold text-blue-400">🔧 Improvements</p>
                    <ul className="list-disc list-inside ml-4 space-y-1">
                      <li>Redesigned task modal with better button layout</li>
                      <li>Widened task modal for better readability (max-w-6xl)</li>
                      <li>Responsive button design (icons on mobile, text on desktop)</li>
                      <li>Improved header organization in task modal</li>
                      <li>Added "📧 Email" button for task creators</li>
                    </ul>
                  </div>
                  <div>
                    <p className="font-semibold text-purple-400">🔒 Security</p>
                    <ul className="list-disc list-inside ml-4 space-y-1">
                      <li>Rate limiting on task invitations (10 per day)</li>
                      <li>Token-based invitation system with 7-day expiration</li>
                      <li>Email validation and verification</li>
                      <li>Duplicate invitation prevention</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Version 0.0.3 */}
              <div className="border-l-4 border-gray-600 pl-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-lg font-semibold text-white">v0.0.3</h4>
                  <span className="text-sm text-gray-400">October 2, 2025</span>
                </div>
                <div className="space-y-2 text-gray-300 text-sm">
                  <div>
                    <p className="font-semibold text-green-400">✨ New Features</p>
                    <ul className="list-disc list-inside ml-4 space-y-1">
                      <li>Enhanced landing page with advanced animations</li>
                      <li>Improved calendar layout with side-by-side view</li>
                      <li>Added changelog to settings</li>
                      <li>Better UI/UX for calendar page</li>
                    </ul>
                  </div>
                  <div>
                    <p className="font-semibold text-blue-400">🔧 Improvements</p>
                    <ul className="list-disc list-inside ml-4 space-y-1">
                      <li>Optimized calendar sizing and proportions</li>
                      <li>Removed redundant UI elements</li>
                      <li>Enhanced animation smoothness</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Version 0.0.2 */}
              <div className="border-l-4 border-gray-600 pl-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-lg font-semibold text-white">v0.0.2</h4>
                  <span className="text-sm text-gray-400">September 2025</span>
                </div>
                <div className="space-y-2 text-gray-300 text-sm">
                  <div>
                    <p className="font-semibold text-green-400">✨ New Features</p>
                    <ul className="list-disc list-inside ml-4 space-y-1">
                      <li>Desktop app with auto-update functionality</li>
                      <li>Browser extension for quick task capture</li>
                      <li>AI-powered task assistant</li>
                      <li>Task sharing between users</li>
                      <li>Audit log for admin users</li>
                      <li>Notification system</li>
                    </ul>
                  </div>
                  <div>
                    <p className="font-semibold text-blue-400">🔧 Improvements</p>
                    <ul className="list-disc list-inside ml-4 space-y-1">
                      <li>Enhanced task filtering and sorting</li>
                      <li>Improved calendar view</li>
                      <li>Better mobile responsiveness</li>
                    </ul>
                  </div>
                  <div>
                    <p className="font-semibold text-red-400">🐛 Bug Fixes</p>
                    <ul className="list-disc list-inside ml-4 space-y-1">
                      <li>Fixed task assignment issues</li>
                      <li>Resolved date picker bugs</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Version 0.0.1 */}
              <div className="border-l-4 border-gray-600 pl-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-lg font-semibold text-white">v0.0.1</h4>
                  <span className="text-sm text-gray-400">August 2025</span>
                </div>
                <div className="space-y-2 text-gray-300 text-sm">
                  <div>
                    <p className="font-semibold text-green-400">✨ Initial Release</p>
                    <ul className="list-disc list-inside ml-4 space-y-1">
                      <li>User authentication and authorization</li>
                      <li>Company and personal account types</li>
                      <li>Task creation, editing, and deletion</li>
                      <li>Task assignment and priority management</li>
                      <li>Comment system</li>
                      <li>Calendar view</li>
                      <li>Employee management (for company accounts)</li>
                      <li>Role-based access control</li>
                      <li>Dashboard with task overview</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-action">
              <button
                onClick={() => setShowChangelog(false)}
                className="btn btn-ghost text-gray-300 hover:text-white"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
