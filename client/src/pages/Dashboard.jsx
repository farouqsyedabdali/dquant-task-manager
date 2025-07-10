import { useState, useEffect } from 'react';
import useTaskStore from '../stores/taskStore';
import useAuthStore from '../context/authStore';
import { STATUS_LABELS, PRIORITY_LABELS } from '../utils/constants';
import TaskTable from '../components/tasks/TaskTable';
import AddTaskModal from '../components/tasks/AddTaskModal';

const Dashboard = () => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const { tasks, fetchTasks } = useTaskStore();
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

  const StatCard = ({ title, value, color, icon }) => (
    <div className={`stat bg-${color} text-${color}-content rounded-lg`}>
      <div className="stat-figure text-3xl">{icon}</div>
      <div className="stat-title text-black">{title}</div>
      <div className="stat-value text-black">{value}</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Welcome back, {user?.name}!
              </h1>
              <p className="text-gray-600 mt-2">
                {isAdmin() ? 'Manage all tasks and team assignments' : 'View and update your assigned tasks'}
              </p>
            </div>
            {isAdmin() && (
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="btn btn-primary"
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
            color="blue"
            icon="📋"
          />
          <StatCard
            title="To Do"
            value={stats.todo}
            color="yellow"
            icon="⏳"
          />
          <StatCard
            title="In Progress"
            value={stats.inProgress}
            color="info"
            icon="🔄"
          />
          <StatCard
            title="Completed"
            value={stats.completed}
            color="success"
            icon="✅"
          />
        </div>

        {/* Priority Alerts */}
        {(stats.urgent > 0 || stats.high > 0) && (
          <div className="mb-8 space-y-3">
            {stats.urgent > 0 && (
              <div className="alert alert-error">
                <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <span>
                  <strong>{stats.urgent}</strong> urgent task{stats.urgent !== 1 ? 's' : ''} require{stats.urgent !== 1 ? '' : 's'} immediate attention
                </span>
              </div>
            )}
            {stats.high > 0 && (
              <div className="alert alert-warning">
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

        {/* Tasks Table */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              {isAdmin() ? 'All Tasks' : 'My Tasks'}
            </h2>
          </div>
          <div className="p-6">
            <TaskTable />
          </div>
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