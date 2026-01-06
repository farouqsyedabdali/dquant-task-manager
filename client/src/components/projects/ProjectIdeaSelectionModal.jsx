import { useState, useEffect } from 'react';
import { FaTimes, FaCheck } from 'react-icons/fa';
import IconButton from '../common/IconButton';

const ProjectIdeaSelectionModal = ({ isOpen, onClose, ideas, onSelect, isLoading }) => {
  const [selectedIndex, setSelectedIndex] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setSelectedIndex(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSelect = (idea, index) => {
    setSelectedIndex(index);
    onSelect(idea);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div 
        className="relative w-full max-w-4xl max-h-[90vh] mx-4 rounded-2xl shadow-2xl transform transition-all"
        style={{
          backgroundColor: 'var(--color-bg-secondary)',
          borderColor: 'var(--color-border-default)',
          border: '1px solid',
        }}
      >
        {/* Header */}
        <div 
          className="flex items-center justify-between px-6 py-4 border-b"
          style={{ borderColor: 'var(--color-border-default)' }}
        >
          <div>
            <h2 
              className="text-2xl font-bold"
              style={{ color: 'var(--color-text-primary)' }}
            >
              Choose a Project Type
            </h2>
            <p 
              className="text-sm mt-1"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              Select the project template that best matches your needs
            </p>
          </div>
          <button
            onClick={onClose}
            className="transition-colors"
            style={{ color: 'var(--color-text-tertiary)' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--color-text-primary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--color-text-tertiary)';
            }}
          >
            <FaTimes size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 120px)' }}>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <span className="loading loading-spinner loading-lg"></span>
              <span 
                className="ml-4 text-lg"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                Analyzing your text...
              </span>
            </div>
          ) : ideas && ideas.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {ideas.map((idea, index) => {
                const isSelected = selectedIndex === index;
                return (
                  <button
                    key={idea.id}
                    onClick={() => handleSelect(idea, index)}
                    className={`text-left p-5 rounded-xl border-2 transition-all duration-200 ${
                      isSelected ? 'ring-2 ring-offset-2' : ''
                    }`}
                    style={{
                      backgroundColor: isSelected 
                        ? 'var(--color-bg-tertiary)' 
                        : 'var(--color-bg-secondary)',
                      borderColor: isSelected 
                        ? idea.color || 'var(--color-primary)' 
                        : 'var(--color-border-default)',
                      ringColor: idea.color || 'var(--color-primary)',
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.borderColor = idea.color || 'var(--color-primary)';
                        e.currentTarget.style.backgroundColor = 'var(--color-bg-tertiary)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.borderColor = 'var(--color-border-default)';
                        e.currentTarget.style.backgroundColor = 'var(--color-bg-secondary)';
                      }
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4 flex-1">
                        {/* Icon */}
                        <div 
                          className="text-4xl flex-shrink-0"
                          style={{ color: idea.color }}
                        >
                          {idea.icon}
                        </div>
                        
                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <h3 
                            className="text-lg font-semibold mb-1"
                            style={{ color: 'var(--color-text-primary)' }}
                          >
                            {idea.name}
                          </h3>
                          <p 
                            className="text-sm mb-2"
                            style={{ color: 'var(--color-text-secondary)' }}
                          >
                            {idea.description}
                          </p>
                          
                          {/* Relevance Score */}
                          {idea.relevanceScore !== undefined && (
                            <div className="flex items-center space-x-2 mt-2">
                              <div 
                                className="text-xs font-medium"
                                style={{ color: 'var(--color-text-tertiary)' }}
                              >
                                Match: {Math.round(idea.relevanceScore * 100)}%
                              </div>
                              <div 
                                className="flex-1 h-2 rounded-full overflow-hidden"
                                style={{ backgroundColor: 'var(--color-bg-quaternary)' }}
                              >
                                <div 
                                  className="h-full rounded-full transition-all duration-300"
                                  style={{ 
                                    width: `${idea.relevanceScore * 100}%`,
                                    backgroundColor: idea.color || 'var(--color-primary)'
                                  }}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Checkmark */}
                      {isSelected && (
                        <div 
                          className="ml-4 flex-shrink-0"
                          style={{ color: idea.color || 'var(--color-primary)' }}
                        >
                          <FaCheck size={20} />
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div 
              className="text-center py-12"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              No project ideas available. Please try again.
            </div>
          )}
        </div>

        {/* Footer */}
        <div 
          className="flex items-center justify-between px-6 py-4 border-t"
          style={{ borderColor: 'var(--color-border-default)' }}
        >
          <IconButton
            onClick={onClose}
            label="Cancel"
            variant="secondary"
            size="sm"
          />
          <div 
            className="text-sm"
            style={{ color: 'var(--color-text-tertiary)' }}
          >
            {selectedIndex !== null 
              ? `Selected: ${ideas[selectedIndex]?.name}` 
              : 'Select a project type to continue'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectIdeaSelectionModal;
