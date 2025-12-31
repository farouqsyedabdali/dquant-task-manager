import { useState } from 'react';
import useUserStore from '../../stores/userStore';

const AddEmployeeModal = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    department: 'Default Department',
    position: 'Default Position',
    password: '',
    confirmPassword: '',
    role: 'EMPLOYEE'
  });
  const [errors, setErrors] = useState({});

  const { createEmployee, isLoading } = useUserStore();

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const result = await createEmployee({
      name: formData.name.trim(),
      email: formData.email.trim(),
      department: formData.department.trim(),
      position: formData.position.trim(),
      password: formData.password,
      role: formData.role
    });

    if (result.success) {
      setFormData({
        name: '',
        email: '',
        department: 'Default Department',
        position: 'Default Position',
        password: '',
        confirmPassword: '',
        role: 'EMPLOYEE'
      });
      setErrors({});
      onClose();
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      role: 'EMPLOYEE'
    });
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal modal-open backdrop-blur-sm animate-fadeIn">
      <div
        className="modal-box max-w-lg border"
        style={{
          backgroundColor: 'var(--color-bg-secondary)',
          borderColor: 'var(--color-border-default)'
        }}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h3 
            className="text-2xl font-bold"
            style={{ color: 'var(--color-text-primary)' }}
          >
            Add New Employee
          </h3>
          <button
            onClick={handleClose}
            className="btn btn-ghost btn-sm btn-circle"
            style={{ color: 'var(--color-text-tertiary)' }}
          >
            ✕
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Name */}
          <div>
            <label
              className="block text-sm font-medium mb-1"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={`input w-full ${errors.name ? 'border-red-500' : ''}`}
              style={{
                backgroundColor: 'var(--color-bg-tertiary)',
                borderColor: errors.name ? '#ef4444' : 'var(--color-border-default)',
                color: 'var(--color-text-primary)',
              }}
              placeholder="Enter employee name"
            />
            {errors.name && (
              <p className="text-red-400 text-sm mt-1">{errors.name}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label
              className="block text-sm font-medium mb-1"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              Email *
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={`input w-full ${errors.email ? 'border-red-500' : ''}`}
              style={{
                backgroundColor: 'var(--color-bg-tertiary)',
                borderColor: errors.email ? '#ef4444' : 'var(--color-border-default)',
                color: 'var(--color-text-primary)',
              }}
              placeholder="Enter employee email"
            />
            {errors.email && (
              <p className="text-red-400 text-sm mt-1">{errors.email}</p>
            )}
          </div>

          {/* Department */}
          <div>
            <label
              className="block text-sm font-medium mb-2"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              Department
            </label>
            <input
              type="text"
              name="department"
              value={formData.department}
              onChange={handleChange}
              className="input w-full"
              style={{
                backgroundColor: 'var(--color-bg-tertiary)',
                borderColor: 'var(--color-border-default)',
                color: 'var(--color-text-primary)',
              }}
              placeholder="Enter department"
            />
          </div>

          {/* Position */}
          <div>
            <label
              className="block text-sm font-medium mb-2"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              Position
            </label>
            <input
              type="text"
              name="position"
              value={formData.position}
              onChange={handleChange}
              className="input w-full"
              style={{
                backgroundColor: 'var(--color-bg-tertiary)',
                borderColor: 'var(--color-border-default)',
                color: 'var(--color-text-primary)',
              }}
              placeholder="Enter position"
            />
          </div>

          {/* Role Selection */}
          <div>
            <label
              className="block text-sm font-medium mb-1"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              Role *
            </label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="select w-full"
              style={{
                backgroundColor: 'var(--color-bg-tertiary)',
                borderColor: 'var(--color-border-default)',
                color: 'var(--color-text-primary)',
              }}
            >
              <option value="EMPLOYEE">Employee</option>
              <option value="ADMIN">Admin</option>
            </select>
            <p 
              className="text-xs mt-1"
              style={{ color: 'var(--color-text-muted)' }}
            >
              Admins can manage employees and tasks
            </p>
          </div>

          {/* Password */}
          <div>
            <label
              className="block text-sm font-medium mb-1"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              Password *
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className={`input w-full ${errors.password ? 'border-red-500' : ''}`}
              style={{
                backgroundColor: 'var(--color-bg-tertiary)',
                borderColor: errors.password ? '#ef4444' : 'var(--color-border-default)',
                color: 'var(--color-text-primary)',
              }}
              placeholder="Enter password"
            />
            {errors.password && (
              <p className="text-red-400 text-sm mt-1">{errors.password}</p>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label
              className="block text-sm font-medium mb-1"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              Confirm Password *
            </label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className={`input w-full ${errors.confirmPassword ? 'border-red-500' : ''}`}
              style={{
                backgroundColor: 'var(--color-bg-tertiary)',
                borderColor: errors.confirmPassword ? '#ef4444' : 'var(--color-border-default)',
                color: 'var(--color-text-primary)',
              }}
              placeholder="Confirm password"
            />
            {errors.confirmPassword && (
              <p className="text-red-400 text-sm mt-1">{errors.confirmPassword}</p>
            )}
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="btn border-0"
              style={{ 
                backgroundColor: 'var(--color-bg-tertiary)',
                color: 'var(--color-text-primary)'
              }}
              onMouseEnter={(e) => e.target.style.opacity = '0.9'}
              onMouseLeave={(e) => e.target.style.opacity = '1'}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
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
                  <span className="loading loading-spinner loading-sm"></span>
                  Creating...
                </>
              ) : (
                'Add Employee'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddEmployeeModal; 