import { STATUS_OPTIONS, PRIORITY_OPTIONS } from '../../utils/constants';

const TaskFilters = ({ filters, onFilterChange, onClearFilters }) => {
  const handleFilterChange = (key, value) => {
    onFilterChange({ [key]: value });
  };

  const hasActiveFilters = filters.status || filters.priority || filters.search;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Search */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Search
          </label>
          <input
            type="text"
            placeholder="Search tasks..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="input input-bordered w-full"
          />
        </div>

        {/* Status Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Status
          </label>
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="select select-bordered w-full"
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
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Priority
          </label>
          <select
            value={filters.priority}
            onChange={(e) => handleFilterChange('priority', e.target.value)}
            className="select select-bordered w-full"
          >
            <option value="">All Priorities</option>
            {PRIORITY_OPTIONS.map(({ value, label }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        {/* Clear Filters */}
        <div className="flex items-end">
          <button
            onClick={onClearFilters}
            disabled={!hasActiveFilters}
            className="btn btn-outline w-full"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="mt-4 flex flex-wrap gap-2">
          {filters.search && (
            <div className="badge badge-primary gap-2">
              Search: {filters.search}
              <button
                onClick={() => handleFilterChange('search', '')}
                className="btn btn-ghost btn-xs"
              >
                ✕
              </button>
            </div>
          )}
          {filters.status && (
            <div className="badge badge-secondary gap-2">
              Status: {STATUS_OPTIONS.find(opt => opt.value === filters.status)?.label}
              <button
                onClick={() => handleFilterChange('status', '')}
                className="btn btn-ghost btn-xs"
              >
                ✕
              </button>
            </div>
          )}
          {filters.priority && (
            <div className="badge badge-accent gap-2">
              Priority: {PRIORITY_OPTIONS.find(opt => opt.value === filters.priority)?.label}
              <button
                onClick={() => handleFilterChange('priority', '')}
                className="btn btn-ghost btn-xs"
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