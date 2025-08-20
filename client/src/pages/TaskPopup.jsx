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
      } catch (err) {
        // Clipboard access not available or denied
        console.log('Clipboard access not available');
      }
    };

    autoFillFromClipboard();
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
      
      if (response.data.success && response.data.taskData) {
        // Open the main app with task data
        const taskData = response.data.taskData;
        const url = `http://localhost:5173/dashboard?createTask=${encodeURIComponent(JSON.stringify(taskData))}&originalText=${encodeURIComponent(inputText)}`;
        
        // Open in main window (reuse existing tab)
        const taskManagerWindow = window.open(url, 'TaskManagerMain');
        if (taskManagerWindow) {
          taskManagerWindow.focus();
        }
        
        setLastResult({
          type: 'create',
          success: true,
          title: taskData.title,
          description: taskData.description
        });
        
        // Clear input after successful creation
        setInputText('');
      } else {
        throw new Error('Failed to extract task data');
      }
    } catch (err) {
      console.error('Create task error:', err);
      setError('Failed to create task. Please try again.');
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
      
      if (response.data.success && response.data.updateData) {
        const updateData = response.data.updateData;
        
        if (updateData.taskFound) {
          // Open the main app with update data
          const url = `http://localhost:5173/dashboard?updateTask=${encodeURIComponent(JSON.stringify(updateData))}&originalText=${encodeURIComponent(inputText)}`;
          
          // Open in main window (reuse existing tab)
          const taskManagerWindow = window.open(url, 'TaskManagerMain');
          if (taskManagerWindow) {
            taskManagerWindow.focus();
          }
          
          setLastResult({
            type: 'update',
            success: true,
            taskId: updateData.taskId,
            updateContent: updateData.updateContent,
            confidence: updateData.confidence
          });
          
          // Clear input after successful update
          setInputText('');
        } else {
          setError(`No matching task found. ${updateData.suggestedActions?.includes('create_new_task') ? 'Try "Create Task" instead.' : ''}`);
        }
      } else {
        throw new Error('Failed to identify task update');
      }
    } catch (err) {
      console.error('Update task error:', err);
      setError('Failed to update task. Please try again.');
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
            const taskManagerWindow = window.open('http://localhost:5173/login', 'TaskManagerMain');
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
          maxLength={500}
        />
        <div className="mt-1 flex justify-between items-center">
          <span className="badge badge-ghost badge-sm text-[10px]">{inputText.length}/500</span>
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
          ) : (
            <span>✅ Update sent for task #{lastResult.taskId}</span>
          )}
        </div>
      )}
    </div>
  );
};

export default TaskPopup; 