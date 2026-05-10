import { useState, useEffect } from 'react';
import useTaskStore from '../../stores/taskStore';
import TaskCard from '../tasks/TaskCard';
import IconButton from '../common/IconButton';
import { FaCalendarAlt } from 'react-icons/fa';
import { gmailAgentAPI } from '../../services/api';

/** Match visible month grid (Sun–Sat weeks spanning partial adjacent months). */
function getMonthGridTimeRange(currentDate) {
  const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  const startDate = new Date(monthStart);
  startDate.setDate(startDate.getDate() - monthStart.getDay());
  const days = [];
  const iter = new Date(startDate);
  while (iter <= monthEnd || iter.getDay() !== 0) {
    days.push(new Date(iter));
    iter.setDate(iter.getDate() + 1);
  }
  const start = new Date(Math.min(...days.map((d) => d.getTime())));
  const end = new Date(Math.max(...days.map((d) => d.getTime())));
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

function getWeekTimeRange(currentDate) {
  const start = new Date(currentDate);
  const day = start.getDay();
  start.setDate(start.getDate() - day);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

function googleEventOverlapsLocalDay(event, day) {
  const sod = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 0, 0, 0, 0);
  const eod = new Date(sod.getTime() + 86400000);
  if (event.allDay) {
    const [ys, ms, ds] = event.start.split('-').map(Number);
    const evStart = new Date(ys, ms - 1, ds, 0, 0, 0, 0);
    const [ye, me, de] = event.end.split('-').map(Number);
    const evEndEx = new Date(ye, me - 1, de, 0, 0, 0, 0);
    return evStart < eod && evEndEx > sod;
  }
  const a = new Date(event.start);
  const b = new Date(event.end);
  return a < eod && b > sod;
}

function getGoogleEventsForDate(events, date) {
  if (!events?.length) return [];
  return events.filter((e) => googleEventOverlapsLocalDay(e, date));
}

function getGoogleAllDayEventsForDate(events, date) {
  return getGoogleEventsForDate(events, date).filter((e) => e.allDay);
}

function getGoogleTimedEventsForSlot(events, day, timeSlot) {
  if (!events?.length) return [];
  const targetDate = new Date(day);
  const startOfSlot = new Date(
    targetDate.getFullYear(),
    targetDate.getMonth(),
    targetDate.getDate(),
    timeSlot.getHours(),
    timeSlot.getMinutes(),
    0
  );
  const endOfSlot = new Date(startOfSlot.getTime() + 30 * 60 * 1000);
  return events.filter((e) => {
    if (e.allDay) return false;
    const a = new Date(e.start);
    const b = new Date(e.end);
    return a < endOfSlot && b > startOfSlot;
  });
}

function formatGoogleEventRange(ev, timeFmt) {
  if (ev.allDay) return 'All day';
  const s = new Date(ev.start);
  const e = new Date(ev.end);
  const opts = timeFmt === '24'
    ? { hour: '2-digit', minute: '2-digit', hour12: false }
    : { hour: 'numeric', minute: '2-digit', hour12: true };
  return `${s.toLocaleTimeString('en-US', opts)} – ${e.toLocaleTimeString('en-US', opts)}`;
}

const googleEventChipStyle = {
  backgroundColor: 'rgba(99, 102, 241, 0.18)',
  color: '#4338ca',
  border: '1px solid rgba(99, 102, 241, 0.45)',
};

const Calendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [calendarView, setCalendarView] = useState('month'); // 'month' or 'week'
  const [timeFormat, setTimeFormat] = useState('12'); // '12' or '24'
  const [statusFilter, setStatusFilter] = useState(''); // Filter by status (comma-separated)
  const [googleEvents, setGoogleEvents] = useState([]);
  const [calendarScopeGranted, setCalendarScopeGranted] = useState(false);
  const [googleAccountConnected, setGoogleAccountConnected] = useState(false);
  const [googleCalendarWriteEnabled, setGoogleCalendarWriteEnabled] = useState(true);
  const { tasks, fetchTasks } = useTaskStore();

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  useEffect(() => {
    const { start, end } =
      calendarView === 'month'
        ? getMonthGridTimeRange(currentDate)
        : getWeekTimeRange(currentDate);
    const timeMin = start.toISOString();
    const timeMax = end.toISOString();
    let cancelled = false;
    (async () => {
      try {
        const { data } = await gmailAgentAPI.getCalendarEvents({ timeMin, timeMax });
        if (cancelled) return;
        setGoogleEvents(Array.isArray(data.events) ? data.events : []);
        setCalendarScopeGranted(Boolean(data.calendarScopeGranted));
        setGoogleAccountConnected(Boolean(data.googleAccountConnected));
        setGoogleCalendarWriteEnabled(data.googleCalendarWriteEnabled !== false);
      } catch (err) {
        if (cancelled) return;
        setGoogleEvents([]);
        setCalendarScopeGranted(false);
        setGoogleAccountConnected(false);
        setGoogleCalendarWriteEnabled(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [currentDate, calendarView]);

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

            <IconButton
              onClick={goToToday}
              icon={<FaCalendarAlt />}
              label="Today"
              variant="primary"
              size="sm"
            />
          </div>
          {googleAccountConnected && !calendarScopeGranted && (
            <p className="text-xs mt-3" style={{ color: 'var(--color-text-tertiary)' }}>
              Your Google connection needs Calendar permission. Open Settings → Integrations and use Connect again to add Google Calendar to this view.
            </p>
          )}
          {googleAccountConnected && calendarScopeGranted && !googleCalendarWriteEnabled && (
            <p className="text-xs mt-3" style={{ color: 'var(--color-text-tertiary)' }}>
              Reconnect Google under Settings → Integrations so Tialz can add tasks to your Google Calendar (event write permission).
            </p>
          )}
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
                const googleForDate = getGoogleEventsForDate(googleEvents, date);
                const totalCount = overdueTasks.length + tasksForDate.length + googleForDate.length;
                
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
                     
                     {/* Task + Google count badge */}
                     {totalCount > 0 && (
                       <div 
                         className="flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-xs font-semibold"
                         style={overdueTasks.length > 0 ? {
                           backgroundColor: '#ef4444',
                           color: '#ffffff'
                         } : {
                           backgroundColor: 'var(--color-primary)',
                           color: '#ffffff'
                         }}
                         title={`${totalCount} item(s) (tasks + calendar)`}
                       >
                         {totalCount}
                       </div>
                     )}
                   </div>

                   {/* Task & Google preview */}
                   {isCurrentMonthDate && totalCount > 0 && (
                     <div className="space-y-1.5">
                       {(() => {
                         const allTasks = sortTasksByStatus([...overdueTasks, ...tasksForDate]);
                         const maxLines = 3;
                         const lines = [];
                         for (const task of allTasks) {
                           if (lines.length >= maxLines) break;
                           const isOverdue = overdueTasks.some((t) => t.id === task.id);
                           lines.push({
                             type: 'task',
                             key: `task-${task.id}`,
                             task,
                             isOverdue,
                           });
                         }
                         for (const ev of googleForDate) {
                           if (lines.length >= maxLines) break;
                           lines.push({ type: 'google', key: `g-${ev.id}`, ev });
                         }
                         return lines.map((line) =>
                           line.type === 'task' ? (
                             <div
                               key={line.key}
                               className="text-xs px-2 py-1 rounded truncate"
                               style={getStatusColors(line.task.status, line.isOverdue)}
                             >
                               {line.task.title}
                             </div>
                           ) : (
                             <div
                               key={line.key}
                               className="text-xs px-2 py-1 rounded truncate"
                               style={googleEventChipStyle}
                               title="Google Calendar"
                             >
                               {line.ev.title}
                             </div>
                           )
                         );
                       })()}
                       
                       {totalCount > 3 && (
                         <div 
                           className="text-xs text-center mt-1"
                           style={{ color: 'var(--color-text-secondary)' }}
                         >
                           +{totalCount - 3} more
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
                  const googleForDay = getGoogleEventsForDate(googleEvents, day);
                  const allDayGoogle = getGoogleAllDayEventsForDate(googleEvents, day);
                  const totalTasks = tasksForDay.length + overdueTasksForDay.length + googleForDay.length;
                  
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
                            title={`${totalTasks} item${totalTasks !== 1 ? 's' : ''} (tasks + calendar)`}
                          >
                            {totalTasks}
                          </div>
                        )}
                      </div>
                      {allDayGoogle.length > 0 && (
                        <div
                          className="text-[10px] mt-1 px-1 truncate"
                          style={{ color: '#4338ca' }}
                          title={allDayGoogle.map((e) => e.title).join(', ')}
                        >
                          All day · {allDayGoogle.length}
                        </div>
                      )}
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
                        const googleForSlot = getGoogleTimedEventsForSlot(googleEvents, day, timeSlot);
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
                            {tasksForSlot.slice(0, 2).map((task, taskIndex) => {
                              // Check if task is overdue (only for TODO or IN_PROGRESS)
                              const taskDueDate = task.dueDate ? new Date(task.dueDate) : null;
                              const isOverdue = taskDueDate && taskDueDate < new Date() && (task.status === 'TODO' || task.status === 'IN_PROGRESS');
                              const statusColors = getStatusColors(task.status, isOverdue);
                              
                              return (
                              <div
                                key={task.id}
                                  className="text-xs px-2 py-1 rounded mb-1 truncate"
                                  style={statusColors}
                                title={task.title}
                              >
                                {task.title}
                              </div>
                              );
                            })}
                            {googleForSlot.slice(0, 2).map((ev) => (
                              <div
                                key={ev.id}
                                className="text-xs px-2 py-1 rounded mb-1 truncate"
                                style={googleEventChipStyle}
                                title={ev.title}
                              >
                                {ev.title}
                              </div>
                            ))}
                            
                            {(tasksForSlot.length + googleForSlot.length) > 2 && (
                              <div 
                                className="text-xs text-center"
                                style={{ color: 'var(--color-text-secondary)' }}
                              >
                                +{(tasksForSlot.length + googleForSlot.length) - 2} more
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
                      const gCount = getGoogleEventsForDate(googleEvents, selectedDate).length;
                      const taskTotal = overdueTasks.length + tasksForDate.length;
                      const total = taskTotal + gCount;
                      if (gCount && taskTotal) {
                        return `${total} item${total !== 1 ? 's' : ''} (${taskTotal} task${taskTotal !== 1 ? 's' : ''}, ${gCount} calendar)`;
                      }
                      if (gCount) {
                        return `${gCount} calendar event${gCount !== 1 ? 's' : ''}`;
                      }
                      return `${taskTotal} task${taskTotal !== 1 ? 's' : ''}`;
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
                    const googleForSelected = getGoogleEventsForDate(googleEvents, selectedDate);

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
                    if (!hasAnyTasks && googleForSelected.length === 0) {
                      return (
                        <div
                          className="text-center py-12"
                          style={{ color: 'var(--color-text-secondary)' }}
                        >
                          <p className="text-lg mb-2">Nothing on this day</p>
                          <p className="text-sm">No tasks or Google Calendar events.</p>
                        </div>
                      );
                    }

                    return (
                      <div className="space-y-4">
                        {googleForSelected.length > 0 && (
                          <div>
                            <h5
                              className="font-medium mb-2"
                              style={{ color: '#4338ca' }}
                            >
                              Google Calendar ({googleForSelected.length})
                            </h5>
                            <div className="space-y-2">
                              {googleForSelected.map((ev) => (
                                <div
                                  key={ev.id}
                                  className="rounded-lg border p-3 text-sm"
                                  style={{
                                    borderColor: 'rgba(99, 102, 241, 0.45)',
                                    backgroundColor: 'rgba(99, 102, 241, 0.08)',
                                  }}
                                >
                                  <p
                                    className="font-medium"
                                    style={{ color: 'var(--color-text-primary)' }}
                                  >
                                    {ev.title}
                                  </p>
                                  <p
                                    className="text-xs mt-1"
                                    style={{ color: 'var(--color-text-secondary)' }}
                                  >
                                    {formatGoogleEventRange(ev, timeFormat)}
                                  </p>
                                  {ev.htmlLink && (
                                    <a
                                      href={ev.htmlLink}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-xs mt-2 inline-block underline"
                                      style={{ color: '#4338ca' }}
                                    >
                                      Open in Google Calendar
                                    </a>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {!hasAnyTasks ? null : (
                          <>
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
                          </>
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
