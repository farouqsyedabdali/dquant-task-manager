import { useState } from 'react';
import IconButton from '../common/IconButton';
import { FaTimes, FaCheck } from 'react-icons/fa';

const SaveAsTemplateModal = ({ isOpen, onClose, projectName, onSave }) => {
  const [templateData, setTemplateData] = useState({
    name: projectName || '',
    isPersonal: true
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSave(templateData);
      onClose();
    } catch (error) {
      console.error('Error saving template:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal modal-open">
      <div 
        className="modal-box max-w-md"
        style={{ 
          backgroundColor: 'var(--color-bg-secondary)',
          borderColor: 'var(--color-border-default)'
        }}
      >
        <h3 className="font-bold text-xl mb-4" style={{ color: 'var(--color-text-primary)' }}>
          💾 Save as Template
        </h3>

        <p className="text-sm mb-6" style={{ color: 'var(--color-text-secondary)' }}>
          Create a reusable template from this project. All task details, assignments, and relative due dates will be preserved.
        </p>

        <form onSubmit={handleSubmit}>
          {/* Template Name */}
          <div className="form-control mb-4">
            <label className="label">
              <span className="label-text" style={{ color: 'var(--color-text-secondary)' }}>
                Template Name *
              </span>
            </label>
            <input
              type="text"
              value={templateData.name}
              onChange={(e) => setTemplateData({ ...templateData, name: e.target.value })}
              placeholder="e.g., Picnic Planning, Product Launch, Client Onboarding"
              className="input input-bordered w-full"
              style={{ 
                backgroundColor: 'var(--color-bg-tertiary)',
                borderColor: 'var(--color-border-default)',
                color: 'var(--color-text-primary)'
              }}
              required
            />
            <label className="label">
              <span className="label-text-alt" style={{ color: 'var(--color-text-tertiary)' }}>
                Choose a memorable name for easy identification later
              </span>
            </label>
          </div>

          {/* Visibility */}
          <div className="form-control mb-6">
            <label className="label cursor-pointer justify-start space-x-3">
              <input
                type="checkbox"
                checked={templateData.isPersonal}
                onChange={(e) => setTemplateData({ ...templateData, isPersonal: e.target.checked })}
                className="checkbox checkbox-primary"
              />
              <div>
                <span className="label-text font-medium" style={{ color: 'var(--color-text-primary)' }}>
                  Personal Template
                </span>
                <p className="text-xs mt-1" style={{ color: 'var(--color-text-tertiary)' }}>
                  Only you can use this template. Uncheck to share with your company.
                </p>
              </div>
            </label>
          </div>

          {/* Info Box */}
          <div 
            className="p-4 rounded-lg mb-6"
            style={{ 
              backgroundColor: 'var(--color-bg-tertiary)',
              borderLeft: '4px solid var(--color-primary)'
            }}
          >
            <p className="text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
              📅 What gets saved:
            </p>
            <ul className="text-xs space-y-1" style={{ color: 'var(--color-text-secondary)' }}>
              <li>• All sent task details (title, description, priority)</li>
              <li>• Task assignments (internal & external contacts)</li>
              <li>• Relative due dates (e.g., "2 days before project due date")</li>
              <li>• Project color and icon</li>
            </ul>
          </div>

          <div className="modal-action">
            <IconButton
              type="submit"
              disabled={!templateData.name.trim() || isSaving}
              icon={<FaCheck />}
              label={isSaving ? 'Saving...' : 'Save Template'}
              variant="primary"
              size="sm"
              loading={isSaving}
            />
            <IconButton
              type="button"
              onClick={onClose}
              disabled={isSaving}
              icon={<FaTimes />}
              label="Cancel"
              variant="secondary"
              size="sm"
            />
          </div>
        </form>
      </div>
      <div className="modal-backdrop" onClick={onClose}></div>
    </div>
  );
};

export default SaveAsTemplateModal;




