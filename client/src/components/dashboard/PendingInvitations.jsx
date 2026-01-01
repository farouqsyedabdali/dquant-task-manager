import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { FaEnvelope, FaUser, FaCalendar, FaCheck, FaTimes, FaClock, FaProjectDiagram } from 'react-icons/fa';
import { taskInvitationAPI } from '../../services/api';
import { useToastContext } from '../../context/ToastContext';

const PendingInvitations = () => {
  const [invitations, setInvitations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingIds, setProcessingIds] = useState(new Set());
  const { success, error } = useToastContext();

  useEffect(() => {
    fetchPendingInvitations();
  }, []);

  const fetchPendingInvitations = async () => {
    try {
      const response = await taskInvitationAPI.getPending();
      setInvitations(response.data.invitations);
    } catch (err) {
      console.error('Error fetching pending invitations:', err);
      error('Failed to load pending invitations');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccept = async (invitation) => {
    setProcessingIds(prev => new Set(prev).add(invitation.id));

    try {
      await taskInvitationAPI.acceptInvitation(invitation.token);
      success(`Accepted invitation for "${invitation.task.title}"`);

      // Remove from local state
      setInvitations(prev => prev.filter(inv => inv.id !== invitation.id));
    } catch (err) {
      console.error('Error accepting invitation:', err);
      error(err.response?.data?.error || 'Failed to accept invitation');
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(invitation.id);
        return newSet;
      });
    }
  };

  const handleDecline = async (invitation) => {
    setProcessingIds(prev => new Set(prev).add(invitation.id));

    try {
      await taskInvitationAPI.declineInvitation(invitation.token, {
        reason: 'Declined from dashboard'
      });
      success(`Declined invitation for "${invitation.task.title}"`);

      // Remove from local state
      setInvitations(prev => prev.filter(inv => inv.id !== invitation.id));
    } catch (err) {
      console.error('Error declining invitation:', err);
      error(err.response?.data?.error || 'Failed to decline invitation');
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(invitation.id);
        return newSet;
      });
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'LOW': return 'bg-blue-500';
      case 'MEDIUM': return 'bg-yellow-500';
      case 'HIGH': return 'bg-orange-500';
      case 'URGENT': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'LOW': return '🔵';
      case 'MEDIUM': return '🟡';
      case 'HIGH': return '🟠';
      case 'URGENT': return '🔴';
      default: return '⚪';
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (invitations.length === 0) {
    return null; // Don't show anything if no pending invitations
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <FaEnvelope className="text-blue-500 w-5 h-5" />
          <h2 className="text-lg font-semibold text-gray-900">
            Pending External Invitations
          </h2>
          <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
            {invitations.length}
          </span>
        </div>
      </div>

      <div className="space-y-4">
        {invitations.map((invitation) => {
          const isProcessing = processingIds.has(invitation.id);

          return (
            <div
              key={invitation.id}
              className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
            >
              {/* Header with task title and priority */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <h3 className="text-base font-medium text-gray-900 truncate">
                      {invitation.task.title}
                    </h3>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium text-white ${getPriorityColor(invitation.task.priority)}`}>
                      {getPriorityIcon(invitation.task.priority)} {invitation.task.priority}
                    </span>
                  </div>

                  {/* Project info if available */}
                  {invitation.task.project && (
                    <div className="flex items-center space-x-2 mb-2">
                      <FaProjectDiagram className="text-gray-400 w-3 h-3" />
                      <span className="text-sm text-gray-600">
                        Project: {invitation.task.project.name}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Task description */}
              {invitation.task.description && (
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                  {invitation.task.description}
                </p>
              )}

              {/* Sender and due date info */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-1">
                    <FaUser className="text-gray-400 w-3 h-3" />
                    <span className="text-sm text-gray-600">
                      From: {invitation.sender.name}
                    </span>
                  </div>

                  {invitation.task.dueDate && (
                    <div className="flex items-center space-x-1">
                      <FaCalendar className="text-gray-400 w-3 h-3" />
                      <span className="text-sm text-gray-600">
                        Due: {format(new Date(invitation.task.dueDate), 'MMM dd, yyyy')}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-1">
                  <FaClock className="text-gray-400 w-3 h-3" />
                  <span className="text-xs text-gray-500">
                    Expires: {format(new Date(invitation.expiresAt), 'MMM dd, yyyy')}
                  </span>
                </div>
              </div>

              {/* Personal message if available */}
              {invitation.message && (
                <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-4">
                  <p className="text-sm text-blue-800">
                    <strong>Message:</strong> {invitation.message}
                  </p>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex items-center justify-end space-x-3">
                <button
                  onClick={() => handleDecline(invitation)}
                  disabled={isProcessing}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FaTimes className="w-4 h-4 mr-2" />
                  Decline
                </button>

                <button
                  onClick={() => handleAccept(invitation)}
                  disabled={isProcessing}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <FaCheck className="w-4 h-4 mr-2" />
                      Accept
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PendingInvitations;
