import { useState, useEffect, useRef, useCallback } from 'react';
import { STATUS_OPTIONS, PRIORITY_OPTIONS, SORT_OPTIONS } from '../../utils/constants';
import useAuthStore from '../../context/authStore';
import IconButton from '../common/IconButton';
import { FaSearch, FaCheckCircle, FaFlag, FaCalendar, FaFilter, FaSort, FaTimes, FaChevronRight } from 'react-icons/fa';
import { projectsAPI } from '../../services/api';

const TaskFilters = ({ filters, onFilterChange, onClearFilters }) => {
  const { user } = useAuthStore();

  // Check if this is a personal account
  const isPersonalAccount = user?.isPersonal || false;
  const [isTaskTypeDropdownOpen, setIsTaskTypeDropdownOpen] = useState(false);
  const [isProjectsSubmenuOpen, setIsProjectsSubmenuOpen] = useState(false);
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const [isPriorityDropdownOpen, setIsPriorityDropdownOpen] = useState(false);
  const [isDueDateDropdownOpen, setIsDueDateDropdownOpen] = useState(false);
  const [isSortByDropdownOpen, setIsSortByDropdownOpen] = useState(false);
  const [projects, setProjects] = useState([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  const taskTypeDropdownRef = useRef(null);
  const projectsSubmenuRef = useRef(null);
  const statusDropdownRef = useRef(null);
  const priorityDropdownRef = useRef(null);
  const dueDateDropdownRef = useRef(null);
  const sortByDropdownRef = useRef(null);
  const projectsSubmenuTimeoutRef = useRef(null);

  // Fetch projects when dropdown opens
  useEffect(() => {
    if (isTaskTypeDropdownOpen && projects.length === 0 && !isLoadingProjects) {
      setIsLoadingProjects(true);
      projectsAPI.getAll()
        .then(response => {
          setProjects(response.data || []);
        })
        .catch(error => {
          console.error('Error fetching projects:', error);
        })
        .finally(() => {
          setIsLoadingProjects(false);
        });
    }
  }, [isTaskTypeDropdownOpen, isPersonalAccount]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      const clickedInTaskType = taskTypeDropdownRef.current?.contains(event.target);
      const clickedInSubmenu = projectsSubmenuRef.current?.contains(event.target);
      const clickedInStatus = statusDropdownRef.current?.contains(event.target);
      const clickedInPriority = priorityDropdownRef.current?.contains(event.target);
      const clickedInDueDate = dueDateDropdownRef.current?.contains(event.target);
      const clickedInSortBy = sortByDropdownRef.current?.contains(event.target);

      if (!clickedInTaskType && !clickedInSubmenu && !clickedInStatus && !clickedInPriority && !clickedInDueDate && !clickedInSortBy) {
        setIsTaskTypeDropdownOpen(false);
        setIsProjectsSubmenuOpen(false);
        setIsStatusDropdownOpen(false);
        setIsPriorityDropdownOpen(false);
        setIsDueDateDropdownOpen(false);
        setIsSortByDropdownOpen(false);
        if (projectsSubmenuTimeoutRef.current) {
          clearTimeout(projectsSubmenuTimeoutRef.current);
        }
      }
    };

    const anyDropdownOpen = isTaskTypeDropdownOpen || isStatusDropdownOpen || isPriorityDropdownOpen || isDueDateDropdownOpen || isSortByDropdownOpen;

    if (anyDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        if (projectsSubmenuTimeoutRef.current) {
          clearTimeout(projectsSubmenuTimeoutRef.current);
        }
      };
    }
  }, [isTaskTypeDropdownOpen, isStatusDropdownOpen, isPriorityDropdownOpen, isDueDateDropdownOpen, isSortByDropdownOpen]);

  const handleFilterChange = (key, value) => {
    onFilterChange({ [key]: value });
  };

  const handleTaskTypeSelect = (taskType) => {
    if (taskType === 'projects') {
      // Don't close dropdown, just show submenu
      setIsProjectsSubmenuOpen(true);
    } else {
      handleFilterChange('taskType', taskType);
      handleFilterChange('selectedProjectId', ''); // Clear project filter
      setIsTaskTypeDropdownOpen(false);
      setIsProjectsSubmenuOpen(false);
    }
  };

  const handleProjectSelect = (projectId) => {
    handleFilterChange('taskType', 'projects');
    handleFilterChange('selectedProjectId', projectId);
    setIsTaskTypeDropdownOpen(false);
    setIsProjectsSubmenuOpen(false);
  };

  const getTaskTypeLabel = () => {
    if (!filters.taskType) return 'All Tasks';
    if (filters.taskType === 'shared') return 'Shared with me';
    if (filters.taskType === 'assigned') return 'Assigned to me';
    if (filters.taskType === 'created') return 'Created by me';
    if (filters.taskType === 'projects') {
      if (filters.selectedProjectId) {
        const project = projects.find(p => p.id === parseInt(filters.selectedProjectId));
        return project ? project.name : 'Projects and Events only';
      }
      return 'Projects and Events only';
    }
    return 'All Tasks';
  };

  const getStatusLabel = () => {
    if (!filters.status) return 'All Statuses';
    if (filters.status === 'TODO,IN_PROGRESS') return 'Tasks on Hand (To Do and In Progress)';
    const statusOption = STATUS_OPTIONS.find(opt => opt.value === filters.status);
    return statusOption ? statusOption.label : filters.status;
  };

  const getPriorityLabel = () => {
    if (!filters.priority) return 'All Priorities';
    const priorityOption = PRIORITY_OPTIONS.find(opt => opt.value === filters.priority);
    return priorityOption ? priorityOption.label : filters.priority;
  };

  const getDueDateLabel = () => {
    if (!filters.dueDateFilter) return 'All Due Dates';
    const labels = {
      'overdue': 'Overdue',
      'due-today': 'Due Today',
      'due-this-week': 'Due This Week',
      'due-this-month': 'Due This Month',
      'no-due-date': 'No Due Date'
    };
    return labels[filters.dueDateFilter] || filters.dueDateFilter;
  };

  const getSortByLabel = () => {
    const sortOption = SORT_OPTIONS.find(opt => opt.value === (filters.sortBy || 'urgency'));
    return sortOption ? sortOption.label : 'Urgency';
  };

  const hasActiveFilters = filters.status || filters.priority || filters.search || filters.dueDateFilter || filters.taskType || filters.selectedProjectId || filters.sortBy;

  return (
    <div
      className="border rounded-lg shadow-lg p-6 transition-colors duration-200 overflow-visible"
      style={{
        backgroundColor: 'var(--color-bg-secondary)',
        borderColor: 'var(--color-border-default)',
      }}
    >
      {/* Single row: 7 columns. min-w-[56rem] keeps one line; narrow viewports scroll horizontally
          at the page level (no overflow-x-auto on this wrapper — that clips dropdown menus). */}
      <div className="pb-1 -mx-1 px-1 w-full min-w-0">
      <div className="grid grid-cols-7 gap-2 sm:gap-3 lg:gap-4 min-w-[56rem] w-full">
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
        <div className="relative" ref={statusDropdownRef}>
          <label
            className="block text-sm font-medium mb-2 flex items-center space-x-2 transition-colors duration-200"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            <FaCheckCircle className="w-4 h-4" />
            <span>Status</span>
          </label>
          <button
            type="button"
            onClick={() => {
              setIsPriorityDropdownOpen(false);
              setIsDueDateDropdownOpen(false);
              setIsTaskTypeDropdownOpen(false);
              setIsProjectsSubmenuOpen(false);
              setIsSortByDropdownOpen(false);
              setIsStatusDropdownOpen(!isStatusDropdownOpen);
            }}
            className="w-full text-left px-3 py-2 rounded-lg focus:outline-none focus:ring-1 transition-colors duration-200 h-10 flex items-center justify-between"
            style={{
              backgroundColor: 'var(--color-bg-tertiary)',
              borderColor: 'var(--color-border-default)',
              color: 'var(--color-text-primary)',
              borderWidth: '1px',
              borderStyle: 'solid',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = 'var(--color-primary)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'var(--color-border-default)';
            }}
          >
            <span className="truncate flex-1 mr-2">{getStatusLabel()}</span>
            <svg className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--color-text-tertiary)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {isStatusDropdownOpen && (
            <div
              className="absolute z-50 w-[120%] mt-1 rounded-lg shadow-lg"
              style={{
                backgroundColor: 'var(--color-bg-secondary)',
                borderColor: 'var(--color-border-default)',
                borderWidth: '1px',
                borderStyle: 'solid',
              }}
            >
              <button
                type="button"
                onClick={() => {
                  handleFilterChange('status', '');
                  setIsStatusDropdownOpen(false);
                }}
                className="w-full text-left px-3 py-2 focus:outline-none transition-colors duration-200"
                style={{
                  color: filters.status === '' ? 'var(--color-primary)' : 'var(--color-text-primary)',
                  backgroundColor: filters.status === '' ? 'var(--color-bg-tertiary)' : 'transparent',
                }}
                onMouseEnter={(e) => {
                  if (filters.status !== '') {
                    e.currentTarget.style.backgroundColor = 'var(--color-bg-tertiary)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (filters.status !== '') {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                All Statuses
              </button>
              <button
                type="button"
                onClick={() => {
                  handleFilterChange('status', 'TODO,IN_PROGRESS');
                  setIsStatusDropdownOpen(false);
                }}
                className="w-full text-left px-3 py-2 focus:outline-none transition-colors duration-200"
                style={{
                  color: filters.status === 'TODO,IN_PROGRESS' ? 'var(--color-primary)' : 'var(--color-text-primary)',
                  backgroundColor: filters.status === 'TODO,IN_PROGRESS' ? 'var(--color-bg-tertiary)' : 'transparent',
                }}
                onMouseEnter={(e) => {
                  if (filters.status !== 'TODO,IN_PROGRESS') {
                    e.currentTarget.style.backgroundColor = 'var(--color-bg-tertiary)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (filters.status !== 'TODO,IN_PROGRESS') {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                Tasks on Hand (To Do and In Progress)
              </button>
              {STATUS_OPTIONS.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => {
                    handleFilterChange('status', value);
                    setIsStatusDropdownOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 focus:outline-none transition-colors duration-200"
                  style={{
                    color: filters.status === value ? 'var(--color-primary)' : 'var(--color-text-primary)',
                    backgroundColor: filters.status === value ? 'var(--color-bg-tertiary)' : 'transparent',
                  }}
                  onMouseEnter={(e) => {
                    if (filters.status !== value) {
                      e.currentTarget.style.backgroundColor = 'var(--color-bg-tertiary)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (filters.status !== value) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Priority Filter */}
        <div className="relative" ref={priorityDropdownRef}>
          <label
            className="block text-sm font-medium mb-2 flex items-center space-x-2 transition-colors duration-200"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            <FaFlag className="w-4 h-4" />
            <span>Priority</span>
          </label>
          <button
            type="button"
            onClick={() => {
              setIsStatusDropdownOpen(false);
              setIsDueDateDropdownOpen(false);
              setIsTaskTypeDropdownOpen(false);
              setIsProjectsSubmenuOpen(false);
              setIsSortByDropdownOpen(false);
              setIsPriorityDropdownOpen(!isPriorityDropdownOpen);
            }}
            className="w-full text-left px-3 py-2 rounded-lg focus:outline-none focus:ring-1 transition-colors duration-200 h-10 flex items-center justify-between"
            style={{
              backgroundColor: 'var(--color-bg-tertiary)',
              borderColor: 'var(--color-border-default)',
              color: 'var(--color-text-primary)',
              borderWidth: '1px',
              borderStyle: 'solid',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = 'var(--color-primary)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'var(--color-border-default)';
            }}
          >
            <span className="truncate flex-1 mr-2">{getPriorityLabel()}</span>
            <svg className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--color-text-tertiary)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {isPriorityDropdownOpen && (
            <div
              className="absolute z-50 w-[120%] mt-1 rounded-lg shadow-lg"
              style={{
                backgroundColor: 'var(--color-bg-secondary)',
                borderColor: 'var(--color-border-default)',
                borderWidth: '1px',
                borderStyle: 'solid',
              }}
            >
              <button
                type="button"
                onClick={() => {
                  handleFilterChange('priority', '');
                  setIsPriorityDropdownOpen(false);
                }}
                className="w-full text-left px-3 py-2 focus:outline-none transition-colors duration-200"
                style={{
                  color: filters.priority === '' ? 'var(--color-primary)' : 'var(--color-text-primary)',
                  backgroundColor: filters.priority === '' ? 'var(--color-bg-tertiary)' : 'transparent',
                }}
                onMouseEnter={(e) => {
                  if (filters.priority !== '') {
                    e.currentTarget.style.backgroundColor = 'var(--color-bg-tertiary)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (filters.priority !== '') {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                All Priorities
              </button>
              {PRIORITY_OPTIONS.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => {
                    handleFilterChange('priority', value);
                    setIsPriorityDropdownOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 focus:outline-none transition-colors duration-200"
                  style={{
                    color: filters.priority === value ? 'var(--color-primary)' : 'var(--color-text-primary)',
                    backgroundColor: filters.priority === value ? 'var(--color-bg-tertiary)' : 'transparent',
                  }}
                  onMouseEnter={(e) => {
                    if (filters.priority !== value) {
                      e.currentTarget.style.backgroundColor = 'var(--color-bg-tertiary)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (filters.priority !== value) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Due Date Filter */}
        <div className="relative" ref={dueDateDropdownRef}>
          <label
            className="block text-sm font-medium mb-2 flex items-center space-x-2 transition-colors duration-200"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            <FaCalendar className="w-4 h-4" />
            <span>Due Date</span>
          </label>
          <button
            type="button"
            onClick={() => {
              setIsStatusDropdownOpen(false);
              setIsPriorityDropdownOpen(false);
              setIsTaskTypeDropdownOpen(false);
              setIsProjectsSubmenuOpen(false);
              setIsSortByDropdownOpen(false);
              setIsDueDateDropdownOpen(!isDueDateDropdownOpen);
            }}
            className="w-full text-left px-3 py-2 rounded-lg focus:outline-none focus:ring-1 transition-colors duration-200 h-10 flex items-center justify-between"
            style={{
              backgroundColor: 'var(--color-bg-tertiary)',
              borderColor: 'var(--color-border-default)',
              color: 'var(--color-text-primary)',
              borderWidth: '1px',
              borderStyle: 'solid',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = 'var(--color-primary)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'var(--color-border-default)';
            }}
          >
            <span className="truncate flex-1 mr-2">{getDueDateLabel()}</span>
            <svg className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--color-text-tertiary)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {isDueDateDropdownOpen && (
            <div
              className="absolute z-50 w-[120%] mt-1 rounded-lg shadow-lg"
              style={{
                backgroundColor: 'var(--color-bg-secondary)',
                borderColor: 'var(--color-border-default)',
                borderWidth: '1px',
                borderStyle: 'solid',
              }}
            >
              <button
                type="button"
                onClick={() => {
                  handleFilterChange('dueDateFilter', '');
                  setIsDueDateDropdownOpen(false);
                }}
                className="w-full text-left px-3 py-2 focus:outline-none transition-colors duration-200"
                style={{
                  color: filters.dueDateFilter === '' ? 'var(--color-primary)' : 'var(--color-text-primary)',
                  backgroundColor: filters.dueDateFilter === '' ? 'var(--color-bg-tertiary)' : 'transparent',
                }}
                onMouseEnter={(e) => {
                  if (filters.dueDateFilter !== '') {
                    e.currentTarget.style.backgroundColor = 'var(--color-bg-tertiary)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (filters.dueDateFilter !== '') {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                All Due Dates
              </button>
              {[
                { value: 'overdue', label: 'Overdue' },
                { value: 'due-today', label: 'Due Today' },
                { value: 'due-this-week', label: 'Due This Week' },
                { value: 'due-this-month', label: 'Due This Month' },
                { value: 'no-due-date', label: 'No Due Date' }
              ].map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => {
                    handleFilterChange('dueDateFilter', value);
                    setIsDueDateDropdownOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 focus:outline-none transition-colors duration-200"
                  style={{
                    color: filters.dueDateFilter === value ? 'var(--color-primary)' : 'var(--color-text-primary)',
                    backgroundColor: filters.dueDateFilter === value ? 'var(--color-bg-tertiary)' : 'transparent',
                  }}
                  onMouseEnter={(e) => {
                    if (filters.dueDateFilter !== value) {
                      e.currentTarget.style.backgroundColor = 'var(--color-bg-tertiary)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (filters.dueDateFilter !== value) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Task Type Filter */}
        <div className="relative" ref={taskTypeDropdownRef}>
          <label
            className="block text-sm font-medium mb-2 flex items-center space-x-2 transition-colors duration-200"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            <FaFilter className="w-4 h-4" />
            <span>Task Type</span>
          </label>
          <button
            type="button"
            onClick={() => {
              setIsStatusDropdownOpen(false);
              setIsPriorityDropdownOpen(false);
              setIsDueDateDropdownOpen(false);
              setIsSortByDropdownOpen(false);
              setIsTaskTypeDropdownOpen(!isTaskTypeDropdownOpen);
            }}
            className="w-full text-left px-3 py-2 rounded-lg focus:outline-none focus:ring-1 transition-colors duration-200 h-10 flex items-center justify-between"
            style={{
              backgroundColor: 'var(--color-bg-tertiary)',
              borderColor: 'var(--color-border-default)',
              color: 'var(--color-text-primary)',
              borderWidth: '1px',
              borderStyle: 'solid',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = 'var(--color-primary)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'var(--color-border-default)';
            }}
          >
            <span className="truncate flex-1 mr-2">{getTaskTypeLabel()}</span>
            <svg className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--color-text-tertiary)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {isTaskTypeDropdownOpen && (
            <div
              className="absolute z-50 w-[120%] mt-1 rounded-lg shadow-lg"
              style={{
                backgroundColor: 'var(--color-bg-secondary)',
                borderColor: 'var(--color-border-default)',
                borderWidth: '1px',
                borderStyle: 'solid',
              }}
            >
              <button
                type="button"
                onClick={() => handleTaskTypeSelect('')}
                className="w-full text-left px-3 py-2 focus:outline-none transition-colors duration-200"
                style={{
                  color: filters.taskType === '' ? 'var(--color-primary)' : 'var(--color-text-primary)',
                  backgroundColor: filters.taskType === '' ? 'var(--color-bg-tertiary)' : 'transparent',
                }}
                onMouseEnter={(e) => {
                  if (filters.taskType !== '') {
                    e.currentTarget.style.backgroundColor = 'var(--color-bg-tertiary)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (filters.taskType !== '') {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                All Tasks
              </button>
              <button
                type="button"
                onClick={() => handleTaskTypeSelect('shared')}
                className="w-full text-left px-3 py-2 focus:outline-none transition-colors duration-200"
                style={{
                  color: filters.taskType === 'shared' ? 'var(--color-primary)' : 'var(--color-text-primary)',
                  backgroundColor: filters.taskType === 'shared' ? 'var(--color-bg-tertiary)' : 'transparent',
                }}
                onMouseEnter={(e) => {
                  if (filters.taskType !== 'shared') {
                    e.currentTarget.style.backgroundColor = 'var(--color-bg-tertiary)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (filters.taskType !== 'shared') {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                Shared with me
              </button>
              <button
                type="button"
                onClick={() => handleTaskTypeSelect('assigned')}
                className="w-full text-left px-3 py-2 focus:outline-none transition-colors duration-200"
                style={{
                  color: filters.taskType === 'assigned' ? 'var(--color-primary)' : 'var(--color-text-primary)',
                  backgroundColor: filters.taskType === 'assigned' ? 'var(--color-bg-tertiary)' : 'transparent',
                }}
                onMouseEnter={(e) => {
                  if (filters.taskType !== 'assigned') {
                    e.currentTarget.style.backgroundColor = 'var(--color-bg-tertiary)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (filters.taskType !== 'assigned') {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                Assigned to me
              </button>
              <button
                type="button"
                onClick={() => handleTaskTypeSelect('created')}
                className="w-full text-left px-3 py-2 focus:outline-none transition-colors duration-200"
                style={{
                  color: filters.taskType === 'created' ? 'var(--color-primary)' : 'var(--color-text-primary)',
                  backgroundColor: filters.taskType === 'created' ? 'var(--color-bg-tertiary)' : 'transparent',
                }}
                onMouseEnter={(e) => {
                  if (filters.taskType !== 'created') {
                    e.currentTarget.style.backgroundColor = 'var(--color-bg-tertiary)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (filters.taskType !== 'created') {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                Created by me
              </button>
              <div
                className="relative"
                onMouseEnter={() => {
                  if (projectsSubmenuTimeoutRef.current) {
                    clearTimeout(projectsSubmenuTimeoutRef.current);
                  }
                  setIsProjectsSubmenuOpen(true);
                }}
                onMouseLeave={() => {
                  // Add a delay before closing to allow moving to submenu
                  projectsSubmenuTimeoutRef.current = setTimeout(() => {
                    setIsProjectsSubmenuOpen(false);
                  }, 200);
                }}
              >
                <button
                  type="button"
                  onClick={() => handleTaskTypeSelect('projects')}
                  className="w-full text-left px-3 py-2 focus:outline-none transition-colors duration-200 flex items-center justify-between"
                  style={{
                    color: filters.taskType === 'projects' ? 'var(--color-primary)' : 'var(--color-text-primary)',
                    backgroundColor: filters.taskType === 'projects' ? 'var(--color-bg-tertiary)' : 'transparent',
                  }}
                  onMouseEnter={(e) => {
                    if (projectsSubmenuTimeoutRef.current) {
                      clearTimeout(projectsSubmenuTimeoutRef.current);
                    }
                    setIsProjectsSubmenuOpen(true);
                    if (filters.taskType !== 'projects') {
                      e.currentTarget.style.backgroundColor = 'var(--color-bg-tertiary)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (filters.taskType !== 'projects') {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  <span>Projects and Events only</span>
                  <FaChevronRight className="w-3 h-3" style={{ color: 'var(--color-text-tertiary)' }} />
                </button>

                {isProjectsSubmenuOpen && (
                  <div
                    ref={projectsSubmenuRef}
                    className="absolute left-full top-0 ml-0 rounded-lg shadow-lg min-w-[200px] max-h-60 overflow-y-auto"
                    style={{
                      backgroundColor: 'var(--color-bg-secondary)',
                      borderColor: 'var(--color-border-default)',
                      borderWidth: '1px',
                      borderStyle: 'solid',
                      zIndex: 10001,
                    }}
                    onMouseEnter={() => {
                      if (projectsSubmenuTimeoutRef.current) {
                        clearTimeout(projectsSubmenuTimeoutRef.current);
                      }
                      setIsProjectsSubmenuOpen(true);
                    }}
                    onMouseLeave={() => {
                      projectsSubmenuTimeoutRef.current = setTimeout(() => {
                        setIsProjectsSubmenuOpen(false);
                      }, 200);
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => handleProjectSelect('')}
                      className="w-full text-left px-3 py-2 focus:outline-none transition-colors duration-200"
                      style={{
                        color: filters.taskType === 'projects' && !filters.selectedProjectId ? 'var(--color-primary)' : 'var(--color-text-primary)',
                        backgroundColor: filters.taskType === 'projects' && !filters.selectedProjectId ? 'var(--color-bg-tertiary)' : 'transparent',
                      }}
                      onMouseEnter={(e) => {
                        if (!(filters.taskType === 'projects' && !filters.selectedProjectId)) {
                          e.currentTarget.style.backgroundColor = 'var(--color-bg-tertiary)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!(filters.taskType === 'projects' && !filters.selectedProjectId)) {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }
                      }}
                    >
                      All
                    </button>
                    {isLoadingProjects ? (
                      <div className="px-3 py-2 text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
                        Loading projects...
                      </div>
                    ) : (
                      projects.map((project) => (
                        <button
                          key={project.id}
                          type="button"
                          onClick={() => handleProjectSelect(project.id.toString())}
                          className="w-full text-left px-3 py-2 focus:outline-none transition-colors duration-200"
                          style={{
                            color: filters.selectedProjectId === project.id.toString() ? 'var(--color-primary)' : 'var(--color-text-primary)',
                            backgroundColor: filters.selectedProjectId === project.id.toString() ? 'var(--color-bg-tertiary)' : 'transparent',
                          }}
                          onMouseEnter={(e) => {
                            if (filters.selectedProjectId !== project.id.toString()) {
                              e.currentTarget.style.backgroundColor = 'var(--color-bg-tertiary)';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (filters.selectedProjectId !== project.id.toString()) {
                              e.currentTarget.style.backgroundColor = 'transparent';
                            }
                          }}
                        >
                          {project.name}
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Sort By Filter */}
        <div className="relative" ref={sortByDropdownRef}>
          <label
            className="block text-sm font-medium mb-2 flex items-center space-x-2 transition-colors duration-200"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            <FaSort className="w-4 h-4" />
            <span>Sort By</span>
          </label>
          <button
            type="button"
            onClick={() => {
              setIsStatusDropdownOpen(false);
              setIsPriorityDropdownOpen(false);
              setIsDueDateDropdownOpen(false);
              setIsTaskTypeDropdownOpen(false);
              setIsProjectsSubmenuOpen(false);
              setIsSortByDropdownOpen(!isSortByDropdownOpen);
            }}
            className="w-full text-left px-3 py-2 rounded-lg focus:outline-none focus:ring-1 transition-colors duration-200 h-10 flex items-center justify-between"
            style={{
              backgroundColor: 'var(--color-bg-tertiary)',
              borderColor: 'var(--color-border-default)',
              color: 'var(--color-text-primary)',
              borderWidth: '1px',
              borderStyle: 'solid',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = 'var(--color-primary)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'var(--color-border-default)';
            }}
          >
            <span className="truncate flex-1 mr-2">{getSortByLabel()}</span>
            <svg className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--color-text-tertiary)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {isSortByDropdownOpen && (
            <div
              className="absolute z-50 w-[120%] mt-1 rounded-lg shadow-lg"
              style={{
                backgroundColor: 'var(--color-bg-secondary)',
                borderColor: 'var(--color-border-default)',
                borderWidth: '1px',
                borderStyle: 'solid',
              }}
            >
              {SORT_OPTIONS.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => {
                    handleFilterChange('sortBy', value);
                    setIsSortByDropdownOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 focus:outline-none transition-colors duration-200"
                  style={{
                    color: (filters.sortBy || 'urgency') === value ? 'var(--color-primary)' : 'var(--color-text-primary)',
                    backgroundColor: (filters.sortBy || 'urgency') === value ? 'var(--color-bg-tertiary)' : 'transparent',
                  }}
                  onMouseEnter={(e) => {
                    if ((filters.sortBy || 'urgency') !== value) {
                      e.currentTarget.style.backgroundColor = 'var(--color-bg-tertiary)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if ((filters.sortBy || 'urgency') !== value) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
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
                  filters.taskType === 'created' ? 'Created by me' :
                    filters.taskType === 'projects' ? (
                      filters.selectedProjectId
                        ? `Project: ${projects.find(p => p.id === parseInt(filters.selectedProjectId))?.name || 'Unknown'}`
                        : 'Projects and Events only'
                    ) : filters.taskType}
              <IconButton
                icon={<FaTimes />}
                label="Remove task type filter"
                iconOnly={true}
                variant="ghost"
                size="sm"
                onClick={() => {
                  handleFilterChange('taskType', '');
                  handleFilterChange('selectedProjectId', '');
                }}
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
