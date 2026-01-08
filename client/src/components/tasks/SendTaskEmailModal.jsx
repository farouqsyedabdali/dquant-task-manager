import { useState } from 'react';
import { tasksAPI } from '../../services/api';

const SendTaskEmailModal = ({ isOpen, onClose, task }) => {
  const [recipientEmail, setRecipientEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(recipientEmail)) {
      setError('Please enter a valid email address');
      setIsLoading(false);
      return;
    }

    try {
      const response = await tasksAPI.sendInvitation(task.id, {
        recipientEmail: recipientEmail.trim(),
        message: message.trim()
      });

      if (response.data.success) {
        setSuccess(true);
        setTimeout(() => {
          handleClose();
        }, 2000);
      }
    } catch (err) {
      console.error('Error sending task invitation:', err);
      const errorMessage = err.response?.data?.error || err.message || 'Failed to send invitation. Please try again.';
      console.error('Error details:', {
        status: err.response?.status,
        error: errorMessage,
        taskId: task.id,
        recipientEmail
      });
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setRecipientEmail('');
    setMessage('');
    setError('');
    setSuccess(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal modal-open">
      <div className="modal-box bg-gray-800 border border-gray-700">
        <h3 className="font-bold text-xl text-white mb-4">
          📧 Send Task via Email
        </h3>

        {success ? (
          <div className="alert alert-success mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Task invitation sent successfully!</span>
          </div>
        ) : (
          <>
            <div className="mb-4 p-4 bg-gray-700 rounded-lg">
              <p className="text-sm text-gray-300 mb-2">
                <strong className="text-white">Task:</strong> {task.title}
              </p>
              <p className="text-xs text-gray-400">
                The recipient will receive an email with task details and can accept or decline the invitation.
              </p>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-control mb-4">
                <label className="label">
                  <span className="label-text text-gray-300">Recipient Email *</span>
                </label>
                <input
                  type="email"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  placeholder="colleague@example.com"
                  className="input input-bordered w-full bg-gray-700 border-gray-600 text-white"
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="form-control mb-4">
                <label className="label">
                  <span className="label-text text-gray-300">Personal Message (Optional)</span>
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Add a personal note to your invitation..."
                  className="textarea textarea-bordered w-full bg-gray-700 border-gray-600 text-white h-24"
                  disabled={isLoading}
                />
                <label className="label">
                  <span className="label-text-alt text-gray-400">
                    {message.length}/500 characters
                  </span>
                </label>
              </div>

              {error && (
                <div className="alert alert-error mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{error}</span>
                </div>
              )}

              <div className="modal-action">
                <button
                  type="button"
                  onClick={handleClose}
                  className="btn btn-ghost text-gray-300 hover:text-white"
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isLoading || !recipientEmail.trim()}
                >
                  {isLoading ? (
                    <>
                      <span className="loading loading-spinner loading-sm"></span>
                      Sending...
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      Send Invitation
                    </>
                  )}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default SendTaskEmailModal;

