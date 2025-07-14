import { create } from 'zustand';
import { tasksAPI } from '../services/api';

const useTaskStore = create((set, get) => ({
  tasks: [],
  currentTask: null,
  isLoading: false,
  error: null,
  filters: {
    status: '',
    priority: '',
    search: ''
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
      return { success: true };
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
    set({ filters: { status: '', priority: '', search: '' } });
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
      filteredTasks = filteredTasks.filter(task => task.status === filters.status);
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

    return filteredTasks;
  }
}));

export default useTaskStore; 