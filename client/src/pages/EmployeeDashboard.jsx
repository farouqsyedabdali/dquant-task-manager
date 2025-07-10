import { useState, useEffect } from 'react';
import useTaskStore from '../stores/taskStore';
import useAuthStore from '../context/authStore';
import { STATUS_LABELS, PRIORITY_LABELS } from '../utils/constants';
import TaskCard from '../components/tasks/TaskCard';
import TaskList from '../components/tasks/TaskList';
import TaskFilters from '../components/tasks/TaskFilters';
import ViewSwitcher from '../components/tasks/ViewSwitcher';

const EmployeeDashboard = () => {
  const [viewMode, setViewMode] = useState('cards'); // 'cards' or 'list'
  const { tasks, fetchTasks, updateTaskStatus, updateTaskPriority, filters, setFilters, clearFilters, getFilteredTasks } = useTaskStore();
  const { user } = useAuthStore();

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Filter tasks to only show those assigned to the current user
  const myTasks = tasks.filter(task => task.assignedTo?.id === user?.id);

  // Calculate statistics for my tasks
  const stats = {
    total: myTasks.length,
    todo: myTasks.filter(task => task.status === 'TODO').length,
    inProgress: myTasks.filter(task => task.status === 'IN_PROGRESS').length,
    completed: myTasks.filter(task => task.status === 'COMPLETED').length,
    urgent: myTasks.filter(task => task.priority === 'URGENT').length,
    high: myTasks.filter(task => task.priority === 'HIGH').length
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

  const handleViewChange = (newView) => {
    setViewMode(newView);
  };

  // Get filtered tasks but only show my tasks
  const allFilteredTasks = getFilteredTasks();
  const filteredMyTasks = allFilteredTasks.filter(task => task.assignedTo?.id === user?.id);

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="max-w-[95%] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-white">
                My Tasks
              </h1>
              <p className="text-gray-400 mt-2">
                View and update your assigned tasks
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <ViewSwitcher 
                currentView={viewMode} 
                onViewChange={handleViewChange} 
              />
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="My Tasks"
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

        {/* Tasks View */}
        <div className="bg-gray-800 rounded-lg shadow-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-white">
              My Tasks ({filteredMyTasks.length})
            </h2>
          </div>
          
          {filteredMyTasks.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-lg mb-2">No tasks assigned to you</div>
              <p className="text-gray-500">You don't have any tasks assigned yet.</p>
            </div>
          ) : viewMode === 'cards' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
              {filteredMyTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onStatusChange={handleStatusChange}
                  onPriorityChange={handlePriorityChange}
                  onDelete={null} // Employees can't delete tasks
                />
              ))}
            </div>
          ) : (
            <TaskList
              tasks={filteredMyTasks}
              onStatusChange={handleStatusChange}
              onPriorityChange={handlePriorityChange}
              onDelete={null} // Employees can't delete tasks
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default EmployeeDashboard;
