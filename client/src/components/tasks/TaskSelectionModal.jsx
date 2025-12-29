import { useState, useEffect } from 'react';
import { tasksAPI } from '../../services/api';
import SearchableDropdown from '../common/SearchableDropdown';
import IconButton from '../common/IconButton';
import { STATUS_LABELS } from '../../utils/constants';
import { FaTimes, FaCheck } from 'react-icons/fa';

const TaskSelectionModal = ({ isOpen, onClose, onSelectTask, updateContent = '', suggestedTaskId = null }) => {
  const [tasks, setTasks] = useState([]);
  const [isLoadingTasks, setIsLoadingTasks] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState('');
  const [isSelecting, setIsSelecting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchTasks();
      // Reset selection when modal opens (will be set after tasks load if suggestedTaskId exists)
      if (!suggestedTaskId) {
        setSelectedTaskId('');
      }
    }
  }, [isOpen, suggestedTaskId]);

  const fetchTasks = async () => {
    setIsLoadingTasks(true);
    try {
      const response = await tasksAPI.getAll();
      // Only show TODO and IN_PROGRESS tasks
      const activeTasks = response.data.filter(task => 
        task.status === 'TODO' || task.status === 'IN_PROGRESS'
      );
      setTasks(activeTasks);
      
      // Set suggested task after tasks are loaded
      if (suggestedTaskId) {
        const suggestedTask = liveTasks.find(t => t.id.toString() === suggestedTaskId.toString());
        if (suggestedTask) {
          setSelectedTaskId(suggestedTaskId.toString());
        }
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setIsLoadingTasks(false);
    }
  };

  const handleSelect = async () => {
    if (!selectedTaskId) return;

    setIsSelecting(true);
    try {
      const selectedTask = tasks.find(t => t.id.toString() === selectedTaskId);
      if (selectedTask && onSelectTask) {
        await onSelectTask(selectedTask);
        setSelectedTaskId('');
        onClose();
      }
    } catch (error) {
      console.error('Error selecting task:', error);
    } finally {
      setIsSelecting(false);
    }
  };

  if (!isOpen) return null;

  const taskOptions = tasks.map(task => ({
    id: task.id.toString(),
    name: task.status && STATUS_LABELS[task.status] 
      ? `${task.title} (${STATUS_LABELS[task.status]})` 
      : task.title,
    value: task.id.toString()
  }));

  return (
    <div className="modal modal-open backdrop-blur-sm" onClick={onClose}>
      <div 
        className="modal-box max-w-2xl w-full border transition-all duration-300 animate-fadeIn"
        style={{
          backgroundColor: 'var(--color-bg-secondary)',
          borderColor: 'var(--color-border-default)',
          minHeight: '500px',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 
              className="text-2xl font-bold transition-colors duration-200"
              style={{ color: 'var(--color-text-primary)' }}
            >
              Select Task to Update
            </h3>
            <p 
              className="text-sm mt-1 transition-colors duration-200"
              style={{ color: 'var(--color-text-tertiary)' }}
            >
              {suggestedTaskId 
                ? 'AI found a matching task (pre-selected). You can change it if needed.'
                : 'AI couldn\'t find a matching task. Please select the task you want to update.'}
            </p>
          </div>
          <IconButton
            icon={<FaTimes />}
            label="Close"
            iconOnly={true}
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="!p-2 !rounded-full"
          />
        </div>

        {/* Content */}
        <div className="space-y-6 py-4">
          <div>
            <label 
              className="block text-base font-medium mb-3 transition-colors duration-200"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              Select Task
              {suggestedTaskId && selectedTaskId === suggestedTaskId.toString() && (
                <span 
                  className="ml-2 text-xs px-2 py-1 rounded"
                  style={{ 
                    backgroundColor: 'rgba(99, 102, 241, 0.2)',
                    color: 'var(--color-primary)'
                  }}
                >
                  AI Suggested
                </span>
              )}
            </label>
            <div className="min-h-[300px]">
              <SearchableDropdown
                options={taskOptions}
                value={selectedTaskId}
                onChange={setSelectedTaskId}
                placeholder="Search for a task..."
                disabled={isLoadingTasks}
              />
            </div>
            {tasks.length === 0 && !isLoadingTasks && (
              <p 
                className="text-sm mt-4 transition-colors duration-200"
                style={{ color: 'var(--color-text-tertiary)' }}
              >
                No tasks available
              </p>
            )}
          </div>

          {/* Preview of update content */}
          {updateContent && (
            <div className="mt-4 p-3 rounded-lg"
              style={{
                backgroundColor: 'var(--color-bg-tertiary)',
                borderColor: 'var(--color-border-default)',
              }}
            >
              <p 
                className="text-xs font-medium mb-1 transition-colors duration-200"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                Update Content:
              </p>
              <p 
                className="text-sm transition-colors duration-200"
                style={{ color: 'var(--color-text-primary)' }}
              >
                {updateContent.substring(0, 200)}{updateContent.length > 200 ? '...' : ''}
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="modal-action">
          <IconButton
            icon={<FaTimes />}
            label="Cancel"
            variant="ghost"
            onClick={onClose}
            disabled={isSelecting}
          />
          <IconButton
            icon={<FaCheck />}
            label={isSelecting ? 'Selecting...' : 'Select Task'}
            variant="primary"
            onClick={handleSelect}
            disabled={!selectedTaskId || isSelecting}
            loading={isSelecting}
          />
        </div>
      </div>
    </div>
  );
};

export default TaskSelectionModal;

