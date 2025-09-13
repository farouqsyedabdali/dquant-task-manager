export const TASK_STATUSES = {
  TODO: 'TODO',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  ON_HOLD: 'ON_HOLD',
  CANCELLED: 'CANCELLED'
};

export const TASK_PRIORITIES = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  URGENT: 'URGENT'
};

export const USER_ROLES = {
  ADMIN: 'ADMIN',
  EMPLOYEE: 'EMPLOYEE'
};

export const STATUS_LABELS = {
  [TASK_STATUSES.TODO]: 'To Do',
  [TASK_STATUSES.IN_PROGRESS]: 'In Progress',
  [TASK_STATUSES.COMPLETED]: 'Completed',
  [TASK_STATUSES.ON_HOLD]: 'On Hold',
  [TASK_STATUSES.CANCELLED]: 'Cancelled'
};

export const PRIORITY_LABELS = {
  [TASK_PRIORITIES.LOW]: 'Low',
  [TASK_PRIORITIES.MEDIUM]: 'Medium',
  [TASK_PRIORITIES.HIGH]: 'High',
  [TASK_PRIORITIES.URGENT]: 'Urgent'
};

export const STATUS_COLORS = {
  [TASK_STATUSES.TODO]: 'badge-neutral',
  [TASK_STATUSES.IN_PROGRESS]: 'badge-info',
  [TASK_STATUSES.COMPLETED]: 'badge-success',
  [TASK_STATUSES.ON_HOLD]: 'badge-warning',
  [TASK_STATUSES.CANCELLED]: 'badge-error'
};

export const PRIORITY_COLORS = {
  [TASK_PRIORITIES.LOW]: 'badge-success',
  [TASK_PRIORITIES.MEDIUM]: 'badge-warning',
  [TASK_PRIORITIES.HIGH]: 'badge-error',
  [TASK_PRIORITIES.URGENT]: 'badge-error'
};

export const STATUS_OPTIONS = Object.entries(STATUS_LABELS).map(([value, label]) => ({
  value,
  label
}));

export const PRIORITY_OPTIONS = Object.entries(PRIORITY_LABELS).map(([value, label]) => ({
  value,
  label
}));

// Utility function to get default due date (7 days from now at 11:59 PM)
export const getDefaultDueDate = () => {
  const now = new Date();
  const sevenDaysFromNow = new Date(now);
  sevenDaysFromNow.setDate(now.getDate() + 7);
  sevenDaysFromNow.setHours(23, 59, 0, 0); // Set to 11:59 PM
  return sevenDaysFromNow.toISOString().slice(0, 16); // Format for datetime-local input
}; 