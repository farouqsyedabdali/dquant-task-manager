import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { aiAPI } from '../../services/api';
import { FaPlus, FaEdit, FaLayerGroup, FaChevronDown, FaProjectDiagram, FaTimes } from 'react-icons/fa';
import ProjectIdeaSelectionModal from '../projects/ProjectIdeaSelectionModal';
import IconButton from '../common/IconButton';

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

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Auto-clear error after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const readClipboard = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text && text.trim().length > 0) {
          return text.trim();
        }
      }
      throw new Error('Clipboard is empty or access denied');
    } catch (err) {
      throw new Error('Could not read clipboard. Please copy some text first.');
    }
  };

  const handleCreateTask = async () => {
    setIsOpen(false);
    setIsProcessing(true);
    setError(null);

    try {
      const inputText = await readClipboard();

      // Call AI to extract task data
      const response = await aiAPI.extractTask(inputText);
      
      let taskData = null;
      if (response.data.success && response.data.taskData) {
        taskData = response.data.taskData;
        console.log('QuickActions: AI successfully extracted task data:', taskData);
      } else {
        console.log('QuickActions: AI failed to extract task data, using fallback');
        taskData = {
          title: inputText.substring(0, 50),
          description: inputText.substring(0, 300),
          priority: 'MEDIUM',
          dueDate: null,
          assignee: null
        };
      }
      
      // Store task data in localStorage
      const popupData = {
        type: 'create',
        taskData: taskData,
        originalText: inputText,
        timestamp: Date.now()
      };
      
      const storageKey = `taskPopup_${Date.now()}`;
      localStorage.setItem(storageKey, JSON.stringify(popupData));
      
      console.log('QuickActions: Stored data in localStorage with key:', storageKey);
      
      // Navigate to dashboard with the storage key
      navigate(`/dashboard?popupData=${storageKey}`);
      
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
      const inputText = await readClipboard();

      // Call AI to identify task update
      const response = await aiAPI.identifyTaskUpdate(inputText);
      
      let updateData = null;
      if (response.data.success && response.data.updateData) {
        updateData = response.data.updateData;
        console.log('QuickActions: AI successfully identified task update:', updateData);
      } else {
        console.log('QuickActions: AI failed to identify task update, using fallback');
        updateData = {
          taskFound: false,
          taskId: null,
          confidence: 0,
          updateType: 'manual_update',
          updateContent: inputText.substring(0, 500),
          suggestedActions: ['manual_task_selection'],
          reasoning: 'AI could not identify specific task - manual selection required',
          originalText: inputText
        };
      }
      
      // Store update data in localStorage
      const popupData = {
        type: 'update',
        updateData: updateData,
        originalText: inputText,
        timestamp: Date.now()
      };
      
      const storageKey = `taskPopup_${Date.now()}`;
      localStorage.setItem(storageKey, JSON.stringify(popupData));
      
      console.log('QuickActions: Stored update data in localStorage with key:', storageKey);
      
      // Navigate to dashboard with the storage key
      navigate(`/dashboard?popupData=${storageKey}`);
      
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
      const inputText = await readClipboard();
      setClipboardText(inputText);
      setIsLoadingIdeas(true);
      setIsProjectIdeasModalOpen(true);
      setIsProcessing(false);

      // Call AI to suggest project ideas
      const response = await aiAPI.suggestProjectIdeas(inputText);
      
      if (response.data.success && response.data.ideas) {
        setProjectIdeas(response.data.ideas);
        console.log('QuickActions: AI suggested project ideas:', response.data.ideas);
      } else {
        throw new Error('Failed to get project ideas');
      }
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
      // Call AI to create project from idea
      const response = await aiAPI.createProjectFromIdea(
        clipboardText,
        selectedIdea,
        null, // projectName - let AI generate it
        null  // dueDate - let AI extract it
      );

      if (response.data.success && response.data.project) {
        const project = response.data.project;
        console.log('QuickActions: Project created successfully:', project);
        
        // Navigate to projects page with project ID and success message
        navigate('/projects', {
          state: {
            openProjectId: project.id,
            successMessage: `Project "${project.name}" created successfully with ${project.tasks?.length || 0} tasks!`
          }
        });
      } else {
        throw new Error('Failed to create project');
      }
    } catch (err) {
      console.error('Create project from idea error:', err);
      setError(err.message || 'Failed to create project');
      setIsProjectIdeasModalOpen(true); // Reopen modal so user can try again
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAddSubtask = async () => {
    setIsOpen(false);
    setIsProcessing(true);
    setError(null);

    try {
      const inputText = await readClipboard();

      // 1. Find the relevant parent task
      const identifyRes = await aiAPI.identifyTaskUpdate(inputText);
      let updateData = null;
      let subtaskData = null;
      
      if (identifyRes.data.success && identifyRes.data.updateData) {
        updateData = identifyRes.data.updateData;
        console.log('QuickActions: AI successfully identified parent task for subtask:', updateData);
      } else {
        console.log('QuickActions: AI failed to identify parent task, using fallback');
        updateData = {
          taskFound: false,
          taskId: null,
          confidence: 0,
          updateType: 'manual_subtask',
          updateContent: 'Manual subtask creation',
          suggestedActions: ['manual_parent_selection'],
          reasoning: 'AI could not identify parent task - manual selection required',
          originalText: inputText
        };
      }
      
      // 2. Use AI to interpret the subtask details
      try {
        const extractRes = await aiAPI.extractTask(inputText);
        if (extractRes.data.success && extractRes.data.taskData) {
          subtaskData = extractRes.data.taskData;
          console.log('QuickActions: AI successfully extracted subtask data:', subtaskData);
        } else {
          throw new Error('AI extraction failed');
        }
      } catch (extractErr) {
        console.log('QuickActions: AI failed to extract subtask data, using fallback:', extractErr);
        subtaskData = {
          title: inputText.substring(0, 50),
          description: inputText.substring(0, 300),
          priority: 'MEDIUM',
          dueDate: null,
          assignee: null
        };
      }

      // 3. Store subtask data in localStorage
      const popupData = {
        type: 'addSubtask',
        updateData: {
          ...updateData,
          subtaskData
        },
        originalText: inputText,
        timestamp: Date.now()
      };
      
      const storageKey = `taskPopup_${Date.now()}`;
      localStorage.setItem(storageKey, JSON.stringify(popupData));
      
      console.log('QuickActions: Stored subtask data in localStorage with key:', storageKey);
      
      // Navigate to dashboard with the storage key
      navigate(`/dashboard?popupData=${storageKey}`);
      
    } catch (err) {
      console.error('Add subtask error:', err);
      setError(err.message || 'Failed to add subtask');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Dropdown Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isProcessing}
        className="px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 flex items-center space-x-2"
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
            <FaLayerGroup className="w-4 h-4" />
            <span>AI Actions</span>
            <FaChevronDown className={`w-3 h-3 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
          </>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && !isProcessing && (
        <div
          className="absolute right-0 mt-2 w-56 rounded-lg shadow-lg border z-50 transition-all duration-200 animate-[slideDown_0.2s_ease-out]"
          style={{
            backgroundColor: 'var(--color-bg-secondary)',
            borderColor: 'var(--color-border-default)',
          }}
        >
          <div className="py-1">
            {/* Create Task */}
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
                <div 
                  className="text-xs transition-colors duration-200"
                  style={{ color: 'var(--color-text-tertiary)' }}
                >
                  From clipboard content
                </div>
              </div>
            </button>

            {/* Update Task */}
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
                <div 
                  className="text-xs transition-colors duration-200"
                  style={{ color: 'var(--color-text-tertiary)' }}
                >
                  Add update to existing task
                </div>
              </div>
            </button>

            {/* Add Subtask */}
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
                <div 
                  className="text-xs transition-colors duration-200"
                  style={{ color: 'var(--color-text-tertiary)' }}
                >
                  Create subtask for parent
                </div>
              </div>
            </button>

            {/* Create Project or Event */}
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
                <div 
                  className="text-xs transition-colors duration-200"
                  style={{ color: 'var(--color-text-tertiary)' }}
                >
                  Create project or event
                </div>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Error Toast */}
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

      {/* Project Ideas Selection Modal */}
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

