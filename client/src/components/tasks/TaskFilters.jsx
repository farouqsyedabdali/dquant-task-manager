import { STATUS_OPTIONS, PRIORITY_OPTIONS } from '../../utils/constants';

const TaskFilters = ({ filters, onFilterChange, onClearFilters }) => {
  const handleFilterChange = (key, value) => {
    onFilterChange({ [key]: value });
  };

  const hasActiveFilters = filters.status || filters.priority || filters.search || filters.dueDateFilter || filters.taskType;

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-lg p-6">
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        {/* Search */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Search
          </label>
          <input
            type="text"
            placeholder="Search tasks..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="input bg-gray-700 border-gray-600 text-white placeholder-gray-400 w-full focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>

        {/* Status Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Status
          </label>
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="select bg-gray-700 border-gray-600 text-white w-full focus:border-indigo-500 focus:ring-indigo-500"
          >
            <option value="">All Statuses</option>
            {STATUS_OPTIONS.map(({ value, label }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        {/* Priority Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Priority
          </label>
          <select
            value={filters.priority}
            onChange={(e) => handleFilterChange('priority', e.target.value)}
            className="select bg-gray-700 border-gray-600 text-white w-full focus:border-indigo-500 focus:ring-indigo-500"
          >
            <option value="">All Priorities</option>
            {PRIORITY_OPTIONS.map(({ value, label }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        {/* Due Date Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Due Date
          </label>
          <select
            value={filters.dueDateFilter}
            onChange={(e) => handleFilterChange('dueDateFilter', e.target.value)}
            className="select bg-gray-700 border-gray-600 text-white w-full focus:border-indigo-500 focus:ring-indigo-500"
          >
            <option value="">All Due Dates</option>
            <option value="overdue">Overdue</option>
            <option value="due-today">Due Today</option>
            <option value="due-this-week">Due This Week</option>
            <option value="due-this-month">Due This Month</option>
            <option value="no-due-date">No Due Date</option>
          </select>
        </div>

        {/* Shared Tasks Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Task Type
          </label>
          <select
            value={filters.taskType || ''}
            onChange={(e) => handleFilterChange('taskType', e.target.value)}
            className="select bg-gray-700 border-gray-600 text-white w-full focus:border-indigo-500 focus:ring-indigo-500"
          >
            <option value="">All Tasks</option>
            <option value="shared">Shared with me</option>
            <option value="assigned">Assigned to me</option>
            <option value="created">Created by me</option>
          </select>
        </div>

        {/* Clear Filters */}
        <div className="flex items-end">
          <button
            onClick={onClearFilters}
            disabled={!hasActiveFilters}
            className="btn bg-gray-700 hover:bg-gray-600 text-white border-gray-600 w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="mt-4 flex flex-wrap gap-2">
          {filters.search && (
            <div className="badge bg-indigo-600 text-white gap-2 border-0">
              Search: {filters.search}
              <button
                onClick={() => handleFilterChange('search', '')}
                className="btn btn-ghost btn-xs text-white hover:bg-indigo-700"
              >
                ✕
              </button>
            </div>
          )}
          {filters.status && (
            <div className="badge bg-blue-600 text-white gap-2 border-0">
              Status: {STATUS_OPTIONS.find(opt => opt.value === filters.status)?.label}
              <button
                onClick={() => handleFilterChange('status', '')}
                className="btn btn-ghost btn-xs text-white hover:bg-blue-700"
              >
                ✕
              </button>
            </div>
          )}
          {filters.priority && (
            <div className="badge bg-orange-600 text-white gap-2 border-0">
              Priority: {PRIORITY_OPTIONS.find(opt => opt.value === filters.priority)?.label}
              <button
                onClick={() => handleFilterChange('priority', '')}
                className="btn btn-ghost btn-xs text-white hover:bg-orange-700"
              >
                ✕
              </button>
            </div>
          )}
          {filters.dueDateFilter && (
            <div className="badge bg-purple-600 text-white gap-2 border-0">
              Due Date: {filters.dueDateFilter === 'overdue' ? 'Overdue' : 
                         filters.dueDateFilter === 'due-today' ? 'Due Today' :
                         filters.dueDateFilter === 'due-this-week' ? 'Due This Week' :
                         filters.dueDateFilter === 'due-this-month' ? 'Due This Month' :
                         filters.dueDateFilter === 'no-due-date' ? 'No Due Date' : filters.dueDateFilter}
              <button
                onClick={() => handleFilterChange('dueDateFilter', '')}
                className="btn btn-ghost btn-xs text-white hover:bg-purple-700"
              >
                ✕
              </button>
            </div>
          )}
          {filters.taskType && (
            <div className="badge bg-green-600 text-white gap-2 border-0">
              Type: {filters.taskType === 'shared' ? 'Shared with me' :
                     filters.taskType === 'assigned' ? 'Assigned to me' :
                     filters.taskType === 'created' ? 'Created by me' : filters.taskType}
              <button
                onClick={() => handleFilterChange('taskType', '')}
                className="btn btn-ghost btn-xs text-white hover:bg-green-700"
              >
                ✕
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TaskFilters; 