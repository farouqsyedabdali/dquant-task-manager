import axios from 'axios';

// Use VITE_API_URL environment variable, or detect environment
const API_BASE_URL = import.meta.env.VITE_API_URL || 
  (import.meta.env.MODE === 'production' 
    ? 'https://dquant-task-manager-production.up.railway.app/api' 
    : 'http://localhost:3000/api');

// Debug log
console.log('🔌 API Configuration:', {
  VITE_API_URL: import.meta.env.VITE_API_URL,
  MODE: import.meta.env.MODE,
  API_BASE_URL
});

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
  updateAutoArchivePeriod: (autoArchivePeriod) => api.put('/auth/company/auto-archive', { autoArchivePeriod }),
  sendVerificationEmail: (email) => api.post('/email-verification/send', email),
  verifyEmail: (token) => api.post('/email-verification/verify', token),
  checkVerificationStatus: (email) => api.get(`/email-verification/status?email=${email}`),
  completeEmployeeSetup: (setupData) => api.post('/auth/complete-employee-setup', setupData),
  
  // Forgot password API
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  verifyPasswordResetCode: (email, code) => api.post('/auth/verify-password-reset-code', { email, code }),
  resetPasswordWithCode: (email, code, newPassword) => api.post('/auth/reset-password-with-code', { email, code, newPassword }),
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
  resetUserPassword: (id, newPassword) => api.put(`/users/${id}/reset-password`, { newPassword }),
  deleteEmployee: (id) => api.delete(`/users/${id}`),
  resendEmployeeInvitation: (id) => api.post(`/users/${id}/resend-invitation`),
};

// AI API
export const aiAPI = {
  chat: (message) => api.post('/ai/chat', { message }),
  extractTask: (text) => api.post('/ai/extract-task', { text }),
  identifyTaskUpdate: (text) => api.post('/ai/identify-task-update', { text }),
};

// Task Share API
export const taskShareAPI = {
  shareTask: (taskId, userId, permissionLevel = 'VIEWER') => api.post(`/task-shares/${taskId}/share`, { userId, permissionLevel }),
  shareTaskWithContact: (taskId, contactId, permissionLevel = 'VIEWER') => api.post(`/task-shares/${taskId}/share-contact`, { contactId, permissionLevel }),
  shareTaskWithEmail: (taskId, email, permissionLevel = 'VIEWER') => api.post(`/task-shares/${taskId}/share-email`, { email, permissionLevel }),
  unshareTask: (taskId, userId) => api.delete(`/task-shares/${taskId}/share/${userId}`),
  unshareTaskById: (taskId, shareId) => api.delete(`/task-shares/${taskId}/share-id/${shareId}`),
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
  getTaskAuditLogs: (taskId) => api.get(`/audit/task/${taskId}`),
  exportAuditLogs: (params = {}) => api.get('/audit/export/csv', { 
    params,
    responseType: 'blob' // For file download
  }),
};

// Task Invitation API (for invitation pages)
export const taskInvitationAPI = {
  // Public endpoint - no auth required (but uses api client for correct baseURL)
  getByToken: (token) => api.get(`/task-invitations/${token}`),
  // Auth required endpoints
  acceptInvitation: (token) => api.post(`/task-invitations/${token}/accept`),
  declineInvitation: (token, data) => api.post(`/task-invitations/${token}/decline`, data),
  getReceived: () => api.get('/task-invitations/user/received'),
  getSent: () => api.get('/task-invitations/user/sent'),
  getPending: () => api.get('/task-invitations/pending'),
};

// Feedback API (no auth required)
export const feedbackAPI = {
  submitFeedback: (feedbackData) => api.post('/feedback', feedbackData),
};

// Super Admin API (SUPER_ADMIN role required)
export const superAdminAPI = {
  // Company management
  getAllCompanies: (params) => api.get('/super-admin/companies', { params }),
  getCompanyById: (id) => api.get(`/super-admin/companies/${id}`),
  toggleCompanyStatus: (companyId, action) => api.put(`/super-admin/companies/${companyId}/status`, { action }),
  
  // User management
  searchUsersGlobally: (params) => api.get('/super-admin/users/search', { params }),
  resetUserPassword: (userId, newPassword) => api.put(`/super-admin/users/${userId}/reset-password`, { newPassword }),
  
  // System monitoring
  getSystemHealth: (params) => api.get('/super-admin/system/health', { params }),
};

// Security API (SUPER_ADMIN role required)
export const securityAPI = {
  // Security monitoring
  getFailedLogins: (params) => api.get('/security/failed-logins', { params }),
  getSuspiciousActivity: (params) => api.get('/security/suspicious-activity', { params }),
  generateSecurityReport: (params) => api.get('/security/security-report', { params }),
  getUserSessions: (params) => api.get('/security/user-sessions', { params }),

  // Security actions
  resetAllPasswords: (data) => api.post('/security/reset-all-passwords', data),
  lockSuspiciousAccounts: (params) => api.post('/security/lock-suspicious-accounts', params),
};

// Contacts API
export const contactsAPI = {
  getAll: (params) => api.get('/contacts', { params }),
  getById: (id) => api.get(`/contacts/${id}`),
  create: (contactData) => api.post('/contacts', contactData),
  update: (id, contactData) => api.put(`/contacts/${id}`, contactData),
  delete: (id) => api.delete(`/contacts/${id}`),
  search: (query, limit) => api.get('/contacts/search', { params: { q: query, limit } }),
};

// Projects API
export const projectsAPI = {
  // CRUD operations
  getAll: (params) => api.get('/projects', { params }),
  getById: (id) => api.get(`/projects/${id}`),
  create: (projectData) => api.post('/projects', projectData),
  update: (id, projectData) => api.put(`/projects/${id}`, projectData),
  delete: (id) => api.delete(`/projects/${id}`),
  
  // Templates
  getTemplates: (params = {}) => api.get('/projects/templates', { params }),
  
  // Members
  addMember: (projectId, userId, role) => api.post(`/projects/${projectId}/members`, { userId, role }),
  removeMember: (projectId, memberId) => api.delete(`/projects/${projectId}/members/${memberId}`),
  
  // Tasks
  addTask: (projectId, taskData) => api.post(`/projects/${projectId}/tasks`, taskData),
  removeTask: (projectId, taskId) => api.delete(`/projects/${projectId}/tasks/${taskId}`),
  
  // Send tasks
  sendTask: (projectId, taskId, message) => api.post(`/projects/${projectId}/tasks/${taskId}/send`, { message }),
  sendAllDraftTasks: (projectId) => api.post(`/projects/${projectId}/tasks/send-all`),
  
  // Reassign tasks
  reassignTask: (projectId, taskId, assigneeData) => api.put(`/projects/${projectId}/tasks/${taskId}/reassign`, assigneeData),
};

export const templatesAPI = {
  // Get all user templates (with pagination and filtering)
  getAll: (params = {}) => api.get('/templates', { params }),
  
  // Get a specific template
  getById: (id) => api.get(`/templates/${id}`),
  
  // Create template from project
  createFromProject: (projectId, data) => api.post(`/templates/from-project/${projectId}`, data),
  
  // Create project from template
  createProjectFromTemplate: (templateId, data) => api.post(`/templates/${templateId}/create-project`, data),
  
  // Update template
  update: (id, data) => api.put(`/templates/${id}`, data),
  
  // Delete template
  delete: (id) => api.delete(`/templates/${id}`),
};

export default api;
