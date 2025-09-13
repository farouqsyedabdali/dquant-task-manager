import { useState, useEffect } from 'react';
import { taskShareAPI, usersAPI } from '../../services/api';
import SearchableDropdown from '../common/SearchableDropdown';

const TaskShareModal = ({ isOpen, onClose, task, onShareUpdate }) => {
  const [users, setUsers] = useState([]);
  const [sharedWith, setSharedWith] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingShares, setIsLoadingShares] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && task) {
      fetchUsers();
      fetchTaskShares();
    }
  }, [isOpen, task]);

  const fetchUsers = async () => {
    try {
      const response = await usersAPI.getEmployees();
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchTaskShares = async () => {
    if (!task) return;
    
    try {
      setIsLoadingShares(true);
      const response = await taskShareAPI.getTaskShares(task.id);
      setSharedWith(response.data);
    } catch (error) {
      console.error('Error fetching task shares:', error);
    } finally {
      setIsLoadingShares(false);
    }
  };

  const handleShare = async () => {
    if (!selectedUserId || !task) return;

    try {
      setIsLoading(true);
      setError(null);
      
      await taskShareAPI.shareTask(task.id, selectedUserId);
      
      // Refresh the shared users list
      await fetchTaskShares();
      
      // Notify parent component
      if (onShareUpdate) {
        onShareUpdate();
      }
      
      setSelectedUserId('');
    } catch (error) {
      console.error('Error sharing task:', error);
      setError(error.response?.data?.error || 'Failed to share task');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnshare = async (userId) => {
    if (!task) return;

    try {
      setIsLoading(true);
      setError(null);
      
      await taskShareAPI.unshareTask(task.id, userId);
      
      // Refresh the shared users list
      await fetchTaskShares();
      
      // Notify parent component
      if (onShareUpdate) {
        onShareUpdate();
      }
    } catch (error) {
      console.error('Error unsharing task:', error);
      setError(error.response?.data?.error || 'Failed to unshare task');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedUserId('');
    setError(null);
    onClose();
  };

  if (!isOpen || !task) return null;

  // Filter out users who are already shared with, co-assignees, or the lead assignee
  const availableUsers = users.filter(user => 
    user.id !== task.assigneeId && // Not the lead assignee
    !task.coAssignees?.some(co => co.userId === user.id) && // Not a co-assignee
    !sharedWith.some(share => share.userId === user.id) // Not already shared
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">Share Task</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white"
          >
            ✕
          </button>
        </div>

        <div className="mb-4">
          <h3 className="text-lg font-semibold text-white mb-2">
            "{task.title}"
          </h3>
          <p className="text-gray-400 text-sm">
            Share this task with team members for view-only access
          </p>
        </div>

        {error && (
          <div className="alert alert-error text-sm mb-4">
            {error}
          </div>
        )}

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Share with
          </label>
          <div className="flex gap-2">
            <SearchableDropdown
              options={availableUsers}
              value={selectedUserId}
              onChange={setSelectedUserId}
              placeholder="Select a team member..."
              className="flex-1"
            />
            <button
              onClick={handleShare}
              disabled={!selectedUserId || isLoading}
              className="btn btn-primary btn-sm"
            >
              {isLoading ? 'Sharing...' : 'Share'}
            </button>
          </div>
        </div>

        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-300 mb-2">
            Currently Shared With
          </h4>
          {isLoadingShares ? (
            <div className="text-gray-400 text-sm">Loading...</div>
          ) : sharedWith.length === 0 ? (
            <div className="text-gray-400 text-sm">No one yet</div>
          ) : (
            <div className="space-y-2">
              {sharedWith.map((share) => (
                <div key={share.id} className="flex items-center justify-between bg-gray-700 rounded p-2">
                  <div className="flex items-center space-x-2">
                    <div className="avatar placeholder">
                      <div className="bg-indigo-600 text-white rounded-full w-6">
                        <span className="text-xs">{share.user.name.charAt(0)}</span>
                      </div>
                    </div>
                    <span className="text-white text-sm">{share.user.name}</span>
                  </div>
                  <button
                    onClick={() => handleUnshare(share.userId)}
                    disabled={isLoading}
                    className="btn btn-ghost btn-xs text-red-400 hover:text-red-300"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-2">
          <button
            onClick={handleClose}
            className="btn btn-ghost"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaskShareModal;
