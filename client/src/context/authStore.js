import { create } from 'zustand';
import { authAPI } from '../services/api';

const useAuthStore = create((set, get) => ({
  user: JSON.parse(localStorage.getItem('user')) || null,
  token: localStorage.getItem('token') || null,
  isLoading: false,
  error: null,

  login: async (credentials) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authAPI.login(credentials);
      const { token, user } = response.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      set({ user, token, isLoading: false });
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Login failed';
      set({ error: errorMessage, isLoading: false });
      return { success: false, error: errorMessage };
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({ user: null, token: null, error: null });
  },

  register: async (userData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authAPI.register(userData);
      set({ isLoading: false });
      return { success: true, data: response.data };
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Registration failed';
      set({ error: errorMessage, isLoading: false });
      return { success: false, error: errorMessage };
    }
  },

  getMe: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await authAPI.getMe();
      const user = response.data.user;
      localStorage.setItem('user', JSON.stringify(user));
      set({ user, isLoading: false });
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Failed to get user info';
      set({ error: errorMessage, isLoading: false });
      return { success: false, error: errorMessage };
    }
  },

  clearError: () => set({ error: null }),

  isAuthenticated: () => {
    const { token, user } = get();
    return !!(token && user);
  },

  isAdmin: () => {
    const { user } = get();
    return user?.role === 'ADMIN';
  },

  isEmployee: () => {
    const { user } = get();
    return user?.role === 'EMPLOYEE';
  }
}));

export default useAuthStore;
