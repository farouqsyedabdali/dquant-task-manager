import { useState, useEffect } from 'react';
import useTaskStore from '../stores/taskStore';
import useAuthStore from '../context/authStore';
import { STATUS_LABELS, PRIORITY_LABELS } from '../utils/constants';
import TaskCard from '../components/tasks/TaskCard';
import AddTaskModal from '../components/tasks/AddTaskModal';
import TaskFilters from '../components/tasks/TaskFilters';

const Dashboard = () => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const { tasks, fetchTasks, deleteTask, updateTaskStatus, updateTaskPriority, filters, setFilters, clearFilters, getFilteredTasks } = useTaskStore();
  const { user, isAdmin } = useAuthStore();

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

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

  const filteredTasks = getFilteredTasks();

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
            {isAdmin() && (
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="btn bg-indigo-600 hover:bg-indigo-700 text-white border-0"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add New Task
              </button>
            )}
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

        {/* Priority Alerts */}
        {(stats.urgent > 0 || stats.high > 0) && (
          <div className="mb-8 space-y-3">
            {stats.urgent > 0 && (
              <div className="alert bg-red-900 border-red-700 text-red-200">
                <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <span>
                  <strong>{stats.urgent}</strong> urgent task{stats.urgent !== 1 ? 's' : ''} require{stats.urgent !== 1 ? '' : 's'} immediate attention
                </span>
              </div>
            )}
            {stats.high > 0 && (
              <div className="alert bg-orange-900 border-orange-700 text-orange-200">
                <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <span>
                  <strong>{stats.high}</strong> high priority task{stats.high !== 1 ? 's' : ''} need{stats.high !== 1 ? '' : 's'} attention
                </span>
              </div>
            )}
          </div>
        )}

        {/* Filters */}
        <div className="mb-6">
          <TaskFilters 
            filters={filters}
            onFilterChange={setFilters}
            onClearFilters={clearFilters}
          />
        </div>

        {/* Tasks Grid */}
        <div className="bg-gray-800 rounded-lg shadow-lg p-6">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-white">
              {isAdmin() ? 'All Tasks' : 'My Tasks'} ({filteredTasks.length})
            </h2>
          </div>
          
          {filteredTasks.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-lg mb-2">No tasks found</div>
              <p className="text-gray-500">Try adjusting your filters or create a new task.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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