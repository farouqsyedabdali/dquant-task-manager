import { create } from 'zustand';
import { tasksAPI } from '../services/api';
import useAuthStore from '../context/authStore';

const useTaskStore = create((set, get) => ({
  tasks: [],
  currentTask: null,
  isLoading: false,
  error: null,
  filters: {
    status: '',
    priority: '',
    search: '',
    dueDateFilter: '',
    taskType: '',
    sortBy: 'urgency'
  },

  // Get all tasks
  fetchTasks: async (filters = {}) => {
    set({ isLoading: true, error: null });
    try {
      const response = await tasksAPI.getAll(filters);
      set({ tasks: response.data, isLoading: false });
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Failed to fetch tasks';
      set({ error: errorMessage, isLoading: false });
      return { success: false, error: errorMessage };
    }
  },

  // Get tasks by type
  fetchTasksByType: async (type = 'all', filters = {}) => {
    set({ isLoading: true, error: null });
    try {
      const response = await tasksAPI.getAll({ ...filters, type });
      set({ tasks: response.data, isLoading: false });
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Failed to fetch tasks';
      set({ error: errorMessage, isLoading: false });
      return { success: false, error: errorMessage };
    }
  },

  // Get single task
  fetchTask: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const response = await tasksAPI.getById(id);
      set({ currentTask: response.data, isLoading: false });
      return { success: true, data: response.data };
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Failed to fetch task';
      set({ error: errorMessage, isLoading: false });
      return { success: false, error: errorMessage };
    }
  },

  // Create task
  createTask: async (taskData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await tasksAPI.create(taskData);
      const newTask = response.data;
      set(state => ({
        tasks: [newTask, ...state.tasks],
        isLoading: false
      }));
      return { success: true, data: newTask };
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Failed to create task';
      set({ error: errorMessage, isLoading: false });
      return { success: false, error: errorMessage };
    }
  },

  // Create subtask
  createSubtask: async (parentTaskId, taskData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await tasksAPI.createSubtask(parentTaskId, taskData);
      const newSubtask = response.data;
      set(state => ({
        tasks: state.tasks.map(task => 
          task.id === parseInt(parentTaskId) 
            ? { ...task, subtasks: [...(task.subtasks || []), newSubtask] }
            : task
        ),
        isLoading: false
      }));
      return { success: true, data: newSubtask };
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Failed to create subtask';
      set({ error: errorMessage, isLoading: false });
      return { success: false, error: errorMessage };
    }
  },

  // Update task
  updateTask: async (id, taskData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await tasksAPI.update(id, taskData);
      const updatedTask = response.data;
      set(state => ({
        tasks: state.tasks.map(task => 
          task.id === updatedTask.id ? updatedTask : task
        ),
        currentTask: state.currentTask?.id === updatedTask.id ? updatedTask : state.currentTask,
        isLoading: false
      }));
      return { success: true, data: updatedTask };
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Failed to update task';
      set({ error: errorMessage, isLoading: false });
      return { success: false, error: errorMessage };
    }
  },

  // Delete task
  deleteTask: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await tasksAPI.delete(id);
      set(state => ({
        tasks: state.tasks.filter(task => task.id !== id),
        currentTask: state.currentTask?.id === id ? null : state.currentTask,
        isLoading: false
      }));
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Failed to delete task';
      set({ error: errorMessage, isLoading: false });
      return { success: false, error: errorMessage };
    }
  },

  // Update task status
  updateTaskStatus: async (id, status) => {
    set({ isLoading: true, error: null });
    try {
      const response = await tasksAPI.updateStatus(id, status);
      const updatedTask = response.data;
      set(state => ({
        tasks: state.tasks.map(task => 
          task.id === updatedTask.id ? updatedTask : task
        ),
        currentTask: state.currentTask?.id === updatedTask.id ? updatedTask : state.currentTask,
        isLoading: false
      }));
      return { success: true, data: updatedTask };
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Failed to update task status';
      set({ error: errorMessage, isLoading: false });
      return { success: false, error: errorMessage };
    }
  },

  // Update task priority
  updateTaskPriority: async (id, priority) => {
    set({ isLoading: true, error: null });
    try {
      const response = await tasksAPI.updatePriority(id, priority);
      const updatedTask = response.data;
      set(state => ({
        tasks: state.tasks.map(task => 
          task.id === updatedTask.id ? updatedTask : task
        ),
        currentTask: state.currentTask?.id === updatedTask.id ? updatedTask : state.currentTask,
        isLoading: false
      }));
      return { success: true, data: updatedTask };
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Failed to update task priority';
      set({ error: errorMessage, isLoading: false });
      return { success: false, error: errorMessage };
    }
  },

  // Set filters
  setFilters: (filters) => {
    set({ filters: { ...get().filters, ...filters } });
  },

  // Clear filters
  clearFilters: () => {
    set({ filters: { status: '', priority: '', search: '', dueDateFilter: '', taskType: '', sortBy: 'urgency' } });
  },

  // Clear current task
  clearCurrentTask: () => {
    set({ currentTask: null });
  },

  // Clear error
  clearError: () => {
    set({ error: null });
  },

  // Get filtered tasks
  getFilteredTasks: () => {
    const { tasks, filters } = get();
    let filteredTasks = [...tasks];

    if (filters.status) {
      const statusArray = filters.status.split(',').map(s => s.trim());
      filteredTasks = filteredTasks.filter(task => statusArray.includes(task.status));
    }

    if (filters.priority) {
      filteredTasks = filteredTasks.filter(task => task.priority === filters.priority);
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filteredTasks = filteredTasks.filter(task =>
        task.title.toLowerCase().includes(searchLower) ||
        (task.description && task.description.toLowerCase().includes(searchLower))
      );
    }

    // Task type filtering
    if (filters.taskType) {
      const user = useAuthStore.getState().user;
      if (user) {
        switch (filters.taskType) {
          case 'shared':
            filteredTasks = filteredTasks.filter(task => 
              task.sharedWith?.some(share => share.userId === user.id)
            );
            break;
          case 'assigned':
            filteredTasks = filteredTasks.filter(task => 
              task.assigneeId === user.id || 
              task.coAssignees?.some(co => co.userId === user.id)
            );
            break;
          case 'created':
            filteredTasks = filteredTasks.filter(task => 
              task.assignerId === user.id
            );
            break;
        }
      }
    }

    // Due date filtering
    if (filters.dueDateFilter) {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      switch (filters.dueDateFilter) {
        case 'overdue':
          filteredTasks = filteredTasks.filter(task => 
            task.dueDate && new Date(task.dueDate) < today && task.status !== 'COMPLETED'
          );
          break;
        case 'due-today':
          const endOfDay = new Date(today.getTime() + 24 * 60 * 60 * 1000);
          filteredTasks = filteredTasks.filter(task => 
            task.dueDate && new Date(task.dueDate) >= today && new Date(task.dueDate) < endOfDay
          );
          break;
        case 'due-this-week':
          const endOfWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
          filteredTasks = filteredTasks.filter(task => 
            task.dueDate && new Date(task.dueDate) >= today && new Date(task.dueDate) < endOfWeek
          );
          break;
        case 'due-this-month':
          const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
          filteredTasks = filteredTasks.filter(task => 
            task.dueDate && new Date(task.dueDate) >= today && new Date(task.dueDate) <= endOfMonth
          );
          break;
        case 'no-due-date':
          filteredTasks = filteredTasks.filter(task => !task.dueDate);
          break;
      }
    }

    // Sort tasks based on sortBy filter
    const sortBy = filters.sortBy || 'urgency';
    filteredTasks.sort((a, b) => {
      switch (sortBy) {
        case 'urgency':
          // Priority order: URGENT > HIGH > MEDIUM > LOW
          const priorityOrder = { URGENT: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
          const aPriority = priorityOrder[a.priority] || 0;
          const bPriority = priorityOrder[b.priority] || 0;
          
          if (aPriority !== bPriority) {
            return bPriority - aPriority; // Higher priority first
          }
          
          // If same priority, sort by due date (earliest first, nulls last)
          if (a.dueDate && b.dueDate) {
            return new Date(a.dueDate) - new Date(b.dueDate);
          }
          if (a.dueDate && !b.dueDate) return -1;
          if (!a.dueDate && b.dueDate) return 1;
          
          // If no due date or same due date, sort by creation date (newest first)
          return new Date(b.createdAt) - new Date(a.createdAt);
          
        case 'created-desc':
          return new Date(b.createdAt) - new Date(a.createdAt);
          
        case 'created-asc':
          return new Date(a.createdAt) - new Date(b.createdAt);
          
        case 'due-desc':
          if (a.dueDate && b.dueDate) {
            return new Date(b.dueDate) - new Date(a.dueDate);
          }
          if (a.dueDate && !b.dueDate) return -1;
          if (!a.dueDate && b.dueDate) return 1;
          return new Date(b.createdAt) - new Date(a.createdAt);
          
        case 'due-asc':
          if (a.dueDate && b.dueDate) {
            return new Date(a.dueDate) - new Date(b.dueDate);
          }
          if (a.dueDate && !b.dueDate) return -1;
          if (!a.dueDate && b.dueDate) return 1;
          return new Date(b.createdAt) - new Date(a.createdAt);
          
        case 'priority-desc':
          const priorityOrderDesc = { URGENT: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
          const aPriorityDesc = priorityOrderDesc[a.priority] || 0;
          const bPriorityDesc = priorityOrderDesc[b.priority] || 0;
          if (aPriorityDesc !== bPriorityDesc) {
            return bPriorityDesc - aPriorityDesc;
          }
          return new Date(b.createdAt) - new Date(a.createdAt);
          
        case 'priority-asc':
          const priorityOrderAsc = { URGENT: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
          const aPriorityAsc = priorityOrderAsc[a.priority] || 0;
          const bPriorityAsc = priorityOrderAsc[b.priority] || 0;
          if (aPriorityAsc !== bPriorityAsc) {
            return aPriorityAsc - bPriorityAsc;
          }
          return new Date(b.createdAt) - new Date(a.createdAt);
          
        case 'status':
          const statusOrder = { TODO: 1, IN_PROGRESS: 2, ON_HOLD: 3, COMPLETED: 4, CANCELLED: 5 };
          const aStatus = statusOrder[a.status] || 0;
          const bStatus = statusOrder[b.status] || 0;
          if (aStatus !== bStatus) {
            return aStatus - bStatus;
          }
          return new Date(b.createdAt) - new Date(a.createdAt);
          
        case 'title':
          return a.title.localeCompare(b.title);
          
        default:
          return new Date(b.createdAt) - new Date(a.createdAt);
      }
    });

    return filteredTasks;
  }
}));

export default useTaskStore; 