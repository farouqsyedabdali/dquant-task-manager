import axios from 'axios';

// Use localhost for development, Railway for production
const API_BASE_URL = import.meta.env.VITE_API_URL || 
  (import.meta.env.DEV ? 'http://localhost:3000/api' : 'https://dquant-task-manager-production.up.railway.app/api');

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
  registerPersonal: (personalData) => api.post('/auth/register-personal', personalData),
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
  // Task Invitation API
  sendInvitation: (taskId, invitationData) => api.post(`/tasks/${taskId}/send-invitation`, invitationData),
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

// Task Archive API
export const taskArchiveAPI = {
  archiveTask: (taskId) => api.post(`/task-archive/${taskId}/archive`),
  unarchiveTask: (taskId) => api.post(`/task-archive/${taskId}/unarchive`),
  getArchivedTasks: () => api.get('/task-archive/archived'),
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

// Task Invitation API (for invitation pages)
export const taskInvitationAPI = {
  // Public endpoint - no auth required
  getByToken: (token) => {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    return axios.get(`${API_URL}/api/task-invitations/${token}`);
  },
  // Auth required endpoints
  acceptInvitation: (token) => api.post(`/task-invitations/${token}/accept`),
  declineInvitation: (token) => api.post(`/task-invitations/${token}/decline`),
  getReceived: () => api.get('/task-invitations/user/received'),
  getSent: () => api.get('/task-invitations/user/sent'),
};

// Feedback API (no auth required)
export const feedbackAPI = {
  submitFeedback: (feedbackData) => {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    return axios.post(`${API_URL}/api/feedback`, feedbackData);
  },
};

export default api;
