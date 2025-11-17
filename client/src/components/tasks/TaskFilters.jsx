import { STATUS_OPTIONS, PRIORITY_OPTIONS, SORT_OPTIONS } from '../../utils/constants';
import useAuthStore from '../../context/authStore';
import IconButton from '../common/IconButton';
import { FaSearch, FaCheckCircle, FaFlag, FaCalendar, FaFilter, FaSort, FaTimes } from 'react-icons/fa';

const TaskFilters = ({ filters, onFilterChange, onClearFilters }) => {
  const { user } = useAuthStore();
  
  // Check if this is a personal account
  const isPersonalAccount = user?.isPersonal || false;
  const handleFilterChange = (key, value) => {
    onFilterChange({ [key]: value });
  };

  const hasActiveFilters = filters.status || filters.priority || filters.search || filters.dueDateFilter || filters.taskType || filters.sortBy;

  return (
    <div 
      className="border rounded-lg shadow-lg p-6 transition-colors duration-200"
      style={{
        backgroundColor: 'var(--color-bg-secondary)',
        borderColor: 'var(--color-border-default)',
      }}
    >
      <div className={`grid grid-cols-1 gap-4 ${isPersonalAccount ? 'md:grid-cols-6' : 'md:grid-cols-7'}`}>
        {/* Search */}
        <div>
          <label 
            className="block text-sm font-medium mb-2 flex items-center space-x-2 transition-colors duration-200"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            <FaSearch className="w-4 h-4" />
            <span>Search</span>
          </label>
          <div className="relative">
            <FaSearch 
              className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 transition-colors duration-200"
              style={{ color: 'var(--color-text-tertiary)' }}
            />
            <input
              type="text"
              placeholder="Search tasks..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="input w-full h-10 pl-10 transition-colors duration-200"
              style={{
                backgroundColor: 'var(--color-bg-tertiary)',
                borderColor: 'var(--color-border-default)',
                color: 'var(--color-text-primary)',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = 'var(--color-primary)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'var(--color-border-default)';
              }}
            />
          </div>
        </div>

        {/* Status Filter */}
        <div>
          <label 
            className="block text-sm font-medium mb-2 flex items-center space-x-2 transition-colors duration-200"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            <FaCheckCircle className="w-4 h-4" />
            <span>Status</span>
          </label>
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="select w-full h-10 transition-colors duration-200"
            style={{
              backgroundColor: 'var(--color-bg-tertiary)',
              borderColor: 'var(--color-border-default)',
              color: 'var(--color-text-primary)',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = 'var(--color-primary)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'var(--color-border-default)';
            }}
          >
            <option value="">All Statuses</option>
            <option value="TODO,IN_PROGRESS">Active Tasks (To Do + In Progress)</option>
            {STATUS_OPTIONS.map(({ value, label }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        {/* Priority Filter */}
        <div>
          <label 
            className="block text-sm font-medium mb-2 flex items-center space-x-2 transition-colors duration-200"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            <FaFlag className="w-4 h-4" />
            <span>Priority</span>
          </label>
          <select
            value={filters.priority}
            onChange={(e) => handleFilterChange('priority', e.target.value)}
            className="select w-full h-10 transition-colors duration-200"
            style={{
              backgroundColor: 'var(--color-bg-tertiary)',
              borderColor: 'var(--color-border-default)',
              color: 'var(--color-text-primary)',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = 'var(--color-primary)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'var(--color-border-default)';
            }}
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
          <label 
            className="block text-sm font-medium mb-2 flex items-center space-x-2 transition-colors duration-200"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            <FaCalendar className="w-4 h-4" />
            <span>Due Date</span>
          </label>
          <select
            value={filters.dueDateFilter}
            onChange={(e) => handleFilterChange('dueDateFilter', e.target.value)}
            className="select w-full h-10 transition-colors duration-200"
            style={{
              backgroundColor: 'var(--color-bg-tertiary)',
              borderColor: 'var(--color-border-default)',
              color: 'var(--color-text-primary)',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = 'var(--color-primary)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'var(--color-border-default)';
            }}
          >
            <option value="">All Due Dates</option>
            <option value="overdue">Overdue</option>
            <option value="due-today">Due Today</option>
            <option value="due-this-week">Due This Week</option>
            <option value="due-this-month">Due This Month</option>
            <option value="no-due-date">No Due Date</option>
          </select>
        </div>

        {/* Task Type Filter - Only show for company accounts */}
        {!isPersonalAccount && (
          <div>
            <label 
              className="block text-sm font-medium mb-2 flex items-center space-x-2 transition-colors duration-200"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              <FaFilter className="w-4 h-4" />
              <span>Task Type</span>
            </label>
            <select
              value={filters.taskType || ''}
              onChange={(e) => handleFilterChange('taskType', e.target.value)}
              className="select w-full h-10 transition-colors duration-200"
              style={{
                backgroundColor: 'var(--color-bg-tertiary)',
                borderColor: 'var(--color-border-default)',
                color: 'var(--color-text-primary)',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = 'var(--color-primary)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'var(--color-border-default)';
              }}
            >
              <option value="">All Tasks</option>
              <option value="shared">Shared with me</option>
              <option value="assigned">Assigned to me</option>
              <option value="created">Created by me</option>
            </select>
          </div>
        )}

        {/* Sort By Filter */}
        <div>
          <label 
            className="block text-sm font-medium mb-2 flex items-center space-x-2 transition-colors duration-200"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            <FaSort className="w-4 h-4" />
            <span>Sort By</span>
          </label>
          <select
            value={filters.sortBy || 'urgency'}
            onChange={(e) => handleFilterChange('sortBy', e.target.value)}
            className="select w-full h-10 transition-colors duration-200"
            style={{
              backgroundColor: 'var(--color-bg-tertiary)',
              borderColor: 'var(--color-border-default)',
              color: 'var(--color-text-primary)',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = 'var(--color-primary)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'var(--color-border-default)';
            }}
          >
            {SORT_OPTIONS.map(({ value, label }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        {/* Clear Filters */}
        <div className="flex items-end">
          <IconButton
            icon={<FaTimes />}
            label="Clear Filters"
            variant="secondary"
            onClick={onClearFilters}
            disabled={!hasActiveFilters}
            className="w-full h-10"
          />
        </div>
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="mt-4 flex flex-wrap gap-2">
          {filters.search && (
            <div className="status-badge bg-indigo-600 text-white gap-2 border-0 flex items-center">
              Search: {filters.search}
              <IconButton
                icon={<FaTimes />}
                label="Remove search filter"
                iconOnly={true}
                variant="ghost"
                size="sm"
                onClick={() => handleFilterChange('search', '')}
                className="!text-white hover:!bg-indigo-700 !p-1 !ml-1"
              />
            </div>
          )}
          {filters.status && (
            <div className="status-badge bg-blue-600 text-white gap-2 border-0 flex items-center">
              Status: {filters.status.includes(',') 
                ? filters.status.split(',').map(s => STATUS_OPTIONS.find(opt => opt.value === s.trim())?.label).join(', ')
                : STATUS_OPTIONS.find(opt => opt.value === filters.status)?.label}
              <IconButton
                icon={<FaTimes />}
                label="Remove status filter"
                iconOnly={true}
                variant="ghost"
                size="sm"
                onClick={() => handleFilterChange('status', '')}
                className="!text-white hover:!bg-blue-700 !p-1 !ml-1"
              />
            </div>
          )}
          {filters.priority && (
            <div className="status-badge bg-orange-600 text-white gap-2 border-0 flex items-center">
              Priority: {PRIORITY_OPTIONS.find(opt => opt.value === filters.priority)?.label}
              <IconButton
                icon={<FaTimes />}
                label="Remove priority filter"
                iconOnly={true}
                variant="ghost"
                size="sm"
                onClick={() => handleFilterChange('priority', '')}
                className="!text-white hover:!bg-orange-700 !p-1 !ml-1"
              />
            </div>
          )}
          {filters.dueDateFilter && (
            <div className="status-badge bg-purple-600 text-white gap-2 border-0 flex items-center">
              Due Date: {filters.dueDateFilter === 'overdue' ? 'Overdue' : 
                         filters.dueDateFilter === 'due-today' ? 'Due Today' :
                         filters.dueDateFilter === 'due-this-week' ? 'Due This Week' :
                         filters.dueDateFilter === 'due-this-month' ? 'Due This Month' :
                         filters.dueDateFilter === 'no-due-date' ? 'No Due Date' : filters.dueDateFilter}
              <IconButton
                icon={<FaTimes />}
                label="Remove due date filter"
                iconOnly={true}
                variant="ghost"
                size="sm"
                onClick={() => handleFilterChange('dueDateFilter', '')}
                className="!text-white hover:!bg-purple-700 !p-1 !ml-1"
              />
            </div>
          )}
          {filters.taskType && (
            <div className="status-badge bg-green-600 text-white gap-2 border-0 flex items-center">
              Type: {filters.taskType === 'shared' ? 'Shared with me' :
                     filters.taskType === 'assigned' ? 'Assigned to me' :
                     filters.taskType === 'created' ? 'Created by me' : filters.taskType}
              <IconButton
                icon={<FaTimes />}
                label="Remove task type filter"
                iconOnly={true}
                variant="ghost"
                size="sm"
                onClick={() => handleFilterChange('taskType', '')}
                className="!text-white hover:!bg-green-700 !p-1 !ml-1"
              />
            </div>
          )}
          {filters.sortBy && filters.sortBy !== 'urgency' && (
            <div className="status-badge bg-yellow-600 text-white gap-2 border-0 flex items-center">
              Sort: {SORT_OPTIONS.find(opt => opt.value === filters.sortBy)?.label}
              <IconButton
                icon={<FaTimes />}
                label="Remove sort filter"
                iconOnly={true}
                variant="ghost"
                size="sm"
                onClick={() => handleFilterChange('sortBy', 'urgency')}
                className="!text-white hover:!bg-yellow-700 !p-1 !ml-1"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TaskFilters; 