const ArchiveSwitcher = ({ currentView, onViewChange }) => {
  return (
    <div className="flex items-center space-x-1 bg-gray-700 rounded-lg p-1">
      <button
        onClick={() => onViewChange('active')}
        className={`px-3 py-1 text-sm rounded-md transition-all duration-200 ${
          currentView === 'active'
            ? 'bg-indigo-600 text-white'
            : 'text-gray-300 hover:text-white hover:bg-gray-600'
        }`}
      >
        Active
      </button>
      <button
        onClick={() => onViewChange('archived')}
        className={`px-3 py-1 text-sm rounded-md transition-all duration-200 ${
          currentView === 'archived'
            ? 'bg-indigo-600 text-white'
            : 'text-gray-300 hover:text-white hover:bg-gray-600'
        }`}
      >
        Archived
      </button>
    </div>
  );
};

export default ArchiveSwitcher;
