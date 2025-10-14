import { useState, useEffect } from 'react';
import useAuthStore from '../context/authStore';
import { aiAPI } from '../services/api';

const TaskPopup = () => {
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastResult, setLastResult] = useState(null);
  const [error, setError] = useState(null);

  
  const { user, isAuthenticated, getMe } = useAuthStore();

  useEffect(() => {
    // Check authentication when popup loads
    if (isAuthenticated()) {
      getMe();
    }
  }, [getMe, isAuthenticated]);

  // Auto-paste clipboard content on load (if available)
  useEffect(() => {
    const autoFillFromClipboard = async () => {
      try {
        if (navigator.clipboard && navigator.clipboard.readText) {
          const clipboardText = await navigator.clipboard.readText();
          if (clipboardText && clipboardText.trim().length > 0) {
            setInputText(clipboardText.trim());
          }
        }
      } catch {
        // Clipboard access not available or denied
        console.log('Clipboard access not available');
      }
    };

    autoFillFromClipboard();
    
    // Clean up old localStorage entries (older than 1 hour)
    const cleanupOldEntries = () => {
      const oneHourAgo = Date.now() - (60 * 60 * 1000);
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('taskPopup_')) {
          try {
            const data = JSON.parse(localStorage.getItem(key));
            if (data.timestamp && data.timestamp < oneHourAgo) {
              localStorage.removeItem(key);
            }
          } catch {
            // Remove invalid entries
            localStorage.removeItem(key);
          }
        }
      });
    };
    
    cleanupOldEntries();
  }, []);



  const handleCreateTask = async () => {
    if (!inputText.trim()) {
      setError('Please enter some text');
      return;
    }

    if (!isAuthenticated()) {
      setError('Please login to your task manager first');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const response = await aiAPI.extractTask(inputText.trim());
      
      let taskData = null;
      if (response.data.success && response.data.taskData) {
        taskData = response.data.taskData;
        console.log('TaskPopup: AI successfully extracted task data:', taskData);
      } else {
        console.log('TaskPopup: AI failed to extract task data, using fallback');
        taskData = {
          title: inputText.trim().substring(0, 50),
          description: inputText.trim().substring(0, 300),
          priority: 'MEDIUM',
          dueDate: null,
          assignee: null
        };
      }
      
      // Always store task data and open modal
      const popupData = {
        type: 'create',
        taskData: taskData,
        originalText: inputText,
        timestamp: Date.now()
      };
      
      // Store in localStorage with a unique key
      const storageKey = `taskPopup_${Date.now()}`;
      localStorage.setItem(storageKey, JSON.stringify(popupData));
      
      console.log('TaskPopup: Stored data in localStorage with key:', storageKey);
      console.log('TaskPopup: Stored data:', popupData);
      
      // Open the main app with just the storage key
      const baseURL = window.location.origin;
      const url = `${baseURL}/dashboard?popupData=${storageKey}`;
      console.log('TaskPopup: Opening URL:', url);
      
      // Open in main window (reuse existing tab)
      const taskManagerWindow = window.open(url, 'TaskManagerMain');
      if (taskManagerWindow) {
        taskManagerWindow.focus();
      } else {
        // Fallback: if popup blocked, try to use postMessage
        console.log('TaskPopup: Popup blocked, trying postMessage fallback');
        try {
          // Try to communicate with existing window
          const baseURL = window.location.origin;
          const existingWindow = window.open(`${baseURL}/dashboard`, 'TaskManagerMain');
          if (existingWindow) {
            // Wait for window to load, then send message
            setTimeout(() => {
              existingWindow.postMessage({
                type: 'CREATE_TASK_FROM_POPUP',
                source: 'task-popup',
                taskData: taskData,
                originalText: inputText
              }, window.location.origin);
            }, 1000);
          }
        } catch (error) {
          console.error('TaskPopup: Fallback also failed:', error);
          setError('Failed to open task manager. Please try again.');
        }
      }
      
      setLastResult({
        type: 'create',
        success: true,
        title: taskData.title,
        description: taskData.description
      });
      
      // Clear input after successful creation
      setInputText('');
    } catch (err) {
      console.error('Create task error:', err);
      
      // Even if AI completely fails, still open the modal with basic data
      const fallbackTaskData = {
        title: inputText.trim().substring(0, 50),
        description: inputText.trim().substring(0, 300),
        priority: 'MEDIUM',
        dueDate: null,
        assignee: null
      };
      
      const popupData = {
        type: 'create',
        taskData: fallbackTaskData,
        originalText: inputText,
        timestamp: Date.now()
      };
      
      const storageKey = `taskPopup_${Date.now()}`;
      localStorage.setItem(storageKey, JSON.stringify(popupData));
      
      const baseURL = window.location.origin;
      const url = `${baseURL}/dashboard?popupData=${storageKey}`;
      const taskManagerWindow = window.open(url, 'TaskManagerMain');
      if (taskManagerWindow) {
        taskManagerWindow.focus();
      }
      
      setLastResult({
        type: 'create',
        success: true,
        title: fallbackTaskData.title,
        description: fallbackTaskData.description
      });
      
      setInputText('');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpdateTask = async () => {
    if (!inputText.trim()) {
      setError('Please enter some text');
      return;
    }

    if (!isAuthenticated()) {
      setError('Please login to your task manager first');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const response = await aiAPI.identifyTaskUpdate(inputText.trim());
      
      let updateData = null;
      if (response.data.success && response.data.updateData) {
        updateData = response.data.updateData;
        console.log('TaskPopup: AI successfully identified task update:', updateData);
      } else {
        console.log('TaskPopup: AI failed to identify task update, using fallback');
        updateData = {
          taskFound: false,
          taskId: null,
          confidence: 0,
          updateType: 'manual_update',
          updateContent: inputText.trim().substring(0, 500),
          suggestedActions: ['manual_task_selection'],
          reasoning: 'AI could not identify specific task - manual selection required',
          originalText: inputText
        };
      }
      
      // Always store update data and open modal (even if no task found)
      const popupData = {
        type: 'update',
        updateData: updateData,
        originalText: inputText,
        timestamp: Date.now()
      };
      
      // Store in localStorage with a unique key
      const storageKey = `taskPopup_${Date.now()}`;
      localStorage.setItem(storageKey, JSON.stringify(popupData));
      
      console.log('TaskPopup: Stored update data in localStorage with key:', storageKey);
      
      // Open the main app with just the storage key
      const baseURL = window.location.origin;
      const url = `${baseURL}/dashboard?popupData=${storageKey}`;
      console.log('TaskPopup: Opening update URL:', url);
      
      // Open in main window (reuse existing tab)
      const taskManagerWindow = window.open(url, 'TaskManagerMain');
      if (taskManagerWindow) {
        taskManagerWindow.focus();
      }
      
      setLastResult({
        type: 'update',
        success: true,
        taskId: updateData.taskId || 'Manual Selection',
        updateContent: updateData.updateContent,
        confidence: updateData.confidence
      });
      
      // Clear input after successful update
      setInputText('');
    } catch (err) {
      console.error('Update task error:', err);
      
      // Even if AI completely fails, still open the modal with basic data
      const fallbackUpdateData = {
        taskFound: false,
        taskId: null,
        confidence: 0,
        updateType: 'manual_update',
        updateContent: inputText.trim().substring(0, 500),
        suggestedActions: ['manual_task_selection'],
        reasoning: 'AI service error - manual selection required',
        originalText: inputText
      };
      
      const popupData = {
        type: 'update',
        updateData: fallbackUpdateData,
        originalText: inputText,
        timestamp: Date.now()
      };
      
      const storageKey = `taskPopup_${Date.now()}`;
      localStorage.setItem(storageKey, JSON.stringify(popupData));
      
      const baseURL = window.location.origin;
      const url = `${baseURL}/dashboard?popupData=${storageKey}`;
      const taskManagerWindow = window.open(url, 'TaskManagerMain');
      if (taskManagerWindow) {
        taskManagerWindow.focus();
      }
      
      setLastResult({
        type: 'update',
        success: true,
        taskId: 'Manual Selection',
        updateContent: fallbackUpdateData.updateContent,
        confidence: 0
      });
      
      setInputText('');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCompleteTask = async () => {
    if (!inputText.trim()) {
      setError('Please enter some text');
      return;
    }

    if (!isAuthenticated()) {
      setError('Please login to your task manager first');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const response = await aiAPI.identifyTaskUpdate(inputText.trim());
      
      let updateData = null;
      if (response.data.success && response.data.updateData) {
        updateData = response.data.updateData;
        console.log('TaskPopup: AI successfully identified task for completion:', updateData);
      } else {
        console.log('TaskPopup: AI failed to identify task for completion, using fallback');
        updateData = {
          taskFound: false,
          taskId: null,
          confidence: 0,
          updateType: 'manual_completion',
          updateContent: inputText.trim().substring(0, 500),
          suggestedActions: ['manual_task_selection'],
          reasoning: 'AI could not identify specific task - manual selection required',
          originalText: inputText
        };
      }
      
      // Always store complete task data and open modal (even if no task found)
      const popupData = {
        type: 'complete',
        updateData: updateData,
        originalText: inputText,
        timestamp: Date.now()
      };
      
      // Store in localStorage with a unique key
      const storageKey = `taskPopup_${Date.now()}`;
      localStorage.setItem(storageKey, JSON.stringify(popupData));
      
      console.log('TaskPopup: Stored complete task data in localStorage with key:', storageKey);
      
      // Open the main app with just the storage key
      const baseURL = window.location.origin;
      const url = `${baseURL}/dashboard?popupData=${storageKey}`;
      console.log('TaskPopup: Opening complete task URL:', url);
      
      // Open in main window (reuse existing tab)
      const taskManagerWindow = window.open(url, 'TaskManagerMain');
      if (taskManagerWindow) {
        taskManagerWindow.focus();
      }
      
      setLastResult({
        type: 'complete',
        success: true,
        taskId: updateData.taskId || 'Manual Selection',
        updateContent: updateData.updateContent,
        confidence: updateData.confidence
      });
      
      // Clear input after successful completion
      setInputText('');
    } catch (err) {
      console.error('Complete task error:', err);
      
      // Even if AI completely fails, still open the modal with basic data
      const fallbackUpdateData = {
        taskFound: false,
        taskId: null,
        confidence: 0,
        updateType: 'manual_completion',
        updateContent: inputText.trim().substring(0, 500),
        suggestedActions: ['manual_task_selection'],
        reasoning: 'AI service error - manual selection required',
        originalText: inputText
      };
      
      const popupData = {
        type: 'complete',
        updateData: fallbackUpdateData,
        originalText: inputText,
        timestamp: Date.now()
      };
      
      const storageKey = `taskPopup_${Date.now()}`;
      localStorage.setItem(storageKey, JSON.stringify(popupData));
      
      const baseURL = window.location.origin;
      const url = `${baseURL}/dashboard?popupData=${storageKey}`;
      const taskManagerWindow = window.open(url, 'TaskManagerMain');
      if (taskManagerWindow) {
        taskManagerWindow.focus();
      }
      
      setLastResult({
        type: 'complete',
        success: true,
        taskId: 'Manual Selection',
        updateContent: fallbackUpdateData.updateContent,
        confidence: 0
      });
      
      setInputText('');
    } finally {
      setIsProcessing(false);
    }
  };


  const handleAddSubtask = async () => {
    if (!inputText.trim()) {
      setError('Please enter some text');
      return;
    }

    if (!isAuthenticated()) {
      setError('Please login to your task manager first');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      // 1. Find the relevant parent task
      const identifyRes = await aiAPI.identifyTaskUpdate(inputText.trim());
      let updateData = null;
      let subtaskData = null;
      
      if (identifyRes.data.success && identifyRes.data.updateData) {
        updateData = identifyRes.data.updateData;
        console.log('TaskPopup: AI successfully identified parent task for subtask:', updateData);
      } else {
        console.log('TaskPopup: AI failed to identify parent task, using fallback');
        updateData = {
          taskFound: false,
          taskId: null,
          confidence: 0,
          updateType: 'manual_subtask',
          updateContent: `Manual subtask creation`,
          suggestedActions: ['manual_parent_selection'],
          reasoning: 'AI could not identify parent task - manual selection required',
          originalText: inputText
        };
      }
      
      // 2. Use AI to interpret the subtask details
      try {
        const extractRes = await aiAPI.extractTask(inputText.trim());
        if (extractRes.data.success && extractRes.data.taskData) {
          subtaskData = extractRes.data.taskData;
          console.log('TaskPopup: AI successfully extracted subtask data:', subtaskData);
        } else {
          throw new Error('AI extraction failed');
        }
      } catch (extractErr) {
        console.log('TaskPopup: AI failed to extract subtask data, using fallback:', extractErr);
        subtaskData = {
          title: inputText.trim().substring(0, 50),
          description: inputText.trim().substring(0, 300),
          priority: 'MEDIUM',
          dueDate: null,
          assignee: null
        };
      }

      // 3. Always store subtask data and open modal
      const popupData = {
        type: 'addSubtask',
        updateData: {
          ...updateData,
          subtaskData
        },
        originalText: inputText,
        timestamp: Date.now()
      };
      
      // Store in localStorage with a unique key
      const storageKey = `taskPopup_${Date.now()}`;
      localStorage.setItem(storageKey, JSON.stringify(popupData));
      
      console.log('TaskPopup: Stored subtask data in localStorage with key:', storageKey);
      
      // Open the main app with just the storage key
      const baseURL = window.location.origin;
      const url = `${baseURL}/dashboard?popupData=${storageKey}`;
      console.log('TaskPopup: Opening subtask URL:', url);

      const taskManagerWindow = window.open(url, 'TaskManagerMain');
      if (taskManagerWindow) {
        taskManagerWindow.focus();
      }

      setLastResult({
        type: 'addSubtask',
        success: true,
        taskId: updateData.taskId || 'Manual Selection',
        updateContent: subtaskData.description,
        confidence: updateData.confidence
      });

      setInputText('');
    } catch (err) {
      console.error('Add subtask error:', err);
      
      // Even if everything fails, still open the modal with basic data
      const fallbackSubtaskData = {
        title: inputText.trim().substring(0, 50),
        description: inputText.trim().substring(0, 300),
        priority: 'MEDIUM',
        dueDate: null,
        assignee: null
      };

      const fallbackUpdateData = {
        taskFound: false,
        taskId: null,
        confidence: 0,
        updateType: 'manual_subtask',
        updateContent: `Manual subtask creation: ${fallbackSubtaskData.title}`,
        suggestedActions: ['manual_parent_selection'],
        reasoning: 'AI service error - manual selection required',
        originalText: inputText
      };

      // Store fallback subtask data in localStorage
      const popupData = {
        type: 'addSubtask',
        updateData: {
          ...fallbackUpdateData,
          subtaskData: fallbackSubtaskData
        },
        originalText: inputText,
        timestamp: Date.now()
      };
      
      // Store in localStorage with a unique key
      const storageKey = `taskPopup_${Date.now()}`;
      localStorage.setItem(storageKey, JSON.stringify(popupData));
      
      console.log('TaskPopup: Stored fallback subtask data in localStorage with key:', storageKey);
      
      // Open the main app with just the storage key
      const baseURL = window.location.origin;
      const url = `${baseURL}/dashboard?popupData=${storageKey}`;
      console.log('TaskPopup: Opening fallback subtask URL:', url);

      const taskManagerWindow = window.open(url, 'TaskManagerMain');
      if (taskManagerWindow) {
        taskManagerWindow.focus();
      }

      setLastResult({
        type: 'addSubtask',
        success: true,
        taskId: 'Manual Selection',
        updateContent: `Opening subtask creation with manual parent selection`,
        confidence: 0
      });

      setInputText('');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClear = () => {
    setInputText('');
    setError(null);
    setLastResult(null);
  };

  if (!isAuthenticated()) {
    return (
      <div className="h-full bg-gray-900 flex flex-col items-center justify-center p-3 text-center">
        <div className="alert alert-warning text-sm mb-3 py-2 px-3">
          <span>⚠️ Not Logged In. Please login to your task manager first.</span>
        </div>
        <button
          onClick={() => {
            const baseURL = window.location.origin;
            const taskManagerWindow = window.open(`${baseURL}/login`, 'TaskManagerMain');
            if (taskManagerWindow) {
              taskManagerWindow.focus();
            }
          }}
          className="btn btn-primary btn-md w-full"
        >
          Open Login
        </button>
      </div>
    );
  }

  return (
    <div className="h-full bg-gray-900 flex flex-col p-3">
      {/* Header */}
      <div className="text-center mb-2">
        <h1 className="text-white text-base font-bold leading-tight">AI Task Assistant</h1>
        <div className="text-gray-400 text-sm leading-tight">
          Hi {user?.name || 'User'}! 👋
        </div>
      </div>

      {/* Text Input */}
      <div className="flex-1 mb-2">
        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Paste text or type task details..."
          className="textarea textarea-bordered w-full h-full text-sm leading-snug bg-gray-800 border-gray-600 text-white placeholder-gray-400"
          maxLength={2000}
        />
        <div className="mt-1 flex justify-between items-center">
          <span className="badge badge-ghost badge-sm text-[10px]">{inputText.length}/2000</span>
          <span className="text-[10px] text-gray-500">Enter = Create • Shift+Enter = Update</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-2 mb-2">
        <button
          onClick={handleCreateTask}
          disabled={isProcessing || !inputText.trim()}
          className="btn btn-success btn-md w-full"
        >
          {isProcessing ? 'Processing…' : '🆕 Create Task'}
        </button>

        <button
          onClick={handleUpdateTask}
          disabled={isProcessing || !inputText.trim()}
          className="btn btn-info btn-md w-full"
        >
          {isProcessing ? 'Processing…' : '📝 Update Task'}
        </button>

        <button
          onClick={handleCompleteTask}
          disabled={isProcessing || !inputText.trim()}
          className="btn btn-accent btn-md w-full"
        >
          {isProcessing ? 'Processing…' : '✅ Complete Task'}
        </button>


        <button
          onClick={handleAddSubtask}
          disabled={isProcessing || !inputText.trim()}
          className="btn btn-secondary btn-md w-full"
        >
          {isProcessing ? 'Processing…' : '➕ Add Subtask'}
        </button>

        <button
          onClick={handleClear}
          disabled={isProcessing}
          className="btn btn-ghost btn-md w-full"
        >
          Clear
        </button>


      </div>

      {/* Status Messages */}
      {error && (
        <div className="alert alert-error text-sm py-2">{error}</div>
      )}

      {lastResult && (
        <div className="alert alert-success text-sm py-2">
                  {lastResult.type === 'create' ? (
          <span>✅ Task created: "{lastResult.title}"</span>
        ) : lastResult.type === 'complete' ? (
          <span>✅ Task #{lastResult.taskId} marked as completed!</span>
        ) : lastResult.type === 'addSubtask' ? (
          <span>➕ Subtask creation opened for task #{lastResult.taskId}!</span>
        ) : (
          <span>✅ Update sent for task #{lastResult.taskId}</span>
        )}
        </div>
      )}


    </div>
  );
};

export default TaskPopup; 