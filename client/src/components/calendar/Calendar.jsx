import { useState, useEffect } from 'react';
import useTaskStore from '../../stores/taskStore';
import TaskCard from '../tasks/TaskCard';

const Calendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [calendarView, setCalendarView] = useState('month'); // 'month' or 'week'
  const [timeFormat, setTimeFormat] = useState('12'); // '12' or '24'
  const [statusFilter, setStatusFilter] = useState(''); // Filter by status (comma-separated)
  const { tasks } = useTaskStore();

  // Get current month's start and end dates
  const getMonthStart = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1);
  };

  const getMonthEnd = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0);
  };

  // Get week's start and end dates
  const getWeekStart = (date) => {
    const start = new Date(date);
    const day = start.getDay();
    const diff = start.getDate() - day;
    start.setDate(diff);
    start.setHours(0, 0, 0, 0);
    return start;
  };

  const getWeekEnd = (date) => {
    const start = getWeekStart(date);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    return end;
  };

  // Generate time slots for weekly view (every 30 minutes from 6 AM to 5:30 AM next day - full 24 hours)
  const generateTimeSlots = () => {
    const slots = [];
    // From 6:00 AM to 11:30 PM (hour 6 to hour 23)
    for (let hour = 6; hour <= 23; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const time = new Date();
        time.setHours(hour, minute, 0, 0);
        slots.push(time);
      }
    }
    // From 12:00 AM (midnight) to 5:30 AM (hour 0 to hour 5)
    for (let hour = 0; hour <= 5; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const time = new Date();
        time.setHours(hour, minute, 0, 0);
        slots.push(time);
      }
    }
    return slots;
  };

  // Format time based on 12/24 hour format
  const formatTime = (date, format = timeFormat) => {
    if (format === '12') {
      return date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
    } else {
      return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      });
    }
  };

  // Get week days
  const getWeekDays = (date) => {
    const start = getWeekStart(date);
    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(start);
      day.setDate(start.getDate() + i);
      days.push(day);
    }
    return days;
  };

  // Get days to display (including previous month's end and next month's start)
  const getCalendarDays = (date) => {
    const monthStart = getMonthStart(date);
    const monthEnd = getMonthEnd(date);
    const startDate = new Date(monthStart);
    startDate.setDate(startDate.getDate() - monthStart.getDay()); // Start from Sunday

    const days = [];
    const currentDate = new Date(startDate);

    while (currentDate <= monthEnd || currentDate.getDay() !== 0) {
      days.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return days;
  };

  // Sort tasks by status order: TODO, IN_PROGRESS, ON_HOLD, COMPLETED, CANCELLED
  const sortTasksByStatus = (taskList) => {
    const statusOrder = ['TODO', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CANCELLED'];
    return [...taskList].sort((a, b) => {
      const aIndex = statusOrder.indexOf(a.status);
      const bIndex = statusOrder.indexOf(b.status);
      return aIndex - bIndex;
    });
  };

  // Get status-based colors for tasks in calendar
  const getStatusColors = (status, isOverdue = false) => {
    // If overdue, use red colors
    if (isOverdue) {
      return {
        backgroundColor: '#ef4444', // red-500 (solid status color)
        color: '#ffffff' // white text for contrast
      };
    }

    // Otherwise, use status-based colors
    switch (status) {
      case 'TODO':
        return {
          backgroundColor: '#9ca3af', // gray-400 (solid status color)
          color: '#ffffff' // white text for contrast
        };
      case 'IN_PROGRESS':
        return {
          backgroundColor: '#3b82f6', // blue-500 (solid status color)
          color: '#ffffff' // white text for contrast
        };
      case 'ON_HOLD':
        return {
          backgroundColor: '#f59e0b', // amber-500 (solid status color)
          color: '#ffffff' // white text for contrast
        };
      case 'COMPLETED':
        return {
          backgroundColor: '#10b981', // green-500 (solid status color)
          color: '#ffffff' // white text for contrast
        };
      case 'CANCELLED':
        return {
          backgroundColor: '#ef4444', // red-500 (solid status color)
          color: '#ffffff' // white text for contrast
        };
      default:
        return {
          backgroundColor: 'var(--color-primary)', // indigo (solid status color)
          color: '#ffffff' // white text for contrast
        };
    }
  };

  // Handle filter card click
  const handleFilterClick = (status) => {
    if (status === 'total') {
      // Clear all status filters to show all tasks
      setStatusFilter('');
    } else {
      // Toggle status in the filter
      const statusArray = statusFilter ? statusFilter.split(',').map(s => s.trim()) : [];
      
      if (statusArray.includes(status)) {
        // Remove status from filter
        const newStatusArray = statusArray.filter(s => s !== status);
        setStatusFilter(newStatusArray.join(','));
      } else {
        // Add status to filter
        const newStatusArray = [...statusArray, status];
        setStatusFilter(newStatusArray.join(','));
      }
    }
  };

  // Apply status filter to tasks
  const applyStatusFilter = (taskList) => {
    if (!statusFilter || statusFilter === '') {
      return taskList;
    }
    const statusArray = statusFilter.split(',').map(s => s.trim());
    return taskList.filter(task => statusArray.includes(task.status));
  };

  // Get tasks due on a specific date
  const getTasksForDate = (date) => {
    if (!tasks || tasks.length === 0) return [];
    
    const targetDate = new Date(date);
    const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

    const filteredTasks = tasks.filter(task => {
      if (!task.dueDate) return false;
      const taskDate = new Date(task.dueDate);
      return taskDate >= startOfDay && taskDate < endOfDay;
    });

    const sortedTasks = sortTasksByStatus(filteredTasks);
    return applyStatusFilter(sortedTasks);
  };

  // Get overdue tasks for a specific date (only show on their original due date)
  const getOverdueTasksForDate = (date) => {
    if (!tasks || tasks.length === 0) return [];
    
    const targetDate = new Date(date);
    const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

    const overdueTasks = tasks.filter(task => {
      if (!task.dueDate) return false;
      // Only consider tasks as overdue if status is TODO or IN_PROGRESS
      if (task.status !== 'TODO' && task.status !== 'IN_PROGRESS') return false;
      const taskDate = new Date(task.dueDate);
      // Only show overdue tasks on their original due date
      return taskDate >= startOfDay && taskDate < endOfDay && taskDate < new Date();
    });

    return applyStatusFilter(overdueTasks);
  };

  // Get tasks for a specific time slot on a specific date
  const getTasksForTimeSlot = (date, timeSlot) => {
    if (!tasks || tasks.length === 0) return [];
    
    const targetDate = new Date(date);
    const startOfSlot = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 
                                timeSlot.getHours(), timeSlot.getMinutes(), 0);
    const endOfSlot = new Date(startOfSlot.getTime() + 30 * 60 * 1000); // 30 minutes later

    return tasks.filter(task => {
      if (!task.dueDate) return false;
      const taskDate = new Date(task.dueDate);
      return taskDate >= startOfSlot && taskDate < endOfSlot;
    });
  };

  // Navigate to previous month/week
  const goToPrevious = () => {
    if (calendarView === 'month') {
      setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    } else {
      setCurrentDate(prev => {
        const newDate = new Date(prev);
        newDate.setDate(prev.getDate() - 7);
        return newDate;
      });
    }
  };

  // Navigate to next month/week
  const goToNext = () => {
    if (calendarView === 'month') {
      setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    } else {
      setCurrentDate(prev => {
        const newDate = new Date(prev);
        newDate.setDate(prev.getDate() + 7);
        return newDate;
      });
    }
  };

  // Go to today
  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(new Date());
  };

  // Check if a date is today
  const isToday = (date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  // Check if a date is in current month
  const isCurrentMonth = (date) => {
    return date.getMonth() === currentDate.getMonth();
  };



  const calendarDays = getCalendarDays(currentDate);
  const weekDays = getWeekDays(currentDate);
  const timeSlots = generateTimeSlots();
  const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const weekRange = calendarView === 'week' ? 
    `${weekDays[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekDays[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}` : 
    monthName;

  // Handle ESC key to close panel
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && selectedDate) {
        setSelectedDate(null);
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [selectedDate]);

  // Add/remove class to body when panel is open for header blur effect
  useEffect(() => {
    if (selectedDate) {
      document.body.classList.add('calendar-panel-open');
    } else {
      document.body.classList.remove('calendar-panel-open');
    }
    return () => {
      document.body.classList.remove('calendar-panel-open');
    };
  }, [selectedDate]);

  return (
    <div className="relative w-full">
      {/* Full Screen Calendar */}
      <div className="flex flex-col w-full">
        {/* Month/Week Navigation - Outside the box */}
        <div className="flex items-center justify-center mb-6">
          <button
            onClick={goToPrevious}
            className="btn btn-ghost"
            style={{ color: 'var(--color-text-primary)' }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <h3 
            className="text-2xl font-semibold min-w-[250px] text-center mx-4"
            style={{ color: 'var(--color-text-primary)' }}
          >
            {weekRange}
          </h3>
          
          <button
            onClick={goToNext}
            className="btn btn-ghost"
            style={{ color: 'var(--color-text-primary)' }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Controls Box - Similar to Dashboard */}
        <div 
          className="border rounded-lg shadow-lg p-6 mb-6 transition-colors duration-200"
          style={{
            backgroundColor: 'var(--color-bg-secondary)',
            borderColor: 'var(--color-border-default)',
          }}
        >
          {/* Controls Row: Month/Week Switcher, Filters, Time Format, Today Button */}
          <div className="flex items-center justify-between flex-wrap gap-3">
          {/* View Switcher */}
          <div className="btn-group">
            <button
              onClick={() => setCalendarView('month')}
                className={`btn ${calendarView === 'month' ? 'btn-active' : 'btn-ghost'}`}
            >
              Month
            </button>
            <button
              onClick={() => setCalendarView('week')}
                className={`btn ${calendarView === 'week' ? 'btn-active' : 'btn-ghost'}`}
            >
              Week
            </button>
          </div>

          {/* Filter Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => handleFilterClick('total')}
              className={`px-4 py-2 rounded-lg border text-base font-medium transition-all duration-200 ${
              !statusFilter || statusFilter === '' ? '' : ''
            }`}
            style={{
              backgroundColor: (!statusFilter || statusFilter === '') 
                ? 'var(--color-bg-tertiary)' 
                : 'var(--color-bg-secondary)',
              borderColor: (!statusFilter || statusFilter === '') 
                ? 'var(--color-primary)' 
                : 'var(--color-border-default)',
              color: (!statusFilter || statusFilter === '') 
                ? 'var(--color-primary)' 
                : 'var(--color-text-primary)'
            }}
            onMouseEnter={(e) => {
              if (statusFilter && statusFilter !== '') {
                e.currentTarget.style.backgroundColor = 'var(--color-bg-tertiary)';
              }
            }}
            onMouseLeave={(e) => {
              if (statusFilter && statusFilter !== '') {
                e.currentTarget.style.backgroundColor = 'var(--color-bg-secondary)';
              }
            }}
          >
            📋 All
          </button>
          <button
            onClick={() => handleFilterClick('TODO')}
              className={`px-4 py-2 rounded-lg border text-base font-medium transition-all duration-200`}
            style={{
              backgroundColor: statusFilter && statusFilter.split(',').includes('TODO')
                ? 'var(--color-bg-tertiary)' 
                : 'var(--color-bg-secondary)',
              borderColor: statusFilter && statusFilter.split(',').includes('TODO')
                ? 'var(--color-primary)' 
                : 'var(--color-border-default)',
              color: statusFilter && statusFilter.split(',').includes('TODO')
                ? 'var(--color-primary)' 
                : 'var(--color-text-primary)'
            }}
            onMouseEnter={(e) => {
              if (!statusFilter || !statusFilter.split(',').includes('TODO')) {
                e.currentTarget.style.backgroundColor = 'var(--color-bg-tertiary)';
              }
            }}
            onMouseLeave={(e) => {
              if (!statusFilter || !statusFilter.split(',').includes('TODO')) {
                e.currentTarget.style.backgroundColor = 'var(--color-bg-secondary)';
              }
            }}
          >
            ⏳ To Do
          </button>
          <button
            onClick={() => handleFilterClick('IN_PROGRESS')}
              className={`px-4 py-2 rounded-lg border text-base font-medium transition-all duration-200`}
            style={{
              backgroundColor: statusFilter && statusFilter.split(',').includes('IN_PROGRESS')
                ? 'var(--color-bg-tertiary)' 
                : 'var(--color-bg-secondary)',
              borderColor: statusFilter && statusFilter.split(',').includes('IN_PROGRESS')
                ? 'var(--color-primary)' 
                : 'var(--color-border-default)',
              color: statusFilter && statusFilter.split(',').includes('IN_PROGRESS')
                ? 'var(--color-primary)' 
                : 'var(--color-text-primary)'
            }}
            onMouseEnter={(e) => {
              if (!statusFilter || !statusFilter.split(',').includes('IN_PROGRESS')) {
                e.currentTarget.style.backgroundColor = 'var(--color-bg-tertiary)';
              }
            }}
            onMouseLeave={(e) => {
              if (!statusFilter || !statusFilter.split(',').includes('IN_PROGRESS')) {
                e.currentTarget.style.backgroundColor = 'var(--color-bg-secondary)';
              }
            }}
          >
            🔄 In Progress
          </button>
          <button
            onClick={() => handleFilterClick('ON_HOLD')}
              className={`px-4 py-2 rounded-lg border text-base font-medium transition-all duration-200`}
            style={{
              backgroundColor: statusFilter && statusFilter.split(',').includes('ON_HOLD')
                ? 'var(--color-bg-tertiary)' 
                : 'var(--color-bg-secondary)',
              borderColor: statusFilter && statusFilter.split(',').includes('ON_HOLD')
                ? 'var(--color-primary)' 
                : 'var(--color-border-default)',
              color: statusFilter && statusFilter.split(',').includes('ON_HOLD')
                ? 'var(--color-primary)' 
                : 'var(--color-text-primary)'
            }}
            onMouseEnter={(e) => {
              if (!statusFilter || !statusFilter.split(',').includes('ON_HOLD')) {
                e.currentTarget.style.backgroundColor = 'var(--color-bg-tertiary)';
              }
            }}
            onMouseLeave={(e) => {
              if (!statusFilter || !statusFilter.split(',').includes('ON_HOLD')) {
                e.currentTarget.style.backgroundColor = 'var(--color-bg-secondary)';
              }
            }}
          >
            ⏸️ On Hold
          </button>
          <button
            onClick={() => handleFilterClick('COMPLETED')}
              className={`px-4 py-2 rounded-lg border text-base font-medium transition-all duration-200`}
            style={{
              backgroundColor: statusFilter && statusFilter.split(',').includes('COMPLETED')
                ? 'var(--color-bg-tertiary)' 
                : 'var(--color-bg-secondary)',
              borderColor: statusFilter && statusFilter.split(',').includes('COMPLETED')
                ? 'var(--color-primary)' 
                : 'var(--color-border-default)',
              color: statusFilter && statusFilter.split(',').includes('COMPLETED')
                ? 'var(--color-primary)' 
                : 'var(--color-text-primary)'
            }}
            onMouseEnter={(e) => {
              if (!statusFilter || !statusFilter.split(',').includes('COMPLETED')) {
                e.currentTarget.style.backgroundColor = 'var(--color-bg-tertiary)';
              }
            }}
            onMouseLeave={(e) => {
              if (!statusFilter || !statusFilter.split(',').includes('COMPLETED')) {
                e.currentTarget.style.backgroundColor = 'var(--color-bg-secondary)';
              }
            }}
          >
            ✅ Completed
          </button>
          <button
            onClick={() => handleFilterClick('CANCELLED')}
              className={`px-4 py-2 rounded-lg border text-base font-medium transition-all duration-200`}
            style={{
              backgroundColor: statusFilter && statusFilter.split(',').includes('CANCELLED')
                ? 'var(--color-bg-tertiary)' 
                : 'var(--color-bg-secondary)',
              borderColor: statusFilter && statusFilter.split(',').includes('CANCELLED')
                ? 'var(--color-primary)' 
                : 'var(--color-border-default)',
              color: statusFilter && statusFilter.split(',').includes('CANCELLED')
                ? 'var(--color-primary)' 
                : 'var(--color-text-primary)'
            }}
            onMouseEnter={(e) => {
              if (!statusFilter || !statusFilter.split(',').includes('CANCELLED')) {
                e.currentTarget.style.backgroundColor = 'var(--color-bg-tertiary)';
              }
            }}
            onMouseLeave={(e) => {
              if (!statusFilter || !statusFilter.split(',').includes('CANCELLED')) {
                e.currentTarget.style.backgroundColor = 'var(--color-bg-secondary)';
              }
            }}
          >
            ❌ Cancelled
          </button>
          </div>

          {/* Time Format Switcher (only show in week view) */}
          {calendarView === 'week' && (
            <div className="btn-group">
              <button
                onClick={() => setTimeFormat('12')}
                  className={`btn ${timeFormat === '12' ? 'btn-active' : 'btn-ghost'}`}
              >
                12h
              </button>
              <button
                onClick={() => setTimeFormat('24')}
                  className={`btn ${timeFormat === '24' ? 'btn-active' : 'btn-ghost'}`}
              >
                24h
              </button>
            </div>
          )}

            <button
              onClick={goToToday}
              className="btn btn-primary"
            >
              Today
            </button>
          </div>
        </div>

          {/* Calendar Grid */}
          {calendarView === 'month' ? (
            <div className="grid grid-cols-7 gap-2">
              {/* Day Headers */}
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="p-4 text-center">
                  <div 
                    className="text-base font-semibold uppercase tracking-wide"
                    style={{ color: 'var(--color-text-secondary)' }}
                  >
                    {day}
                  </div>
                </div>
              ))}

              {/* Calendar Days */}
              {calendarDays.map((date, index) => {
                const isTodayDate = isToday(date);
                const isCurrentMonthDate = isCurrentMonth(date);
                const tasksForDate = getTasksForDate(date);
                const overdueTasks = getOverdueTasksForDate(date);
                
                return (
                  <div
                    key={index}
                    className={`min-h-[110px] p-3 border transition-colors cursor-pointer rounded ${
                      selectedDate && date.toDateString() === selectedDate.toDateString()
                        ? 'ring-2'
                        : ''
                    }`}
                    style={{
                      backgroundColor: !isCurrentMonthDate 
                        ? 'var(--color-bg-tertiary)' 
                        : 'var(--color-bg-primary)',
                      borderColor: 'var(--color-border-default)',
                      color: !isCurrentMonthDate 
                        ? 'var(--color-text-tertiary)' 
                        : 'var(--color-text-primary)',
                      ...(selectedDate && date.toDateString() === selectedDate.toDateString() ? {
                        ringColor: 'var(--color-primary)',
                        ringWidth: '2px'
                      } : {})
                    }}
                    onMouseEnter={(e) => {
                      if (isCurrentMonthDate) {
                        e.currentTarget.style.backgroundColor = 'var(--color-bg-secondary)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (isCurrentMonthDate) {
                        e.currentTarget.style.backgroundColor = 'var(--color-bg-primary)';
                      }
                    }}
                    onClick={() => setSelectedDate(date)}
                  >
                    {/* Date Number */}
                    <div className="flex items-center justify-between mb-2">
                      <span 
                        className={`text-base font-semibold rounded-full w-7 h-7 flex items-center justify-center ${
                          isTodayDate ? '' : ''
                        }`}
                        style={isTodayDate ? {
                          backgroundColor: 'var(--color-primary)',
                          color: '#ffffff'
                        } : {
                          color: isCurrentMonthDate 
                            ? 'var(--color-text-primary)' 
                            : 'var(--color-text-tertiary)'
                        }}
                      >
                        {date.getDate()}
                      </span>
                     
                     {/* Task Count Badge */}
                     {(overdueTasks.length > 0 || tasksForDate.length > 0) && (
                       <div 
                         className="flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-xs font-semibold"
                         style={overdueTasks.length > 0 ? {
                           backgroundColor: '#ef4444',
                           color: '#ffffff'
                         } : {
                           backgroundColor: 'var(--color-primary)',
                           color: '#ffffff'
                         }}
                         title={`${overdueTasks.length + tasksForDate.length} task(s)`}
                       >
                         {overdueTasks.length + tasksForDate.length}
                       </div>
                     )}
                   </div>

                   {/* Task Preview */}
                   {isCurrentMonthDate && (tasksForDate.length > 0 || overdueTasks.length > 0) && (
                     <div className="space-y-1.5">
                       {/* Combine and sort all tasks by status */}
                       {(() => {
                         const allTasks = sortTasksByStatus([...overdueTasks, ...tasksForDate]);
                         return allTasks.slice(0, 2).map((task, taskIndex) => {
                           const isOverdue = overdueTasks.some(t => t.id === task.id);
                           const statusColors = getStatusColors(task.status, isOverdue);
                           return (
                             <div 
                               key={`task-${taskIndex}`} 
                               className="text-xs px-2 py-1 rounded truncate"
                               style={statusColors}
                             >
                               {task.title}
                             </div>
                           );
                         });
                       })()}
                       
                       {/* Show count if more tasks */}
                       {(overdueTasks.length + tasksForDate.length) > 2 && (
                         <div 
                           className="text-xs text-center mt-1"
                           style={{ color: 'var(--color-text-secondary)' }}
                         >
                           +{(overdueTasks.length + tasksForDate.length) - 2} more
                         </div>
                       )}
                     </div>
                   )}
                 </div>
               );
             })}
            </div>
          ) : (
            /* Weekly View */
            <div 
              className="border rounded-lg overflow-hidden"
              style={{ borderColor: 'var(--color-border-default)' }}
            >
              {/* Week Header */}
              <div 
                className="grid"
                style={{ 
                  backgroundColor: 'var(--color-bg-tertiary)',
                  gridTemplateColumns: '120px repeat(7, minmax(0, 1fr))',
                  width: '100%',
                  boxSizing: 'border-box',
                  paddingRight: '15px' // Account for scrollbar width
                }}
              >
                <div 
                  className="p-2 border-r box-border"
                  style={{ borderColor: 'var(--color-border-default)' }}
                ></div>
                {weekDays.map((day, index) => {
                  const isTodayDate = isToday(day);
                  const tasksForDay = getTasksForDate(day);
                  const overdueTasksForDay = getOverdueTasksForDate(day);
                  const totalTasks = tasksForDay.length + overdueTasksForDay.length;
                  
                  return (
                    <div 
                      key={index} 
                      className="p-1 text-center border-r last:border-r-0 box-border overflow-hidden"
                      style={{ borderColor: 'var(--color-border-default)' }}
                    >
                      <div 
                        className="text-sm font-semibold uppercase tracking-wide"
                        style={{ color: 'var(--color-text-secondary)' }}
                      >
                        {day.toLocaleDateString('en-US', { weekday: 'short' })}
                      </div>
                      <div className="flex items-center justify-center gap-2 mt-1">
                        <div 
                          className="text-lg font-bold"
                          style={{ color: isTodayDate ? 'var(--color-primary)' : 'var(--color-text-primary)' }}
                        >
                          {day.getDate()}
                        </div>
                        {totalTasks > 0 && (
                          <div 
                            className="flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-xs font-semibold"
                            style={overdueTasksForDay.length > 0 ? {
                              backgroundColor: '#ef4444',
                              color: '#ffffff'
                            } : {
                              backgroundColor: 'var(--color-primary)',
                              color: '#ffffff'
                            }}
                            title={`${totalTasks} task${totalTasks !== 1 ? 's' : ''}`}
                          >
                            {totalTasks}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Time Slots Grid */}
              <div className="max-h-[600px] overflow-y-auto" style={{ scrollbarGutter: 'stable' }}>
                {timeSlots.map((timeSlot, slotIndex) => {
                  const isHour = timeSlot.getMinutes() === 0;
                  const isHalfHour = timeSlot.getMinutes() === 30;
                  
                  return (
                    <div 
                      key={slotIndex} 
                      className="grid"
                      style={{ 
                        gridTemplateColumns: '120px repeat(7, minmax(0, 1fr))',
                        width: '100%'
                      }}
                    >
                      {/* Time Column */}
                      <div 
                        className={`p-2 border-r box-border ${
                          isHour ? 'border-b-2' : 'border-b'
                        }`}
                        style={{
                          borderColor: isHour 
                            ? 'var(--color-border-default)' 
                            : 'var(--color-border-default)',
                          backgroundColor: 'var(--color-bg-tertiary)',
                          borderBottomWidth: isHour ? '2px' : '1px'
                        }}
                      >
                        <div 
                          className={`text-xs font-medium ${isHour ? 'font-bold' : ''}`}
                          style={{ color: 'var(--color-text-secondary)' }}
                        >
                          {formatTime(timeSlot)}
                        </div>
                      </div>

                      {/* Day Columns */}
                      {weekDays.map((day, dayIndex) => {
                        const tasksForSlot = getTasksForTimeSlot(day, timeSlot);
                        const isTodayDate = isToday(day);
                        
                        return (
                          <div
                            key={dayIndex}
                            className={`p-1 border-r last:border-r-0 cursor-pointer transition-colors box-border overflow-hidden ${
                              isHour ? 'border-b-2' : 'border-b'
                            }`}
                            style={{
                              borderColor: 'var(--color-border-default)',
                              backgroundColor: isTodayDate 
                                ? 'var(--color-bg-tertiary)' 
                                : 'var(--color-bg-secondary)',
                              borderBottomWidth: isHour ? '2px' : '1px',
                              minWidth: 0
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = 'var(--color-bg-tertiary)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = isTodayDate 
                                ? 'var(--color-bg-tertiary)' 
                                : 'var(--color-bg-secondary)';
                            }}
                            onClick={() => setSelectedDate(day)}
                          >
                            {/* Task Items in Time Slot */}
                            {tasksForSlot.slice(0, 2).map((task, taskIndex) => {
                              // Check if task is overdue (only for TODO or IN_PROGRESS)
                              const taskDueDate = task.dueDate ? new Date(task.dueDate) : null;
                              const isOverdue = taskDueDate && taskDueDate < new Date() && (task.status === 'TODO' || task.status === 'IN_PROGRESS');
                              const statusColors = getStatusColors(task.status, isOverdue);
                              
                              return (
                              <div
                                key={taskIndex}
                                  className="text-xs px-2 py-1 rounded mb-1 truncate"
                                  style={statusColors}
                                title={task.title}
                              >
                                {task.title}
                              </div>
                              );
                            })}
                            
                            {/* Show more indicator */}
                            {tasksForSlot.length > 2 && (
                              <div 
                                className="text-xs text-center"
                                style={{ color: 'var(--color-text-secondary)' }}
                              >
                                +{tasksForSlot.length - 2} more
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

      {/* Slide-in Panel */}
      {selectedDate && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity duration-500 ease-out"
            onClick={() => setSelectedDate(null)}
          />
          
          {/* Slide-in Panel */}
          <div
            className="fixed top-0 right-0 h-full w-full max-w-md z-50"
            style={{
              boxShadow: '-4px 0 20px rgba(0, 0, 0, 0.3)',
              animation: 'slideInRight 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
              transform: 'translateX(0)'
            }}
          >
            <style>{`
              @keyframes slideInRight {
                from {
                  transform: translateX(100%);
                  opacity: 0;
                }
                to {
                  transform: translateX(0);
                  opacity: 1;
                }
              }
            `}</style>
            <div
              className="h-full overflow-y-auto"
              style={{
                backgroundColor: 'var(--color-bg-secondary)',
                borderLeft: '1px solid var(--color-border-default)'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Panel Header */}
              <div
                className="sticky top-0 z-10 flex items-center justify-between p-6 border-b"
                style={{
                  backgroundColor: 'var(--color-bg-secondary)',
                  borderColor: 'var(--color-border-default)'
                }}
              >
                <div>
                  <h3
                    className="text-xl font-bold"
                    style={{ color: 'var(--color-text-primary)' }}
                  >
                    {selectedDate.toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </h3>
                  <p
                    className="text-sm mt-1"
                    style={{ color: 'var(--color-text-secondary)' }}
                  >
                    {(() => {
                      const overdueTasks = getOverdueTasksForDate(selectedDate);
                      const tasksForDate = getTasksForDate(selectedDate);
                      const total = overdueTasks.length + tasksForDate.length;
                      return `${total} task${total !== 1 ? 's' : ''}`;
                    })()}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedDate(null)}
                  className="btn btn-ghost btn-sm btn-circle"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  ✕
                </button>
              </div>

              {/* Panel Content */}
              <div className="p-6">
                {/* Tasks List */}
                <div className="space-y-3">
                  {(() => {
                    const overdueTasks = getOverdueTasksForDate(selectedDate);
                    const tasksForDate = getTasksForDate(selectedDate);

                    // Group tasks by status
                    const tasksByStatus = {
                      overdue: sortTasksByStatus(overdueTasks),
                      todo: sortTasksByStatus(tasksForDate.filter(t => t.status === 'TODO')),
                      inProgress: sortTasksByStatus(tasksForDate.filter(t => t.status === 'IN_PROGRESS')),
                      onHold: sortTasksByStatus(tasksForDate.filter(t => t.status === 'ON_HOLD')),
                      completed: sortTasksByStatus(tasksForDate.filter(t => t.status === 'COMPLETED')),
                      cancelled: sortTasksByStatus(tasksForDate.filter(t => t.status === 'CANCELLED'))
                    };

                    const hasAnyTasks = Object.values(tasksByStatus).some(arr => arr.length > 0);
                    if (!hasAnyTasks) {
                      return (
                        <div
                          className="text-center py-12"
                          style={{ color: 'var(--color-text-secondary)' }}
                        >
                          <p className="text-lg mb-2">No tasks scheduled</p>
                          <p className="text-sm">Click a time slot to create a task</p>
                        </div>
                      );
                    }

                    return (
                      <div className="space-y-4">
                        {/* Overdue Tasks */}
                        {tasksByStatus.overdue.length > 0 && (
                          <div>
                            <h5
                              className="font-medium mb-2"
                              style={{ color: '#ef4444' }}
                            >
                              Overdue ({tasksByStatus.overdue.length})
                            </h5>
                            <div className="space-y-4">
                              {tasksByStatus.overdue.map((task) => (
                                <TaskCard
                                  key={task.id}
                                  task={task}
                                  onStatusChange={() => {}}
                                  onPriorityChange={() => {}}
                                  onDelete={() => {}}
                                />
                              ))}
                            </div>
                          </div>
                        )}

                        {/* TODO Tasks */}
                        {tasksByStatus.todo.length > 0 && (
                          <div>
                            <h5
                              className="font-medium mb-2"
                              style={{ color: 'var(--color-primary)' }}
                            >
                              To Do ({tasksByStatus.todo.length})
                            </h5>
                            <div className="space-y-4">
                              {tasksByStatus.todo.map((task) => (
                                <TaskCard
                                  key={task.id}
                                  task={task}
                                  onStatusChange={() => {}}
                                  onPriorityChange={() => {}}
                                  onDelete={() => {}}
                                />
                              ))}
                            </div>
                          </div>
                        )}

                        {/* In Progress Tasks */}
                        {tasksByStatus.inProgress.length > 0 && (
                          <div>
                            <h5
                              className="font-medium mb-2"
                              style={{ color: 'var(--color-primary)' }}
                            >
                              In Progress ({tasksByStatus.inProgress.length})
                            </h5>
                            <div className="space-y-4">
                              {tasksByStatus.inProgress.map((task) => (
                                <TaskCard
                                  key={task.id}
                                  task={task}
                                  onStatusChange={() => {}}
                                  onPriorityChange={() => {}}
                                  onDelete={() => {}}
                                />
                              ))}
                            </div>
                          </div>
                        )}

                        {/* On Hold Tasks */}
                        {tasksByStatus.onHold.length > 0 && (
                          <div>
                            <h5
                              className="font-medium mb-2"
                              style={{ color: 'var(--color-primary)' }}
                            >
                              On Hold ({tasksByStatus.onHold.length})
                            </h5>
                            <div className="space-y-4">
                              {tasksByStatus.onHold.map((task) => (
                                <TaskCard
                                  key={task.id}
                                  task={task}
                                  onStatusChange={() => {}}
                                  onPriorityChange={() => {}}
                                  onDelete={() => {}}
                                />
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Completed Tasks */}
                        {tasksByStatus.completed.length > 0 && (
                          <div>
                            <h5
                              className="font-medium mb-2"
                              style={{ color: 'var(--color-primary)' }}
                            >
                              Completed ({tasksByStatus.completed.length})
                            </h5>
                            <div className="space-y-4">
                              {tasksByStatus.completed.map((task) => (
                                <TaskCard
                                  key={task.id}
                                  task={task}
                                  onStatusChange={() => {}}
                                  onPriorityChange={() => {}}
                                  onDelete={() => {}}
                                />
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Cancelled Tasks */}
                        {tasksByStatus.cancelled.length > 0 && (
                          <div>
                            <h5
                              className="font-medium mb-2"
                              style={{ color: 'var(--color-primary)' }}
                            >
                              Cancelled ({tasksByStatus.cancelled.length})
                            </h5>
                            <div className="space-y-4">
                              {tasksByStatus.cancelled.map((task) => (
                                <TaskCard
                                  key={task.id}
                                  task={task}
                                  onStatusChange={() => {}}
                                  onPriorityChange={() => {}}
                                  onDelete={() => {}}
                                />
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Calendar;
