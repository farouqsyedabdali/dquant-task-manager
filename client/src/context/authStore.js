import { create } from 'zustand';
import { authAPI } from '../services/api';

// Safely read and parse a JSON value from localStorage
function getSafeParsedLocalStorage(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    // Guard against the literal string "undefined" or invalid JSON
    if (raw === 'undefined') {
      localStorage.removeItem(key);
      return null;
    }
    return JSON.parse(raw);
  } catch (_err) {
    // If parsing fails, clean up the bad value and return null
    localStorage.removeItem(key);
    return null;
  }
}

const useAuthStore = create((set, get) => ({
  user: getSafeParsedLocalStorage('user'),
  token: localStorage.getItem('token') || null,
  isLoading: false,
  error: null,

  login: async (credentials) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authAPI.login(credentials);
      const { token, user } = response.data;
      
      // Store authentication data
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      // Handle remember me functionality
      if (credentials.rememberMe) {
        localStorage.setItem('rememberMe', 'true');
        // Set a longer expiry for remember me (30 days)
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + 30);
        localStorage.setItem('tokenExpiry', expiryDate.toISOString());
      } else {
        localStorage.removeItem('rememberMe');
        localStorage.removeItem('tokenExpiry');
      }
      
      set({ user, token, isLoading: false });
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Login failed';
      const requiresVerification = error.response?.data?.requiresVerification || false;
      const companySuspended = error.response?.data?.companySuspended || false;
      const email = error.response?.data?.email || null;
      const companyName = error.response?.data?.companyName || null;
      
      set({ error: errorMessage, isLoading: false });
      return { 
        success: false, 
        error: errorMessage, 
        requiresVerification,
        companySuspended,
        email,
        companyName
      };
    }
  },

  registerCompany: async (companyData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authAPI.registerCompany(companyData);
      set({ isLoading: false });
      return { success: true, data: response.data };
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Company registration failed';
      set({ error: errorMessage, isLoading: false });
      return { success: false, error: errorMessage };
    }
  },

  registerPersonal: async (personalData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authAPI.registerPersonal(personalData);
      const { token, user } = response.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      set({ user, token, isLoading: false });
      return { success: true, data: response.data };
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Personal registration failed';
      set({ error: errorMessage, isLoading: false });
      return { success: false, error: errorMessage };
    }
  },

  deleteCompany: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await authAPI.deleteCompany();
      set({ isLoading: false });
      
      // Clear user data and redirect to login after successful deletion
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      set({ user: null, token: null, error: null });
      
      // Redirect to login page
      window.location.href = '/login';
      
      return { success: true, data: response.data };
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Company deletion failed';
      set({ error: errorMessage, isLoading: false });
      return { success: false, error: errorMessage };
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('rememberMe');
    localStorage.removeItem('tokenExpiry');
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
      
      // If token is invalid/expired (401 or 403), clear auth
      if (error.response?.status === 401 || error.response?.status === 403) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('rememberMe');
        localStorage.removeItem('tokenExpiry');
        set({ user: null, token: null, error: null, isLoading: false });
      } else {
      set({ error: errorMessage, isLoading: false });
      }
      
      return { success: false, error: errorMessage };
    }
  },

  clearError: () => set({ error: null }),

  setAuth: ({ token, user }) => {
    if (token) {
      localStorage.setItem('token', token);
    }
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    }
    set({ token, user, error: null });
  },

  isAuthenticated: () => {
    const { token, user } = get();
    
    if (!token || !user) return false;
    
    // Check if remember me is enabled and token hasn't expired
    const rememberMe = localStorage.getItem('rememberMe');
    const tokenExpiry = localStorage.getItem('tokenExpiry');
    
    if (rememberMe === 'true' && tokenExpiry) {
      const now = new Date();
      const expiry = new Date(tokenExpiry);
      if (now > expiry) {
        // Token expired, clear everything
        get().logout();
        return false;
      }
    }
    
    return true;
  },

  isSuperAdmin: () => {
    const { user } = get();
    const isSuperAdmin = user?.role === 'SUPER_ADMIN';
    console.log('🔍 isSuperAdmin check:', { 
      userRole: user?.role, 
      isSuperAdmin,
      userEmail: user?.email 
    });
    return isSuperAdmin;
  },

  isAdmin: () => {
    const { user } = get();
    return user?.role === 'ADMIN' || user?.role === 'SYSDMIN' || user?.role === 'SUPER_ADMIN';
  },

  isSysAdmin: () => {
    const { user } = get();
    return user?.role === 'SYSDMIN' || user?.role === 'SUPER_ADMIN';
  },

  isEmployee: () => {
    const { user } = get();
    return user?.role === 'EMPLOYEE';
  }
}));

export default useAuthStore;
