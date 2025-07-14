import { create } from 'zustand';
import { usersAPI } from '../services/api';

const useUserStore = create((set, get) => ({
  users: [],
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

  // Delete employee
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
      const errorMessage = error.response?.data?.error || 'Failed to delete employee';
      set({ error: errorMessage, isLoading: false });
      return { success: false, error: errorMessage };
    }
  },

  // Clear error
  clearError: () => set({ error: null }),
}));

export default useUserStore; 