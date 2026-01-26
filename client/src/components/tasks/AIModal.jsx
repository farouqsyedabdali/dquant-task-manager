import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { aiAPI } from '../../services/api';
import { FaRobot, FaTimes, FaPlus, FaEdit, FaLayerGroup, FaProjectDiagram } from 'react-icons/fa';
import useAuthStore from '../../context/authStore';
import ProjectIdeaSelectionModal from '../projects/ProjectIdeaSelectionModal';
import IconButton from '../common/IconButton';
import tialzLogo from '../../assets/TIALZ Logo (No Background).png';
import AIWarning from '../common/AIWarning';

const AIModal = ({ isOpen, onClose, onAction }) => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [messages, setMessages] = useState(() => {
    // Load conversation from localStorage or start with welcome message
    const saved = localStorage.getItem('aiConversation');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Check if it's the old message format and replace it
        if (parsed.length > 0 && parsed[0].role === 'assistant') {
          const oldMessage = parsed[0].content;
          // If it's the old welcome message, replace with new one
          if (oldMessage.includes("Hi") && oldMessage.includes("I'm your AI assistant")) {
            parsed[0].content = `Describe what's on your mind and press a button below. I'll assist you with the rest.`;
            return parsed;
          }
        }
        return parsed;
      } catch (e) {
        console.error('Failed to parse saved conversation:', e);
      }
    }
    return [
      {
        role: 'assistant',
        content: `Describe what's on your mind and press a button below. I'll assist you with the rest.`
      }
    ];
  });
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isProjectIdeasModalOpen, setIsProjectIdeasModalOpen] = useState(false);
  const [projectIdeas, setProjectIdeas] = useState([]);
  const [isLoadingIdeas, setIsLoadingIdeas] = useState(false);
  const [clipboardText, setClipboardText] = useState('');
  const messagesEndRef = useRef(null);

  // Save conversation to localStorage whenever it changes
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('aiConversation', JSON.stringify(messages));
    }
  }, [messages]);

  useEffect(() => {
    if (isOpen && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleCreateTask = async () => {
    if (!input.trim()) {
      setError('Please describe what you want to create');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const inputText = input.trim();

      // Call AI to extract task data
      const response = await aiAPI.extractTask(inputText);

      let taskData = null;
      if (response.data.success && response.data.taskData) {
        taskData = response.data.taskData;
      } else {
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

      // Navigate to dashboard with the storage key
      setInput('');
      if (onAction) onAction();
      navigate(`/dashboard?popupData=${storageKey}`);
      onClose();
    } catch (err) {
      console.error('Create task error:', err);
      setError(err.message || 'Failed to create task');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpdateTask = async () => {
    if (!input.trim()) {
      setError('Please describe the update you want to make');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const inputText = input.trim();

      // Call AI to identify task update
      const response = await aiAPI.identifyTaskUpdate(inputText);

      let updateData = null;
      if (response.data.success && response.data.updateData) {
        updateData = response.data.updateData;
      } else {
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

      // Navigate to dashboard with the storage key
      setInput('');
      if (onAction) onAction();
      navigate(`/dashboard?popupData=${storageKey}`);
      onClose();
    } catch (err) {
      console.error('Update task error:', err);
      setError(err.message || 'Failed to update task');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCreateProject = async () => {
    if (!input.trim()) {
      setError('Please describe the project or event you want to create');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const inputText = input.trim();
      setClipboardText(inputText);
      setIsLoadingIdeas(true);
      setIsProjectIdeasModalOpen(true);
      setIsProcessing(false);

      // Call AI to suggest project ideas
      const response = await aiAPI.suggestProjectIdeas(inputText);

      if (response.data.success && response.data.ideas) {
        setProjectIdeas(response.data.ideas);
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

        // Navigate to projects page with project ID and success message
        setInput('');
        if (onAction) onAction();

        // If already on projects page, use replace: false to ensure state update triggers
        const isOnProjectsPage = location.pathname === '/projects';
        navigate('/projects', {
          state: {
            openProjectId: project.id,
            successMessage: `Project "${project.name}" created successfully with ${project.tasks?.length || 0} tasks!`,
            timestamp: Date.now() // Add timestamp to force state update
          },
          replace: false // Always use replace: false to ensure state is updated
        });
        onClose();
      } else {
        throw new Error('Failed to create project');
      }
    } catch (err) {
      console.error('Create project from idea error:', err);
      const errorMessage = err.response?.data?.error || err.response?.data?.message || err.message || 'Failed to create project';
      setError(errorMessage);
      setIsProjectIdeasModalOpen(true); // Reopen modal so user can try again
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAddSubtask = async () => {
    if (!input.trim()) {
      setError('Please describe the subtask you want to create');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const inputText = input.trim();

      // 1. Find the relevant parent task
      const identifyRes = await aiAPI.identifyTaskUpdate(inputText);
      let updateData = null;
      let subtaskData = null;

      if (identifyRes.data.success && identifyRes.data.updateData) {
        updateData = identifyRes.data.updateData;
      } else {
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
        } else {
          throw new Error('AI extraction failed');
        }
      } catch (extractErr) {
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

      // Navigate to dashboard with the storage key
      setInput('');
      if (onAction) onAction();
      navigate(`/dashboard?popupData=${storageKey}`);
      onClose();
    } catch (err) {
      console.error('Add subtask error:', err);
      setError(err.message || 'Failed to add subtask');
    } finally {
      setIsProcessing(false);
    }
  };

  const clearConversation = () => {
    setMessages([
      {
        role: 'assistant',
        content: `Describe what's on your mind and press a button below. I'll assist you with the rest.`
      }
    ]);
    localStorage.removeItem('aiConversation');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-200 opacity-100" />

      {/* Animated container */}
      <div className="absolute inset-0 flex items-end sm:items-center justify-center">
        <div className="w-full h-[calc(70vh+12px)] sm:h-[calc(60vh+12px)] sm:max-w-3xl transform transition-all duration-300 ease-out animate-[aimodal-enter_300ms_ease-out]">
          <style>{`@keyframes aimodal-enter{0%{opacity:0;transform:translateY(24px) scale(0.98)}100%{opacity:1;transform:translateY(0) scale(1)}}`}</style>
          <div
            className="border rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col h-full transition-colors duration-200 overflow-hidden"
            style={{
              backgroundColor: 'var(--color-bg-secondary)',
              borderColor: 'var(--color-border-default)',
            }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-6 py-4 border-b transition-colors duration-200"
              style={{ borderColor: 'var(--color-border-default)' }}
            >
              <div className="flex items-center space-x-2">
                <img src={tialzLogo} alt="TIALZ" className="w-8 h-8 object-contain" />
                <div>
                  <span
                    className="text-lg font-semibold transition-colors duration-200"
                    style={{ color: 'var(--color-text-primary)' }}
                  >
                    AI Assistant
                  </span>
                  <div
                    className="text-xs transition-colors duration-200"
                    style={{ color: 'var(--color-text-tertiary)' }}
                  >
                    {user?.name} ({user?.role})
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={onClose}
                  className="transition-colors duration-200"
                  style={{ color: 'var(--color-text-tertiary)' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = 'var(--color-text-primary)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = 'var(--color-text-tertiary)';
                  }}
                >
                  <FaTimes size={20} />
                </button>
              </div>
            </div>
            {/* Conversation */}
            <div
              className="flex-1 overflow-y-auto px-6 py-3 space-y-4 transition-colors duration-200"
              style={{
                minHeight: 300,
                backgroundColor: 'var(--color-bg-tertiary)',
              }}
            >
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`rounded-xl px-4 py-2 max-w-[80%] text-sm ${msg.role === 'user' ? 'bg-indigo-600 text-white' : ''}`}
                    style={msg.role === 'assistant' ? {
                      backgroundColor: 'var(--color-bg-secondary)',
                      color: 'var(--color-text-primary)',
                      border: '1px solid var(--color-border-default)',
                    } : {}}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />

              {/* Input Box - Close to first message */}
              <div className="mt-4 mb-2">
                <textarea
                  className="w-full resize-none rounded-lg px-3 py-3 focus:outline-none transition-colors duration-200"
                  style={{
                    backgroundColor: 'var(--color-bg-secondary)',
                    color: 'var(--color-text-primary)',
                    borderColor: 'var(--color-border-default)',
                    border: '1px solid',
                    minHeight: 180,
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = 'var(--color-primary)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = 'var(--color-border-default)';
                  }}
                  rows={8}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder="Describe what you want to create or update..."
                  disabled={isProcessing}
                  maxLength={500}
                />

                {/* AI Action Buttons - Single Line */}
                <div className="flex flex-wrap gap-2 mt-3 justify-center">
                  <IconButton
                    icon={<FaPlus />}
                    label="Create Task"
                    variant="success"
                    size="sm"
                    onClick={handleCreateTask}
                    disabled={isProcessing}
                    loading={isProcessing}
                  />
                  <IconButton
                    icon={<FaEdit />}
                    label="Add Update"
                    variant="primary"
                    size="sm"
                    onClick={handleUpdateTask}
                    disabled={isProcessing}
                    loading={isProcessing}
                  />
                  <IconButton
                    icon={<FaLayerGroup />}
                    label="Add Subtask"
                    variant="warning"
                    size="sm"
                    onClick={handleAddSubtask}
                    disabled={isProcessing}
                    loading={isProcessing}
                  />
                  <IconButton
                    icon={<FaProjectDiagram />}
                    label="Create Project"
                    variant="danger"
                    size="sm"
                    onClick={handleCreateProject}
                    disabled={isProcessing}
                    loading={isProcessing}
                  />
                </div>
                <AIWarning className="mt-4" />
              </div>
            </div>
            {/* Error */}
            {error && <div className="text-red-400 text-sm px-6 pb-2">{error}</div>}
          </div>
        </div>
      </div>

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

export default AIModal; 