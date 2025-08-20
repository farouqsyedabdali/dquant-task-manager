import { useState, useEffect } from 'react';
import useTaskStore from '../../stores/taskStore';

const Calendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const { tasks } = useTaskStore();

  // Get current month's start and end dates
  const getMonthStart = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1);
  };

  const getMonthEnd = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0);
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

  // Get tasks due on a specific date
  const getTasksForDate = (date) => {
    if (!tasks || tasks.length === 0) return [];
    
    const targetDate = new Date(date);
    const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

    return tasks.filter(task => {
      if (!task.dueDate) return false;
      const taskDate = new Date(task.dueDate);
      return taskDate >= startOfDay && taskDate < endOfDay;
    });
  };

  // Get overdue tasks for a specific date (only show on their original due date)
  const getOverdueTasksForDate = (date) => {
    if (!tasks || tasks.length === 0) return [];
    
    const targetDate = new Date(date);
    const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

    return tasks.filter(task => {
      if (!task.dueDate || task.status === 'COMPLETED') return false;
      const taskDate = new Date(task.dueDate);
      // Only show overdue tasks on their original due date
      return taskDate >= startOfDay && taskDate < endOfDay && taskDate < new Date();
    });
  };

  // Navigate to previous month
  const goToPreviousMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  // Navigate to next month
  const goToNextMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
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
  const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-lg p-6">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">Calendar</h2>
        <div className="flex items-center space-x-3">
          <button
            onClick={goToPreviousMonth}
            className="btn btn-ghost btn-sm text-gray-300 hover:text-white"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <h3 className="text-xl font-semibold text-white min-w-[200px] text-center">
            {monthName}
          </h3>
          
          <button
            onClick={goToNextMonth}
            className="btn btn-ghost btn-sm text-gray-300 hover:text-white"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          
          <button
            onClick={goToToday}
            className="btn btn-primary btn-sm"
          >
            Today
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {/* Day Headers */}
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="p-3 text-center">
            <div className="text-sm font-medium text-gray-400 uppercase tracking-wide">
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
               className={`min-h-[80px] p-2 border border-gray-700 hover:bg-gray-700 transition-colors cursor-pointer ${
                 !isCurrentMonthDate ? 'bg-gray-900 text-gray-600' : 'bg-gray-800'
               } ${
                 selectedDate && date.toDateString() === selectedDate.toDateString()
                   ? 'ring-2 ring-indigo-500'
                   : ''
               }`}
               onClick={() => setSelectedDate(date)}
             >
               {/* Date Number */}
               <div className="flex items-center justify-between mb-1">
                 <span className={`text-sm font-medium ${
                   isTodayDate 
                     ? 'bg-indigo-600 text-white rounded-full w-6 h-6 flex items-center justify-center'
                     : isCurrentMonthDate 
                       ? 'text-white' 
                       : 'text-gray-600'
                 }`}>
                   {date.getDate()}
                 </span>
                 
                 {/* Task Indicators */}
                 {(overdueTasks.length > 0 || tasksForDate.length > 0) && (
                   <div className="flex items-center space-x-1">
                     {overdueTasks.length > 0 && (
                       <div className="w-2 h-2 bg-red-500 rounded-full" title={`${overdueTasks.length} overdue task(s)`}></div>
                     )}
                     {overdueTasks.length === 0 && tasksForDate.length > 0 && (
                       <div className="w-2 h-2 bg-indigo-500 rounded-full" title={`${tasksForDate.length} task(s) due`}></div>
                     )}
                   </div>
                 )}
               </div>

               {/* Task Preview */}
               {isCurrentMonthDate && (tasksForDate.length > 0 || overdueTasks.length > 0) && (
                 <div className="space-y-1">
                   {/* Overdue Tasks */}
                   {overdueTasks.slice(0, 2).map((task, taskIndex) => (
                     <div key={`overdue-${taskIndex}`} className="text-xs bg-red-900 text-red-200 px-1 py-0.5 rounded truncate">
                       {task.title}
                     </div>
                   ))}
                   
                   {/* Due Today Tasks (only show if no overdue tasks, to avoid duplication) */}
                   {overdueTasks.length === 0 && tasksForDate.slice(0, 2).map((task, taskIndex) => (
                     <div key={`due-${taskIndex}`} className="text-xs bg-indigo-900 text-indigo-200 px-1 py-0.5 rounded truncate">
                       {task.title}
                     </div>
                   ))}
                   
                   {/* Show count if more tasks */}
                   {(overdueTasks.length + tasksForDate.length) > 4 && (
                     <div className="text-xs text-gray-400 text-center">
                       +{(overdueTasks.length + tasksForDate.length) - 4} more
                     </div>
                   )}
                 </div>
               )}
             </div>
           );
         })}
      </div>

      {/* Legend */}
      <div className="mt-6 pt-4 border-t border-gray-700">
        <div className="flex items-center justify-center space-x-6 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-indigo-500 rounded-full"></div>
            <span className="text-gray-300">Tasks Due</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span className="text-gray-300">Overdue</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center text-white text-xs font-medium">
              {new Date().getDate()}
            </div>
            <span className="text-gray-300">Today</span>
          </div>
        </div>
      </div>

      {/* Selected Date Info */}
      {selectedDate && (
        <div className="mt-6 p-4 bg-gray-700 rounded-lg border border-gray-600">
          <h4 className="text-lg font-semibold text-white mb-3">
            {selectedDate.toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </h4>
          
          <div className="space-y-3">
            {/* Overdue Tasks */}
            {(() => {
              const overdueTasks = getOverdueTasksForDate(selectedDate);
              if (overdueTasks.length === 0) return null;
              
              return (
                <div>
                  <h5 className="text-red-400 font-medium mb-2">Overdue Tasks ({overdueTasks.length})</h5>
                  <div className="space-y-2">
                    {overdueTasks.map((task, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-red-900 rounded">
                        <span className="text-red-200 text-sm">{task.title}</span>
                        <span className="text-red-300 text-xs">
                          Due: {new Date(task.dueDate).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Tasks Due Today */}
            {(() => {
              const tasksForDate = getTasksForDate(selectedDate);
              if (tasksForDate.length === 0) return null;
              
              return (
                <div>
                  <h5 className="text-indigo-400 font-medium mb-2">Tasks Due ({tasksForDate.length})</h5>
                  <div className="space-y-2">
                    {tasksForDate.map((task, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-indigo-900 rounded">
                        <span className="text-indigo-200 text-sm">{task.title}</span>
                        <span className="text-indigo-300 text-xs">
                          Due: {new Date(task.dueDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* No Tasks */}
            {(() => {
              const overdueTasks = getOverdueTasksForDate(selectedDate);
              const tasksForDate = getTasksForDate(selectedDate);
              
              if (overdueTasks.length === 0 && tasksForDate.length === 0) {
                return (
                  <div className="text-gray-400 text-center py-4">
                    No tasks scheduled for this date
                  </div>
                );
              }
              return null;
            })()}
          </div>
        </div>
      )}
    </div>
  );
};

export default Calendar;
