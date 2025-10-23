import { useState, useEffect } from 'react';
import { commentsAPI } from '../../services/api';
import useAuthStore from '../../context/authStore';
import DeleteConfirmModal from '../common/DeleteConfirmModal';

const CommentSection = ({ taskId, task = null, extensionUpdateData = null }) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [deleteCommentId, setDeleteCommentId] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editContent, setEditContent] = useState('');

  const { user, isAdmin } = useAuthStore();
  
  // Check if user is a company admin (same company as task)
  const isCompanyAdmin = task && user && isAdmin() && task.companyId === user.companyId;

  useEffect(() => {
    fetchComments();
  }, [taskId]);

  // Pre-fill comment with extension update data
  useEffect(() => {
    if (extensionUpdateData && extensionUpdateData.updateContent && extensionUpdateData.taskFound) {
      console.log('Pre-filling comment with extension update:', extensionUpdateData);
      setNewComment(extensionUpdateData.updateContent);
      
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
        <div className="bg-indigo-900/30 border border-indigo-500/30 rounded-lg p-3 mb-4">
          <div className="flex items-start space-x-2">
            <div className="text-indigo-400 mt-0.5">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h5 className="text-sm font-medium text-indigo-300 mb-1">
                ✨ AI-Generated Update ({extensionUpdateData.updateType?.toUpperCase()})
              </h5>
              <p className="text-xs text-gray-300">
                {extensionUpdateData.reasoning}
              </p>
              {extensionUpdateData.suggestedActions && extensionUpdateData.suggestedActions.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs text-gray-400">Suggested actions:</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {extensionUpdateData.suggestedActions.map((action, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2 py-1 rounded text-xs bg-indigo-800/40 text-indigo-300"
                      >
                        {action.replace(/_/g, ' ')}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <textarea
            value={newComment}
            onChange={handleCommentChange}
            placeholder="Add a comment..."
            rows={3}
            maxLength={200}
            className="textarea bg-gray-700 border-gray-600 text-white placeholder-gray-400 w-full focus:border-indigo-500 focus:ring-indigo-500 rounded-lg"
            disabled={isLoading}
          />
          <div className="text-xs text-gray-400 mt-1">
            {newComment.length}/200 characters
          </div>
        </div>
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isLoading || !newComment.trim()}
            className="btn bg-indigo-600 hover:bg-indigo-700 text-white border-0 btn-sm"
          >
            {isLoading ? (
              <>
                <span className="loading loading-spinner loading-xs"></span>
                Adding...
              </>
            ) : (
              'Add Comment'
            )}
          </button>
        </div>
      </form>

      {/* Comments List */}
      <div className="space-y-4">
        {isLoading && comments.length === 0 ? (
          <div className="flex justify-center py-4">
            <span className="loading loading-spinner loading-md"></span>
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <p>No comments yet</p>
            <p className="text-sm">Be the first to add a comment!</p>
          </div>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="bg-gray-700 border border-gray-600 rounded-lg p-4">
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center space-x-2">
                  <div className="avatar placeholder">
                    <div className="bg-indigo-600 text-white rounded-full w-6">
                      <span className="text-xs">{comment.author.name.charAt(0)}</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">
                      {comment.author.name}
                    </p>
                    <p className="text-xs text-gray-400">
                      {formatDate(comment.createdAt)}
                      {comment.editedAt && (
                        <span className="text-gray-500 ml-1">(edited)</span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex space-x-1">
                  {/* Edit button - only for comment author */}
                  {comment.author.id === user?.id && (
                    <button
                      onClick={() => handleEditComment(comment)}
                      className="btn btn-ghost btn-xs text-blue-400 hover:text-blue-300"
                      title="Edit comment"
                      disabled={editingCommentId === comment.id}
                    >
                      ✏️
                    </button>
                  )}
                  {/* Delete button - only for company admins or comment author */}
                  {(isCompanyAdmin || comment.author.id === user?.id) && (
                    <button
                      onClick={() => handleDeleteComment(comment.id)}
                      className="btn btn-ghost btn-xs text-red-400 hover:text-red-300"
                      title="Delete comment"
                    >
                      🗑️
                    </button>
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
                    className="textarea bg-gray-600 border-gray-500 text-white placeholder-gray-400 w-full focus:border-blue-500 focus:ring-blue-500 rounded-lg"
                    disabled={isLoading}
                  />
                  <div className="flex justify-between items-center">
                    <div className="text-xs text-gray-400">
                      {editContent.length}/200 characters
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={handleCancelEdit}
                        className="btn btn-ghost btn-xs text-gray-400 hover:text-gray-300"
                        disabled={isLoading}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveEdit}
                        disabled={isLoading || !editContent.trim()}
                        className="btn bg-blue-600 hover:bg-blue-700 text-white border-0 btn-xs"
                      >
                        {isLoading ? (
                          <>
                            <span className="loading loading-spinner loading-xs"></span>
                            Saving...
                          </>
                        ) : (
                          'Save'
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-gray-300 whitespace-pre-wrap">
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