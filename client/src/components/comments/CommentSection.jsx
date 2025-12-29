import { useState, useEffect } from 'react';
import { commentsAPI, tasksAPI } from '../../services/api';
import useAuthStore from '../../context/authStore';
import useTaskStore from '../../stores/taskStore';
import DeleteConfirmModal from '../common/DeleteConfirmModal';
import IconButton from '../common/IconButton';
import SearchableDropdown from '../common/SearchableDropdown';
import { FaComment, FaEdit, FaTrash, FaSave, FaTimes, FaExchangeAlt } from 'react-icons/fa';

const CommentSection = ({ taskId, task = null, extensionUpdateData = null, onTaskSwitch = null }) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [deleteCommentId, setDeleteCommentId] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [showTaskSwitcher, setShowTaskSwitcher] = useState(false);
  const [availableTasks, setAvailableTasks] = useState([]);
  const [selectedTaskId, setSelectedTaskId] = useState('');

  const { user, isAdmin } = useAuthStore();
  const { fetchTask } = useTaskStore();
  
  // Check if user is a company admin (same company as task)
  const isCompanyAdmin = task && user && isAdmin() && task.companyId === user.companyId;

  useEffect(() => {
    fetchComments();
  }, [taskId]);

  // Pre-fill comment with extension update data
  useEffect(() => {
    if (extensionUpdateData && extensionUpdateData.updateContent) {
      console.log('Pre-filling comment with extension update:', extensionUpdateData);
      setNewComment(extensionUpdateData.updateContent);
      
      // Note: Task switcher is no longer used for update flow
      // Task selection now happens in TaskSelectionModal before opening TaskModal
      
      // Scroll to comment section to show the pre-filled update
      setTimeout(() => {
        const commentTextarea = document.querySelector('textarea[placeholder*="Add a comment"]');
        if (commentTextarea) {
          commentTextarea.focus();
          commentTextarea.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    }
  }, [extensionUpdateData]);

  // Fetch available tasks for task switcher
  const fetchAvailableTasks = async () => {
    try {
      const response = await tasksAPI.getAll();
      const taskOptions = response.data.map(t => ({
        id: t.id.toString(),
        name: `${t.title} (${t.status})`,
        value: t.id.toString()
      }));
      setAvailableTasks(taskOptions);
    } catch (error) {
      console.error('Failed to fetch tasks for switcher:', error);
    }
  };

  // Handle task switch
  const handleTaskSwitch = async () => {
    if (!selectedTaskId) return;
    
    const result = await fetchTask(parseInt(selectedTaskId));
    if (result.success && result.data && onTaskSwitch) {
      onTaskSwitch(result.data);
      setShowTaskSwitcher(false);
    }
  };

  const fetchComments = async () => {
    try {
      setIsLoading(true);
      const response = await commentsAPI.getByTaskId(taskId);
      setComments(response.data);
    } catch (error) {
      setError('Failed to load comments');
      console.error('Error fetching comments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!newComment.trim()) return;

    try {
      setIsLoading(true);
      const response = await commentsAPI.create(taskId, newComment.trim());
      setComments([response.data, ...comments]);
      setNewComment('');
    } catch (error) {
      setError('Failed to add comment');
      console.error('Error adding comment:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCommentChange = (e) => {
    const value = e.target.value;
    // Limit to 200 characters
    if (value.length <= 200) {
      setNewComment(value);
    }
  };

  const handleDeleteComment = async (commentId) => {
    const comment = comments.find(c => c.id === commentId);
    const canDelete = isCompanyAdmin || (comment && comment.author.id === user?.id);
    
    if (!canDelete) return;
    
    setDeleteCommentId(commentId);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteComment = async () => {
    if (deleteCommentId) {
      try {
        await commentsAPI.delete(deleteCommentId);
        setComments(comments.filter(comment => comment.id !== deleteCommentId));
        setIsDeleteModalOpen(false);
        setDeleteCommentId(null);
      } catch (error) {
        setError('Failed to delete comment');
        console.error('Error deleting comment:', error);
      }
    }
  };

  const handleEditComment = (comment) => {
    setEditingCommentId(comment.id);
    setEditContent(comment.content);
  };

  const handleCancelEdit = () => {
    setEditingCommentId(null);
    setEditContent('');
  };

  const handleSaveEdit = async () => {
    if (!editingCommentId || !editContent.trim()) return;

    try {
      setIsLoading(true);
      const response = await commentsAPI.update(editingCommentId, editContent);
      setComments(comments.map(comment => 
        comment.id === editingCommentId ? response.data : comment
      ));
      setEditingCommentId(null);
      setEditContent('');
    } catch (error) {
      setError('Failed to update comment');
      console.error('Error updating comment:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-4">
      {/* Error Alert */}
      {error && (
        <div className="alert bg-red-900 border-red-700 text-red-200">
          <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {/* Add Comment Form */}
      {extensionUpdateData && extensionUpdateData.taskFound && (
        <div 
          className="border rounded-lg p-3 mb-4 transition-colors duration-200"
          style={{
            backgroundColor: 'rgba(99, 102, 241, 0.1)',
            borderColor: 'rgba(99, 102, 241, 0.3)',
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 flex-1">
              <div 
                className="flex-shrink-0 transition-colors duration-200"
                style={{ color: 'var(--color-primary-light)' }}
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex-1">
                <p 
                  className="text-xs transition-colors duration-200"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  AI can make mistakes. Please double-check the information.
                </p>
              </div>
            </div>
            {onTaskSwitch && (
              <button
                onClick={onTaskSwitch}
                className="btn btn-sm ml-3 flex-shrink-0"
                style={{
                  backgroundColor: 'var(--color-primary)',
                  color: 'white',
                  border: 'none'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = '0.9';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = '1';
                }}
              >
                <FaExchangeAlt className="w-3 h-3 mr-1" />
                Change Task
              </button>
            )}
          </div>
        </div>
      )}
      
      {/* Task Switcher - Removed: Task selection now happens in TaskSelectionModal before opening TaskModal */}
      
      <form onSubmit={handleSubmit} className="space-y-1">
        <div>
          <textarea
            value={newComment}
            onChange={handleCommentChange}
            placeholder="Add a comment..."
            rows={3}
            maxLength={200}
            className="textarea w-full rounded-lg transition-colors duration-200"
            style={{
              backgroundColor: 'var(--color-bg-tertiary)',
              borderColor: 'var(--color-border-default)',
              color: 'var(--color-text-primary)',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = 'var(--color-primary)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'var(--color-border-default)';
            }}
            disabled={isLoading}
          />
          <div 
            className="text-xs mt-1 transition-colors duration-200"
            style={{ color: 'var(--color-text-tertiary)' }}
          >
            {newComment.length}/200 characters
          </div>
        </div>
        <div className="flex justify-end">
          <IconButton
            icon={<FaComment />}
            label={isLoading ? 'Adding...' : 'Add Comment'}
            variant="primary"
            size="sm"
            type="submit"
            disabled={isLoading || !newComment.trim()}
            loading={isLoading}
          />
        </div>
      </form>

      {/* Comments List */}
      <div className="space-y-4">
        {isLoading && comments.length === 0 ? (
          <div className="flex justify-center py-4">
            <span className="loading loading-spinner loading-md"></span>
          </div>
        ) : comments.length === 0 ? (
          <div 
            className="text-center py-8 transition-colors duration-200"
            style={{ color: 'var(--color-text-tertiary)' }}
          >
            <p>No comments yet</p>
            <p className="text-sm">Be the first to add a comment!</p>
          </div>
        ) : (
          comments.map((comment) => (
            <div 
              key={comment.id} 
              className="border rounded-lg p-4 transition-colors duration-200"
              style={{
                backgroundColor: 'var(--color-bg-tertiary)',
                borderColor: 'var(--color-border-default)',
              }}
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center space-x-2">
                  <div 
                    className="text-white rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ 
                      backgroundColor: 'var(--color-primary)',
                      width: '24px',
                      height: '24px',
                      minWidth: '24px',
                      minHeight: '24px',
                      maxWidth: '24px',
                      maxHeight: '24px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      lineHeight: '1'
                    }}
                  >
                    <span 
                      className="text-xs"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        lineHeight: '1'
                      }}
                    >
                      {comment.author.name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <p 
                      className="text-sm font-medium transition-colors duration-200"
                      style={{ color: 'var(--color-text-primary)' }}
                    >
                      {comment.author.name}
                    </p>
                    <p 
                      className="text-xs transition-colors duration-200"
                      style={{ color: 'var(--color-text-tertiary)' }}
                    >
                      {formatDate(comment.createdAt)}
                      {comment.editedAt && (
                        <span 
                          className="ml-1 transition-colors duration-200"
                          style={{ color: 'var(--color-text-muted)' }}
                        >
                          (edited)
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex space-x-1">
                  {/* Edit button - only for comment author */}
                  {comment.author.id === user?.id && (
                    <IconButton
                      icon={<FaEdit />}
                      label="Edit comment"
                      iconOnly={true}
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditComment(comment)}
                      disabled={editingCommentId === comment.id}
                      className="!text-blue-400 hover:!text-blue-300 !p-1.5"
                    />
                  )}
                  {/* Delete button - only for company admins or comment author */}
                  {(isCompanyAdmin || comment.author.id === user?.id) && (
                    <IconButton
                      icon={<FaTrash />}
                      label="Delete comment"
                      iconOnly={true}
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteComment(comment.id)}
                      className="!text-red-400 hover:!text-red-300 !p-1.5"
                    />
                  )}
                </div>
              </div>
              
              {/* Comment content or edit form */}
              {editingCommentId === comment.id ? (
                <div className="space-y-3">
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    rows={3}
                    maxLength={200}
                    className="textarea w-full rounded-lg transition-colors duration-200"
                    style={{
                      backgroundColor: 'var(--color-bg-quaternary)',
                      borderColor: 'var(--color-border-light)',
                      color: 'var(--color-text-primary)',
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = '#3b82f6';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = 'var(--color-border-light)';
                    }}
                    disabled={isLoading}
                  />
                  <div className="flex justify-between items-center">
                    <div 
                      className="text-xs transition-colors duration-200"
                      style={{ color: 'var(--color-text-tertiary)' }}
                    >
                      {editContent.length}/200 characters
                    </div>
                    <div className="flex space-x-2">
                      <IconButton
                        icon={<FaTimes />}
                        label="Cancel"
                        variant="ghost"
                        size="sm"
                        onClick={handleCancelEdit}
                        disabled={isLoading}
                      />
                      <IconButton
                        icon={<FaSave />}
                        label={isLoading ? 'Saving...' : 'Save'}
                        variant="primary"
                        size="sm"
                        onClick={handleSaveEdit}
                        disabled={isLoading || !editContent.trim()}
                        loading={isLoading}
                        className="!bg-blue-600 hover:!bg-blue-700"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <p 
                  className="whitespace-pre-wrap transition-colors duration-200"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  {comment.content}
                </p>
              )}
            </div>
          ))
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteCommentId && (
        <DeleteConfirmModal
          isOpen={isDeleteModalOpen}
          onClose={() => {
            setIsDeleteModalOpen(false);
            setDeleteCommentId(null);
          }}
          onConfirm={confirmDeleteComment}
          taskTitle={`Comment by ${comments.find(c => c.id === deleteCommentId)?.author.name || 'Unknown'}`}
          isLoading={isLoading}
        />
      )}
    </div>
  );
};

export default CommentSection; 