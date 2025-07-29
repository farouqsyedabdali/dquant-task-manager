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
      <div className="h-full bg-gray-900 flex flex-col items-center justify-center p-4 text-center">
        <div className="text-red-400 text-xs mb-2">⚠️ Not Logged In</div>
        <div className="text-gray-300 text-xs mb-3">
          Please login to your task manager first
        </div>
        <button
          onClick={() => {
            const taskManagerWindow = window.open('http://localhost:5173/login', 'TaskManagerMain');
            if (taskManagerWindow) {
              taskManagerWindow.focus();
            }
          }}
          className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-3 py-1 rounded"
        >
          Open Login
        </button>
      </div>
    );
  }

  return (
    <div className="h-full bg-gray-900 flex flex-col p-3">
      {/* Header */}
      <div className="text-center mb-3">
        <h1 className="text-white text-sm font-bold">AI Task Assistant</h1>
        <div className="text-gray-400 text-xs">
          Hi {user?.name || 'User'}! 👋
        </div>
      </div>

      {/* Text Input */}
      <div className="flex-1 mb-3">
        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Paste text here or type task details..."
          className="w-full h-full resize-none bg-gray-800 border border-gray-600 text-white text-xs placeholder-gray-400 rounded p-2 focus:border-indigo-500 focus:outline-none"
          maxLength={500}
        />
        <div className="text-xs text-gray-500 text-right mt-1">
          {inputText.length}/500
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-2 mb-2">
        <button
          onClick={handleCreateTask}
          disabled={isProcessing || !inputText.trim()}
          className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white text-xs py-2 px-3 rounded font-medium transition-colors"
        >
          {isProcessing ? '🔄 Processing...' : '🆕 Create New Task'}
        </button>
        
        <button
          onClick={handleUpdateTask}
          disabled={isProcessing || !inputText.trim()}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white text-xs py-2 px-3 rounded font-medium transition-colors"
        >
          {isProcessing ? '🔄 Processing...' : '📝 Update Existing Task'}
        </button>
        
        <button
          onClick={handleClear}
          disabled={isProcessing}
          className="w-full bg-gray-600 hover:bg-gray-700 disabled:bg-gray-600 text-white text-xs py-1 px-3 rounded transition-colors"
        >
          Clear
        </button>
      </div>

      {/* Status Messages */}
      {error && (
        <div className="bg-red-900/50 border border-red-500/50 text-red-300 text-xs p-2 rounded mb-2">
          {error}
        </div>
      )}
      
      {lastResult && (
        <div className="bg-green-900/50 border border-green-500/50 text-green-300 text-xs p-2 rounded">
          {lastResult.type === 'create' ? (
            <div>
              ✅ Task created: "{lastResult.title}"
            </div>
          ) : (
            <div>
              ✅ Update sent for task #{lastResult.taskId}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TaskPopup; 