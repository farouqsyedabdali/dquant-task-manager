import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import useTaskStore from '../stores/taskStore';
import useAuthStore from '../context/authStore';
import { STATUS_LABELS, PRIORITY_LABELS } from '../utils/constants';
import { commentsAPI, taskArchiveAPI } from '../services/api';
import TaskCard from '../components/tasks/TaskCard';
import TaskList from '../components/tasks/TaskList';
import AddTaskModal from '../components/tasks/AddTaskModal';
import TaskModal from '../components/tasks/TaskModal';
import TaskFilters from '../components/tasks/TaskFilters';
import ViewSwitcher from '../components/tasks/ViewSwitcher';
import ArchiveSwitcher from '../components/tasks/ArchiveSwitcher';
import DeleteConfirmModal from '../components/common/DeleteConfirmModal';
import NotificationBoard from '../components/notifications/NotificationBoard';

const PersonalDashboard = () => {
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

  // Load tasks on component mount
  useEffect(() => {
    if (taskType === 'all') {
      fetchTasks();
    } else {
      fetchTasksByType(taskType);
    }
  }, [taskType, fetchTasks, fetchTasksByType]);

  // Fetch archived tasks when switching to archived view
  useEffect(() => {
    if (archiveView === 'archived') {
      fetchArchivedTasks();
    }
  }, [archiveView]);

  // Handle extension messages
  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data.type === 'TASK_UPDATE') {
        handleTaskUpdate(event.data);
      } else if (event.data.type === 'TASK_COMPLETE') {
        handleTaskComplete(event.data);
      } else if (event.data.type === 'ADD_SUBTASK') {
        handleAddSubtask(event.data);
      } else if (event.data.type === 'SUMMARIZE_TASK') {
        handleSummarizeTask(event.data);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
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
  const handleTaskComplete = async (completeData) => {
    console.log('Processing task completion:', completeData);
    
    if (completeData.taskFound && completeData.taskId) {
      // Ask user for confirmation before completing
      const confirmed = window.confirm(`Complete task: "${completeData.taskTitle}"?`);
      
      if (confirmed) {
        try {
          // Update task status to completed
          const result = await updateTaskStatus(completeData.taskId, 'COMPLETED');
          if (result.success) {
            console.log('Task completed successfully');
            // Refresh the appropriate task list
            if (taskType === 'all') {
              fetchTasks();
            } else {
              fetchTasksByType(taskType);
            }
          } else {
            console.error('Failed to complete task:', result.error);
            alert('Failed to complete task. Please try again.');
            // Still open modal for manual completion
            setExtensionUpdateData(completeData);
            setIsTaskModalOpen(true);
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

  // Function to handle subtask addition from extension
  const handleAddSubtask = async (addSubtaskData) => {
    console.log('Processing subtask addition:', addSubtaskData);
    
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
  const handleSummarizeTask = async (summarizeData) => {
    console.log('Processing task summarization:', summarizeData);
    
    if (summarizeData.taskFound && summarizeData.taskId) {
      try {
        // Fetch the specific task to summarize
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

  // Create a comprehensive task summary
  const createTaskSummary = async (task) => {
    let summary = {
      title: task.title,
      status: task.status,
      priority: task.priority,
      description: task.description || 'No description',
      dueDate: task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date',
      createdAt: new Date(task.createdAt).toLocaleDateString(),
      assignee: task.assignee?.name || 'Unassigned',
      comments: []
    };

    // Fetch comments for the task
    try {
      const commentsResponse = await commentsAPI.getComments(task.id);
      if (commentsResponse.data) {
        summary.comments = commentsResponse.data.map(comment => ({
          author: comment.author?.name || 'Unknown',
          content: comment.content,
          createdAt: new Date(comment.createdAt).toLocaleDateString()
        }));
      }
    } catch (error) {
      console.error('Failed to fetch comments:', error);
    }

    return summary;
  };

  // Handle task status change
  const handleStatusChange = async (taskId, newStatus) => {
    const result = await updateTaskStatus(taskId, newStatus);
    if (result.success) {
      // Refresh the appropriate task list
      if (taskType === 'all') {
        fetchTasks();
      } else {
        fetchTasksByType(taskType);
      }
    }
  };

  // Handle task priority change
  const handlePriorityChange = async (taskId, newPriority) => {
    const result = await updateTaskPriority(taskId, newPriority);
    if (result.success) {
      // Refresh the appropriate task list
      if (taskType === 'all') {
        fetchTasks();
      } else {
        fetchTasksByType(taskType);
      }
    }
  };

  // Handle task deletion
  const handleDelete = (taskId) => {
    setDeleteTaskId(taskId);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (deleteTaskId) {
      const result = await deleteTask(deleteTaskId);
      if (result.success) {
        // Refresh the appropriate task list
        if (taskType === 'all') {
          fetchTasks();
        } else {
          fetchTasksByType(taskType);
        }
      }
    }
    setDeleteTaskId(null);
    setIsDeleteModalOpen(false);
  };

  // Handle archive/unarchive actions
  const handleArchiveTask = async (taskId) => {
    try {
      await taskArchiveAPI.archiveTask(taskId);
      // Refresh the appropriate task list
      if (archiveView === 'archived') {
        fetchArchivedTasks();
      } else {
        if (taskType === 'all') {
          fetchTasks();
        } else {
          fetchTasksByType(taskType);
        }
      }
    } catch (error) {
      console.error('Failed to archive task:', error);
      alert('Failed to archive task. Please try again.');
    }
  };

  const handleUnarchiveTask = async (taskId) => {
    try {
      await taskArchiveAPI.unarchiveTask(taskId);
      // Refresh the appropriate task list
      if (archiveView === 'archived') {
        fetchArchivedTasks();
      } else {
        if (taskType === 'all') {
          fetchTasks();
        } else {
          fetchTasksByType(taskType);
        }
      }
    } catch (error) {
      console.error('Failed to unarchive task:', error);
      alert('Failed to unarchive task. Please try again.');
    }
  };

  // Handle filter changes
  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

  // Handle task type change
  const handleTaskTypeChange = (type) => {
    setTaskType(type);
    if (type === 'all') {
      fetchTasks();
    } else {
      fetchTasksByType(type);
    }
  };

  // Handle view mode change
  const handleViewModeChange = (mode) => {
    setViewMode(mode);
    localStorage.setItem('taskViewMode', mode);
  };

  // Handle archive view change
  const handleArchiveViewChange = (view) => {
    setArchiveView(view);
  };

  // Handle task click
  const handleTaskClick = (task) => {
    setCurrentTask(task);
    setIsTaskModalOpen(true);
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

  // Get the appropriate task list based on archive view
  const currentTasks = archiveView === 'archived' ? archivedTasks : tasks;
  
  // Filter and sort tasks
  const getFilteredAndSortedTasks = () => {
    let filtered = archiveView === 'archived' ? 
      currentTasks.filter(task => {
        // Apply basic filters to archived tasks
        if (filters.search) {
          const searchLower = filters.search.toLowerCase();
          if (!task.title.toLowerCase().includes(searchLower) && 
              !(task.description && task.description.toLowerCase().includes(searchLower))) {
            return false;
          }
        }
        return true;
      }) : 
      getFilteredTasks();
    
    // Sorting is now handled in the taskStore
    return filtered;
  };
  
  const filteredTasks = getFilteredAndSortedTasks();

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">CN</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Personal Task Manager</h1>
              <p className="text-gray-400 text-sm">Welcome back, {user?.name}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <NotificationBoard />
            <div className="flex items-center space-x-2">
              <span className="text-gray-400 text-sm">Welcome, {user?.name}</span>
              <button
                onClick={() => {
                  localStorage.removeItem('token');
                  localStorage.removeItem('user');
                  navigate('/login');
                }}
                className="btn btn-ghost text-gray-400 hover:text-white"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Filters */}
        <div className="mb-6">
          <TaskFilters
            filters={filters}
            onFilterChange={handleFilterChange}
            onClearFilters={clearFilters}
          />
        </div>

        {/* Task List Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <h2 className="text-xl font-semibold text-white">
              {archiveView === 'archived' ? 'Archived Tasks' : 'All Tasks'} ({filteredTasks.length})
            </h2>
            <ViewSwitcher
              currentView={viewMode}
              onViewChange={handleViewModeChange}
            />
          </div>
          
          <div className="flex items-center space-x-4">
            <ArchiveSwitcher
              currentView={archiveView}
              onViewChange={handleArchiveViewChange}
            />
            <button
              onClick={handleAddTask}
              className="btn bg-indigo-600 hover:bg-indigo-700 text-white border-0"
            >
              + Add Task
            </button>
          </div>
        </div>

        {/* Task List */}
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
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
                  onArchive={handleArchiveTask}
                  onUnarchive={handleUnarchiveTask}
                />
              ))}
            </div>
          ) : (
            <TaskList
              tasks={filteredTasks}
              onStatusChange={handleStatusChange}
              onPriorityChange={handlePriorityChange}
              onDelete={handleDelete}
              onArchive={handleArchiveTask}
              onUnarchive={handleUnarchiveTask}
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
          onArchive={handleArchiveTask}
          onUnarchive={handleUnarchiveTask}
          extensionUpdateData={extensionUpdateData}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteTaskId && (
        <DeleteConfirmModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={confirmDelete}
          title="Delete Task"
          message="Are you sure you want to delete this task? This action cannot be undone."
        />
      )}
    </div>
  );
};

export default PersonalDashboard;
