import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  readClipboardForQuickAction,
  quickActionCreateTask,
  quickActionAddUpdate,
  quickActionAddSubtask,
  quickActionSuggestProjectIdeas,
  quickActionCreateProjectFromIdea,
} from '../../services/aiQuickActions';
import { FaPlus, FaEdit, FaLayerGroup, FaChevronDown, FaProjectDiagram, FaTimes } from 'react-icons/fa';
import ProjectIdeaSelectionModal from '../projects/ProjectIdeaSelectionModal';
import IconButton from '../common/IconButton';
import { tialzFavicon } from '../../hooks/useThemeLogo';

const QuickActionsDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [isProjectIdeasModalOpen, setIsProjectIdeasModalOpen] = useState(false);
  const [projectIdeas, setProjectIdeas] = useState([]);
  const [isLoadingIdeas, setIsLoadingIdeas] = useState(false);
  const [clipboardText, setClipboardText] = useState('');
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleCreateTask = async () => {
    setIsOpen(false);
    setIsProcessing(true);
    setError(null);

    try {
      const inputText = await readClipboardForQuickAction();
      await quickActionCreateTask(inputText, navigate);
    } catch (err) {
      console.error('Create task error:', err);
      setError(err.message || 'Failed to create task');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpdateTask = async () => {
    setIsOpen(false);
    setIsProcessing(true);
    setError(null);

    try {
      const inputText = await readClipboardForQuickAction();
      await quickActionAddUpdate(inputText, navigate);
    } catch (err) {
      console.error('Update task error:', err);
      setError(err.message || 'Failed to update task');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCreateProject = async () => {
    setIsOpen(false);
    setIsProcessing(true);
    setError(null);

    try {
      const inputText = await readClipboardForQuickAction();
      setClipboardText(inputText);
      setIsLoadingIdeas(true);
      setIsProjectIdeasModalOpen(true);
      setIsProcessing(false);

      const { ideas } = await quickActionSuggestProjectIdeas(inputText);
      setProjectIdeas(ideas);
    } catch (err) {
      console.error('Create project error:', err);
      setError(err.message || 'Failed to get project ideas');
      setIsProjectIdeasModalOpen(false);
      setIsProcessing(false);
    } finally {
      setIsLoadingIdeas(false);
    }
  };

  const handleProjectIdeaSelect = async (selectedIdea) => {
    setIsProjectIdeasModalOpen(false);
    setIsProcessing(true);
    setError(null);

    try {
      await quickActionCreateProjectFromIdea(clipboardText, selectedIdea, navigate);
    } catch (err) {
      console.error('Create project from idea error:', err);
      console.error('Response data:', err.response?.data);
      console.error('Response status:', err.response?.status);
      const errorMessage =
        err.response?.data?.error || err.response?.data?.message || err.message || 'Failed to create project';
      console.error('Error message:', errorMessage);
      setError(errorMessage);
      setIsProjectIdeasModalOpen(true);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAddSubtask = async () => {
    setIsOpen(false);
    setIsProcessing(true);
    setError(null);

    try {
      const inputText = await readClipboardForQuickAction();
      await quickActionAddSubtask(inputText, navigate);
    } catch (err) {
      console.error('Add subtask error:', err);
      setError(err.message || 'Failed to add subtask');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isProcessing}
        className="px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 flex items-center space-x-2 flex-shrink-0 whitespace-nowrap"
        style={{
          backgroundColor: 'var(--color-primary)',
          color: 'white',
        }}
        onMouseEnter={(e) => {
          if (!isProcessing) e.currentTarget.style.filter = 'brightness(0.9)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.filter = 'brightness(1)';
        }}
      >
        {isProcessing ? (
          <>
            <span className="loading loading-spinner loading-sm"></span>
            <span>Processing...</span>
          </>
        ) : (
          <>
            <img
              src={tialzFavicon}
              alt=""
              className="object-contain"
              style={{
                height: '24px',
                width: '24px',
              }}
            />
            <span>AI Actions</span>
            <FaChevronDown className={`w-3 h-3 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
          </>
        )}
      </button>

      {isOpen && !isProcessing && (
        <div
          className="absolute right-0 mt-2 w-56 rounded-lg shadow-lg border z-50 transition-all duration-200 animate-[slideDown_0.2s_ease-out]"
          style={{
            backgroundColor: 'var(--color-bg-secondary)',
            borderColor: 'var(--color-border-default)',
          }}
        >
          <div className="py-1">
            <button
              onClick={handleCreateTask}
              className="w-full px-4 py-3 text-left flex items-center space-x-3 transition-colors duration-200"
              style={{ color: 'var(--color-text-primary)' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--color-bg-tertiary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <FaPlus className="w-4 h-4 text-green-500" />
              <div>
                <div className="font-medium">Create Task</div>
                <div className="text-xs transition-colors duration-200" style={{ color: 'var(--color-text-tertiary)' }}>
                  From clipboard content
                </div>
              </div>
            </button>

            <button
              onClick={handleUpdateTask}
              className="w-full px-4 py-3 text-left flex items-center space-x-3 transition-colors duration-200"
              style={{ color: 'var(--color-text-primary)' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--color-bg-tertiary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <FaEdit className="w-4 h-4 text-blue-500" />
              <div>
                <div className="font-medium">Add Update</div>
                <div className="text-xs transition-colors duration-200" style={{ color: 'var(--color-text-tertiary)' }}>
                  Add update to existing task
                </div>
              </div>
            </button>

            <button
              onClick={handleAddSubtask}
              className="w-full px-4 py-3 text-left flex items-center space-x-3 transition-colors duration-200"
              style={{ color: 'var(--color-text-primary)' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--color-bg-tertiary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <FaLayerGroup className="w-4 h-4 text-purple-500" />
              <div>
                <div className="font-medium">Add Subtask</div>
                <div className="text-xs transition-colors duration-200" style={{ color: 'var(--color-text-tertiary)' }}>
                  Create subtask for parent
                </div>
              </div>
            </button>

            <button
              onClick={handleCreateProject}
              className="w-full px-4 py-3 text-left flex items-center space-x-3 transition-colors duration-200"
              style={{ color: 'var(--color-text-primary)' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--color-bg-tertiary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <FaProjectDiagram className="w-4 h-4 text-orange-500" />
              <div>
                <div className="font-medium">Create Project</div>
                <div className="text-xs transition-colors duration-200" style={{ color: 'var(--color-text-tertiary)' }}>
                  Create project or event
                </div>
              </div>
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="fixed bottom-4 right-4 z-50 max-w-md">
          <div className="alert alert-error shadow-lg">
            <div>
              <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current flex-shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
            <IconButton
              onClick={() => setError(null)}
              icon={<FaTimes />}
              label="Close"
              iconOnly={true}
              variant="ghost"
              size="sm"
            />
          </div>
        </div>
      )}

      <ProjectIdeaSelectionModal
        isOpen={isProjectIdeasModalOpen}
        onClose={() => {
          setIsProjectIdeasModalOpen(false);
          setProjectIdeas([]);
          setClipboardText('');
        }}
        ideas={projectIdeas}
        onSelect={handleProjectIdeaSelect}
        isLoading={isLoadingIdeas}
      />
    </div>
  );
};

export default QuickActionsDropdown;
