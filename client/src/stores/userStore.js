import { create } from 'zustand';
import { usersAPI } from '../services/api';

const useUserStore = create((set, get) => ({
  users: [],
  recentEmployees: [], // Track 5 most recently selected employees
  isLoading: false,
  error: null,

  // Get all users
  fetchUsers: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await usersAPI.getAll();
      set({ users: response.data, isLoading: false });
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Failed to fetch users';
      set({ error: errorMessage, isLoading: false });
      return { success: false, error: errorMessage };
    }
  },

  // Create new employee
  createEmployee: async (employeeData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await usersAPI.createEmployee(employeeData);
      const newEmployee = response.data;
      set(state => ({
        users: [newEmployee, ...state.users],
        isLoading: false
      }));
      return { success: true, data: newEmployee };
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Failed to create employee';
      set({ error: errorMessage, isLoading: false });
      return { success: false, error: errorMessage };
    }
  },

  // Update user
  updateUser: async (id, userData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await usersAPI.updateUser(id, userData);
      const updatedUser = response.data;
      set(state => ({
        users: state.users.map(user => 
          user.id === id ? updatedUser : user
        ),
        isLoading: false
      }));
      return { success: true, data: updatedUser };
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Failed to update user';
      set({ error: errorMessage, isLoading: false });
      return { success: false, error: errorMessage };
    }
  },

  // Reset user password
  resetUserPassword: async (id, newPassword) => {
    set({ isLoading: true, error: null });
    try {
      const response = await usersAPI.resetUserPassword(id, newPassword);
      set({ isLoading: false });
      return { success: true, data: response.data };
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Failed to reset password';
      set({ error: errorMessage, isLoading: false });
      return { success: false, error: errorMessage };
    }
  },

  // Delete user (employee or admin)
  deleteEmployee: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await usersAPI.deleteEmployee(id);
      set(state => ({
        users: state.users.filter(user => user.id !== id),
        isLoading: false
      }));
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Failed to delete user';
      set({ error: errorMessage, isLoading: false });
      return { success: false, error: errorMessage };
    }
  },

  // Resend employee invitation
  resendEmployeeInvitation: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await usersAPI.resendEmployeeInvitation(id);
      set({ isLoading: false });
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Failed to resend invitation';
      set({ error: errorMessage, isLoading: false });
      return { success: false, error: errorMessage };
    }
  },

  // Add employee to recent list
  addToRecentEmployees: (employee) => {
    set(state => {
      const existingIndex = state.recentEmployees.findIndex(emp => emp.id === employee.id);
      let newRecentEmployees;
      
      if (existingIndex !== -1) {
        // Remove from current position and add to front
        newRecentEmployees = [
          employee,
          ...state.recentEmployees.filter(emp => emp.id !== employee.id)
        ];
      } else {
        // Add to front, keep only 5 most recent
        newRecentEmployees = [employee, ...state.recentEmployees].slice(0, 5);
      }
      
      return { recentEmployees: newRecentEmployees };
    });
  },

  // Get recent employees (first 5)
  getRecentEmployees: () => {
    return get().recentEmployees.slice(0, 5);
  },

  // Clear recent employees
  clearRecentEmployees: () => set({ recentEmployees: [] }),

  // Clear error
  clearError: () => set({ error: null }),
}));

export default useUserStore; 