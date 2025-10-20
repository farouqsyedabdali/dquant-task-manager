const TaskUpdatesModal = ({ isOpen, onClose, task }) => {
  if (!isOpen || !task) return null;

  // Mock updates data - in production, this would come from an API
  const updates = [
    {
      id: 1,
      type: 'STATUS_CHANGE',
      message: `Status changed from "To Do" to "In Progress"`,
      user: task.assigner?.name || 'System',
      timestamp: new Date(task.updatedAt),
      icon: '🔄'
    },
    {
      id: 2,
      type: 'CREATED',
      message: `Task created`,
      user: task.assigner?.name || 'Unknown',
      timestamp: new Date(task.createdAt),
      icon: '✨'
    }
  ];

  // Sort by most recent first
  const sortedUpdates = updates.sort((a, b) => b.timestamp - a.timestamp);

  const formatTimestamp = (date) => {
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="modal modal-open backdrop-blur-sm" style={{ zIndex: 60 }}>
      <div className="modal-box max-w-2xl bg-gray-800 border border-gray-700">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-white">Task Updates</h3>
          <button
            onClick={onClose}
            className="btn btn-ghost btn-sm btn-circle text-gray-400 hover:text-white"
          >
            ✕
          </button>
        </div>

        {/* Task Info */}
        <div className="mb-4 p-3 bg-gray-700 rounded-lg">
          <h4 className="text-white font-semibold text-sm">{task.title}</h4>
          <p className="text-gray-400 text-xs mt-1">
            Created by {task.assigner?.name} on {new Date(task.createdAt).toLocaleDateString()}
          </p>
        </div>

        {/* Updates Timeline */}
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {sortedUpdates.length > 0 ? (
            sortedUpdates.map((update) => (
              <div key={update.id} className="flex gap-3 p-3 bg-gray-700 rounded-lg hover:bg-gray-600 transition">
                <div className="text-2xl">{update.icon}</div>
                <div className="flex-1">
                  <p className="text-white text-sm">{update.message}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-gray-400 text-xs">{update.user}</span>
                    <span className="text-gray-500 text-xs">•</span>
                    <span className="text-gray-400 text-xs">{formatTimestamp(update.timestamp)}</span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-400">
              <p>No updates yet</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-4 pt-4 border-t border-gray-700">
          <p className="text-xs text-gray-500 text-center">
            Task activity and change history will appear here
          </p>
        </div>
      </div>
    </div>
  );
};

export default TaskUpdatesModal;

