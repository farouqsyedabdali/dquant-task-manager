import { useState, useEffect } from 'react';
import { commentsAPI } from '../../services/api';
import useAuthStore from '../../context/authStore';

const CommentSection = ({ taskId }) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const { user, isAdmin } = useAuthStore();

  useEffect(() => {
    fetchComments();
  }, [taskId]);

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

  const handleDeleteComment = async (commentId) => {
    if (!isAdmin()) return;
    
    if (!window.confirm('Are you sure you want to delete this comment?')) return;

    try {
      await commentsAPI.delete(commentId);
      setComments(comments.filter(comment => comment.id !== commentId));
    } catch (error) {
      setError('Failed to delete comment');
      console.error('Error deleting comment:', error);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now - date) / (1000 * 60));
      return `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`;
    } else if (diffInHours < 24) {
      const hours = Math.floor(diffInHours);
      return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString();
    }
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
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            rows={3}
            className="textarea bg-gray-700 border-gray-600 text-white placeholder-gray-400 w-full focus:border-indigo-500 focus:ring-indigo-500"
            disabled={isLoading}
          />
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
                    </p>
                  </div>
                </div>
                {isAdmin() && (
                  <button
                    onClick={() => handleDeleteComment(comment.id)}
                    className="btn btn-ghost btn-xs text-red-400 hover:text-red-300"
                    title="Delete comment"
                  >
                    🗑️
                  </button>
                )}
              </div>
              <p className="text-gray-300 whitespace-pre-wrap">
                {comment.content}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default CommentSection; 