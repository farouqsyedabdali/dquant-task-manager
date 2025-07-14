import { useState, useEffect } from 'react';
import useTaskStore from '../stores/taskStore';
import useAuthStore from '../context/authStore';
import { STATUS_LABELS, PRIORITY_LABELS } from '../utils/constants';
import TaskCard from '../components/tasks/TaskCard';
import TaskList from '../components/tasks/TaskList';
import AddTaskModal from '../components/tasks/AddTaskModal';
import TaskFilters from '../components/tasks/TaskFilters';
import ViewSwitcher from '../components/tasks/ViewSwitcher';

const Dashboard = () => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState(() => {
    // Get view mode from localStorage, default to 'cards'
    return localStorage.getItem('taskViewMode') || 'cards';
  });
  const [taskType, setTaskType] = useState('all');
  const { tasks, fetchTasks, fetchTasksByType, deleteTask, updateTaskStatus, updateTaskPriority, filters, setFilters, clearFilters, getFilteredTasks } = useTaskStore();
  const { user, isAdmin } = useAuthStore();

  useEffect(() => {
    if (taskType === 'all') {
      fetchTasks();
    } else {
      fetchTasksByType(taskType);
    }
  }, [fetchTasks, fetchTasksByType, taskType]);

  // Calculate statistics
  const stats = {
    total: tasks.length,
    todo: tasks.filter(task => task.status === 'TODO').length,
    inProgress: tasks.filter(task => task.status === 'IN_PROGRESS').length,
    completed: tasks.filter(task => task.status === 'COMPLETED').length,
    urgent: tasks.filter(task => task.priority === 'URGENT').length,
    high: tasks.filter(task => task.priority === 'HIGH').length
  };

  const StatCard = ({ title, value, icon }) => (
    <div className={`bg-gray-800 border border-gray-700 rounded-lg p-4 text-white`}>
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

  const handlePriorityChange = async (taskId, newPriority) => {
    await updateTaskPriority(taskId, newPriority);
  };

  const handleDelete = async (taskId) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      await deleteTask(taskId);
    }
  };

  const handleViewChange = (newView) => {
    setViewMode(newView);
    // Save view mode to localStorage
    localStorage.setItem('taskViewMode', newView);
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
              
              <button
                onClick={() => setIsAddModalOpen(true)}
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Tasks"
            value={stats.total}
            icon="📋"
          />
          <StatCard
            title="To Do"
            value={stats.todo}
            icon="⏳"
          />
          <StatCard
            title="In Progress"
            value={stats.inProgress}
            icon="🔄"
          />
          <StatCard
            title="Completed"
            value={stats.completed}
            icon="✅"
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
          onClose={() => setIsAddModalOpen(false)}
        />
      )}
    </div>
  );
};

export default Dashboard; 