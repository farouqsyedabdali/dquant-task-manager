import { useState, useEffect } from 'react';
import useUserStore from '../stores/userStore';
import useAuthStore from '../context/authStore';
import AddEmployeeModal from '../components/employees/AddEmployeeModal';

const Employees = () => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const { users, fetchUsers, deleteEmployee, isLoading, error } = useUserStore();
  const { user, isAdmin } = useAuthStore();

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleDelete = async (userId, userName) => {
    if (window.confirm(`Are you sure you want to delete ${userName}? This action cannot be undone.`)) {
      const result = await deleteEmployee(userId);
      if (!result.success) {
        // Error is handled by the store
        console.error('Failed to delete employee:', result.error);
      }
    }
  };

  const getRoleLabel = (role) => {
    switch (role) {
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
      case 'ADMIN':
        return 'bg-purple-600 text-purple-200';
      case 'EMPLOYEE':
        return 'bg-blue-600 text-blue-200';
      default:
        return 'bg-gray-600 text-gray-200';
    }
  };

  // Filter out the current user from the list
  const filteredUsers = users.filter(u => u.id !== user?.id);

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="max-w-[95%] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-white">
                Employee Management
              </h1>
              <p className="text-gray-400 mt-2">
                Manage employees in your company
              </p>
            </div>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="btn bg-indigo-600 hover:bg-indigo-700 text-white border-0"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Employee
            </button>
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

        {/* Employees List */}
        <div className="bg-gray-800 rounded-lg shadow-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-white">
              Company Employees ({filteredUsers.length})
            </h2>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <span className="loading loading-spinner loading-lg text-indigo-500"></span>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-lg mb-2">No employees found</div>
              <p className="text-gray-500">Add your first employee to get started.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table w-full">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left text-gray-300 font-medium">Name</th>
                    <th className="text-left text-gray-300 font-medium">Email</th>
                    <th className="text-left text-gray-300 font-medium">Role</th>
                    <th className="text-left text-gray-300 font-medium">Joined</th>
                    <th className="text-left text-gray-300 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((employee) => (
                    <tr key={employee.id} className="border-b border-gray-700 hover:bg-gray-700">
                      <td className="py-4">
                        <div className="flex items-center space-x-3">
                          <div className="avatar placeholder">
                            <div className="bg-indigo-600 text-white rounded-full w-10">
                              <span className="text-sm">{employee.name.charAt(0)}</span>
                            </div>
                          </div>
                          <div>
                            <div className="font-medium text-white">{employee.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 text-gray-300">{employee.email}</td>
                      <td className="py-4">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getRoleColor(employee.role)}`}>
                          {getRoleLabel(employee.role)}
                        </span>
                      </td>
                      <td className="py-4 text-gray-300">
                        {new Date(employee.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-4">
                        {employee.role === 'EMPLOYEE' && (
                          <button
                            onClick={() => handleDelete(employee.id, employee.name)}
                            className="btn btn-sm bg-red-600 hover:bg-red-700 text-white border-0"
                          >
                            Delete
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Add Employee Modal */}
      {isAddModalOpen && (
        <AddEmployeeModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
        />
      )}
    </div>
  );
};

export default Employees; 