import { FaFolderOpen, FaArchive } from 'react-icons/fa';

const ArchiveSwitcher = ({ currentView, onViewChange }) => {
  return (
    <div 
      className="flex items-center space-x-1 rounded-lg p-1 transition-colors duration-200"
      style={{ backgroundColor: 'var(--color-bg-tertiary)' }}
    >
      <button
        onClick={() => onViewChange('active')}
        className={`px-3 py-1 text-sm rounded-md transition-all duration-200 flex items-center space-x-2 ${
          currentView === 'active' ? '' : ''
        }`}
        style={currentView === 'active' 
          ? {
              backgroundColor: 'var(--color-primary)',
              color: '#ffffff',
            }
          : {
              color: 'var(--color-text-secondary)',
            }
        }
        onMouseEnter={(e) => {
          if (currentView !== 'active') {
            e.currentTarget.style.color = 'var(--color-text-primary)';
            e.currentTarget.style.backgroundColor = 'var(--color-surface-hover)';
          }
        }}
        onMouseLeave={(e) => {
          if (currentView !== 'active') {
            e.currentTarget.style.color = 'var(--color-text-secondary)';
            e.currentTarget.style.backgroundColor = 'transparent';
          }
        }}
      >
        <FaFolderOpen className="w-4 h-4" />
        <span>Active</span>
      </button>
      <button
        onClick={() => onViewChange('archived')}
        className={`px-3 py-1 text-sm rounded-md transition-all duration-200 flex items-center space-x-2 ${
          currentView === 'archived' ? '' : ''
        }`}
        style={currentView === 'archived' 
          ? {
              backgroundColor: 'var(--color-primary)',
              color: '#ffffff',
            }
          : {
              color: 'var(--color-text-secondary)',
            }
        }
        onMouseEnter={(e) => {
          if (currentView !== 'archived') {
            e.currentTarget.style.color = 'var(--color-text-primary)';
            e.currentTarget.style.backgroundColor = 'var(--color-surface-hover)';
          }
        }}
        onMouseLeave={(e) => {
          if (currentView !== 'archived') {
            e.currentTarget.style.color = 'var(--color-text-secondary)';
            e.currentTarget.style.backgroundColor = 'transparent';
          }
        }}
      >
        <FaArchive className="w-4 h-4" />
        <span>Archived</span>
      </button>
    </div>
  );
};

export default ArchiveSwitcher;
