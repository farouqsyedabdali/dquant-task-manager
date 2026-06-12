import { useState, useMemo } from 'react';
import { projectsAPI } from '../../services/api';
import IconButton from '../common/IconButton';
import { FaTimes, FaCopy, FaTrash } from 'react-icons/fa';

const DuplicateTasksModal = ({ isOpen, onClose, tasks, projectId, onSuccess }) => {
  // Tasks included in the duplication (user can remove individual ones)
  const [includedTaskIds, setIncludedTaskIds] = useState(
    () => new Set(tasks.map(t => t.id))
  );

  // Options
  const [clearAssignees, setClearAssignees] = useState(true);
  const [dueDateMode, setDueDateMode] = useState('keep');
  const [shiftDays, setShiftDays] = useState(7);
  const [includeSubtasks, setIncludeSubtasks] = useState(true);

  const [isDuplicating, setIsDuplicating] = useState(false);
  const [error, setError] = useState(null);

  const includedTasks = useMemo(
    () => tasks.filter(t => includedTaskIds.has(t.id)),
    [tasks, includedTaskIds]
  );

  const hasSubtasks = useMemo(
    () => includedTasks.some(t => t.subtasks && t.subtasks.length > 0),
    [includedTasks]
  );

  const handleRemoveTask = (taskId) => {
    setIncludedTaskIds(prev => {
      const next = new Set(prev);
      next.delete(taskId);
      return next;
    });
  };

  const handleDuplicate = async () => {
    if (includedTasks.length === 0) return;

    setIsDuplicating(true);
    setError(null);

    try {
      const response = await projectsAPI.duplicateTasks(projectId, includedTasks.map(t => t.id), {
        clearAssignees,
        dueDateMode,
        shiftDays: dueDateMode === 'shift' ? shiftDays : 0,
        includeSubtasks
      });

      onSuccess(response.data.message || `Duplicated ${includedTasks.length} task(s)`);
      onClose();
    } catch (err) {
      console.error('Error duplicating tasks:', err);
      setError(err.response?.data?.error || 'Failed to duplicate tasks');
    } finally {
      setIsDuplicating(false);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'URGENT': return 'bg-red-600 text-red-200';
      case 'HIGH': return 'bg-orange-600 text-orange-200';
      case 'MEDIUM': return 'bg-yellow-600 text-yellow-200';
      case 'LOW': return 'bg-green-600 text-green-200';
      default: return 'bg-yellow-600 text-yellow-200';
    }
  };

  const getAssigneeName = (task) => {
    if (task.externalContact) return task.externalContact.name;
    if (task.assignee) return task.assignee.name;
    return 'Unassigned';
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'No date';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (!isOpen) return null;

  return (
    <div className="modal modal-open backdrop-blur-sm" style={{ zIndex: 55 }}>
      <div
        className="modal-box max-w-2xl max-h-[85vh] border"
        style={{
          backgroundColor: 'var(--color-bg-secondary)',
          borderColor: 'var(--color-border-default)'
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
              Duplicate {includedTasks.length} Task{includedTasks.length !== 1 ? 's' : ''}
            </h3>
            <p className="text-sm mt-1" style={{ color: 'var(--color-text-tertiary)' }}>
              Duplicates will be created as drafts
            </p>
          </div>
          <IconButton
            icon={<FaTimes />}
            label="Close"
            iconOnly
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="!p-2 !rounded-full"
          />
        </div>

        {/* Error */}
        {error && (
          <div className="alert alert-error mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-5 w-5" fill="none" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm">{error}</span>
          </div>
        )}

        {/* Task list */}
        <div className="mb-6">
          <h4 className="text-sm font-semibold mb-3" style={{ color: 'var(--color-text-secondary)' }}>
            Tasks to duplicate
          </h4>
          <div
            className="rounded-lg border overflow-hidden max-h-56 overflow-y-auto"
            style={{
              backgroundColor: 'var(--color-bg-tertiary)',
              borderColor: 'var(--color-border-default)'
            }}
          >
            {includedTasks.length > 0 ? (
              <div className="divide-y" style={{ borderColor: 'var(--color-border-light)' }}>
                {includedTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between p-3 hover:bg-indigo-500/5 transition-colors"
                  >
                    <div className="flex-1 min-w-0 mr-3">
                      <p
                        className="text-sm font-medium truncate"
                        style={{ color: 'var(--color-text-primary)' }}
                        title={task.title}
                      >
                        {task.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className={`px-1.5 py-0.5 rounded text-xs font-medium uppercase ${getPriorityColor(task.priority)}`}>
                          {task.priority}
                        </span>
                        <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                          {getAssigneeName(task)}
                        </span>
                        {task.dueDate && (
                          <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                            &middot; {formatDate(task.dueDate)}
                          </span>
                        )}
                        {task.subtasks && task.subtasks.length > 0 && (
                          <span className="text-xs px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400">
                            {task.subtasks.length} subtask{task.subtasks.length !== 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                    </div>
                    {includedTasks.length > 1 && (
                      <button
                        onClick={() => handleRemoveTask(task.id)}
                        className="p-1.5 rounded-lg hover:bg-red-500/20 transition-colors flex-shrink-0"
                        style={{ color: 'var(--color-text-tertiary)' }}
                        title="Remove from duplication"
                      >
                        <FaTrash className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center">
                <p className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
                  No tasks to duplicate. Close and select tasks again.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Options */}
        <div className="space-y-5 mb-6">
          <h4 className="text-sm font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
            Duplication options
          </h4>

          {/* Assignees */}
          <div>
            <label className="text-xs font-medium mb-2 block" style={{ color: 'var(--color-text-tertiary)' }}>
              Assignees
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setClearAssignees(true)}
                className={`px-3 py-2 rounded-lg text-sm font-medium border transition-all ${
                  clearAssignees
                    ? 'border-indigo-500 bg-indigo-500/20 text-indigo-400'
                    : 'hover:bg-indigo-500/5'
                }`}
                style={clearAssignees ? {} : {
                  borderColor: 'var(--color-border-default)',
                  color: 'var(--color-text-secondary)'
                }}
              >
                Clear assignees
              </button>
              <button
                type="button"
                onClick={() => setClearAssignees(false)}
                className={`px-3 py-2 rounded-lg text-sm font-medium border transition-all ${
                  !clearAssignees
                    ? 'border-indigo-500 bg-indigo-500/20 text-indigo-400'
                    : 'hover:bg-indigo-500/5'
                }`}
                style={!clearAssignees ? {} : {
                  borderColor: 'var(--color-border-default)',
                  color: 'var(--color-text-secondary)'
                }}
              >
                Keep assignees
              </button>
            </div>
          </div>

          {/* Due dates */}
          <div>
            <label className="text-xs font-medium mb-2 block" style={{ color: 'var(--color-text-tertiary)' }}>
              Due dates
            </label>
            <div className="flex gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => setDueDateMode('keep')}
                className={`px-3 py-2 rounded-lg text-sm font-medium border transition-all ${
                  dueDateMode === 'keep'
                    ? 'border-indigo-500 bg-indigo-500/20 text-indigo-400'
                    : 'hover:bg-indigo-500/5'
                }`}
                style={dueDateMode === 'keep' ? {} : {
                  borderColor: 'var(--color-border-default)',
                  color: 'var(--color-text-secondary)'
                }}
              >
                Keep dates
              </button>
              <button
                type="button"
                onClick={() => setDueDateMode('shift')}
                className={`px-3 py-2 rounded-lg text-sm font-medium border transition-all ${
                  dueDateMode === 'shift'
                    ? 'border-indigo-500 bg-indigo-500/20 text-indigo-400'
                    : 'hover:bg-indigo-500/5'
                }`}
                style={dueDateMode === 'shift' ? {} : {
                  borderColor: 'var(--color-border-default)',
                  color: 'var(--color-text-secondary)'
                }}
              >
                Shift by days
              </button>
              <button
                type="button"
                onClick={() => setDueDateMode('clear')}
                className={`px-3 py-2 rounded-lg text-sm font-medium border transition-all ${
                  dueDateMode === 'clear'
                    ? 'border-indigo-500 bg-indigo-500/20 text-indigo-400'
                    : 'hover:bg-indigo-500/5'
                }`}
                style={dueDateMode === 'clear' ? {} : {
                  borderColor: 'var(--color-border-default)',
                  color: 'var(--color-text-secondary)'
                }}
              >
                Clear dates
              </button>
            </div>

            {/* Shift days input */}
            {dueDateMode === 'shift' && (
              <div className="mt-3 flex items-center gap-2">
                <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                  Shift by
                </span>
                <input
                  type="number"
                  value={shiftDays}
                  onChange={(e) => setShiftDays(parseInt(e.target.value) || 0)}
                  className="input input-sm input-bordered w-20 text-center"
                  style={{
                    backgroundColor: 'var(--color-bg-tertiary)',
                    borderColor: 'var(--color-border-default)',
                    color: 'var(--color-text-primary)'
                  }}
                  min={-365}
                  max={365}
                />
                <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                  day{shiftDays !== 1 && shiftDays !== -1 ? 's' : ''}
                </span>
                <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                  (negative = earlier)
                </span>
              </div>
            )}
          </div>

          {/* Subtasks */}
          {hasSubtasks && (
            <div>
              <label className="flex items-center cursor-pointer space-x-3">
                <input
                  type="checkbox"
                  checked={includeSubtasks}
                  onChange={(e) => setIncludeSubtasks(e.target.checked)}
                  className="checkbox checkbox-primary checkbox-sm"
                />
                <div>
                  <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                    Include subtasks
                  </span>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-tertiary)' }}>
                    Also duplicate any subtasks attached to the selected tasks
                  </p>
                </div>
              </label>
            </div>
          )}
        </div>

        {/* Summary info box */}
        <div
          className="p-4 rounded-lg mb-6"
          style={{
            backgroundColor: 'var(--color-bg-tertiary)',
            borderLeft: '4px solid var(--color-primary)'
          }}
        >
          <p className="text-sm font-medium mb-1" style={{ color: 'var(--color-text-primary)' }}>
            Summary
          </p>
          <ul className="text-xs space-y-0.5" style={{ color: 'var(--color-text-secondary)' }}>
            <li>&bull; {includedTasks.length} task{includedTasks.length !== 1 ? 's' : ''} will be duplicated as drafts</li>
            <li>&bull; Assignees: {clearAssignees ? 'Cleared (re-assign after)' : 'Kept from originals'}</li>
            <li>
              &bull; Due dates: {
                dueDateMode === 'keep' ? 'Kept from originals' :
                dueDateMode === 'shift' ? `Shifted by ${shiftDays} day${shiftDays !== 1 && shiftDays !== -1 ? 's' : ''}` :
                'Cleared'
              }
            </li>
            {hasSubtasks && (
              <li>&bull; Subtasks: {includeSubtasks ? 'Included' : 'Not included'}</li>
            )}
          </ul>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2">
          <IconButton
            type="button"
            onClick={onClose}
            disabled={isDuplicating}
            icon={<FaTimes />}
            label="Cancel"
            variant="ghost"
            size="sm"
          />
          <IconButton
            type="button"
            onClick={handleDuplicate}
            disabled={isDuplicating || includedTasks.length === 0}
            loading={isDuplicating}
            icon={<FaCopy />}
            label={isDuplicating ? 'Duplicating...' : `Duplicate ${includedTasks.length} Task${includedTasks.length !== 1 ? 's' : ''}`}
            variant="primary"
            size="sm"
            className="!bg-indigo-600 hover:!bg-indigo-700"
          />
        </div>
      </div>
      <div className="modal-backdrop"></div>
    </div>
  );
};

export default DuplicateTasksModal;
