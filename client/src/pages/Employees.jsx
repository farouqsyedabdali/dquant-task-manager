import { useState, useEffect } from 'react';
import useUserStore from '../stores/userStore';
import useAuthStore from '../context/authStore';
import AddEmployeeModal from '../components/employees/AddEmployeeModal';
import EmployeeDetailsModal from '../components/employees/EmployeeDetailsModal';
import ResetPasswordModal from '../components/employees/ResetPasswordModal';
import DeleteConfirmModal from '../components/common/DeleteConfirmModal';
import IconButton from '../components/common/IconButton';
import SkeletonList from '../components/common/SkeletonList';
import EmptyState from '../components/common/EmptyState';
import ConfirmModal from '../components/common/ConfirmModal';
import { useToastContext } from '../context/ToastContext';
import { FaPlus, FaCloudUploadAlt, FaUsers } from 'react-icons/fa';

const Employees = () => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [deleteUserId, setDeleteUserId] = useState(null);
  const [deleteUserName, setDeleteUserName] = useState('');
  const [deleteUserRole, setDeleteUserRole] = useState('');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [csvImportStatus, setCsvImportStatus] = useState(null);
  const [isImporting, setIsImporting] = useState(false);
  const [isCsvImportModalOpen, setIsCsvImportModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
  const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] = useState(false);
  const [resetPasswordEmployee, setResetPasswordEmployee] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isResendConfirmOpen, setIsResendConfirmOpen] = useState(false);
  const [pendingResendEmployee, setPendingResendEmployee] = useState(null);
      const { users, fetchUsers, deleteEmployee, createEmployee, resendEmployeeInvitation, isLoading, error } = useUserStore();
    const { user, isAdmin, isSysAdmin } = useAuthStore();
  const toast = useToastContext();

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleDelete = async (userId, userName, userRole) => {
    setDeleteUserId(userId);
    setDeleteUserName(userName);
    setDeleteUserRole(userRole);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (deleteUserId) {
      const result = await deleteEmployee(deleteUserId);
      if (!result.success) {
        // Error is handled by the store
        console.error('Failed to delete user:', result.error);
      }
      setIsDeleteModalOpen(false);
      setDeleteUserId(null);
      setDeleteUserName('');
      setDeleteUserRole('');
    }
  };

  const getRoleLabel = (role) => {
    switch (role) {
      case 'SYSDMIN':
        return 'System Administrator';
      case 'ADMIN':
        return 'Admin';
      case 'EMPLOYEE':
        return 'Employee';
      default:
        return role;
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'SYSDMIN':
        return 'bg-red-600 text-red-200';
      case 'ADMIN':
        return 'bg-purple-600 text-purple-200';
      case 'EMPLOYEE':
        return 'bg-blue-600 text-blue-200';
      default:
        return 'bg-gray-600 text-gray-200';
    }
  };

  // Apply search filter (include all users including current user)
  const filteredUsers = users.filter(u =>
    (u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
     u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
     u.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
     u.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
     u.position.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // CSV Import Handler
  const handleCSVImport = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file size (2MB limit)
    if (file.size > 2 * 1024 * 1024) {
      setCsvImportStatus({
        type: 'error',
        message: 'File size exceeds 2MB limit'
      });
      return;
    }

    // Validate file type
    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      setCsvImportStatus({
        type: 'error',
        message: 'Please select a valid CSV file'
      });
      return;
    }

    setIsImporting(true);
    setCsvImportStatus(null);

    try {
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        throw new Error('CSV file must have at least a header row and one data row');
      }

      // Parse header row
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      const nameIndex = headers.findIndex(h => h === 'name');
      const emailIndex = headers.findIndex(h => h === 'email');
      const roleIndex = headers.findIndex(h => h === 'role');

      if (nameIndex === -1 || emailIndex === -1) {
        throw new Error('CSV must have "name" and "email" columns');
      }

      // Parse data rows
      const employees = [];
      const errors = [];
      
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const values = line.split(',').map(v => v.trim());
        const name = values[nameIndex];
        const email = values[emailIndex];
        const role = roleIndex !== -1 ? values[roleIndex] : 'EMPLOYEE';

        // Validate required fields
        if (!name || !email) {
          errors.push(`Row ${i + 1}: Missing name or email`);
          continue;
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          errors.push(`Row ${i + 1}: Invalid email format: ${email}`);
          continue;
        }

        // Validate role
        if (role && !['EMPLOYEE', 'ADMIN', 'SYSDMIN'].includes(role.toUpperCase())) {
          errors.push(`Row ${i + 1}: Invalid role: ${role}. Must be EMPLOYEE, ADMIN, or SYSDMIN`);
          continue;
        }
        
        // Only SYSDMIN can create other SYSDMIN users
        if (role && role.toUpperCase() === 'SYSDMIN' && !isSysAdmin()) {
          errors.push(`Row ${i + 1}: Only System Administrators can create other System Administrators`);
          continue;
        }

        employees.push({
          name,
          email,
          role: role.toUpperCase() || 'EMPLOYEE',
          password: generateRandomPassword() // Generate random password
        });
      }

      if (errors.length > 0) {
        throw new Error(`Validation errors:\n${errors.join('\n')}`);
      }

      if (employees.length === 0) {
        throw new Error('No valid employee data found in CSV');
      }

      // Import employees
      let successCount = 0;
      let failCount = 0;

      for (const employee of employees) {
        try {
          const result = await createEmployee(employee);
          if (result.success) {
            successCount++;
          } else {
            failCount++;
            console.error(`Failed to create ${employee.name}:`, result.error);
          }
        } catch (error) {
          failCount++;
          console.error(`Error creating ${employee.name}:`, error);
        }
      }

      // Show results
      if (failCount === 0) {
        setCsvImportStatus({
          type: 'success',
          message: `Successfully imported ${successCount} employees!`
        });
        // Refresh the users list
        fetchUsers();
      } else if (successCount > 0) {
        setCsvImportStatus({
          type: 'error',
          message: `Imported ${successCount} employees, but ${failCount} failed. Check console for details.`
        });
        fetchUsers();
      } else {
        setCsvImportStatus({
          type: 'error',
          message: `Failed to import any employees. Check console for details.`
        });
      }

    } catch (error) {
      setCsvImportStatus({
        type: 'error',
        message: error.message
      });
    } finally {
      setIsImporting(false);
      // Clear the file input
      event.target.value = '';
    }
  };

  // Generate random password for imported employees
  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

  // Download CSV template
  const downloadCSVTemplate = () => {
    const csvContent = 'name,email,role\nJohn Doe,john@example.com,EMPLOYEE\nJane Smith,jane@example.com,ADMIN\nMike Johnson,mike@example.com,EMPLOYEE\nSystem Admin,sysadmin@example.com,SYSDMIN';
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'employee_import_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  // Handle employee click to show details
  const handleEmployeeClick = (employee) => {
    setSelectedEmployee(employee);
    setIsEmployeeModalOpen(true);
  };

  // Handle password reset
  const handleResetPassword = (employee) => {
    setResetPasswordEmployee(employee);
    setIsResetPasswordModalOpen(true);
  };

  // Handle resend invitation
  const handleResendInvitation = async (employeeId, employeeName) => {
    setPendingResendEmployee({ id: employeeId, name: employeeName });
    setIsResendConfirmOpen(true);
  };

  const confirmResendInvitation = async () => {
    if (!pendingResendEmployee) return;
    
    setIsResendConfirmOpen(false);
    const { id: employeeId, name: employeeName } = pendingResendEmployee;
    setPendingResendEmployee(null);

    try {
    const result = await resendEmployeeInvitation(employeeId);
    if (result.success) {
        toast.success(`Invitation resent successfully to ${employeeName}`);
    } else {
        toast.error(`Failed to resend invitation: ${result.error}`);
      }
    } catch (error) {
      console.error('Error resending invitation:', error);
      toast.error('Failed to resend invitation');
    }
  };

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: 'var(--color-bg-primary)', color: 'var(--color-text-primary)' }}
    >
      <div className="max-w-[95%] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 
                className="text-3xl font-bold"
                style={{ color: 'var(--color-text-primary)' }}
              >
                Employee Management
              </h1>
              <p 
                className="mt-2"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                Manage employees in your company
              </p>
            </div>
            <IconButton
              onClick={() => setIsAddModalOpen(true)}
              icon={<FaPlus />}
              label="Add Employee"
              variant="primary"
              size="sm"
            />
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="alert alert-error mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Search and Actions Bar */}
        <div
          className="rounded-lg shadow-lg p-6 mb-6"
          style={{
            backgroundColor: 'var(--color-bg-secondary)',
            borderColor: 'var(--color-border-default)',
            borderWidth: 1,
          }}
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            {/* Search Bar */}
            <div className="flex-1 max-w-md">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search employees by name, email, or role..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input input-bordered w-full focus:border-indigo-500 focus:ring-indigo-500"
                  style={{
                    backgroundColor: 'var(--color-bg-tertiary)',
                    borderColor: 'var(--color-border-default)',
                    color: 'var(--color-text-primary)',
                  }}
                />
                <svg 
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5" 
                  style={{ color: 'var(--color-text-tertiary)' }}
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2">
              {isAdmin() && (
                <IconButton
                  onClick={() => setIsCsvImportModalOpen(true)}
                  icon={<FaCloudUploadAlt />}
                  label="Bulk Import"
                  variant="primary"
                  size="sm"
                  className="!bg-green-600 hover:!bg-green-700"
                />
              )}
            </div>
          </div>

          {/* Search Results Count */}
          <div
            className="mt-4 text-sm"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            Showing {filteredUsers.length} of {users.length} employees
          </div>
        </div>

        {/* Employees List */}
        <div
          className="rounded-lg shadow-lg p-6"
          style={{
            backgroundColor: 'var(--color-bg-secondary)',
            borderColor: 'var(--color-border-default)',
            borderWidth: 1,
          }}
        >
          <div className="flex justify-between items-center mb-6">
            <h2
              className="text-xl font-semibold"
              style={{ color: 'var(--color-text-primary)' }}
            >
              Company Employees ({filteredUsers.length})
            </h2>
          </div>
          
          {isLoading ? (
            <SkeletonList count={5} variant="default" />
          ) : filteredUsers.length === 0 ? (
            <EmptyState
              icon={<FaUsers className="w-16 h-16" />}
              title="No employees found"
              description="Add your first employee to get started with team collaboration."
              actionLabel="Add Employee"
              onAction={() => setIsAddModalOpen(true)}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="table w-full">
                <thead>
                  <tr className="border-b" style={{ borderColor: 'var(--color-border-default)' }}>
                    <th
                      className="text-left font-medium"
                      style={{ color: 'var(--color-text-secondary)' }}
                    >
                      Name
                    </th>
                    <th
                      className="text-left font-medium"
                      style={{ color: 'var(--color-text-secondary)' }}
                    >
                      Email
                    </th>
                    <th
                      className="text-left font-medium"
                      style={{ color: 'var(--color-text-secondary)' }}
                    >
                      Department
                    </th>
                    <th
                      className="text-left font-medium"
                      style={{ color: 'var(--color-text-secondary)' }}
                    >
                      Position
                    </th>
                    <th
                      className="text-left font-medium"
                      style={{ color: 'var(--color-text-secondary)' }}
                    >
                      Role
                    </th>
                    <th
                      className="text-left font-medium"
                      style={{ color: 'var(--color-text-secondary)' }}
                    >
                      Joined
                    </th>
                    <th
                      className="text-left font-medium"
                      style={{ color: 'var(--color-text-secondary)' }}
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((employee) => (
                    <tr
                      key={employee.id}
                      className="border-b cursor-pointer"
                      style={{ borderColor: 'var(--color-border-default)' }}
                      onClick={() => handleEmployeeClick(employee)}
                    >
                      <td className="py-4">
                        <div className="flex items-center space-x-3">
                          <div 
                            className="rounded-full text-white flex items-center justify-center flex-shrink-0"
                            style={{ 
                              backgroundColor: 'var(--color-primary)',
                              width: '40px',
                              height: '40px',
                              minWidth: '40px',
                              minHeight: '40px',
                              maxWidth: '40px',
                              maxHeight: '40px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              lineHeight: '1'
                            }}
                          >
                            <span 
                              className="text-sm"
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                lineHeight: '1'
                              }}
                            >
                              {employee.name.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <div
                              className="font-medium"
                              style={{ color: 'var(--color-text-primary)' }}
                            >
                              {employee.name}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td
                        className="py-4"
                        style={{ color: 'var(--color-text-secondary)' }}
                      >
                        {employee.email}
                      </td>
                      <td
                        className="py-4"
                        style={{ color: 'var(--color-text-secondary)' }}
                      >
                        {employee.department}
                      </td>
                      <td
                        className="py-4"
                        style={{ color: 'var(--color-text-secondary)' }}
                      >
                        {employee.position}
                      </td>
                      <td className="py-4">
                        <div className="flex items-center space-x-2">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getRoleColor(employee.role)}`}>
                            {getRoleLabel(employee.role)}
                          </span>
                          {/* Show invitation status */}
                          {employee.invitationToken && !employee.password && (
                            <div className="badge badge-warning badge-sm">Pending Setup</div>
                          )}
                          {employee.invitationToken && employee.password && (
                            <div className="badge badge-success badge-sm">Active</div>
                          )}
                        </div>
                      </td>
                      <td
                        className="py-4"
                        style={{ color: 'var(--color-text-secondary)' }}
                      >
                        {new Date(employee.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-4">
                        <div className="flex space-x-2">
                          {/* Show resend invitation button for employees who haven't completed setup */}
                          {employee.invitationToken && !employee.password && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleResendInvitation(employee.id, employee.name);
                              }}
                              className="btn btn-sm btn-outline btn-info"
                              title="Resend invitation"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                              </svg>
                            </button>
                          )}

                          {/* Show password reset button for all users except current user */}
                          {employee.id !== user?.id && employee.password && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleResetPassword(employee);
                              }}
                              className="btn btn-sm bg-yellow-600 hover:bg-yellow-700 text-white border-0"
                              title="Reset Password"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                              </svg>
                            </button>
                          )}
                          
                          {/* Show delete button for employees and other admins (but not for current user) */}
                          {employee.id !== user?.id && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(employee.id, employee.name, employee.role);
                              }}
                              className={`btn btn-sm text-white border-0 ${
                                employee.role === 'ADMIN' 
                                  ? 'bg-purple-600 hover:bg-purple-700' 
                                  : 'bg-red-600 hover:bg-red-700'
                              }`}
                              title={employee.role === 'ADMIN' ? 'Delete Admin' : 'Delete Employee'}
                            >
                              {employee.role === 'ADMIN' ? 'Delete Admin' : 'Delete'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* CSV Import Modal */}
      {isCsvImportModalOpen && (
        <div className="modal modal-open backdrop-blur-sm animate-fadeIn">
          <div 
            className="modal-box max-w-4xl border"
            style={{ 
              backgroundColor: 'var(--color-bg-secondary)',
              borderColor: 'var(--color-border-default)'
            }}
          >
            <div className="flex justify-between items-center mb-6">
              <h3 
                className="text-2xl font-bold"
                style={{ color: 'var(--color-text-primary)' }}
              >
                Bulk Import Employees
              </h3>
              <button
                onClick={() => setIsCsvImportModalOpen(false)}
                className="btn btn-ghost btn-sm"
                style={{ color: 'var(--color-text-tertiary)' }}
              >
                ✕
              </button>
            </div>

            <div className="mb-6">
              <p 
                className="text-sm mb-4"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                Import multiple employees from a CSV file. The file should have columns: name, email, role (optional, defaults to EMPLOYEE). 
                <br />
                <span className="text-yellow-400">Note: Imported employees will have randomly generated passwords. They should reset their password on first login.</span>
              </p>
            </div>

            {/* CSV Import Form */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <fieldset className="fieldset">
                  <legend className="fieldset-legend">Pick a file</legend>
                  <input 
                    type="file" 
                    className="file-input" 
                    accept=".csv"
                    onChange={handleCSVImport}
                  />
                  <label className="label">Max size 2MB</label>
                </fieldset>
              </div>
              
              <div className="flex items-center">
                <div 
                  className="text-sm"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  <p><strong>CSV Format:</strong></p>
                  <p>name,email,role</p>
                  <p>John Doe,john@example.com,EMPLOYEE</p>
                  <p>Jane Smith,jane@example.com,ADMIN</p>
                  <p>System Admin,sysadmin@example.com,SYSDMIN</p>
                </div>
              </div>
            </div>

            {/* Import Progress/Status */}
            {csvImportStatus && (
              <div className={`alert mb-6 ${csvImportStatus.type === 'success' ? 'alert-success' : 'alert-error'}`}>
                {csvImportStatus.type === 'success' ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
                <span>{csvImportStatus.message}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3">
              <button
                onClick={downloadCSVTemplate}
                className="btn btn-outline"
                style={{ 
                  borderColor: 'var(--color-border-default)',
                  color: 'var(--color-text-secondary)'
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Download Template
              </button>
              <button
                onClick={() => setIsCsvImportModalOpen(false)}
                className="btn border-0"
                style={{ 
                  backgroundColor: 'var(--color-bg-tertiary)',
                  color: 'var(--color-text-primary)'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Employee Details Modal */}
      {isEmployeeModalOpen && selectedEmployee && (
        <EmployeeDetailsModal
          employee={selectedEmployee}
          isOpen={isEmployeeModalOpen}
          onClose={() => {
            setIsEmployeeModalOpen(false);
            setSelectedEmployee(null);
          }}
        />
      )}

      {/* Add Employee Modal */}
      {isAddModalOpen && (
        <AddEmployeeModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
        />
      )}



      {/* Reset Password Modal */}
      {isResetPasswordModalOpen && resetPasswordEmployee && (
        <ResetPasswordModal
          isOpen={isResetPasswordModalOpen}
          onClose={() => {
            setIsResetPasswordModalOpen(false);
            setResetPasswordEmployee(null);
          }}
          employee={resetPasswordEmployee}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteUserId && (
        <DeleteConfirmModal
          isOpen={isDeleteModalOpen}
          onClose={() => {
            setIsDeleteModalOpen(false);
            setDeleteUserId(null);
            setDeleteUserName('');
            setDeleteUserRole('');
          }}
          onConfirm={confirmDelete}
          taskTitle={deleteUserName}
          deleteType={deleteUserRole === 'ADMIN' ? 'admin' : 'employee'}
          isLoading={isLoading}
        />
      )}

      {/* Resend Invitation Confirmation */}
      {isResendConfirmOpen && pendingResendEmployee && (
        <ConfirmModal
          isOpen={isResendConfirmOpen}
          onClose={() => {
            setIsResendConfirmOpen(false);
            setPendingResendEmployee(null);
          }}
          onConfirm={confirmResendInvitation}
          title="Resend Invitation?"
          message={`Are you sure you want to resend the invitation to ${pendingResendEmployee.name}?`}
          confirmText="Resend"
          cancelText="Cancel"
          variant="info"
        />
      )}
      
    </div>
  );
};

export default Employees; 