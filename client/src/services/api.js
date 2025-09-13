import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  registerCompany: (companyData) => api.post('/auth/register-company', companyData),
  deleteCompany: () => api.delete('/auth/company'),
  getMe: () => api.get('/auth/me'),
};

// Tasks API
export const tasksAPI = {
  getAll: (params = {}) => api.get('/tasks', { params }),
  getById: (id) => api.get(`/tasks/${id}`),
  create: (taskData) => api.post('/tasks', taskData),
  createSubtask: (parentTaskId, taskData) => api.post(`/tasks/${parentTaskId}/subtasks`, taskData),
  update: (id, taskData) => api.put(`/tasks/${id}`, taskData),
  delete: (id) => api.delete(`/tasks/${id}`),
  updateStatus: (id, status) => api.patch(`/tasks/${id}/status`, { status }),
  updatePriority: (id, priority) => api.patch(`/tasks/${id}/priority`, { priority }),
  // Co-assignee API
  getCoAssignees: (taskId) => api.get(`/tasks/${taskId}/co-assignees`),
  addCoAssignee: (taskId, userId) => api.post(`/tasks/${taskId}/co-assignees`, { userId }),
  removeCoAssignee: (taskId, userId) => api.delete(`/tasks/${taskId}/co-assignees/${userId}`),
};

// Comments API
export const commentsAPI = {
  getByTaskId: (taskId) => api.get(`/comments/task/${taskId}`),
  create: (taskId, content) => api.post(`/comments/task/${taskId}`, { content }),
  update: (id, content) => api.put(`/comments/${id}`, { content }),
  delete: (id) => api.delete(`/comments/${id}`),
};

// Users API (for admin)
export const usersAPI = {
  getAll: () => api.get('/users'),
  getEmployees: () => api.get('/users/employees'),
  getById: (id) => api.get(`/users/${id}`),
  createEmployee: (employeeData) => api.post('/users', employeeData),
  updateUser: (id, userData) => api.put(`/users/${id}`, userData),
  deleteEmployee: (id) => api.delete(`/users/${id}`),
};

// AI API
export const aiAPI = {
  chat: (message) => api.post('/ai/chat', { message }),
  extractTask: (text) => api.post('/ai/extract-task', { text }),
  identifyTaskUpdate: (text) => api.post('/ai/identify-task-update', { text }),
};

// Task Share API
export const taskShareAPI = {
  shareTask: (taskId, userId) => api.post(`/task-shares/${taskId}/share`, { userId }),
  unshareTask: (taskId, userId) => api.delete(`/task-shares/${taskId}/share/${userId}`),
  getTaskShares: (taskId) => api.get(`/task-shares/${taskId}/shares`),
  getSharedTasks: () => api.get('/task-shares/shared'),
};

// Notification API
export const notificationAPI = {
  getNotifications: () => api.get('/notifications'),
  markAsRead: (notificationId) => api.patch(`/notifications/${notificationId}/read`),
  markAllAsRead: () => api.patch('/notifications/mark-all-read'),
  getUnreadCount: () => api.get('/notifications/unread-count'),
};

// Audit API
export const auditAPI = {
  getAuditLogs: (params = {}) => api.get('/audit', { params }),
  getAuditLogById: (id) => api.get(`/audit/${id}`),
  getAuditStats: (params = {}) => api.get('/audit/stats/summary', { params }),
  exportAuditLogs: (params = {}) => api.get('/audit/export/csv', { 
    params,
    responseType: 'blob' // For file download
  }),
};

export default api;
