import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import useAuthStore from '../context/authStore';
import useFontSizeStore from '../context/fontSizeStore';
import useThemeStore from '../stores/themeStore';
import DeleteConfirmModal from '../components/common/DeleteConfirmModal';
import AuditLogModal from '../components/audit/AuditLogModal';
import LegalDocumentModal from '../components/legal/LegalDocumentModal';
import GmailAgentSettings from '../components/integrations/GmailAgentSettings';
import OutlookAgentSettings from '../components/integrations/OutlookAgentSettings';
import { feedbackAPI, authAPI } from '../services/api';
import { lightPalettes, darkPalettes } from '../config/colorPalettes';
import IconButton from '../components/common/IconButton';
import ConfirmModal from '../components/common/ConfirmModal';
import { useToastContext } from '../context/ToastContext';
import { FaFileAlt, FaTrash, FaPaperPlane, FaHistory, FaFileContract, FaShieldAlt, FaTimes } from 'react-icons/fa';

const Settings = () => {
  const { user, isAdmin, isSysAdmin, isSuperAdmin, deleteCompany } = useAuthStore();
  const { fontSize, setFontSize } = useFontSizeStore();
  const { theme, setTheme, lightPalette, darkPalette, setLightPalette, setDarkPalette } = useThemeStore();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');
  const [showAuditLog, setShowAuditLog] = useState(false);
  const [showChangelog, setShowChangelog] = useState(false);
  const [showOlderVersions, setShowOlderVersions] = useState(false);
  const [showLegalModal, setShowLegalModal] = useState(false);
  const [legalDocumentType, setLegalDocumentType] = useState('terms'); // 'terms' or 'privacy'
  const [selectedCategory, setSelectedCategory] = useState('account'); // 'account' | 'integrations' | 'preferences' | 'about' | 'feedback' | 'admin-tools'
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToastContext();

  const [previewBriefingContent, setPreviewBriefingContent] = useState('');
  const [previewBriefingTitle, setPreviewBriefingTitle] = useState('');
  const [isPreviewingBriefing, setIsPreviewingBriefing] = useState(false);
  const [showBriefingModal, setShowBriefingModal] = useState(false);
  
  // Check URL parameters for category on mount and when location changes
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const category = urlParams.get('category');
    if (category && ['account', 'integrations', 'preferences', 'about', 'feedback', 'admin-tools'].includes(category)) {
      setSelectedCategory(category);
    }
  }, [location.search]);
  
  // Feedback form state
  const [feedbackForm, setFeedbackForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    feedback: ''
  });
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState(false);
  const [feedbackError, setFeedbackError] = useState('');
  const [autoArchivePeriod, setAutoArchivePeriod] = useState(user?.autoArchivePeriod ?? 12);
  const [isUpdatingAutoArchive, setIsUpdatingAutoArchive] = useState(false);
  
  // Check if this is a personal account
  const isPersonalAccount = user?.isPersonal || false;

  // Update autoArchivePeriod when user data changes
  useEffect(() => {
    setAutoArchivePeriod(user?.autoArchivePeriod ?? 12);
  }, [user?.autoArchivePeriod]);

  const handlePreviewBriefing = async (kind) => {
    try {
      setIsPreviewingBriefing(true);
      const { data } = await authAPI.previewBriefing(kind);
      setPreviewBriefingContent(data.content || '');
      setPreviewBriefingTitle(kind === 'MORNING' ? 'Morning Briefing' : 'Evening Briefing');
      setShowBriefingModal(true);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not fetch briefing');
    } finally {
      setIsPreviewingBriefing(false);
    }
  };


  // Get the required confirmation text
  const getRequiredConfirmationText = () => {
    if (isPersonalAccount) {
      return user?.email || '';
    } else {
      // For companies, use company name or a generic text
      return 'DELETE';
    }
  };

  const confirmDeleteCompany = async () => {
    // Double-check confirmation text matches
    if (deleteConfirmationText !== getRequiredConfirmationText()) {
      alert('Please type the confirmation text correctly.');
      return;
    }

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
      setDeleteConfirmationText('');
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
    <div
      className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
      style={{ color: 'var(--color-text-primary)' }}
    >
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>
          Settings
        </h1>
        <p style={{ color: 'var(--color-text-secondary)' }}>
          {isPersonalAccount ? 'Manage your personal account settings' : 'Manage your account and company settings'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Sidebar */}
        <aside className="md:col-span-1">
          <div
            className="rounded-lg p-3 sticky top-6"
            style={{
              backgroundColor: 'var(--color-bg-secondary)',
              borderColor: 'var(--color-border-default)',
              borderWidth: 1,
            }}
          >
            <nav className="flex md:block space-x-2 md:space-x-0 md:space-y-2">
              {[
                { id: 'account', label: 'Account' },
                { id: 'integrations', label: 'Integrations' },
                { id: 'preferences', label: 'Preferences' },
                { id: 'feedback', label: 'Feedback' },
                { id: 'about', label: 'About' },
                ...(isSuperAdmin() ? [{ id: 'admin-tools', label: '🔴 Admin Tools' }] : [])
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setSelectedCategory(item.id)}
                  className="w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors"
                  style={
                    selectedCategory === item.id
                      ? {
                          backgroundColor: 'var(--color-primary)',
                          color: '#ffffff',
                        }
                      : {
                          color: 'var(--color-text-secondary)',
                          backgroundColor: 'transparent',
                        }
                  }
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
              <div
                className="card"
                style={{
                  backgroundColor: 'var(--color-bg-secondary)',
                  borderColor: 'var(--color-border-default)',
                  borderWidth: 1,
                }}
              >
                <div className="card-body">
                  <h2
                    className="card-title text-xl mb-6"
                    style={{ color: 'var(--color-text-primary)' }}
                  >
                    Profile Information
                  </h2>
                  <div className="space-y-6">
                    <div className="flex items-center space-x-4">
                      <div 
                        className="bg-indigo-600 text-white rounded-full flex items-center justify-center flex-shrink-0"
                        style={{
                          width: '80px',
                          height: '80px',
                          minWidth: '80px',
                          minHeight: '80px',
                          maxWidth: '80px',
                          maxHeight: '80px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          lineHeight: '1'
                        }}
                      >
                        <span 
                          className="text-2xl font-bold"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            lineHeight: '1'
                          }}
                        >
                          {user?.name?.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <h3
                          className="text-lg font-semibold"
                          style={{ color: 'var(--color-text-primary)' }}
                        >
                          {user?.name}
                        </h3>
                        {!isPersonalAccount && (
                          <p
                            className="capitalize"
                            style={{ color: 'var(--color-text-secondary)' }}
                          >
                            {user?.role?.toLowerCase()}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="label">
                          <span className="label-text" style={{ color: 'var(--color-text-secondary)' }}>
                            Full Name
                          </span>
                        </label>
                        <input
                          type="text"
                          value={user?.name || ''}
                          disabled
                          className="input input-bordered w-full"
                          style={{
                            backgroundColor: 'var(--color-bg-tertiary)',
                            borderColor: 'var(--color-border-default)',
                            color: 'var(--color-text-primary)',
                          }}
                        />
                      </div>
                      <div>
                        <label className="label">
                          <span className="label-text" style={{ color: 'var(--color-text-secondary)' }}>
                            Email
                          </span>
                        </label>
                        <input
                          type="email"
                          value={user?.email || ''}
                          disabled
                          className="input input-bordered w-full"
                          style={{
                            backgroundColor: 'var(--color-bg-tertiary)',
                            borderColor: 'var(--color-border-default)',
                            color: 'var(--color-text-primary)',
                          }}
                        />
                      </div>
                      {!isPersonalAccount && (
                        <>
                          <div>
                            <label className="label">
                              <span
                                className="label-text"
                                style={{ color: 'var(--color-text-secondary)' }}
                              >
                                Role
                              </span>
                            </label>
                            <input
                              type="text"
                              value={user?.role || ''}
                              disabled
                              className="input input-bordered w-full"
                              style={{
                                backgroundColor: 'var(--color-bg-tertiary)',
                                borderColor: 'var(--color-border-default)',
                                color: 'var(--color-text-primary)',
                              }}
                            />
                          </div>
                          <div>
                            <label className="label">
                              <span
                                className="label-text"
                                style={{ color: 'var(--color-text-secondary)' }}
                              >
                                Company
                              </span>
                            </label>
                            <input
                              type="text"
                              value={user?.companyName || ''}
                              disabled
                              className="input input-bordered w-full"
                              style={{
                                backgroundColor: 'var(--color-bg-tertiary)',
                                borderColor: 'var(--color-border-default)',
                                color: 'var(--color-text-primary)',
                              }}
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
                <div
                  className="card"
                  style={{
                    backgroundColor: 'var(--color-bg-secondary)',
                    borderColor: 'var(--color-border-default)',
                    borderWidth: 1,
                  }}
                >
                  <div className="card-body">
                    <h2
                      className="card-title text-xl mb-6"
                      style={{ color: 'var(--color-text-primary)' }}
                    >
                      Admin Tools
                    </h2>
                    <div className="space-y-4">
                      <IconButton
                        onClick={() => setShowAuditLog(true)}
                        icon={<FaFileAlt />}
                        label="View Audit Log"
                        variant="primary"
                        size="sm"
                        className="w-full"
                      />
                      <div className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                        Track all user actions and system changes
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Account/Company Management */}
              {isSysAdmin() && (
                <div
                  className="card"
                  style={{
                    backgroundColor: 'var(--color-bg-secondary)',
                    borderColor: 'var(--color-border-default)',
                    borderWidth: 1,
                  }}
                >
                  <div className="card-body">
                    <h2
                      className="card-title text-xl mb-6"
                      style={{ color: 'var(--color-text-primary)' }}
                    >
                      {isPersonalAccount ? 'Account Management' : 'Company Management'}
                    </h2>
                    <div className="space-y-4">
                      <div>
                        <p 
                          className="text-sm mb-4"
                          style={{ color: 'var(--color-text-secondary)' }}
                        >
                          {isPersonalAccount 
                            ? 'Permanently delete your account and all associated data.'
                            : 'Permanently delete your company and all associated data. This action cannot be undone.'
                          }
                        </p>
                        <IconButton
                          onClick={() => setShowDeleteModal(true)}
                          icon={<FaTrash />}
                          label={isPersonalAccount ? 'Delete Account' : 'Delete Company'}
                          variant="danger"
                          size="sm"
                          className="w-full"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {selectedCategory === 'integrations' && (
            <div className="space-y-8">
              <GmailAgentSettings />
              <OutlookAgentSettings />
            </div>
          )}

          {selectedCategory === 'preferences' && (
            <div className="space-y-8">
              {/* Theme Selection - One Click */}
              <div
                className="card"
                style={{
                  backgroundColor: 'var(--color-bg-secondary)',
                  borderColor: 'var(--color-border-default)',
                  borderWidth: 1,
                }}
              >
                <div className="card-body">
                  <h2
                    className="card-title text-xl mb-6"
                    style={{ color: 'var(--color-text-primary)' }}
                  >
                    🎨 Color Theme
                  </h2>
                  
                  {/* Light Themes */}
                  <div className="mb-6">
                    <h3 className="text-sm font-semibold mb-3 flex items-center" style={{ color: 'var(--color-text-secondary)' }}>
                      ☀️ LIGHT THEMES
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {lightPalettes.map((palette) => {
                        const isActive = theme === 'light' && lightPalette === palette.id;
                        return (
                          <button
                            key={palette.id}
                            onClick={() => {
                              setTheme('light');
                              setLightPalette(palette.id);
                            }}
                            className="text-left p-3 rounded-lg border transition-all duration-200 hover:scale-[1.02]"
                            style={
                              isActive
                                ? {
                                    backgroundColor: 'var(--color-primary)',
                                    borderColor: 'var(--color-primary)',
                                    color: '#ffffff',
                                  }
                                : {
                                    backgroundColor: 'var(--color-bg-tertiary)',
                                    borderColor: 'var(--color-border-default)',
                                    color: 'var(--color-text-primary)',
                                  }
                            }
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="font-semibold text-sm">{palette.name}</div>
                              {isActive && <div className="text-sm">✓</div>}
                            </div>
                            <div className="flex space-x-1">
                              {Object.entries(palette.colors)
                                .slice(0, 4)
                                .map(([key, value]) => (
                                  <div
                                    key={key}
                                    className="w-5 h-5 rounded border"
                                    style={{
                                      backgroundColor: value,
                                      borderColor: isActive ? '#ffffff' : 'var(--color-border-default)',
                                    }}
                                  />
                                ))}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Dark Themes */}
                  <div>
                    <h3 className="text-sm font-semibold mb-3 flex items-center" style={{ color: 'var(--color-text-secondary)' }}>
                      🌙 DARK THEMES
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {darkPalettes.map((palette) => {
                        const isActive = theme === 'dark' && darkPalette === palette.id;
                        return (
                          <button
                            key={palette.id}
                            onClick={() => {
                              setTheme('dark');
                              setDarkPalette(palette.id);
                            }}
                            className="text-left p-3 rounded-lg border transition-all duration-200 hover:scale-[1.02]"
                            style={
                              isActive
                                ? {
                                    backgroundColor: 'var(--color-primary)',
                                    borderColor: 'var(--color-primary)',
                                    color: '#ffffff',
                                  }
                                : {
                                    backgroundColor: 'var(--color-bg-tertiary)',
                                    borderColor: 'var(--color-border-default)',
                                    color: 'var(--color-text-primary)',
                                  }
                            }
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="font-semibold text-sm">{palette.name}</div>
                              {isActive && <div className="text-sm">✓</div>}
                            </div>
                            <div className="flex space-x-1">
                              {Object.entries(palette.colors)
                                .slice(0, 4)
                                .map(([key, value]) => (
                                  <div
                                    key={key}
                                    className="w-5 h-5 rounded border"
                                    style={{
                                      backgroundColor: value,
                                      borderColor: isActive ? '#ffffff' : 'var(--color-border-default)',
                                    }}
                                  />
                                ))}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Font Size Preferences */}
              <div
                className="card"
                style={{
                  backgroundColor: 'var(--color-bg-secondary)',
                  borderColor: 'var(--color-border-default)',
                  borderWidth: 1,
                }}
              >
                <div className="card-body">
                  <h2
                    className="card-title text-xl mb-6"
                    style={{ color: 'var(--color-text-primary)' }}
                  >
                    🔤 Font Size
                  </h2>
                  <div className="space-y-4">
                    <div className="flex space-x-3">
                      {['small', 'medium', 'large'].map((size) => (
                        <button
                          key={size}
                          onClick={() => setFontSize(size)}
                          className="flex-1 py-3 px-4 rounded-lg border-2 transition-all duration-200 capitalize font-semibold"
                          style={
                            fontSize === size
                              ? {
                                  backgroundColor: 'var(--color-primary)',
                                  borderColor: 'var(--color-primary)',
                                  color: '#ffffff',
                                }
                              : {
                                  backgroundColor: 'var(--color-bg-tertiary)',
                                  borderColor: 'var(--color-border-default)',
                                  color: 'var(--color-text-primary)',
                                }
                          }
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                    <div
                      className="pt-4 border-t text-sm"
                      style={{
                        borderColor: 'var(--color-border-default)',
                        color: 'var(--color-text-secondary)',
                      }}
                    >
                      Font size changes will be applied across the entire application.
                    </div>
                  </div>
                </div>
              </div>

              {/* Daily briefings */}
              <div
                className="card"
                style={{
                  backgroundColor: 'var(--color-bg-secondary)',
                  borderColor: 'var(--color-border-default)',
                  borderWidth: 1,
                }}
              >
                <div className="card-body">
                  <h2
                    className="card-title text-xl mb-2"
                    style={{ color: 'var(--color-text-primary)' }}
                  >
                    Daily briefings
                  </h2>
                  <p
                    className="text-sm mb-6"
                    style={{ color: 'var(--color-text-secondary)' }}
                  >
                    Generate an on-demand summary of tasks due today and overdue (morning), and how much you closed out (evening).
                  </p>
                  <div className="flex flex-wrap gap-4">
                    <button
                      type="button"
                      onClick={() => handlePreviewBriefing('MORNING')}
                      disabled={isPreviewingBriefing}
                      className="px-5 py-2.5 rounded-lg font-semibold text-white transition-colors disabled:opacity-50"
                      style={{ backgroundColor: 'var(--color-primary)' }}
                    >
                      {isPreviewingBriefing ? 'Generating...' : 'Generate Morning Briefing'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePreviewBriefing('EVENING')}
                      disabled={isPreviewingBriefing}
                      className="px-5 py-2.5 rounded-lg font-semibold text-white transition-colors disabled:opacity-50"
                      style={{ backgroundColor: 'var(--color-primary)' }}
                    >
                      {isPreviewingBriefing ? 'Generating...' : 'Generate Evening Briefing'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Auto-Archive Settings */}
              {(isAdmin() || isSysAdmin()) && (
                <div
                  className="card"
                  style={{
                    backgroundColor: 'var(--color-bg-secondary)',
                    borderColor: 'var(--color-border-default)',
                    borderWidth: 1,
                  }}
                >
                  <div className="card-body">
                    <h2
                      className="card-title text-xl mb-6"
                      style={{ color: 'var(--color-text-primary)' }}
                    >
                      📦 Auto-Archive Tasks
                    </h2>
                    <div className="space-y-4">
                      <p
                        className="text-sm"
                        style={{ color: 'var(--color-text-secondary)' }}
                      >
                        Automatically archive tasks that are past their due date by the selected period.
                      </p>

                      <div className="flex flex-wrap gap-3">
                        {[3, 6, 12].map((months) => (
                          <button
                            key={months}
                            onClick={async () => {
                              setIsUpdatingAutoArchive(true);
                              try {
                                await authAPI.updateAutoArchivePeriod(months);
                                setAutoArchivePeriod(months);
                                // Refresh user data
                                const { getMe } = useAuthStore.getState();
                                await getMe();
                              } catch (error) {
                                console.error('Error updating auto-archive period:', error);
                              } finally {
                                setIsUpdatingAutoArchive(false);
                              }
                            }}
                            className="px-4 py-2 rounded-lg border-2 transition-all duration-200 font-semibold"
                            style={
                              autoArchivePeriod === months
                                ? {
                                    backgroundColor: 'var(--color-primary)',
                                    borderColor: 'var(--color-primary)',
                                    color: '#ffffff',
                                  }
                                : {
                                    backgroundColor: 'var(--color-bg-tertiary)',
                                    borderColor: 'var(--color-border-default)',
                                    color: 'var(--color-text-primary)',
                                  }
                            }
                            disabled={isUpdatingAutoArchive}
                          >
                            {months} {months === 1 ? 'Month' : 'Months'}
                          </button>
                        ))}
                      </div>
                      
                      <div
                        className="pt-4 border-t text-sm"
                        style={{
                          borderColor: 'var(--color-border-default)',
                          color: 'var(--color-text-secondary)',
                        }}
                      >
                        {`Tasks that are ${autoArchivePeriod} months past their due date will be automatically archived.`}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {selectedCategory === 'feedback' && (
            <div className="space-y-8">
              <div 
                className="card border transition-colors duration-200"
                style={{
                  backgroundColor: 'var(--color-bg-secondary)',
                  borderColor: 'var(--color-border-default)',
                }}
              >
                <div className="card-body">
                  <h2 
                    className="card-title text-xl mb-6 transition-colors duration-200"
                    style={{ color: 'var(--color-text-primary)' }}
                  >
                    💬 Send Us Feedback
                  </h2>
                  
                  <p 
                    className="mb-6 transition-colors duration-200"
                    style={{ color: 'var(--color-text-secondary)' }}
                  >
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
                          <span 
                            className="label-text transition-colors duration-200"
                            style={{ color: 'var(--color-text-secondary)' }}
                          >
                            Your Name *
                          </span>
                        </label>
                        <input
                          type="text"
                          value={feedbackForm.name}
                          onChange={(e) => setFeedbackForm({ ...feedbackForm, name: e.target.value })}
                          className="input input-bordered w-full transition-colors duration-200"
                          style={{
                            backgroundColor: 'var(--color-bg-tertiary)',
                            borderColor: 'var(--color-border-default)',
                            color: 'var(--color-text-primary)',
                          }}
                          placeholder="John Doe"
                          required
                          disabled={isSubmittingFeedback}
                        />
                      </div>

                      <div className="form-control">
                        <label className="label">
                          <span 
                            className="label-text transition-colors duration-200"
                            style={{ color: 'var(--color-text-secondary)' }}
                          >
                            Your Email *
                          </span>
                        </label>
                        <input
                          type="email"
                          value={feedbackForm.email}
                          onChange={(e) => setFeedbackForm({ ...feedbackForm, email: e.target.value })}
                          className="input input-bordered w-full transition-colors duration-200"
                          style={{
                            backgroundColor: 'var(--color-bg-tertiary)',
                            borderColor: 'var(--color-border-default)',
                            color: 'var(--color-text-primary)',
                          }}
                          placeholder="john@example.com"
                          required
                          disabled={isSubmittingFeedback}
                        />
                      </div>
                    </div>

                    <div className="form-control">
                      <label className="label">
                        <span 
                          className="label-text transition-colors duration-200"
                          style={{ color: 'var(--color-text-secondary)' }}
                        >
                          Your Feedback *
                        </span>
                      </label>
                      <textarea
                        value={feedbackForm.feedback}
                        onChange={(e) => setFeedbackForm({ ...feedbackForm, feedback: e.target.value })}
                        className="textarea textarea-bordered w-full h-40 transition-colors duration-200"
                        style={{
                          backgroundColor: 'var(--color-bg-tertiary)',
                          borderColor: 'var(--color-border-default)',
                          color: 'var(--color-text-primary)',
                        }}
                        placeholder="Tell us what you think, what features you'd like, or any issues you've encountered..."
                        required
                        minLength={10}
                        maxLength={2000}
                        disabled={isSubmittingFeedback}
                      />
                      <label className="label">
                        <span 
                          className="label-text-alt transition-colors duration-200"
                          style={{ color: 'var(--color-text-tertiary)' }}
                        >
                          {feedbackForm.feedback.length}/2000 characters (min: 10)
                        </span>
                      </label>
                    </div>

                    <div className="flex justify-end">
                      <IconButton
                        type="submit"
                        icon={<FaPaperPlane />}
                        label={isSubmittingFeedback ? 'Sending...' : 'Send Feedback'}
                        variant="primary"
                        size="sm"
                        disabled={isSubmittingFeedback || feedbackForm.feedback.length < 10}
                        loading={isSubmittingFeedback}
                      />
                    </div>
                  </form>

                  <div 
                    className="mt-6 p-4 rounded-lg border transition-colors duration-200"
                    style={{
                      backgroundColor: 'rgba(59, 130, 246, 0.1)',
                      borderColor: 'rgba(59, 130, 246, 0.3)',
                    }}
                  >
                    <div className="flex">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-400 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p 
                        className="text-sm transition-colors duration-200"
                        style={{ color: 'var(--color-text-secondary)' }}
                      >
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
              <div 
                className="card border transition-colors duration-200"
                style={{
                  backgroundColor: 'var(--color-bg-secondary)',
                  borderColor: 'var(--color-border-default)',
                }}
              >
                <div className="card-body">
                  <h2 
                    className="card-title text-xl mb-6 transition-colors duration-200"
                    style={{ color: 'var(--color-text-primary)' }}
                  >
                    About
                  </h2>
                  <div className="space-y-4">
                    <IconButton
                      onClick={() => setShowChangelog(true)}
                      icon={<FaHistory />}
                      label="View Changelog"
                      variant="primary"
                      size="sm"
                      className="w-full md:w-auto"
                    />

                    {/* Legal Documents Section */}
                    <div className="pt-4">
                      <h3 
                        className="text-sm font-semibold mb-3 uppercase tracking-wider"
                        style={{ color: 'var(--color-text-tertiary)' }}
                      >
                        Legal Documents
                      </h3>
                      <div className="flex flex-col sm:flex-row gap-3">
                        <IconButton
                          onClick={() => {
                            setLegalDocumentType('terms');
                            setShowLegalModal(true);
                          }}
                          icon={<FaFileContract />}
                          label="Terms of Service"
                          variant="secondary"
                          size="sm"
                          className="w-full sm:w-auto"
                        />
                        <IconButton
                          onClick={() => {
                            setLegalDocumentType('privacy');
                            setShowLegalModal(true);
                          }}
                          icon={<FaShieldAlt />}
                          label="Privacy Policy"
                          variant="secondary"
                          size="sm"
                          className="w-full sm:w-auto"
                        />
                      </div>
                    </div>

                    <div className="pt-4">
                      <p 
                        className="text-sm transition-colors duration-200"
                        style={{ color: 'var(--color-text-secondary)' }}
                      >
                        <strong 
                          className="transition-colors duration-200"
                          style={{ color: 'var(--color-text-primary)' }}
                        >
                          Task Manager
                        </strong> v0.0.6
                      </p>
                      <p 
                        className="text-sm transition-colors duration-200"
                        style={{ color: 'var(--color-text-secondary)' }}
                      >
                        © 2025 Tialz. All rights reserved.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {selectedCategory === 'admin-tools' && isSuperAdmin() && (
            <div className="space-y-8">
              <div 
                className="card border transition-colors duration-200"
                style={{
                  backgroundColor: 'var(--color-bg-secondary)',
                  borderColor: 'var(--color-border-default)',
                }}
              >
                <div className="card-body">
                  <h2 
                    className="card-title text-xl mb-6 transition-colors duration-200"
                    style={{ color: 'var(--color-text-primary)' }}
                  >
                    🔴 Admin Tools
                  </h2>
                  <p 
                    className="mb-6 transition-colors duration-200"
                    style={{ color: 'var(--color-text-secondary)' }}
                  >
                    Super Admin controls for managing the entire system.
                  </p>
                  
                  <div className="space-y-4">
                    <button
                      onClick={() => navigate('/super-admin')}
                      className="btn w-full md:w-auto transition-colors duration-200"
                      style={{
                        backgroundColor: '#dc2626',
                        color: 'white',
                        borderColor: '#dc2626',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#b91c1c';
                        e.currentTarget.style.borderColor = '#b91c1c';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#dc2626';
                        e.currentTarget.style.borderColor = '#dc2626';
                      }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      Open Super Admin Dashboard
                    </button>
                    
                    <div 
                      className="mt-6 p-4 rounded-lg border transition-colors duration-200"
                      style={{
                        backgroundColor: 'rgba(220, 38, 38, 0.1)',
                        borderColor: 'rgba(220, 38, 38, 0.3)',
                      }}
                    >
                      <div className="flex">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-400 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <div>
                          <p 
                            className="text-sm font-medium transition-colors duration-200"
                            style={{ color: 'var(--color-text-primary)' }}
                          >
                            Warning: Super Admin Access
                          </p>
                          <p 
                            className="text-sm mt-1 transition-colors duration-200"
                            style={{ color: 'var(--color-text-secondary)' }}
                          >
                            This dashboard provides system-wide administrative controls. Use with caution.
                          </p>
                        </div>
                      </div>
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
        <div className="modal modal-open backdrop-blur-sm animate-fadeIn">
          <div 
            className="modal-box border"
            style={{ 
              backgroundColor: 'var(--color-bg-secondary)',
              borderColor: 'var(--color-border-default)'
            }}
          >
            <h3 
              className="font-bold text-lg mb-4"
              style={{ color: 'var(--color-text-primary)' }}
            >
              {isPersonalAccount ? 'Delete Account' : 'Delete Company'}
            </h3>
            <p 
              className="mb-6"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              {isPersonalAccount 
                ? 'Are you sure you want to delete your personal account? This action will permanently delete:'
                : 'Are you sure you want to delete your company? This action will permanently delete:'
              }
            </p>
            <ul 
              className="mb-6 list-disc list-inside space-y-1"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              <li>All tasks and projects</li>
              {!isPersonalAccount && <li>All employees and their data</li>}
              <li>All comments and activity</li>
              <li>{isPersonalAccount ? 'Account settings and configuration' : 'Company settings and configuration'}</li>
            </ul>
            <p className="text-red-400 font-semibold mb-6">
              This action cannot be undone!
            </p>

            {/* Type Confirmation */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                Type <strong style={{ color: 'var(--color-text-primary)' }}>{getRequiredConfirmationText()}</strong> to confirm:
              </label>
              <input
                type="text"
                value={deleteConfirmationText}
                onChange={(e) => setDeleteConfirmationText(e.target.value)}
                className="input input-bordered w-full"
                style={{
                  backgroundColor: 'var(--color-bg-tertiary)',
                  borderColor: 'var(--color-border-default)',
                  color: 'var(--color-text-primary)',
                }}
                placeholder={`Type ${getRequiredConfirmationText()} here`}
                disabled={isDeleting}
              />
              {deleteConfirmationText && deleteConfirmationText !== getRequiredConfirmationText() && (
                <p className="text-red-400 text-sm mt-1">
                  Text must match exactly: {getRequiredConfirmationText()}
                </p>
              )}
            </div>
            
            <div className="modal-action">
              <IconButton
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmationText('');
                }}
                icon={<FaTimes />}
                label="Cancel"
                variant="secondary"
                size="sm"
                disabled={isDeleting}
              />
              <IconButton
                onClick={confirmDeleteCompany}
                icon={<FaTrash />}
                label={isDeleting ? 'Deleting...' : 'Delete Company'}
                variant="danger"
                size="sm"
                disabled={isDeleting || deleteConfirmationText !== getRequiredConfirmationText()}
                loading={isDeleting}
              />
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
          <div 
            className="modal-box max-w-3xl border max-h-[80vh] transition-colors duration-200"
            style={{
              backgroundColor: 'var(--color-bg-secondary)',
              borderColor: 'var(--color-border-default)',
            }}
          >
            <h3 
              className="font-bold text-2xl mb-6 transition-colors duration-200"
              style={{ color: 'var(--color-text-primary)' }}
            >
              Changelog
            </h3>
            
            <div className="space-y-6 overflow-y-auto pr-2" style={{ maxHeight: 'calc(80vh - 150px)' }}>
              {/* Version 0.0.6 */}
              <div className="border-l-4 border-green-600 pl-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 
                    className="text-lg font-semibold transition-colors duration-200"
                    style={{ color: 'var(--color-text-primary)' }}
                  >
                    v0.0.6
                  </h4>
                  <span 
                    className="text-sm transition-colors duration-200"
                    style={{ color: 'var(--color-text-tertiary)' }}
                  >
                    December 23, 2024
                  </span>
                </div>
                <div 
                  className="space-y-2 text-sm transition-colors duration-200"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  <div>
                    <p className="font-semibold text-green-400">✨ New Features</p>
                    <ul className="list-disc list-inside ml-4 space-y-1">
                      <li>Project management system with templates</li>
                      <li>Project templates for reusable workflows</li>
                      <li>Task hierarchy visualization in modal</li>
                      <li>Tabbed interface in Task Modal (Team & Sharing / Task Hierarchy)</li>
                      <li>Side-by-side parent task and subtasks view</li>
                      <li>Project member management with roles</li>
                      <li>Draft tasks for project planning</li>
                      <li>Task sending and reassignment within projects</li>
                    </ul>
                  </div>
                  <div>
                    <p className="font-semibold text-blue-400">🔧 Improvements</p>
                    <ul className="list-disc list-inside ml-4 space-y-1">
                      <li>Reorganized Task Modal with cleaner layout</li>
                      <li>Better visual hierarchy for task relationships</li>
                      <li>Improved space utilization in modals</li>
                      <li>Enhanced empty states with helpful messages</li>
                      <li>Smooth tab transitions with animations</li>
                      <li>Aligned headers and content in hierarchy view</li>
                    </ul>
                  </div>
                  <div>
                    <p className="font-semibold text-purple-400">🎨 UI/UX</p>
                    <ul className="list-disc list-inside ml-4 space-y-1">
                      <li>Cleaner tab design without badge counters</li>
                      <li>Better visual separation between sections</li>
                      <li>Improved scrollable subtask lists</li>
                      <li>Icon-based navigation for tabs</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Version 0.0.5 */}
              <div className="border-l-4 border-blue-600 pl-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-lg font-semibold text-white">v0.0.5</h4>
                  <span className="text-sm text-gray-400">October 22, 2024</span>
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
                  <span className="text-sm text-gray-400">October 2, 2024</span>
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

              {/* View More Button */}
              {!showOlderVersions && (
                <div className="text-center py-4">
                  <button
                    onClick={() => setShowOlderVersions(true)}
                    className="btn btn-outline btn-sm text-gray-300 hover:text-white"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                    View Older Versions
                  </button>
                </div>
              )}

              {/* Older Versions (Hidden by default) */}
              {showOlderVersions && (
                <>
              {/* Version 0.0.2 */}
              <div className="border-l-4 border-gray-600 pl-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-lg font-semibold text-white">v0.0.2</h4>
                      <span className="text-sm text-gray-400">September 2024</span>
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
                      <span className="text-sm text-gray-400">August 2024</span>
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

                  {/* Hide Older Versions Button */}
                  <div className="text-center py-4">
                    <button
                      onClick={() => setShowOlderVersions(false)}
                      className="btn btn-outline btn-sm text-gray-300 hover:text-white"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" />
                      </svg>
                      Hide Older Versions
                    </button>
                  </div>
                </>
              )}
            </div>

            <div className="modal-action">
              <button
                onClick={() => setShowChangelog(false)}
                className="btn btn-ghost transition-colors duration-200"
                style={{ color: 'var(--color-text-secondary)' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = 'var(--color-text-primary)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'var(--color-text-secondary)';
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Legal Document Modal */}
      <LegalDocumentModal
        isOpen={showLegalModal}
        onClose={() => setShowLegalModal(false)}
        documentType={legalDocumentType}
      />

      {/* Briefing Modal */}
      {showBriefingModal && (
        <div className="modal modal-open">
          <div 
            className="modal-box w-11/12 max-w-2xl transition-colors duration-200"
            style={{
              backgroundColor: 'var(--color-bg-primary)',
              borderColor: 'var(--color-border-default)',
              borderWidth: 1,
            }}
          >
            <h3 className="font-bold text-lg mb-4" style={{ color: 'var(--color-text-primary)' }}>
              {previewBriefingTitle}
            </h3>
            <div 
              className="p-4 rounded-lg whitespace-pre-wrap text-sm"
              style={{
                backgroundColor: 'var(--color-bg-secondary)',
                color: 'var(--color-text-primary)',
                borderColor: 'var(--color-border-default)',
                borderWidth: 1,
              }}
            >
              {previewBriefingContent}
            </div>
            <div className="modal-action">
              <button 
                className="btn btn-primary"
                onClick={() => setShowBriefingModal(false)}
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
