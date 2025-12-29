import { useState, useEffect } from 'react';
import { projectsAPI, templatesAPI } from '../../services/api';

const CreateProjectModal = ({ isOpen, onClose, onProjectCreated }) => {
  const [step, setStep] = useState(1); // 1: choose template or scratch, 2: project details
  const [templates, setTemplates] = useState([]);
  const [userTemplates, setUserTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [selectedTemplateType, setSelectedTemplateType] = useState('system'); // 'system' or 'user'
  const [activeTab, setActiveTab] = useState('system'); // 'system' or 'my-templates'
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#6366f1',
    icon: '📁',
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

  useEffect(() => {
    if (isOpen) {
      fetchTemplates();
      fetchUserTemplates();
    }
  }, [isOpen]);

  const fetchTemplates = async () => {
    try {
      const response = await projectsAPI.getTemplates();
      setTemplates(response.data);
    } catch (err) {
      console.error('Error fetching templates:', err);
    }
  };

  const fetchUserTemplates = async () => {
    try {
      const response = await templatesAPI.getAll();
      setUserTemplates(response.data);
    } catch (err) {
      console.error('Error fetching user templates:', err);
    }
  };

  const handleTemplateSelect = (template, type) => {
    setSelectedTemplate(template);
    setSelectedTemplateType(type);
    if (template) {
      setFormData(prev => ({
        ...prev,
        name: template.name,
        description: template.description,
        color: template.color,
        icon: template.icon
      }));
    }
    setStep(2);
  };

  const handleStartFromScratch = () => {
    setSelectedTemplate(null);
    setFormData({
      name: '',
      description: '',
      color: '#6366f1',
      icon: '📁',
      dueDate: ''
    });
    setStep(2);
  };

  const handleDeleteTemplate = async (templateId, e) => {
    e.stopPropagation(); // Prevent selecting the template when clicking delete
    try {
      await templatesAPI.delete(templateId);
      // Refresh the user templates list
      await fetchUserTemplates();
      setDeleteConfirm(null);
    } catch (err) {
      console.error('Error deleting template:', err);
      setError(err.response?.data?.error || 'Failed to delete template');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Project name is required');
      return;
    }

    // Validate due date is required and in the future
    if (!formData.dueDate || !formData.dueDate.trim()) {
      setError('Due date is required');
      return;
    }

    const dueDateObj = new Date(formData.dueDate);
    const now = new Date();
    if (isNaN(dueDateObj.getTime())) {
      setError('Invalid due date format');
      return;
    }
    if (dueDateObj <= now) {
      setError('Due date must be in the future');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      let response;
      
      if (selectedTemplateType === 'user') {
        // Create project from user template (with date offset logic)
        response = await templatesAPI.createProjectFromTemplate(selectedTemplate.id, {
          name: formData.name,
          description: formData.description,
          dueDate: formData.dueDate
        });
      } else {
        // Create project from system template or from scratch
        response = await projectsAPI.create({
          ...formData,
          template: selectedTemplate?.id || null
        });
      }
      
      onProjectCreated(response.data);
      handleClose();
    } catch (err) {
      console.error('Error creating project:', err);
      setError(err.response?.data?.error || 'Failed to create project');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setStep(1);
    setSelectedTemplate(null);
    setSearchTerm('');
    setFormData({
      name: '',
      description: '',
      color: '#6366f1',
      icon: '📁',
      dueDate: ''
    });
    setError(null);
    onClose();
  };

  // Filter templates based on search term
  const filteredSystemTemplates = templates.filter(template => {
    if (!searchTerm.trim()) return true;
    const search = searchTerm.toLowerCase();
    return (
      template.name.toLowerCase().includes(search) ||
      template.description?.toLowerCase().includes(search)
    );
  });

  const filteredUserTemplates = userTemplates.filter(template => {
    if (!searchTerm.trim()) return true;
    const search = searchTerm.toLowerCase();
    return (
      template.name.toLowerCase().includes(search) ||
      template.description?.toLowerCase().includes(search)
    );
  });

  if (!isOpen) return null;

  return (
    <div className="modal modal-open backdrop-blur-sm animate-fadeIn">
      <div 
        className="modal-box max-w-3xl border"
        style={{ 
          backgroundColor: 'var(--color-bg-secondary)',
          borderColor: 'var(--color-border-default)'
        }}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
              {step === 1 ? 'Create New Project' : selectedTemplate ? `Create from Template` : 'New Project'}
            </h3>
            <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
              {step === 1 
                ? 'Choose a template or start from scratch'
                : 'Configure your project details'}
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

        {/* Step 1: Template Selection */}
        {step === 1 && (
          <div className="space-y-6">
            {/* Start from Scratch */}
            <button
              onClick={handleStartFromScratch}
              className="w-full p-6 rounded-xl border-2 border-dashed transition-all hover:border-indigo-500 hover:bg-indigo-500/5 text-left group"
              style={{ borderColor: 'var(--color-border-default)' }}
            >
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 rounded-xl bg-indigo-500/20 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                  ✨
                </div>
                <div>
                  <h4 className="text-lg font-semibold group-hover:text-indigo-400 transition-colors" style={{ color: 'var(--color-text-primary)' }}>
                    Start from Scratch
                  </h4>
                  <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                    Create a blank project and add your own tasks
                  </p>
                </div>
              </div>
            </button>

            {/* Tabs */}
            <div className="tabs tabs-boxed" style={{ backgroundColor: 'var(--color-bg-tertiary)' }}>
              <button 
                className={`tab ${activeTab === 'system' ? 'tab-active' : ''}`}
                onClick={() => setActiveTab('system')}
                style={activeTab === 'system' ? { backgroundColor: 'var(--color-primary)', color: 'white' } : {}}
              >
                📋 System Templates
              </button>
              <button 
                className={`tab ${activeTab === 'my-templates' ? 'tab-active' : ''}`}
                onClick={() => setActiveTab('my-templates')}
                style={activeTab === 'my-templates' ? { backgroundColor: 'var(--color-primary)', color: 'white' } : {}}
              >
                💾 My Templates ({userTemplates.length})
              </button>
            </div>

            {/* Search Bar */}
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search templates by name or description..."
                className="input input-bordered w-full pl-10"
                style={{
                  backgroundColor: 'var(--color-bg-tertiary)',
                  borderColor: 'var(--color-border-default)',
                  color: 'var(--color-text-primary)',
                }}
              />
              <svg 
                className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5"
                style={{ color: 'var(--color-text-tertiary)' }}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 btn btn-ghost btn-xs btn-circle"
                  style={{ color: 'var(--color-text-tertiary)' }}
                  title="Clear search"
                >
                  ✕
                </button>
              )}
            </div>

            {/* System Templates */}
            {activeTab === 'system' && (
              <div>
                <h4 className="text-sm font-medium mb-3" style={{ color: 'var(--color-text-tertiary)' }}>
                  CHOOSE A SYSTEM TEMPLATE
                  {searchTerm && (
                    <span className="ml-2 text-xs">
                      ({filteredSystemTemplates.length} {filteredSystemTemplates.length === 1 ? 'result' : 'results'})
                    </span>
                  )}
                </h4>
                {filteredSystemTemplates.length === 0 ? (
                  <div 
                    className="p-12 text-center rounded-xl border-2 border-dashed"
                    style={{ borderColor: 'var(--color-border-default)' }}
                  >
                    <div className="text-4xl mb-4 opacity-50">🔍</div>
                    <h5 className="text-lg font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>
                      No templates found
                    </h5>
                    <p className="text-sm mb-4" style={{ color: 'var(--color-text-secondary)' }}>
                      No system templates match "{searchTerm}"
                    </p>
                    <button
                      onClick={() => setSearchTerm('')}
                      className="btn btn-sm btn-ghost"
                      style={{ color: 'var(--color-text-secondary)' }}
                    >
                      Clear search
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredSystemTemplates.map((template) => (
                    <button
                      key={template.id}
                      onClick={() => handleTemplateSelect(template, 'system')}
                      className="p-4 rounded-xl border transition-all hover:border-indigo-500 hover:bg-indigo-500/5 text-left group"
                      style={{ 
                        backgroundColor: 'var(--color-bg-tertiary)',
                        borderColor: 'var(--color-border-default)'
                      }}
                    >
                      <div className="flex items-start space-x-3">
                        <div 
                          className="w-10 h-10 rounded-lg flex items-center justify-center text-xl group-hover:scale-110 transition-transform"
                          style={{ backgroundColor: template.color + '30' }}
                        >
                          {template.icon}
                        </div>
                      <div className="flex-1 min-w-0">
                        <h5 className="font-semibold truncate group-hover:text-indigo-400 transition-colors" style={{ color: 'var(--color-text-primary)' }}>
                          {template.name}
                        </h5>
                        <p className="text-xs line-clamp-2 mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                          {template.description}
                        </p>
                        <div className="flex items-center mt-2 text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                          <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                          {template.taskCount} tasks included
                        </div>
                      </div>
                    </div>
                  </button>
                    ))}
                  </div>
                )}
              </div>
            )}

          {/* My Templates Tab */}
          {activeTab === 'my-templates' && (
            <div>
              <div className="flex justify-between items-center mb-3">
                <h4 className="text-sm font-medium" style={{ color: 'var(--color-text-tertiary)' }}>
                  YOUR CUSTOM TEMPLATES
                  {searchTerm && (
                    <span className="ml-2 text-xs">
                      ({filteredUserTemplates.length} {filteredUserTemplates.length === 1 ? 'result' : 'results'})
                    </span>
                  )}
                </h4>
                {userTemplates.length > 0 && !searchTerm && (
                  <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                    🚀 Click a template to reuse it with new dates
                  </p>
                )}
              </div>

              {userTemplates.length === 0 ? (
                <div 
                  className="p-12 text-center rounded-xl border-2 border-dashed"
                  style={{ borderColor: 'var(--color-border-default)' }}
                >
                  <div className="text-6xl mb-4 opacity-50">💾</div>
                  <h5 className="text-lg font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>
                    No custom templates yet
                  </h5>
                  <p className="text-sm mb-4" style={{ color: 'var(--color-text-secondary)' }}>
                    Create a project, set it up with tasks and due dates, then save it as a template for future use.
                  </p>
                  <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                    💡 Templates preserve task assignments and relative due dates
                  </p>
                </div>
              ) : filteredUserTemplates.length === 0 ? (
                <div 
                  className="p-12 text-center rounded-xl border-2 border-dashed"
                  style={{ borderColor: 'var(--color-border-default)' }}
                >
                  <div className="text-4xl mb-4 opacity-50">🔍</div>
                  <h5 className="text-lg font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>
                    No templates found
                  </h5>
                  <p className="text-sm mb-4" style={{ color: 'var(--color-text-secondary)' }}>
                    No custom templates match "{searchTerm}"
                  </p>
                  <button
                    onClick={() => setSearchTerm('')}
                    className="btn btn-sm btn-ghost"
                    style={{ color: 'var(--color-text-secondary)' }}
                  >
                    Clear search
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredUserTemplates.map((template) => (
                    <div key={template.id} className="relative">
                      <button
                        onClick={() => handleTemplateSelect(template, 'user')}
                        className="w-full p-4 rounded-xl border transition-all hover:border-indigo-500 hover:bg-indigo-500/5 text-left group"
                        style={{ 
                          backgroundColor: 'var(--color-bg-tertiary)',
                          borderColor: 'var(--color-border-default)'
                        }}
                      >
                        <div className="flex items-start space-x-3">
                          <div 
                            className="w-10 h-10 rounded-lg flex items-center justify-center text-xl group-hover:scale-110 transition-transform"
                            style={{ backgroundColor: template.color + '30' }}
                          >
                            {template.icon}
                          </div>
                          <div className="flex-1 min-w-0 pr-8">
                            <div className="flex items-center justify-between">
                              <h5 className="font-semibold truncate group-hover:text-indigo-400 transition-colors" style={{ color: 'var(--color-text-primary)' }}>
                                {template.name}
                              </h5>
                              {!template.isPersonal && (
                                <span 
                                  className="badge badge-sm ml-2"
                                  style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}
                                >
                                  Company
                                </span>
                              )}
                            </div>
                          {template.description && (
                            <p className="text-xs line-clamp-2 mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                              {template.description}
                            </p>
                          )}
                          <div className="flex items-center justify-between mt-2">
                            <div className="flex items-center text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                              <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                              </svg>
                              {template._count?.tasks || 0} tasks
                            </div>
                            {template.usageCount > 0 && (
                              <div className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                                Used {template.usageCount}x
                              </div>
                            )}
                          </div>
                          {template.lastUsedAt && (
                            <p className="text-xs mt-1" style={{ color: 'var(--color-text-tertiary)' }}>
                              Last used {new Date(template.lastUsedAt).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                    </button>

                    {/* Delete Button */}
                    {deleteConfirm === template.id ? (
                      <div 
                        className="absolute top-2 right-2 flex items-center space-x-1 p-1 rounded-lg"
                        style={{ backgroundColor: 'var(--color-bg-secondary)' }}
                      >
                        <button
                          onClick={(e) => handleDeleteTemplate(template.id, e)}
                          className="btn btn-xs btn-error"
                          title="Confirm delete"
                        >
                          ✓
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteConfirm(null);
                          }}
                          className="btn btn-xs btn-ghost"
                          title="Cancel"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteConfirm(template.id);
                        }}
                        className="absolute top-2 right-2 btn btn-xs btn-ghost btn-circle opacity-0 group-hover:opacity-100 transition-opacity"
                        style={{ color: 'var(--color-text-tertiary)' }}
                        title="Delete template"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                  ))}
                </div>
              )}
            </div>
          )}
          </div>
        )}

        {/* Step 2: Project Details Form */}
        {step === 2 && (
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

            {/* Icon and Color */}
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

            {/* Due Date */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                Due Date <span className="text-error">*</span>
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
                required
                min={new Date().toISOString().split('T')[0]}
              />
              <label className="label">
                <span className="label-text-alt" style={{ color: 'var(--color-text-tertiary)' }}>
                  📅 {selectedTemplateType === 'user' ? 'All task due dates will be calculated relative to this date' : 'Project must have a future due date'}
                </span>
              </label>
            </div>


            {/* Template Info */}
            {selectedTemplate && (
              <div 
                className="rounded-lg p-3 flex items-center space-x-3"
                style={{ backgroundColor: selectedTemplate.color + '10' }}
              >
                <span className="text-xl">{selectedTemplate.icon}</span>
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                    Using template: {selectedTemplate.name}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                    {selectedTemplate.taskCount} tasks will be automatically created
                  </p>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-between pt-4 border-t" style={{ borderColor: 'var(--color-border-default)' }}>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="btn btn-ghost"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                ← Back
              </button>
              <div className="space-x-2">
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
                  className="btn border-0"
                  style={{ 
                    backgroundColor: 'var(--color-primary)',
                    color: 'white'
                  }}
                  onMouseEnter={(e) => e.target.style.opacity = '0.9'}
                  onMouseLeave={(e) => e.target.style.opacity = '1'}
                >
                  {isLoading ? (
                    <>
                      <span className="loading loading-spinner loading-sm mr-2"></span>
                      Creating...
                    </>
                  ) : (
                    'Create Project'
                  )}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default CreateProjectModal;

