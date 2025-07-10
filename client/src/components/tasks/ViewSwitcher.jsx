import { MdViewModule, MdViewList } from 'react-icons/md';

const ViewSwitcher = ({ currentView, onViewChange }) => {
  return (
    <div className="flex items-center space-x-2 bg-gray-800 border border-gray-700 rounded-lg p-1">
      <button
        onClick={() => onViewChange('cards')}
        className={`flex items-center space-x-2 px-3 py-2 rounded-md transition-colors ${
          currentView === 'cards'
            ? 'bg-indigo-600 text-white'
            : 'text-gray-400 hover:text-white hover:bg-gray-700'
        }`}
      >
        <MdViewModule className="w-4 h-4" />
        <span className="text-sm font-medium">Cards</span>
      </button>
      
      <button
        onClick={() => onViewChange('list')}
        className={`flex items-center space-x-2 px-3 py-2 rounded-md transition-colors ${
          currentView === 'list'
            ? 'bg-indigo-600 text-white'
            : 'text-gray-400 hover:text-white hover:bg-gray-700'
        }`}
      >
        <MdViewList className="w-4 h-4" />
        <span className="text-sm font-medium">List</span>
      </button>
    </div>
  );
};

export default ViewSwitcher; 