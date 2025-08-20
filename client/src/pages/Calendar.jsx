import Calendar from '../components/calendar/Calendar';

const CalendarPage = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Calendar View</h1>
        <p className="text-gray-400">View your tasks and deadlines in a monthly calendar format</p>
      </div>
      
      <Calendar />
    </div>
  );
};

export default CalendarPage;
