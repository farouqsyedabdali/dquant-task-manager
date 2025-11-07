import React from 'react';
import IconButton from './IconButton';
import { FaTimes, FaTrash } from 'react-icons/fa';

const DeleteConfirmModal = ({ isOpen, onClose, onConfirm, taskTitle, isLoading = false, deleteType = 'task' }) => {
  if (!isOpen) return null;

  // Determine title and message based on delete type
  const getTitle = () => {
    switch (deleteType) {
      case 'admin':
        return 'Delete Admin User';
      case 'employee':
        return 'Delete Employee';
      default:
        return 'Delete Task';
    }
  };

  const getMessage = () => {
    switch (deleteType) {
      case 'admin':
        return `Are you sure you want to delete admin user <span className="font-medium text-white">"${taskTitle}"</span>? This will remove their admin privileges and all associated data. This action cannot be undone.`;
      case 'employee':
        return `Are you sure you want to delete employee <span className="font-medium text-white">"${taskTitle}"</span>? This will remove all their associated data. This action cannot be undone.`;
      default:
        return `Are you sure you want to delete <span className="font-medium text-white">"${taskTitle}"</span>? This action cannot be undone.`;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      {/* Modal */}
      <div className="relative bg-gray-900 border border-gray-700 rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
        <div className="text-center">
          {/* Icon */}
          <div className="mx-auto flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mb-4">
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          
          {/* Title */}
          <h3 className="text-lg font-medium text-white mb-2">
            {getTitle()}
          </h3>
          
          {/* Message */}
          <p className="text-gray-300 mb-6" dangerouslySetInnerHTML={{ __html: getMessage() }} />
          
          {/* Buttons */}
          <div className="flex space-x-3">
            <IconButton
              icon={<FaTimes />}
              label="Cancel"
              variant="ghost"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1"
            />
            <IconButton
              icon={<FaTrash />}
              label="Delete"
              variant="danger"
              onClick={onConfirm}
              disabled={isLoading}
              loading={isLoading}
              className="flex-1"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmModal;
