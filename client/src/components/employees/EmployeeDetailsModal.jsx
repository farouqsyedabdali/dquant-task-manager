import { useState, useEffect } from 'react';
import { tasksAPI } from '../../services/api';
import useUserStore from '../../stores/userStore';
import useAuthStore from '../../context/authStore';

const EmployeeDetailsModal = ({ employee, isOpen, onClose }) => {
  const [taskStats, setTaskStats] = useState({ 
    assigned: 0, 
    completed: 0, 
    inProgress: 0, 
    onHold: 0, 
    cancelled: 0 
  });
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'EMPLOYEE'
  });
  const [errors, setErrors] = useState({});

  const { updateUser, isLoading } = useUserStore();
  const { isSysAdmin } = useAuthStore();

  // Fetch task statistics when modal opens
  useEffect(() => {
    if (isOpen && employee) {
      fetchTaskStats();
      // Initialize form data
      setFormData({
        name: employee.name,
        email: employee.email,
        role: employee.role
      });
      setErrors({});
      setIsEditing(false);
    }
  }, [isOpen, employee]);

  const fetchTaskStats = async () => {
    try {
      setIsLoadingStats(true);
      const response = await tasksAPI.getAll();
      const employeeTasks = response.data.filter(task => 
        task.assigneeId === employee.id || task.assignerId === employee.id
      );
      
      const stats = {
        assigned: employeeTasks.filter(task => task.assigneeId === employee.id).length,
        completed: employeeTasks.filter(task => 
          task.assigneeId === employee.id && task.status === 'COMPLETED'
        ).length,
        inProgress: employeeTasks.filter(task => 
          task.assigneeId === employee.id && task.status === 'IN_PROGRESS'
        ).length,
        onHold: employeeTasks.filter(task => 
          task.assigneeId === employee.id && task.status === 'ON_HOLD'
        ).length,
        cancelled: employeeTasks.filter(task => 
          task.assigneeId === employee.id && task.status === 'CANCELLED'
        ).length
      };
      
      setTaskStats(stats);
    } catch (error) {
      console.error('Failed to fetch task statistics:', error);
    } finally {
      setIsLoadingStats(false);
    }
  };

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
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const result = await updateUser(employee.id, {
      name: formData.name.trim(),
      email: formData.email.trim(),
      role: formData.role
    });

    if (result.success) {
      setIsEditing(false);
      // Refresh the employee data
      onClose();
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    // Reset form data to original values
    setFormData({
      name: employee.name,
      email: employee.email,
      role: employee.role
    });
    setErrors({});
  };

  const handleClose = () => {
    onClose();
  };

  if (!isOpen || !employee) return null;

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
          <h3 
            className="text-2xl font-bold"
            style={{ color: 'var(--color-text-primary)' }}
          >
            {isEditing ? 'Edit Employee' : 'Employee Details'}
          </h3>
          <div className="flex items-center space-x-2">
            {!isEditing && isSysAdmin() && (
              <button
                onClick={handleEdit}
                className="btn btn-sm border-0"
                style={{ 
                  backgroundColor: 'var(--color-primary)',
                  color: 'white'
                }}
                onMouseEnter={(e) => e.target.style.opacity = '0.9'}
                onMouseLeave={(e) => e.target.style.opacity = '1'}
              >
                Edit
              </button>
            )}
            <button
              onClick={handleClose}
              className="btn btn-ghost btn-sm"
              style={{ color: 'var(--color-text-tertiary)' }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Employee Info */}
        <div className="space-y-6">
          {/* Basic Info */}
          <div className="flex items-center space-x-4">
            <div className="avatar placeholder">
              <div 
                className="text-white rounded-full w-16"
                style={{ backgroundColor: 'var(--color-primary)' }}
              >
                <span className="text-2xl">{formData.name.charAt(0)}</span>
              </div>
            </div>
            <div>
              <h4 
                className="text-xl font-semibold"
                style={{ color: 'var(--color-text-primary)' }}
              >
                {formData.name}
              </h4>
              <p style={{ color: 'var(--color-text-secondary)' }}>{formData.email}</p>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Personal Info */}
            <div className="space-y-4">
              <h5 
                className="text-lg font-semibold pb-2 border-b"
                style={{ 
                  color: 'var(--color-text-primary)',
                  borderColor: 'var(--color-border-light)'
                }}
              >
                Personal Information
              </h5>
              
              <div>
                <label 
                  className="text-sm font-medium"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  Full Name
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className={`input w-full mt-1 ${errors.name ? 'border-red-500' : ''}`}
                    style={{
                      backgroundColor: 'var(--color-bg-tertiary)',
                      borderColor: errors.name ? '#ef4444' : 'var(--color-border-default)',
                      color: 'var(--color-text-primary)',
                    }}
                    placeholder="Enter employee name"
                  />
                ) : (
                  <p 
                    className="mt-1"
                    style={{ color: 'var(--color-text-primary)' }}
                  >
                    {formData.name}
                  </p>
                )}
                {isEditing && errors.name && (
                  <p className="text-red-400 text-sm mt-1">{errors.name}</p>
                )}
              </div>

              <div>
                <label 
                  className="text-sm font-medium"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  Email Address
                </label>
                {isEditing ? (
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`input w-full mt-1 ${errors.email ? 'border-red-500' : ''}`}
                    style={{
                      backgroundColor: 'var(--color-bg-tertiary)',
                      borderColor: errors.email ? '#ef4444' : 'var(--color-border-default)',
                      color: 'var(--color-text-primary)',
                    }}
                    placeholder="Enter employee email"
                  />
                ) : (
                  <p 
                    className="mt-1"
                    style={{ color: 'var(--color-text-primary)' }}
                  >
                    {formData.email}
                  </p>
                )}
                {isEditing && errors.email && (
                  <p className="text-red-400 text-sm mt-1">{errors.email}</p>
                )}
              </div>

              <div>
                <label 
                  className="text-sm font-medium"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  Role
                </label>
                {isEditing ? (
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    className="select w-full mt-1"
                    style={{
                      backgroundColor: 'var(--color-bg-tertiary)',
                      borderColor: 'var(--color-border-default)',
                      color: 'var(--color-text-primary)',
                    }}
                  >
                    <option value="EMPLOYEE">Employee</option>
                    <option value="ADMIN">Admin</option>
                    {formData.role === 'SYSDMIN' && (
                      <option value="SYSDMIN">System Administrator</option>
                    )}
                  </select>
                ) : (
                  <div className="mt-1">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      formData.role === 'SYSDMIN'
                        ? 'bg-red-600 text-red-200'
                        : formData.role === 'ADMIN' 
                        ? 'bg-purple-600 text-purple-200' 
                        : 'bg-blue-600 text-blue-200'
                    }`}>
                      {formData.role === 'SYSDMIN' ? 'System Administrator' : formData.role}
                    </span>
                  </div>
                )}
              </div>

              <div>
                <label 
                  className="text-sm font-medium"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  Date Joined
                </label>
                <p 
                  className="mt-1"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  {new Date(employee.createdAt).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            </div>


          </div>

                     {/* Task Statistics */}
           <div 
             className="border-t pt-6"
             style={{ borderColor: 'var(--color-border-light)' }}
           >
             <h5 
               className="text-lg font-semibold mb-4"
               style={{ color: 'var(--color-text-primary)' }}
             >
               Task Statistics
             </h5>
             {isLoadingStats ? (
               <div className="flex justify-center py-8">
                 <span 
                   className="loading loading-spinner loading-md"
                   style={{ color: 'var(--color-primary)' }}
                 ></span>
               </div>
             ) : (
               <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                 <div 
                   className="text-center p-4 rounded-lg"
                   style={{ backgroundColor: 'var(--color-bg-tertiary)' }}
                 >
                   <div 
                     className="text-2xl font-bold"
                     style={{ color: 'var(--color-primary)' }}
                   >
                     {taskStats.assigned}
                   </div>
                   <div 
                     className="text-sm"
                     style={{ color: 'var(--color-text-secondary)' }}
                   >
                     Assigned
                   </div>
                 </div>
                 <div 
                   className="text-center p-4 rounded-lg"
                   style={{ backgroundColor: 'var(--color-bg-tertiary)' }}
                 >
                   <div className="text-2xl font-bold text-green-400">{taskStats.completed}</div>
                   <div 
                     className="text-sm"
                     style={{ color: 'var(--color-text-secondary)' }}
                   >
                     Completed
                   </div>
                 </div>
                 <div 
                   className="text-center p-4 rounded-lg"
                   style={{ backgroundColor: 'var(--color-bg-tertiary)' }}
                 >
                   <div className="text-2xl font-bold text-yellow-400">{taskStats.inProgress}</div>
                   <div 
                     className="text-sm"
                     style={{ color: 'var(--color-text-secondary)' }}
                   >
                     In Progress
                   </div>
                 </div>
                 <div 
                   className="text-center p-4 rounded-lg"
                   style={{ backgroundColor: 'var(--color-bg-tertiary)' }}
                 >
                   <div className="text-2xl font-bold text-orange-400">{taskStats.onHold}</div>
                   <div 
                     className="text-sm"
                     style={{ color: 'var(--color-text-secondary)' }}
                   >
                     On Hold
                   </div>
                 </div>
                 <div 
                   className="text-center p-4 rounded-lg"
                   style={{ backgroundColor: 'var(--color-bg-tertiary)' }}
                 >
                   <div className="text-2xl font-bold text-red-400">{taskStats.cancelled}</div>
                   <div 
                     className="text-sm"
                     style={{ color: 'var(--color-text-secondary)' }}
                   >
                     Cancelled
                   </div>
                 </div>
               </div>
             )}
             {!isLoadingStats && taskStats.assigned === 0 && (
               <p 
                 className="text-xs mt-2 text-center"
                 style={{ color: 'var(--color-text-muted)' }}
               >
                 No tasks assigned to this employee yet
               </p>
             )}
           </div>
        </div>

                       {/* Footer */}
               <div 
                 className="flex justify-end mt-8 pt-6 border-t"
                 style={{ borderColor: 'var(--color-border-light)' }}
               >
                 {isEditing ? (
                   <div className="flex space-x-3">
                     <button
                       onClick={handleCancel}
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
                       onClick={handleSubmit}
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
                           Updating...
                         </>
                       ) : (
                         'Update Employee'
                       )}
                     </button>
                   </div>
                 ) : (
                   <button
                     onClick={handleClose}
                     className="btn border-0"
                     style={{ 
                       backgroundColor: 'var(--color-bg-tertiary)',
                       color: 'var(--color-text-primary)'
                     }}
                     onMouseEnter={(e) => e.target.style.opacity = '0.9'}
                     onMouseLeave={(e) => e.target.style.opacity = '1'}
                   >
                     Close
                   </button>
                 )}
               </div>
      </div>
    </div>
  );
};

export default EmployeeDetailsModal;
