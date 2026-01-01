import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import useTaskStore from '../stores/taskStore';
import useAuthStore from '../context/authStore';
import { STATUS_LABELS, PRIORITY_LABELS } from '../utils/constants';
import { commentsAPI, taskArchiveAPI, aiAPI } from '../services/api';
import TaskCard from '../components/tasks/TaskCard';
// import TaskList from '../components/tasks/TaskList'; // Kept in file but not used
import AddTaskModal from '../components/tasks/AddTaskModal';
import AddSubtaskModal from '../components/tasks/AddSubtaskModal';
import TaskModal from '../components/tasks/TaskModal';
import TaskSelectionModal from '../components/tasks/TaskSelectionModal';
import TaskFilters from '../components/tasks/TaskFilters';
// import ViewSwitcher from '../components/tasks/ViewSwitcher'; // Kept in file but not used
import ArchiveSwitcher from '../components/tasks/ArchiveSwitcher';
import DeleteConfirmModal from '../components/common/DeleteConfirmModal';
import NotificationBoard from '../components/notifications/NotificationBoard';
import PendingInvitations from '../components/dashboard/PendingInvitations';
import IconButton from '../components/common/IconButton';
import { FaPlus, FaTimes } from 'react-icons/fa';

const Dashboard = ({ taskbarAction, onTaskbarActionHandled }) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isAddSubtaskModalOpen, setIsAddSubtaskModalOpen] = useState(false);
  const [isTaskSelectionModalOpen, setIsTaskSelectionModalOpen] = useState(false);
  const [currentTask, setCurrentTask] = useState(null);
  const [extensionTaskData, setExtensionTaskData] = useState(null);
  const [extensionUpdateData, setExtensionUpdateData] = useState(null);
  const [subtaskExtensionData, setSubtaskExtensionData] = useState(null);
  const [pendingUpdateData, setPendingUpdateData] = useState(null);
  const [viewMode, setViewMode] = useState(() => {
    // Get view mode from localStorage, default to 'cards'
    return localStorage.getItem('taskViewMode') || 'cards';
  });
  const [archiveView, setArchiveView] = useState('active'); // 'active' or 'archived'
  const [archivedTasks, setArchivedTasks] = useState([]);
  const [isLoadingArchived, setIsLoadingArchived] = useState(false);
  const [deleteTaskId, setDeleteTaskId] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
  const [summaryData, setSummaryData] = useState(null);
  const { tasks, fetchTasks, fetchTasksByType, fetchTask, deleteTask, updateTaskStatus, updateTaskPriority, filters, setFilters, clearFilters, getFilteredTasks } = useTaskStore();
  const { user, isAdmin } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();

  // Set default filters to show TODO and IN_PROGRESS tasks only on first load
  useEffect(() => {
    // Only set default filter if no status filter is currently applied and this is the initial load
    if (!filters.status) {
      setFilters({ status: 'TODO,IN_PROGRESS' });
    }
  }, []); // Empty dependency array - only run once on mount

  // Handle taskbar actions from Electron
  useEffect(() => {
    if (taskbarAction) {
      console.log('Dashboard: Handling taskbar action:', taskbarAction);
      
      switch (taskbarAction.action) {
        case 'create-task':
          console.log('Dashboard: Opening create task modal with data:', taskbarAction.clipboardText);
          
          if (taskbarAction.useAI) {
            console.log('Dashboard: Using AI to process clipboard text');
            // Use AI to analyze the clipboard text, same as popup functionality
            handleTaskExtractionFromTaskbar(taskbarAction.clipboardText);
          } else {
            // Fallback to simple clipboard paste (old behavior)
            setExtensionTaskData({
              title: taskbarAction.clipboardText?.substring(0, 50) || 'New Task',
              description: taskbarAction.clipboardText || '',
              priority: 'MEDIUM',
              dueDate: null,
              assignee: null,
              originalText: taskbarAction.clipboardText
            });
            setIsAddModalOpen(true);
          }
          break;
          
        case 'update-task':
          // Handle task update with clipboard data
          handleTaskUpdate({
            updateContent: taskbarAction.clipboardText || '',
            originalText: taskbarAction.clipboardText
          });
          break;
          
        case 'add-subtask':
          // Handle adding subtask with clipboard data
          handleAddSubtask({
            subtaskData: {
              title: taskbarAction.clipboardText?.substring(0, 50) || 'New Subtask',
              description: taskbarAction.clipboardText || '',
              priority: 'MEDIUM',
              dueDate: null,
              assignee: null
            },
            originalText: taskbarAction.clipboardText
          });
          break;
          
        default:
          console.log('Unknown taskbar action:', taskbarAction.action);
      }
      
      // Notify parent that action has been handled
      if (onTaskbarActionHandled) {
        onTaskbarActionHandled();
      }
    }
  }, [taskbarAction, onTaskbarActionHandled]);

  // Fetch archived tasks
  const fetchArchivedTasks = async () => {
    setIsLoadingArchived(true);
    try {
      const response = await taskArchiveAPI.getArchivedTasks();
      setArchivedTasks(response.data);
    } catch (error) {
      console.error('Error fetching archived tasks:', error);
    } finally {
      setIsLoadingArchived(false);
    }
  };

  useEffect(() => {
    if (archiveView === 'archived') {
      fetchArchivedTasks();
    } else {
      fetchTasks();
    }
  }, [fetchTasks, archiveView]);

  // Handle opening task from notification click
  useEffect(() => {
    const handleOpenTaskFromNotification = async (event) => {
      const { taskId } = event.detail;
      if (taskId) {
        try {
          const result = await fetchTask(parseInt(taskId));
          if (result.success && result.data) {
            setCurrentTask(result.data);
            setIsTaskModalOpen(true);
            console.log('Dashboard: Opened task modal from notification:', result.data.title);
          } else {
            console.error('Dashboard: Failed to fetch task with ID:', taskId);
          }
        } catch (error) {
          console.error('Dashboard: Error fetching task from notification:', error);
        }
      }
    };

    window.addEventListener('openTaskFromNotification', handleOpenTaskFromNotification);
    return () => {
      window.removeEventListener('openTaskFromNotification', handleOpenTaskFromNotification);
    };
  }, [fetchTask]);

  // Handle URL parameters for task data and updates from browser extension
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const popupDataKey = urlParams.get('popupData');
    const taskIdParam = urlParams.get('taskId');
    
    // Handle direct task ID from email links (e.g., reminder emails)
    if (taskIdParam) {
      console.log('Dashboard: Found taskId in URL:', taskIdParam);
      const openTaskFromUrl = async () => {
        try {
          const result = await fetchTask(parseInt(taskIdParam));
          if (result.success && result.data) {
            setCurrentTask(result.data);
            setIsTaskModalOpen(true);
            console.log('Dashboard: Opened task modal for task:', result.data.title);
          } else {
            console.error('Dashboard: Failed to fetch task with ID:', taskIdParam);
          }
        } catch (error) {
          console.error('Dashboard: Error fetching task from URL:', error);
        } finally {
          // Clean up URL parameter
          navigate('/dashboard', { replace: true });
        }
      };
      openTaskFromUrl();
      return; // Exit early to avoid processing other URL params
    }
    
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

  // Function to handle AI task extraction from taskbar (same as popup functionality)
  const handleTaskExtractionFromTaskbar = async (text) => {
    console.log('Dashboard: Processing AI task extraction from taskbar:', text);
    
    try {
      // Use the exact same AI API call as the popup
      const response = await aiAPI.extractTask(text.trim());
      
      let taskData = null;
      if (response.data.success && response.data.taskData) {
        taskData = response.data.taskData;
        console.log('Dashboard: AI successfully extracted task data:', taskData);
      } else {
        console.log('Dashboard: AI failed to extract task data, using fallback');
        taskData = {
          title: text.trim().substring(0, 50),
          description: text.trim().substring(0, 300),
          priority: 'MEDIUM',
          dueDate: null,
          assignee: null
        };
      }
      
      // Set the AI-extracted task data (same structure as popup)
      setExtensionTaskData({
        title: taskData.title,
        description: taskData.description || '',
        priority: taskData.priority || 'MEDIUM',
        dueDate: taskData.dueDate || null,
        assignee: taskData.assignee || null,
        originalText: text
      });
      setIsAddModalOpen(true);
      console.log('Dashboard: Task modal opened with AI-extracted data');
      
    } catch (error) {
      console.error('Dashboard: AI extraction error:', error);
      // Fallback to simple clipboard paste
      setExtensionTaskData({
        title: text?.substring(0, 50) || 'New Task',
        description: text || '',
        priority: 'MEDIUM',
        dueDate: null,
        assignee: null,
        originalText: text
      });
      setIsAddModalOpen(true);
    }
  };

  // Function to handle task updates from extension
  const handleTaskUpdate = async (updateData) => {
    console.log('Processing task update:', updateData);
    
    if (updateData.taskFound && updateData.taskId) {
      // AI found a task - open TaskModal directly
      console.log('AI found task, opening TaskModal directly');
      const result = await fetchTask(updateData.taskId);
      if (result.success) {
        setCurrentTask(result.data || tasks.find(t => t.id === updateData.taskId));
        setExtensionUpdateData(updateData);
        setIsTaskModalOpen(true);
      } else {
        console.error('Failed to fetch task for update');
        // Fallback to task selection modal
        setPendingUpdateData(updateData);
        setIsTaskSelectionModalOpen(true);
      }
    } else {
      // AI didn't find a task - show task selection modal
      console.log('AI didn\'t find task, opening task selection modal');
      setPendingUpdateData(updateData);
      setIsTaskSelectionModalOpen(true);
    }
  };

  // Handle task selection from TaskSelectionModal
  const handleTaskSelected = async (selectedTask) => {
    console.log('Task selected for update:', selectedTask);
    
    // Fetch the full task data
    const result = await fetchTask(selectedTask.id);
    if (result.success) {
      setCurrentTask(result.data || selectedTask);
      // Set update data with the selected task and pre-filled comment
      setExtensionUpdateData({
        ...pendingUpdateData,
        taskFound: true,
        taskId: selectedTask.id,
        updateContent: pendingUpdateData?.updateContent || pendingUpdateData?.originalText || ''
      });
      setIsTaskModalOpen(true);
      setIsTaskSelectionModalOpen(false);
      setPendingUpdateData(null);
    } else {
      console.error('Failed to fetch selected task');
    }
  };

  // Handle task switch from TaskModal (when user wants to change AI's suggestion)
  const handleTaskSwitch = () => {
    console.log('Opening task selection modal to switch task');
    // Store current extensionUpdateData as pending so user can select a different task
    // Include current task ID as suggested so it's pre-selected
    setPendingUpdateData({
      ...extensionUpdateData,
      taskId: currentTask?.id || extensionUpdateData?.taskId,
      taskFound: true
    });
    setIsTaskSelectionModalOpen(true);
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
          fetchTasks();
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
      // No task found, open AddSubtaskModal directly with no parent selected
      // User will manually select the parent task
      console.log('No matching task found for subtask addition, opening AddSubtaskModal with no parent');
      setSubtaskExtensionData({
        ...addSubtaskData,
        action: 'addSubtask',
        taskId: null, // No parent selected
        taskFound: false,
        subtaskData: addSubtaskData.subtaskData || null
      });
      setIsAddSubtaskModalOpen(true);
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
    const formatDate = (dateString, taskStatus) => {
      if (!dateString) return 'No due date set';
      const date = new Date(dateString);
      const now = new Date();
      const diffTime = date.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      // Only show "Overdue" if task status is TODO or IN_PROGRESS
      if (diffDays < 0 && (taskStatus === 'TODO' || taskStatus === 'IN_PROGRESS')) {
        return `Overdue by ${Math.abs(diffDays)} day(s)`;
      } else if (diffDays < 0) {
        // For other statuses, just show the date without "Overdue"
        return new Date(dateString).toLocaleDateString();
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
      dueDate: formatDate(task.dueDate, task.status),
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
      className={`border rounded-lg p-4 cursor-pointer transition-all duration-200 hover:scale-105 ${
        isActive 
          ? 'shadow-lg' 
          : ''
      }`}
      style={{
        backgroundColor: isActive 
          ? 'var(--color-bg-tertiary)' 
          : 'var(--color-bg-secondary)',
        borderColor: isActive 
          ? 'var(--color-primary)' 
          : 'var(--color-border-default)',
        boxShadow: isActive 
          ? '0 10px 25px rgba(99, 102, 241, 0.2)' 
          : 'none',
      }}
      onMouseEnter={(e) => {
        if (!isActive) {
          e.currentTarget.style.backgroundColor = 'var(--color-surface-hover)';
        }
      }}
      onMouseLeave={(e) => {
        if (!isActive) {
          e.currentTarget.style.backgroundColor = 'var(--color-bg-secondary)';
        }
      }}
      onClick={onClick}
      title={`Click to ${status === 'total' ? 'show all tasks' : `toggle ${title.toLowerCase()} filter`}`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p 
            className="text-sm font-medium transition-colors duration-200"
            style={{ color: 'var(--color-text-tertiary)' }}
          >
            {title}
          </p>
          <p 
            className="text-2xl font-bold transition-colors duration-200"
            style={{ color: 'var(--color-text-primary)' }}
          >
            {value}
          </p>
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
      const statusArray = currentStatus ? currentStatus.split(',').map(s => s.trim()) : [];
      
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

  // Handle archive/unarchive actions
  const handleArchiveTask = async (taskId) => {
    try {
      await taskArchiveAPI.archiveTask(taskId);
      // Refresh the appropriate task list
      if (archiveView === 'archived') {
        fetchArchivedTasks();
      } else {
        fetchTasks();
      }
    } catch (error) {
      console.error('Error archiving task:', error);
    }
  };

  const handleUnarchiveTask = async (taskId) => {
    try {
      await taskArchiveAPI.unarchiveTask(taskId);
      // Refresh archived tasks
      fetchArchivedTasks();
    } catch (error) {
      console.error('Error unarchiving task:', error);
    }
  };

  // Get the appropriate task list based on archive view
  const currentTasks = archiveView === 'archived' ? archivedTasks : tasks;
  
  // Filter and sort tasks
  const getFilteredAndSortedTasks = () => {
    let filtered = archiveView === 'archived' ? 
      currentTasks.filter(task => {
        // Apply basic filters to archived tasks
        if (filters.status && task.status !== filters.status) return false;
        if (filters.priority && task.priority !== filters.priority) return false;
        if (filters.search) {
          const searchLower = filters.search.toLowerCase();
          return task.title.toLowerCase().includes(searchLower) ||
                 task.description?.toLowerCase().includes(searchLower) ||
                 task.assignee?.name.toLowerCase().includes(searchLower);
        }
        return true;
      }) : 
      getFilteredTasks();
    
    // Sorting is now handled in the taskStore
    return filtered;
  };
  
  const filteredTasks = getFilteredAndSortedTasks();

  return (
    <div 
      className="min-h-screen transition-colors duration-200"
      style={{ backgroundColor: 'var(--color-bg-primary)' }}
    >
      <div className="max-w-[95%] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 
                className="text-3xl font-bold transition-colors duration-200"
                style={{ color: 'var(--color-text-primary)' }}
              >
                Welcome back, {user?.name}!
              </h1>
              <p 
                className="mt-2 transition-colors duration-200"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                {user?.isPersonal 
                  ? 'Manage your personal tasks and stay organized'
                  : isAdmin() 
                    ? 'Manage all tasks and team assignments' 
                    : ''
                }
              </p>
            </div>
            <div className="flex items-center space-x-4">
              {/* ViewSwitcher removed - only card view is shown */}
              
              {/* Notification Board */}
              <NotificationBoard />
              
              <IconButton
                icon={<FaPlus />}
                label="Add New Task"
                variant="primary"
                onClick={handleAddTask}
              />
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="mb-4">
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8">
          <StatCard
            title="Total Tasks"
            value={stats.total}
            icon="📋"
            status="total"
            isActive={!filters.status || filters.status === ''}
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

        {/* Pending Invitations */}
        <PendingInvitations />

        {/* Filters */}
        <div className="mb-6">
          <TaskFilters 
            filters={filters}
            onFilterChange={setFilters}
            onClearFilters={clearFilters}
          />
        </div>

        {/* Tasks View */}
        <div 
          className="rounded-lg shadow-lg p-6 transition-colors duration-200"
          style={{ backgroundColor: 'var(--color-bg-secondary)' }}
        >
          <div className="flex justify-between items-center mb-6">
            <h2 
              className="text-xl font-semibold transition-colors duration-200"
              style={{ color: 'var(--color-text-primary)' }}
            >
              {archiveView === 'archived' ? 'Archived Tasks' : 'All Tasks'} ({filteredTasks.length})
            </h2>
            <ArchiveSwitcher 
              currentView={archiveView} 
              onViewChange={setArchiveView} 
            />
          </div>
          
          {filteredTasks.length === 0 ? (
            <div className="text-center py-12">
              <div 
                className="text-lg mb-2 transition-colors duration-200"
                style={{ color: 'var(--color-text-tertiary)' }}
              >
                No tasks found
              </div>
              <p 
                className="transition-colors duration-200"
                style={{ color: 'var(--color-text-muted)' }}
              >
                Try adjusting your filters or create a new task.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
              {filteredTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onStatusChange={handleStatusChange}
                  onPriorityChange={handlePriorityChange}
                  onDelete={handleDelete}
                  onArchive={handleArchiveTask}
                  onUnarchive={handleUnarchiveTask}
                />
              ))}
            </div>
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

      {/* Add Subtask Modal (No Parent) */}
      {isAddSubtaskModalOpen && (
        <AddSubtaskModal
          isOpen={isAddSubtaskModalOpen}
          onClose={() => {
            setIsAddSubtaskModalOpen(false);
            setSubtaskExtensionData(null);
          }}
          parentTask={null}
          extensionUpdateData={subtaskExtensionData}
        />
      )}

      {/* Task Selection Modal (when AI can't find task) */}
      {isTaskSelectionModalOpen && (
        <TaskSelectionModal
          isOpen={isTaskSelectionModalOpen}
          onClose={() => {
            setIsTaskSelectionModalOpen(false);
            setPendingUpdateData(null);
          }}
          onSelectTask={handleTaskSelected}
          updateContent={pendingUpdateData?.updateContent || pendingUpdateData?.originalText || ''}
          suggestedTaskId={pendingUpdateData?.taskFound && pendingUpdateData?.taskId ? pendingUpdateData.taskId : null}
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
          onArchive={handleArchiveTask}
          onUnarchive={handleUnarchiveTask}
          extensionUpdateData={extensionUpdateData}
          onTaskSwitch={extensionUpdateData?.taskFound ? handleTaskSwitch : null}
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
          <div 
            className="modal-box max-w-4xl max-h-[90vh] overflow-y-auto border transition-colors duration-200"
            style={{
              backgroundColor: 'var(--color-bg-secondary)',
              borderColor: 'var(--color-border-default)',
            }}
          >
            <div className="flex justify-between items-start mb-6">
              <h3 
                className="text-2xl font-bold transition-colors duration-200"
                style={{ color: 'var(--color-text-primary)' }}
              >
                Task Summary
              </h3>
              <IconButton
                icon={<FaTimes />}
                label="Close"
                iconOnly={true}
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsSummaryModalOpen(false);
                  setSummaryData(null);
                }}
                className="!p-2 !rounded-full"
              />
            </div>
            
            <div className="space-y-6">
              {/* Text Summary Section */}
              <div 
                className="rounded-lg p-4 transition-colors duration-200"
                style={{ backgroundColor: 'var(--color-bg-tertiary)' }}
              >
                <h4 
                  className="text-lg font-semibold mb-3 transition-colors duration-200"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  📋 Content Summary
                </h4>
                <div 
                  className="rounded p-3 whitespace-pre-line transition-colors duration-200"
                  style={{
                    backgroundColor: 'var(--color-bg-secondary)',
                    color: 'var(--color-text-secondary)',
                  }}
                >
                  {summaryData.textSummary}
                </div>
              </div>

              {/* Task Details Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h4 
                      className="text-lg font-semibold mb-3 transition-colors duration-200"
                      style={{ color: 'var(--color-text-primary)' }}
                    >
                      📊 Task Details
                    </h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span 
                          className="transition-colors duration-200"
                          style={{ color: 'var(--color-text-tertiary)' }}
                        >
                          Status:
                        </span>
                        <span 
                          className="transition-colors duration-200"
                          style={{ color: 'var(--color-text-primary)' }}
                        >
                          {summaryData.status}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span 
                          className="transition-colors duration-200"
                          style={{ color: 'var(--color-text-tertiary)' }}
                        >
                          Priority:
                        </span>
                        <span 
                          className="transition-colors duration-200"
                          style={{ color: 'var(--color-text-primary)' }}
                        >
                          {summaryData.priority}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span 
                          className="transition-colors duration-200"
                          style={{ color: 'var(--color-text-tertiary)' }}
                        >
                          Due Date:
                        </span>
                        <span 
                          className="transition-colors duration-200"
                          style={{ color: 'var(--color-text-primary)' }}
                        >
                          {summaryData.dueDate}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 
                      className="text-lg font-semibold mb-3 transition-colors duration-200"
                      style={{ color: 'var(--color-text-primary)' }}
                    >
                      👥 People
                    </h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span 
                          className="transition-colors duration-200"
                          style={{ color: 'var(--color-text-tertiary)' }}
                        >
                          Created by:
                        </span>
                        <span 
                          className="transition-colors duration-200"
                          style={{ color: 'var(--color-text-primary)' }}
                        >
                          {summaryData.createdBy}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span 
                          className="transition-colors duration-200"
                          style={{ color: 'var(--color-text-tertiary)' }}
                        >
                          Assigned to:
                        </span>
                        <span 
                          className="transition-colors duration-200"
                          style={{ color: 'var(--color-text-primary)' }}
                        >
                          {summaryData.assignedTo}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span 
                          className="transition-colors duration-200"
                          style={{ color: 'var(--color-text-tertiary)' }}
                        >
                          Created:
                        </span>
                        <span 
                          className="transition-colors duration-200"
                          style={{ color: 'var(--color-text-primary)' }}
                        >
                          {summaryData.createdAt}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Additional Info */}
              <div 
                className="rounded-lg p-4 transition-colors duration-200"
                style={{ backgroundColor: 'var(--color-bg-tertiary)' }}
              >
                <h4 
                  className="text-lg font-semibold mb-3 transition-colors duration-200"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  📈 Additional Information
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div 
                      className="text-2xl font-bold transition-colors duration-200"
                      style={{ color: 'var(--color-primary-light)' }}
                    >
                      {summaryData.comments}
                    </div>
                    <div 
                      className="text-sm transition-colors duration-200"
                      style={{ color: 'var(--color-text-tertiary)' }}
                    >
                      Comments
                    </div>
                  </div>
                  <div className="text-center">
                    <div 
                      className="text-2xl font-bold transition-colors duration-200"
                      style={{ color: 'var(--color-primary-light)' }}
                    >
                      {summaryData.subtasks}
                    </div>
                    <div 
                      className="text-sm transition-colors duration-200"
                      style={{ color: 'var(--color-text-tertiary)' }}
                    >
                      Subtasks
                    </div>
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