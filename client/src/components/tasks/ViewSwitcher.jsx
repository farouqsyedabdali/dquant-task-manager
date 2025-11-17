import { MdViewModule, MdViewList } from 'react-icons/md';

const ViewSwitcher = ({ currentView, onViewChange }) => {
  return (
    <div 
      className="flex items-center space-x-2 border rounded-lg p-1 transition-colors duration-200"
      style={{
        backgroundColor: 'var(--color-bg-secondary)',
        borderColor: 'var(--color-border-default)',
      }}
    >
      <button
        onClick={() => onViewChange('cards')}
        className="flex items-center space-x-2 px-3 py-2 rounded-md transition-colors duration-200"
        style={currentView === 'cards' 
          ? {
              backgroundColor: 'var(--color-primary)',
              color: '#ffffff',
            }
          : {
              color: 'var(--color-text-tertiary)',
            }
        }
        onMouseEnter={(e) => {
          if (currentView !== 'cards') {
            e.currentTarget.style.color = 'var(--color-text-primary)';
            e.currentTarget.style.backgroundColor = 'var(--color-surface-hover)';
          }
        }}
        onMouseLeave={(e) => {
          if (currentView !== 'cards') {
            e.currentTarget.style.color = 'var(--color-text-tertiary)';
            e.currentTarget.style.backgroundColor = 'transparent';
          }
        }}
      >
        <MdViewModule className="w-4 h-4" />
        <span className="text-sm font-medium">Cards</span>
      </button>
      
      <button
        onClick={() => onViewChange('list')}
        className="flex items-center space-x-2 px-3 py-2 rounded-md transition-colors duration-200"
        style={currentView === 'list' 
          ? {
              backgroundColor: 'var(--color-primary)',
              color: '#ffffff',
            }
          : {
              color: 'var(--color-text-tertiary)',
            }
        }
        onMouseEnter={(e) => {
          if (currentView !== 'list') {
            e.currentTarget.style.color = 'var(--color-text-primary)';
            e.currentTarget.style.backgroundColor = 'var(--color-surface-hover)';
          }
        }}
        onMouseLeave={(e) => {
          if (currentView !== 'list') {
            e.currentTarget.style.color = 'var(--color-text-tertiary)';
            e.currentTarget.style.backgroundColor = 'transparent';
          }
        }}
      >
        <MdViewList className="w-4 h-4" />
        <span className="text-sm font-medium">List</span>
      </button>
    </div>
  );
};

export default ViewSwitcher; 