import { FaFolderOpen, FaArchive } from 'react-icons/fa';

const ArchiveSwitcher = ({ currentView, onViewChange }) => {
  return (
    <div className="flex items-center space-x-1 bg-gray-700 rounded-lg p-1">
      <button
        onClick={() => onViewChange('active')}
        className={`px-3 py-1 text-sm rounded-md transition-all duration-200 flex items-center space-x-2 ${
          currentView === 'active'
            ? 'bg-indigo-600 text-white'
            : 'text-gray-300 hover:text-white hover:bg-gray-600'
        }`}
      >
        <FaFolderOpen className="w-4 h-4" />
        <span>Active</span>
      </button>
      <button
        onClick={() => onViewChange('archived')}
        className={`px-3 py-1 text-sm rounded-md transition-all duration-200 flex items-center space-x-2 ${
          currentView === 'archived'
            ? 'bg-indigo-600 text-white'
            : 'text-gray-300 hover:text-white hover:bg-gray-600'
        }`}
      >
        <FaArchive className="w-4 h-4" />
        <span>Archived</span>
      </button>
    </div>
  );
};

export default ArchiveSwitcher;
