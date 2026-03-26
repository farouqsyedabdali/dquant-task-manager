import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useAuthStore from '../context/authStore';
import { format } from 'date-fns';
import { taskInvitationAPI } from '../services/api';

const TaskInvitation = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [invitation, setInvitation] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [actionSuccess, setActionSuccess] = useState(null);
  const [showDeclineForm, setShowDeclineForm] = useState(false);
  const [declineReason, setDeclineReason] = useState('');

  useEffect(() => {
    fetchInvitation();
  }, [token]);

  const fetchInvitation = async () => {
    try {
      const response = await taskInvitationAPI.getByToken(token);
      setInvitation(response.data.invitation);
    } catch (err) {
      console.error('Error fetching invitation:', err);
      setError(
        err.response?.data?.error || 
        'Failed to load invitation. It may have expired or been deleted.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccept = async () => {
    if (!user) {
      // Store the token in localStorage and redirect to login
      localStorage.setItem('pendingInvitation', token);
      navigate('/login', { state: { from: `/task-invitation/${token}` } });
      return;
    }

    setIsProcessing(true);
    setError('');

    try {
      const response = await taskInvitationAPI.acceptInvitation(token);

      if (response.data.success) {
        setActionSuccess('accepted');
        setTimeout(() => {
          navigate('/app');
        }, 2000);
      }
    } catch (err) {
      console.error('Error accepting invitation:', err);
      setError(
        err.response?.data?.error || 
        'Failed to accept invitation. Please try again.'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeclineClick = () => {
    if (!user) {
      // Store the token in localStorage and redirect to login
      localStorage.setItem('pendingInvitation', token);
      navigate('/login', { state: { from: `/task-invitation/${token}` } });
      return;
    }
    setShowDeclineForm(true);
  };

  const handleDecline = async () => {
    setIsProcessing(true);
    setError('');

    try {
      const response = await taskInvitationAPI.declineInvitation(token, {
        reason: declineReason || 'No reason provided'
      });

      if (response.data.success) {
        setActionSuccess('declined');
        setTimeout(() => {
          navigate('/app');
        }, 2000);
      }
    } catch (err) {
      console.error('Error declining invitation:', err);
      setError(
        err.response?.data?.error || 
        'Failed to decline invitation. Please try again.'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const getPriorityColor = (priority) => {
    const colors = {
      LOW: 'badge-info',
      MEDIUM: 'badge-warning',
      HIGH: 'badge-error',
      URGENT: 'badge-error'
    };
    return colors[priority] || 'badge-ghost';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <span className="loading loading-spinner loading-lg text-primary"></span>
          <p className="text-gray-400 mt-4">Loading invitation...</p>
        </div>
      </div>
    );
  }

  if (error && !invitation) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="card bg-gray-800 border border-gray-700 w-full max-w-2xl">
          <div className="card-body text-center">
            <div className="text-6xl mb-4">❌</div>
            <h2 className="card-title text-white text-2xl justify-center mb-4">
              Invitation Not Found
            </h2>
            <p className="text-gray-400 mb-6">{error}</p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => navigate('/login')}
                className="btn btn-primary"
              >
                Go to Login
              </button>
              <button
                onClick={() => navigate('/')}
                className="btn btn-ghost text-gray-300"
              >
                Go Home
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (actionSuccess) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="card bg-gray-800 border border-gray-700 w-full max-w-2xl">
          <div className="card-body text-center">
            <div className="text-6xl mb-4">
              {actionSuccess === 'accepted' ? '✅' : '👋'}
            </div>
            <h2 className="card-title text-white text-2xl justify-center mb-4">
              {actionSuccess === 'accepted' 
                ? 'Collaboration Started!'
                : 'Invitation Declined'}
            </h2>
            <p className="text-gray-400 mb-6">
              {actionSuccess === 'accepted'
                ? 'You are now collaborating on this task. You can view and comment on it. Redirecting to dashboard...'
                : 'You have declined this task invitation. Redirecting...'}
            </p>
            <span className="loading loading-spinner loading-md text-primary"></span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="card bg-gray-800 border border-gray-700 w-full max-w-3xl">
        <div className="card-body">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="text-5xl mb-4">📬</div>
            <h1 className="text-3xl font-bold text-white mb-2">
              You've Received a Task!
            </h1>
            <p className="text-gray-400">
              <strong className="text-white">{invitation.sender.name}</strong> has sent you a task
            </p>
          </div>

          {/* Task Details */}
          <div className="bg-gray-700 rounded-lg p-6 mb-6">
            <div className="flex items-start justify-between mb-4">
              <h2 className="text-2xl font-bold text-white flex items-center">
                <span className="text-3xl mr-3">📋</span>
                {invitation.task.title}
              </h2>
              <span className={`badge ${getPriorityColor(invitation.task.priority)} badge-lg`}>
                {invitation.task.priority}
              </span>
            </div>

            {invitation.task.description && (
              <div className="mb-4">
                <p className="text-gray-300 whitespace-pre-wrap">
                  {invitation.task.description}
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-600">
              <div className="flex items-center">
                <span className="text-2xl mr-2">📅</span>
                <div>
                  <p className="text-xs text-gray-400">Due Date</p>
                  <p className="text-white font-semibold">
                    {invitation.task.dueDate 
                      ? format(new Date(invitation.task.dueDate), 'MMM dd, yyyy')
                      : 'No due date'}
                  </p>
                </div>
              </div>
              <div className="flex items-center">
                <span className="text-2xl mr-2">👤</span>
                <div>
                  <p className="text-xs text-gray-400">From</p>
                  <p className="text-white font-semibold">{invitation.sender.name}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Personal Message */}
          {invitation.message && (
            <div className="bg-yellow-900/20 border-l-4 border-yellow-500 p-4 mb-6 rounded">
              <p className="text-xs font-semibold text-yellow-500 uppercase mb-2">
                Personal Message
              </p>
              <p className="text-gray-300 italic">"{invitation.message}"</p>
            </div>
          )}

          {/* Expiry Notice */}
          {invitation.expiresAt && (
            <div className="alert alert-warning mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3l-7.93-13.75a2 2 0 00-3.464 0L2.342 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>This invitation expires on {format(new Date(invitation.expiresAt), 'MMM dd, yyyy')}</span>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="alert alert-error mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* Login Notice */}
          {!user && (
            <div className="alert alert-info mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>You need to log in or sign up to respond to this invitation</span>
            </div>
          )}

          {/* Action Buttons */}
          {!showDeclineForm ? (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={handleDeclineClick}
                className="btn btn-outline btn-error flex-1 sm:flex-initial"
                disabled={isProcessing}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
                Decline
              </button>
              <button
                onClick={handleAccept}
                className="btn btn-primary flex-1 sm:flex-initial"
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <span className="loading loading-spinner loading-sm"></span>
                    Processing...
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    Accept Task
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="bg-gray-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">
                Why are you declining this task?
              </h3>
              <textarea
                value={declineReason}
                onChange={(e) => setDeclineReason(e.target.value)}
                className="textarea textarea-bordered w-full h-32 bg-gray-800 border-gray-600 text-white placeholder-gray-400"
                placeholder="Please provide a reason (optional)..."
              />
              <div className="flex gap-3 mt-4">
                <button
                  onClick={handleDecline}
                  className="btn btn-error flex-1"
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <span className="loading loading-spinner loading-sm"></span>
                      Declining...
                    </>
                  ) : (
                    'Confirm Decline'
                  )}
                </button>
                <button
                  onClick={() => {
                    setShowDeclineForm(false);
                    setDeclineReason('');
                  }}
                  className="btn btn-ghost text-gray-400"
                  disabled={isProcessing}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Help Text */}
          <p className="text-center text-sm text-gray-500 mt-6">
            By accepting this task, it will be added to your personal task list and you can start working on it immediately.
          </p>
        </div>
      </div>
    </div>
  );
};

export default TaskInvitation;

