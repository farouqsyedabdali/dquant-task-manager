import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import useTaskStore from '../stores/taskStore';
import useAuthStore from '../context/authStore';
import { STATUS_LABELS, PRIORITY_LABELS } from '../utils/constants';
import { commentsAPI } from '../services/api';
import TaskCard from '../components/tasks/TaskCard';
import TaskList from '../components/tasks/TaskList';
import AddTaskModal from '../components/tasks/AddTaskModal';
import TaskModal from '../components/tasks/TaskModal';
import TaskFilters from '../components/tasks/TaskFilters';
import ViewSwitcher from '../components/tasks/ViewSwitcher';
import DeleteConfirmModal from '../components/common/DeleteConfirmModal';
import NotificationBoard from '../components/notifications/NotificationBoard';

const Dashboard = () => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [currentTask, setCurrentTask] = useState(null);
  const [extensionTaskData, setExtensionTaskData] = useState(null);
  const [extensionUpdateData, setExtensionUpdateData] = useState(null);
  const [viewMode, setViewMode] = useState(() => {
    // Get view mode from localStorage, default to 'cards'
    return localStorage.getItem('taskViewMode') || 'cards';
  });
  const [taskType, setTaskType] = useState('all');
  const [deleteTaskId, setDeleteTaskId] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
  const [summaryData, setSummaryData] = useState(null);
  const { tasks, fetchTasks, fetchTasksByType, fetchTask, deleteTask, updateTaskStatus, updateTaskPriority, filters, setFilters, clearFilters, getFilteredTasks } = useTaskStore();
  const { user, isAdmin } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (taskType === 'all') {
      fetchTasks();
    } else {
      fetchTasksByType(taskType);
    }
  }, [fetchTasks, fetchTasksByType, taskType]);

  // Handle URL parameters for task data and updates from browser extension
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const popupDataKey = urlParams.get('popupData');
    
    if (popupDataKey) {
      console.log('Dashboard: Found popupDataKey in URL:', popupDataKey);
      try {
        // Get data from localStorage using the key
        const popupData = localStorage.getItem(popupDataKey);
        console.log('Dashboard: Retrieved popupData from localStorage:', popupData);
        
        if (popupData) {
          const parsedData = JSON.parse(popupData);
          console.log('Dashboard: Parsed popup data:', parsedData);
          
          // Process based on type
          if (parsedData.type === 'create') {
            console.log('Dashboard: Processing create task with data:', parsedData.taskData);
            setExtensionTaskData({
              ...parsedData.taskData,
              originalText: parsedData.originalText
            });
            setIsAddModalOpen(true);
            console.log('Dashboard: Set extensionTaskData and opened add modal');
          } else if (parsedData.type === 'update') {
            console.log('Dashboard: Processing update task with data:', parsedData.updateData);
            handleTaskUpdate({
              ...parsedData.updateData,
              originalText: parsedData.originalText
            });
          } else if (parsedData.type === 'addSubtask') {
            console.log('Dashboard: Processing add subtask with data:', parsedData.updateData);
            handleAddSubtask({
              ...parsedData.updateData,
              originalText: parsedData.originalText
            });
          } else if (parsedData.type === 'complete') {
            console.log('Dashboard: Processing complete task with data:', parsedData.updateData);
            handleTaskCompletion({
              ...parsedData.updateData,
              originalText: parsedData.originalText
            });
          } else if (parsedData.type === 'summarize') {
            console.log('Dashboard: Processing summarize task with data:', parsedData.updateData);
            handleTaskSummarization({
              ...parsedData.updateData,
              originalText: parsedData.originalText
            });
          }
          
          // Clean up localStorage and URL parameters
          localStorage.removeItem(popupDataKey);
          navigate('/dashboard', { replace: true });
        } else {
          console.log('Dashboard: No popupData found in localStorage for key:', popupDataKey);
        }
      } catch (error) {
        console.error('Failed to parse popup data from localStorage:', error);
        // Clean up URL parameters on error
        navigate('/dashboard', { replace: true });
      }
    }
    
    // Handle legacy URL parameters for backward compatibility
    const taskDataParam = urlParams.get('createTask');
    const updateDataParam = urlParams.get('updateTask');
    const completeTaskParam = urlParams.get('completeTask');
    const summarizeTaskParam = urlParams.get('summarizeTask');
    const addSubtaskParam = urlParams.get('addSubtask');
    const originalTextParam = urlParams.get('originalText');
    
    if (taskDataParam) {
      try {
        const taskData = JSON.parse(decodeURIComponent(taskDataParam));
        setExtensionTaskData({
          ...taskData,
          originalText: originalTextParam ? decodeURIComponent(originalTextParam) : null
        });
        setIsAddModalOpen(true);
        
        // Clean up URL parameters
        navigate('/dashboard', { replace: true });
      } catch (error) {
        console.error('Failed to parse task data from URL:', error);
      }
    } else if (updateDataParam) {
      try {
        const updateData = JSON.parse(decodeURIComponent(updateDataParam));
        handleTaskUpdate({
          ...updateData,
          originalText: originalTextParam ? decodeURIComponent(originalTextParam) : null
        });
        
        // Clean up URL parameters
        navigate('/dashboard', { replace: true });
      } catch (error) {
        console.error('Failed to parse update data from URL:', error);
      }
    } else if (completeTaskParam) {
      try {
        const completeData = JSON.parse(decodeURIComponent(completeTaskParam));
        handleTaskCompletion({
          ...completeData,
          originalText: originalTextParam ? decodeURIComponent(originalTextParam) : null
        });
        
        // Clean up URL parameters
        navigate('/dashboard', { replace: true });
      } catch (error) {
        console.error('Failed to parse complete task data from URL:', error);
      }
    } else if (summarizeTaskParam) {
      try {
        const summarizeData = JSON.parse(decodeURIComponent(summarizeTaskParam));
        handleTaskSummarization({
          ...summarizeData,
          originalText: originalTextParam ? decodeURIComponent(originalTextParam) : null
        });
        
        // Clean up URL parameters
        navigate('/dashboard', { replace: true });
      } catch (error) {
        console.error('Failed to parse summarize task data from URL:', error);
      }
    } else if (addSubtaskParam) {
      try {
        const addSubtaskData = JSON.parse(decodeURIComponent(addSubtaskParam));
        handleAddSubtask({
          ...addSubtaskData,
          originalText: originalTextParam ? decodeURIComponent(originalTextParam) : null
        });
        
        // Clean up URL parameters
        navigate('/dashboard', { replace: true });
      } catch (error) {
        console.error('Failed to parse add subtask data from URL:', error);
      }
    }
  }, [location, navigate]);

  // Listen for messages from browser extension
  useEffect(() => {
    const handleMessage = (event) => {
      // Verify origin for security (allow localhost variations)
      const allowedOrigins = [
        window.location.origin,
        'http://localhost:5173',
        'http://127.0.0.1:5173'
      ];
      if (!allowedOrigins.includes(event.origin)) {
        console.log('Dashboard: Rejected message from origin:', event.origin);
        return;
      }
      
      console.log('Dashboard received window message:', event.data);
      
      if (event.data.type === 'CREATE_TASK_FROM_EXTENSION' && event.data.source === 'browser-extension') {
        console.log('Processing task creation from extension');
        setExtensionTaskData({
          ...event.data.taskData,
          originalText: event.data.originalText
        });
        setIsAddModalOpen(true);
      } else if (event.data.type === 'UPDATE_TASK_FROM_EXTENSION' && event.data.source === 'browser-extension') {
        console.log('Processing task update from extension');
        handleTaskUpdate({
          ...event.data.updateData,
          originalText: event.data.originalText
        });
      } else if (event.data.type === 'CREATE_TASK_FROM_POPUP' && event.data.source === 'task-popup') {
        console.log('Processing task creation from popup (postMessage fallback)');
        setExtensionTaskData({
          ...event.data.taskData,
          originalText: event.data.originalText
        });
        setIsAddModalOpen(true);
      }
    };

    // Also listen for custom events as fallback
    const handleCustomEvent = (event) => {
      console.log('Dashboard received custom event:', event.detail);
      
      if (event.detail.type === 'CREATE_TASK_FROM_EXTENSION' && event.detail.source === 'browser-extension') {
        console.log('Processing task creation from extension (custom event)');
        setExtensionTaskData({
          ...event.detail.taskData,
          originalText: event.detail.originalText
        });
        setIsAddModalOpen(true);
      }
    };

    // Handle task update custom events
    const handleUpdateCustomEvent = (event) => {
      console.log('Dashboard received update custom event:', event.detail);
      
      if (event.detail.type === 'UPDATE_TASK_FROM_EXTENSION' && event.detail.source === 'browser-extension') {
        console.log('Processing task update from extension (custom event)');
        handleTaskUpdate({
          ...event.detail.updateData,
          originalText: event.detail.originalText
        });
      }
    };

    window.addEventListener('message', handleMessage);
    window.addEventListener('taskFromExtension', handleCustomEvent);
    window.addEventListener('taskUpdateFromExtension', handleUpdateCustomEvent);
    
    return () => {
      window.removeEventListener('message', handleMessage);
      window.removeEventListener('taskFromExtension', handleCustomEvent);
      window.removeEventListener('taskUpdateFromExtension', handleUpdateCustomEvent);
    };
  }, []);

  // Function to handle task updates from extension
  const handleTaskUpdate = async (updateData) => {
    console.log('Processing task update:', updateData);
    
    if (updateData.taskFound && updateData.taskId) {
      // Fetch the specific task to update
      const result = await fetchTask(updateData.taskId);
      if (result.success) {
        setCurrentTask(result.data || tasks.find(t => t.id === updateData.taskId));
        setExtensionUpdateData(updateData);
        setIsTaskModalOpen(true);
      } else {
        console.error('Failed to fetch task for update');
        // Still open modal with the update data for manual handling
        setExtensionUpdateData(updateData);
        setIsTaskModalOpen(true);
      }
    } else {
      // No task found, open AddTaskModal for manual task creation
      console.log('No matching task found, opening AddTaskModal for manual task creation');
      setExtensionTaskData({
        title: updateData.updateContent?.substring(0, 50) || 'Manual Task',
        description: updateData.updateContent || 'Task created from manual input',
        priority: 'MEDIUM',
        dueDate: null,
        assignee: null,
        originalText: updateData.originalText
      });
      setIsAddModalOpen(true);
    }
  };

  // Function to handle task completion from extension
  const handleTaskCompletion = async (completeData) => {
    console.log('Processing task completion:', completeData);
    
    if (completeData.taskFound && completeData.taskId) {
      // Find the task to show its details
      const task = tasks.find(t => t.id === completeData.taskId);
      const taskTitle = task ? task.title : 'Unknown Task';
      
      // Show confirmation dialog with task details
      const confirmed = window.confirm(
        `Are you sure you want to complete this task?\n\n` +
        `Task: "${taskTitle}"\n` +
        `Completion Note: "${completeData.updateContent || 'No additional details provided'}"\n\n` +
        `This will mark the task as COMPLETED and add a completion comment.`
      );
      
      if (confirmed) {
        try {
          // Mark the task as completed
          await updateTaskStatus(completeData.taskId, 'COMPLETED');
          
          // Add a completion comment
          if (completeData.updateContent && completeData.updateContent.trim()) {
            try {
              await commentsAPI.create(completeData.taskId, `✅ Task completed: ${completeData.updateContent}`);
            } catch (commentError) {
              console.error('Failed to add completion comment:', commentError);
              // Continue even if comment fails
            }
          }
          
          // Show success message
          alert(`✅ Task "${taskTitle}" has been completed and marked as COMPLETED!`);
          
          // Refresh tasks to show updated status
          if (taskType === 'all') {
            fetchTasks();
          } else {
            fetchTasksByType(taskType);
          }
        } catch (error) {
          console.error('Failed to complete task:', error);
          alert('Failed to complete task. Please try again.');
          // Still open modal for manual completion
          setExtensionUpdateData(completeData);
          setIsTaskModalOpen(true);
        }
      } else {
        // User cancelled, show info message
        console.log('Task completion cancelled by user');
      }
    } else {
      // No task found, open AddTaskModal for manual task creation
      console.log('No matching task found for completion, opening AddTaskModal for manual task creation');
      setExtensionTaskData({
        title: completeData.updateContent?.substring(0, 50) || 'Manual Task',
        description: completeData.updateContent || 'Task created from manual input',
        priority: 'MEDIUM',
        dueDate: null,
        assignee: null,
        originalText: completeData.originalText
      });
      setIsAddModalOpen(true);
    }
  };

  // Function to handle adding subtask from extension
  const handleAddSubtask = async (addSubtaskData) => {
    console.log('Processing add subtask:', addSubtaskData);
    
    if (addSubtaskData.taskFound && addSubtaskData.taskId) {
      // Fetch the specific task to add subtask to
      const result = await fetchTask(addSubtaskData.taskId);
      if (result.success) {
        setCurrentTask(result.data || tasks.find(t => t.id === addSubtaskData.taskId));
        // Set extension data to trigger subtask modal, including subtaskData if present
        setExtensionUpdateData({
          ...addSubtaskData,
          action: 'addSubtask',
          subtaskData: addSubtaskData.subtaskData || null
        });
        setIsTaskModalOpen(true);
      } else {
        console.error('Failed to fetch task for subtask addition');
        // Still open modal for manual subtask addition
        setExtensionUpdateData({
          ...addSubtaskData,
          action: 'addSubtask',
          subtaskData: addSubtaskData.subtaskData || null
        });
        setIsTaskModalOpen(true);
      }
    } else {
      // No task found, open AddTaskModal for manual task creation (as parent for subtask)
      console.log('No matching task found for subtask addition, opening AddTaskModal for manual task creation');
      setExtensionTaskData({
        title: addSubtaskData.subtaskData?.title || addSubtaskData.updateContent?.substring(0, 50) || 'Manual Task',
        description: addSubtaskData.subtaskData?.description || addSubtaskData.updateContent || 'Task created from manual input',
        priority: addSubtaskData.subtaskData?.priority || 'MEDIUM',
        dueDate: addSubtaskData.subtaskData?.dueDate || null,
        assignee: addSubtaskData.subtaskData?.assignee || null,
        originalText: addSubtaskData.originalText
      });
      setIsAddModalOpen(true);
    }
  };

  // Function to handle task summarization from extension
  const handleTaskSummarization = async (summarizeData) => {
    console.log('Processing task summarization:', summarizeData);
    
    if (summarizeData.taskFound && summarizeData.taskId) {
      try {
        // Fetch the specific task to show summary
        const result = await fetchTask(summarizeData.taskId);
        if (result.success) {
          const task = result.data || tasks.find(t => t.id === summarizeData.taskId);
          if (task) {
            // Create a comprehensive summary
            const summary = await createTaskSummary(task);
            
            // Show summary in a modal
            setSummaryData(summary);
            setIsSummaryModalOpen(true);
          } else {
            // Task not found, open AddTaskModal for manual task creation
            console.log('Task not found for summarization, opening AddTaskModal for manual task creation');
            setExtensionTaskData({
              title: summarizeData.updateContent?.substring(0, 50) || 'Manual Task',
              description: summarizeData.updateContent || 'Task created from manual input',
              priority: 'MEDIUM',
              dueDate: null,
              assignee: null,
              originalText: summarizeData.originalText
            });
            setIsAddModalOpen(true);
          }
        } else {
          console.error('Failed to fetch task for summarization');
          // Open AddTaskModal for manual task creation
          setExtensionTaskData({
            title: summarizeData.updateContent?.substring(0, 50) || 'Manual Task',
            description: summarizeData.updateContent || 'Task created from manual input',
            priority: 'MEDIUM',
            dueDate: null,
            assignee: null,
            originalText: summarizeData.originalText
          });
          setIsAddModalOpen(true);
        }
      } catch (error) {
        console.error('Failed to summarize task:', error);
        // Open AddTaskModal for manual task creation
        setExtensionTaskData({
          title: summarizeData.updateContent?.substring(0, 50) || 'Manual Task',
          description: summarizeData.updateContent || 'Task created from manual input',
          priority: 'MEDIUM',
          dueDate: null,
          assignee: null,
          originalText: summarizeData.originalText
        });
        setIsAddModalOpen(true);
      }
    } else {
      // No task found, open AddTaskModal for manual task creation
      console.log('No matching task found for summarization, opening AddTaskModal for manual task creation');
      setExtensionTaskData({
        title: summarizeData.updateContent?.substring(0, 50) || 'Manual Task',
        description: summarizeData.updateContent || 'Task created from manual input',
        priority: 'MEDIUM',
        dueDate: null,
        assignee: null,
        originalText: summarizeData.originalText
      });
      setIsAddModalOpen(true);
    }
  };

  // Helper function to create a comprehensive task summary
  const createTaskSummary = async (task) => {
    const formatDate = (dateString) => {
      if (!dateString) return 'No due date set';
      const date = new Date(dateString);
      const now = new Date();
      const diffTime = date.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays < 0) {
        return `Overdue by ${Math.abs(diffDays)} day(s)`;
      } else if (diffDays === 0) {
        return 'Due today';
      } else if (diffDays === 1) {
        return 'Due tomorrow';
      } else {
        return `Due in ${diffDays} day(s)`;
      }
    };

    const getStatusEmoji = (status) => {
      switch (status) {
        case 'TODO': return '⏳';
        case 'IN_PROGRESS': return '🔄';
        case 'COMPLETED': return '✅';
        case 'ON_HOLD': return '⏸️';
        case 'CANCELLED': return '❌';
        default: return '❓';
      }
    };

    const getPriorityEmoji = (priority) => {
      switch (priority) {
        case 'URGENT': return '🚨';
        case 'HIGH': return '🔴';
        case 'MEDIUM': return '🟡';
        case 'LOW': return '🟢';
        default: return '⚪';
      }
    };

    // Create text summary of title, description, and comments
    let textSummary = `Task: ${task.title}`;
    
    if (task.description) {
      textSummary += `\n\nDescription: ${task.description}`;
    }
    
    if (task.comments && task.comments.length > 0) {
      textSummary += `\n\nComments Summary:`;
      task.comments.forEach((comment, index) => {
        textSummary += `\n${index + 1}. ${comment.author.name}: ${comment.content}`;
      });
    }

    return {
      title: task.title,
      description: task.description || 'No description provided',
      textSummary: textSummary,
      status: `${getStatusEmoji(task.status)} ${task.status.replace('_', ' ')}`,
      priority: `${getPriorityEmoji(task.priority)} ${task.priority}`,
      dueDate: formatDate(task.dueDate),
      createdBy: task.assigner?.name || 'Unknown',
      assignedTo: task.assignedTo?.name || 'Unassigned',
      createdAt: new Date(task.createdAt).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      comments: task.comments?.length || 0,
      subtasks: task.subtasks?.length || 0
    };
  };



  // Calculate statistics
  const stats = {
    total: tasks.length,
    todo: tasks.filter(task => task.status === 'TODO').length,
    inProgress: tasks.filter(task => task.status === 'IN_PROGRESS').length,
    completed: tasks.filter(task => task.status === 'COMPLETED').length,
    onHold: tasks.filter(task => task.status === 'ON_HOLD').length,
    cancelled: tasks.filter(task => task.status === 'CANCELLED').length,
    urgent: tasks.filter(task => task.priority === 'URGENT').length,
    high: tasks.filter(task => task.priority === 'HIGH').length
  };

  const StatCard = ({ title, value, icon, status, isActive, onClick }) => (
    <div 
      className={`bg-gray-800 border rounded-lg p-4 text-white cursor-pointer transition-all duration-200 hover:bg-gray-700 hover:scale-105 ${
        isActive 
          ? 'border-indigo-500 bg-indigo-900/20 shadow-lg shadow-indigo-500/20' 
          : 'border-gray-700 hover:border-gray-600'
      }`}
      onClick={onClick}
      title={`Click to ${status === 'total' ? 'show all tasks' : `toggle ${title.toLowerCase()} filter`}`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-sm font-medium">{title}</p>
          <p className="text-2xl font-bold text-white">{value}</p>
        </div>
        <div className="text-3xl">{icon}</div>
      </div>
    </div>
  );

  const handleStatusChange = async (taskId, newStatus) => {
    await updateTaskStatus(taskId, newStatus);
  };

  // Handle stat card click for multi-select filtering
  const handleStatCardClick = (status) => {
    if (status === 'total') {
      // Clear all status filters to show all tasks
      setFilters({ ...filters, status: '' });
    } else {
      // Toggle status in the filter
      const currentStatus = filters.status || '';
      const statusArray = currentStatus ? currentStatus.split(',') : [];
      
      if (statusArray.includes(status)) {
        // Remove status from filter
        const newStatusArray = statusArray.filter(s => s !== status);
        setFilters({ ...filters, status: newStatusArray.join(',') });
      } else {
        // Add status to filter
        const newStatusArray = [...statusArray, status];
        setFilters({ ...filters, status: newStatusArray.join(',') });
      }
    }
  };

  const handlePriorityChange = async (taskId, newPriority) => {
    await updateTaskPriority(taskId, newPriority);
  };

  const handleDelete = async (taskId) => {
    setDeleteTaskId(taskId);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (deleteTaskId) {
      await deleteTask(deleteTaskId);
      setIsDeleteModalOpen(false);
      setDeleteTaskId(null);
    }
  };

  const handleViewChange = (newView) => {
    setViewMode(newView);
    // Save view mode to localStorage
    localStorage.setItem('taskViewMode', newView);
  };

  const handleAddTask = () => {
    setExtensionTaskData(null); // Clear any existing extension data
    setIsAddModalOpen(true);
  };

  const handleCloseAddModal = () => {
    setIsAddModalOpen(false);
    setExtensionTaskData(null); // Clear extension data when modal closes
  };

  const handleCloseTaskModal = () => {
    setIsTaskModalOpen(false);
    setCurrentTask(null);
    setExtensionUpdateData(null); // Clear extension update data when modal closes
  };

  const filteredTasks = getFilteredTasks();

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="max-w-[95%] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-white">
                Welcome back, {user?.name}!
              </h1>
              <p className="text-gray-400 mt-2">
                {isAdmin() ? 'Manage all tasks and team assignments' : 'View and update your assigned tasks'}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              {/* Task Type Selector */}
              <div className="flex items-center space-x-2">
                <label className="text-gray-300 text-sm">View:</label>
                <select
                  value={taskType}
                  onChange={(e) => setTaskType(e.target.value)}
                  className="select select-sm bg-gray-700 border-gray-600 text-white"
                >
                  <option value="all">All Tasks</option>
                  <option value="assigned-to-me">Assigned to Me</option>
                  <option value="created-by-me">Created by Me</option>
                </select>
              </div>
              
              <ViewSwitcher 
                currentView={viewMode} 
                onViewChange={handleViewChange} 
              />
              
              {/* Notification Board */}
              <NotificationBoard />
              
              <button
                onClick={handleAddTask}
                className="btn bg-indigo-600 hover:bg-indigo-700 text-white border-0"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add New Task
              </button>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="mb-4">
          {filters.status && (
            <div className="text-sm text-gray-400 mb-2">
              Showing tasks with status: {filters.status.split(',').map(s => s.trim()).join(', ')}
              <button
                onClick={() => setFilters({ ...filters, status: '' })}
                className="ml-2 text-indigo-400 hover:text-indigo-300 underline"
              >
                Clear filters
              </button>
            </div>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8">
          <StatCard
            title="Total Tasks"
            value={stats.total}
            icon="📋"
            status="total"
            isActive={!filters.status}
            onClick={() => handleStatCardClick('total')}
          />
          <StatCard
            title="To Do"
            value={stats.todo}
            icon="⏳"
            status="TODO"
            isActive={filters.status && filters.status.split(',').includes('TODO')}
            onClick={() => handleStatCardClick('TODO')}
          />
          <StatCard
            title="In Progress"
            value={stats.inProgress}
            icon="🔄"
            status="IN_PROGRESS"
            isActive={filters.status && filters.status.split(',').includes('IN_PROGRESS')}
            onClick={() => handleStatCardClick('IN_PROGRESS')}
          />
          <StatCard
            title="Completed"
            value={stats.completed}
            icon="✅"
            status="COMPLETED"
            isActive={filters.status && filters.status.split(',').includes('COMPLETED')}
            onClick={() => handleStatCardClick('COMPLETED')}
          />
          <StatCard
            title="On Hold"
            value={stats.onHold}
            icon="⏸️"
            status="ON_HOLD"
            isActive={filters.status && filters.status.split(',').includes('ON_HOLD')}
            onClick={() => handleStatCardClick('ON_HOLD')}
          />
          <StatCard
            title="Cancelled"
            value={stats.cancelled}
            icon="❌"
            status="CANCELLED"
            isActive={filters.status && filters.status.split(',').includes('CANCELLED')}
            onClick={() => handleStatCardClick('CANCELLED')}
          />
        </div>

        

        {/* Filters */}
        <div className="mb-6">
          <TaskFilters 
            filters={filters}
            onFilterChange={setFilters}
            onClearFilters={clearFilters}
          />
        </div>

        {/* Tasks View */}
        <div className="bg-gray-800 rounded-lg shadow-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-white">
              {taskType === 'all' ? 'All Tasks' : 
               taskType === 'assigned-to-me' ? 'Tasks Assigned to Me' : 
               'Tasks Created by Me'} ({filteredTasks.length})
            </h2>
          </div>
          
          {filteredTasks.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-lg mb-2">No tasks found</div>
              <p className="text-gray-500">Try adjusting your filters or create a new task.</p>
            </div>
          ) : viewMode === 'cards' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
              {filteredTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onStatusChange={handleStatusChange}
                  onPriorityChange={handlePriorityChange}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          ) : (
            <TaskList
              tasks={filteredTasks}
              onStatusChange={handleStatusChange}
              onPriorityChange={handlePriorityChange}
              onDelete={handleDelete}
            />
          )}
        </div>
      </div>

      {/* Add Task Modal */}
      {isAddModalOpen && (
        <AddTaskModal
          isOpen={isAddModalOpen}
          onClose={handleCloseAddModal}
          initialData={extensionTaskData}
        />
      )}

      {/* Task Update Modal */}
      {isTaskModalOpen && currentTask && (
        <TaskModal
          isOpen={isTaskModalOpen}
          onClose={handleCloseTaskModal}
          task={currentTask}
          onStatusChange={handleStatusChange}
          onPriorityChange={handlePriorityChange}
          onDelete={confirmDelete}
          extensionUpdateData={extensionUpdateData}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteTaskId && (
        <DeleteConfirmModal
          isOpen={isDeleteModalOpen}
          onClose={() => {
            setIsDeleteModalOpen(false);
            setDeleteTaskId(null);
          }}
          onConfirm={confirmDelete}
          taskTitle={tasks.find(t => t.id === deleteTaskId)?.title || 'Unknown Task'}
          isLoading={false}
        />
      )}

      {/* Task Summary Modal */}
      {isSummaryModalOpen && summaryData && (
        <div className="modal modal-open">
          <div className="modal-box max-w-4xl max-h-[90vh] overflow-y-auto bg-gray-800 border border-gray-700">
            <div className="flex justify-between items-start mb-6">
              <h3 className="text-2xl font-bold text-white">Task Summary</h3>
              <button
                onClick={() => {
                  setIsSummaryModalOpen(false);
                  setSummaryData(null);
                }}
                className="btn btn-ghost btn-sm btn-circle text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-6">
              {/* Text Summary Section */}
              <div className="bg-gray-700 rounded-lg p-4">
                <h4 className="text-lg font-semibold text-white mb-3">📋 Content Summary</h4>
                <div className="bg-gray-800 rounded p-3 text-gray-200 whitespace-pre-line">
                  {summaryData.textSummary}
                </div>
              </div>

              {/* Task Details Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="text-lg font-semibold text-white mb-3">📊 Task Details</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Status:</span>
                        <span className="text-white">{summaryData.status}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Priority:</span>
                        <span className="text-white">{summaryData.priority}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Due Date:</span>
                        <span className="text-white">{summaryData.dueDate}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="text-lg font-semibold text-white mb-3">👥 People</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Created by:</span>
                        <span className="text-white">{summaryData.createdBy}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Assigned to:</span>
                        <span className="text-white">{summaryData.assignedTo}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Created:</span>
                        <span className="text-white">{summaryData.createdAt}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Additional Info */}
              <div className="bg-gray-700 rounded-lg p-4">
                <h4 className="text-lg font-semibold text-white mb-3">📈 Additional Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-indigo-400">{summaryData.comments}</div>
                    <div className="text-gray-400 text-sm">Comments</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-indigo-400">{summaryData.subtasks}</div>
                    <div className="text-gray-400 text-sm">Subtasks</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard; 