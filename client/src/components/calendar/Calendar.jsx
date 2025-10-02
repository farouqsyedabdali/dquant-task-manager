import { useState } from 'react';
import useTaskStore from '../../stores/taskStore';
import TaskCard from '../tasks/TaskCard';
import TaskList from '../tasks/TaskList';

const Calendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [viewMode, setViewMode] = useState('cards');
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
    <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-lg p-8">
      {/* Two Column Layout: Calendar Left (60%), Tasks Right (40%) */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 min-h-[800px]">
        {/* Left Column - Calendar (3/5 = 60%) */}
        <div className="flex flex-col lg:col-span-3">
          {/* Calendar Header */}
          <div className="flex items-center justify-end mb-6">
            <button
              onClick={goToToday}
              className="btn btn-primary btn-sm"
            >
              Today
            </button>
          </div>

          {/* Month Navigation */}
          <div className="flex items-center justify-center space-x-3 mb-4">
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
          </div>

           {/* Calendar Grid */}
           <div className="grid grid-cols-7 gap-2">
         {/* Day Headers */}
         {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
           <div key={day} className="p-4 text-center">
             <div className="text-base font-semibold text-gray-400 uppercase tracking-wide">
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
                className={`min-h-[110px] p-3 border border-gray-700 hover:bg-gray-700 transition-colors cursor-pointer rounded ${
                  !isCurrentMonthDate ? 'bg-gray-900 text-gray-600' : 'bg-gray-800'
                } ${
                  selectedDate && date.toDateString() === selectedDate.toDateString()
                    ? 'ring-2 ring-indigo-500'
                    : ''
                }`}
                onClick={() => setSelectedDate(date)}
              >
                {/* Date Number */}
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-base font-semibold ${
                    isTodayDate 
                      ? 'bg-indigo-600 text-white rounded-full w-7 h-7 flex items-center justify-center'
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
                       <div className="w-3 h-3 bg-red-500 rounded-full" title={`${overdueTasks.length} overdue task(s)`}></div>
                     )}
                     {overdueTasks.length === 0 && tasksForDate.length > 0 && (
                       <div className="w-3 h-3 bg-indigo-500 rounded-full" title={`${tasksForDate.length} task(s) due`}></div>
                     )}
                   </div>
                 )}
               </div>

               {/* Task Preview */}
               {isCurrentMonthDate && (tasksForDate.length > 0 || overdueTasks.length > 0) && (
                 <div className="space-y-1.5">
                   {/* Overdue Tasks */}
                   {overdueTasks.slice(0, 2).map((task, taskIndex) => (
                     <div key={`overdue-${taskIndex}`} className="text-xs bg-red-900 text-red-200 px-2 py-1 rounded truncate">
                       {task.title}
                     </div>
                   ))}
                   
                   {/* Due Today Tasks (only show if no overdue tasks, to avoid duplication) */}
                   {overdueTasks.length === 0 && tasksForDate.slice(0, 2).map((task, taskIndex) => (
                     <div key={`due-${taskIndex}`} className="text-xs bg-indigo-900 text-indigo-200 px-2 py-1 rounded truncate">
                       {task.title}
                     </div>
                   ))}
                   
                   {/* Show count if more tasks */}
                   {(overdueTasks.length + tasksForDate.length) > 4 && (
                     <div className="text-xs text-gray-400 text-center mt-1">
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
           <div className="mt-8 pt-6 border-t border-gray-700">
             <div className="flex flex-col space-y-4 text-base">
               <div className="flex items-center space-x-3">
                 <div className="w-4 h-4 bg-indigo-500 rounded-full"></div>
                 <span className="text-gray-300">Tasks Due</span>
               </div>
               <div className="flex items-center space-x-3">
                 <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                 <span className="text-gray-300">Overdue</span>
               </div>
               <div className="flex items-center space-x-3">
                 <div className="w-7 h-7 bg-indigo-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                   {new Date().getDate()}
                 </div>
                 <span className="text-gray-300">Today</span>
               </div>
             </div>
           </div>
        </div>

        {/* Right Column - Task Cards (2/5 = 40%) */}
        <div className="flex flex-col lg:col-span-2">
          {/* View Mode Selector */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Tasks</h2>
            <div className="btn-group">
              <button
                onClick={() => setViewMode('cards')}
                className={`btn btn-sm ${viewMode === 'cards' ? 'btn-active' : 'btn-ghost'}`}
              >
                Cards
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`btn btn-sm ${viewMode === 'list' ? 'btn-active' : 'btn-ghost'}`}
              >
                List
              </button>
            </div>
          </div>

          {/* Selected Date Info */}
          {selectedDate ? (
            <div className="p-4 bg-gray-700 rounded-lg border border-gray-600 overflow-y-auto max-h-[calc(100vh-16rem)]">
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
                  {viewMode === 'cards' ? (
                    <div className="space-y-4">
                      {overdueTasks.map((task) => (
                        <TaskCard
                          key={task.id}
                          task={task}
                          onStatusChange={() => {}}
                          onPriorityChange={() => {}}
                          onDelete={() => {}}
                        />
                      ))}
                    </div>
                  ) : (
                    <TaskList
                      tasks={overdueTasks}
                      onStatusChange={() => {}}
                      onPriorityChange={() => {}}
                      onDelete={() => {}}
                    />
                  )}
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
                   {viewMode === 'cards' ? (
                     <div className="space-y-4">
                       {tasksForDate.map((task) => (
                         <TaskCard
                           key={task.id}
                           task={task}
                           onStatusChange={() => {}}
                           onPriorityChange={() => {}}
                           onDelete={() => {}}
                         />
                       ))}
                     </div>
                   ) : (
                     <TaskList
                       tasks={tasksForDate}
                       onStatusChange={() => {}}
                       onPriorityChange={() => {}}
                       onDelete={() => {}}
                     />
                   )}
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
          ) : (
            <div className="p-8 bg-gray-700 rounded-lg border border-gray-600 h-full flex items-center justify-center">
              <div className="text-center">
                <svg className="w-16 h-16 mx-auto mb-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-gray-400 text-lg">Select a date to view tasks</p>
                <p className="text-gray-500 text-sm mt-2">Click on any date in the calendar</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Calendar;
