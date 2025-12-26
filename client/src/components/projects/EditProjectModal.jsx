import { useState, useEffect } from 'react';
import { projectsAPI } from '../../services/api';

const EditProjectModal = ({ isOpen, onClose, project, onProjectUpdated }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#6366f1',
    icon: '📁',
    status: 'ACTIVE',
    dueDate: ''
  });

  const colorOptions = [
    '#6366f1', // Indigo
    '#8b5cf6', // Purple
    '#ec4899', // Pink
    '#ef4444', // Red
    '#f59e0b', // Amber
    '#10b981', // Emerald
    '#06b6d4', // Cyan
    '#3b82f6', // Blue
    '#84cc16', // Lime
    '#f97316', // Orange
  ];

  const iconOptions = [
    '📁', '🚀', '💼', '📊', '🎯', '💡', '🔧', '📱', '🎨', '📝',
    '🏆', '⭐', '🔥', '💎', '🌟', '📣', '🎉', '💻', '✍️', '🤝'
  ];

  const statusOptions = [
    { value: 'ACTIVE', label: 'Active' },
    { value: 'ON_HOLD', label: 'On Hold' },
    { value: 'COMPLETED', label: 'Completed' },
    { value: 'ARCHIVED', label: 'Archived' }
  ];

  useEffect(() => {
    if (project && isOpen) {
      setFormData({
        name: project.name || '',
        description: project.description || '',
        color: project.color || '#6366f1',
        icon: project.icon || '📁',
        status: project.status || 'ACTIVE',
        dueDate: project.dueDate ? new Date(project.dueDate).toISOString().split('T')[0] : ''
      });
      setError(null);
    }
  }, [project, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Project name is required');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const updateData = {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        color: formData.color,
        icon: formData.icon,
        status: formData.status,
        dueDate: formData.dueDate || null
      };

      const response = await projectsAPI.update(project.id, updateData);
      onProjectUpdated(response.data);
      handleClose();
    } catch (err) {
      console.error('Error updating project:', err);
      setError(err.response?.data?.error || 'Failed to update project');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      description: '',
      color: '#6366f1',
      icon: '📁',
      status: 'ACTIVE',
      dueDate: ''
    });
    setError(null);
    onClose();
  };

  if (!isOpen || !project) return null;

  return (
    <div className="modal modal-open backdrop-blur-sm animate-fadeIn">
      <div 
        className="modal-box max-w-2xl border"
        style={{ 
          backgroundColor: 'var(--color-bg-secondary)',
          borderColor: 'var(--color-border-default)'
        }}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
              Edit Project
            </h3>
            <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
              Update project details
            </p>
          </div>
          <button 
            onClick={handleClose} 
            className="btn btn-ghost btn-sm btn-circle"
            style={{ color: 'var(--color-text-tertiary)' }}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Error Display */}
          {error && (
            <div className="alert alert-error">
              <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* Icon and Name */}
          <div className="flex space-x-6">
            {/* Icon Selection */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                Icon
              </label>
              <div 
                className="w-16 h-16 rounded-xl flex items-center justify-center text-3xl cursor-pointer relative group"
                style={{ backgroundColor: formData.color + '20' }}
              >
                {formData.icon}
                <div className="dropdown dropdown-bottom">
                  <div tabIndex={0} className="absolute inset-0 cursor-pointer" />
                  <div 
                    tabIndex={0} 
                    className="dropdown-content z-50 p-3 shadow-xl rounded-xl w-64 grid grid-cols-5 gap-2"
                    style={{ backgroundColor: 'var(--color-bg-tertiary)' }}
                  >
                    {iconOptions.map((icon) => (
                      <button
                        key={icon}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, icon }))}
                        className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl hover:bg-indigo-500/20 transition-colors ${formData.icon === icon ? 'bg-indigo-500/30 ring-2 ring-indigo-500' : ''}`}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Name Input */}
            <div className="flex-1">
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                Project Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="input input-bordered w-full"
                style={{
                  backgroundColor: 'var(--color-bg-tertiary)',
                  borderColor: 'var(--color-border-default)',
                  color: 'var(--color-text-primary)',
                }}
                placeholder="Enter project name"
                autoFocus
                required
              />
            </div>
          </div>

          {/* Color Selection */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
              Color
            </label>
            <div className="flex flex-wrap gap-2">
              {colorOptions.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, color }))}
                  className={`w-8 h-8 rounded-full transition-transform hover:scale-110 ${formData.color === color ? 'ring-2 ring-offset-2 ring-white scale-110' : ''}`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="textarea textarea-bordered w-full h-24"
              style={{
                backgroundColor: 'var(--color-bg-tertiary)',
                borderColor: 'var(--color-border-default)',
                color: 'var(--color-text-primary)',
              }}
              placeholder="What is this project about?"
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
              className="select select-bordered w-full"
              style={{
                backgroundColor: 'var(--color-bg-tertiary)',
                borderColor: 'var(--color-border-default)',
                color: 'var(--color-text-primary)',
              }}
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Due Date */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
              Due Date (optional)
            </label>
            <input
              type="date"
              value={formData.dueDate}
              onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
              className="input input-bordered w-full"
              style={{
                backgroundColor: 'var(--color-bg-tertiary)',
                borderColor: 'var(--color-border-default)',
                color: 'var(--color-text-primary)',
              }}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-2 pt-4 border-t" style={{ borderColor: 'var(--color-border-default)' }}>
            <button
              type="button"
              onClick={handleClose}
              className="btn btn-ghost"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !formData.name.trim()}
              className="btn"
              style={{ 
                backgroundColor: 'var(--color-primary)',
                color: 'white',
                border: 'none'
              }}
            >
              {isLoading ? (
                <>
                  <span className="loading loading-spinner loading-sm mr-2"></span>
                  Updating...
                </>
              ) : (
                'Update Project'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProjectModal;


