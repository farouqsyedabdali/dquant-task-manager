import { create } from 'zustand';
import { contactsAPI } from '../services/api';

const useContactStore = create((set, get) => ({
  // State
  contacts: [],
  isLoading: false,
  error: null,
  searchResults: [],

  // Actions
  fetchContacts: async (params = {}) => {
    set({ isLoading: true, error: null });
    try {
      const response = await contactsAPI.getAll(params);
      // The API returns contacts directly, not wrapped in a data object
      const contacts = response.data;
      set({ contacts: contacts, isLoading: false });
      return { success: true, data: { contacts: contacts } };
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Failed to fetch contacts';
      set({ error: errorMessage, isLoading: false });
      return { success: false, error: errorMessage };
    }
  },

  createContact: async (contactData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await contactsAPI.create(contactData);
      set(state => ({
        contacts: [response.data, ...state.contacts],
        isLoading: false
      }));
      return { success: true, data: response.data };
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Failed to create contact';
      set({ error: errorMessage, isLoading: false });
      return { success: false, error: errorMessage };
    }
  },

  updateContact: async (id, contactData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await contactsAPI.update(id, contactData);
      set(state => ({
        contacts: state.contacts.map(contact =>
          contact.id === id ? response.data : contact
        ),
        isLoading: false
      }));
      return { success: true, data: response.data };
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Failed to update contact';
      set({ error: errorMessage, isLoading: false });
      return { success: false, error: errorMessage };
    }
  },

  deleteContact: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await contactsAPI.delete(id);
      set(state => ({
        contacts: state.contacts.filter(contact => contact.id !== id),
        isLoading: false
      }));
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Failed to delete contact';
      set({ error: errorMessage, isLoading: false });
      return { success: false, error: errorMessage };
    }
  },

  searchContacts: async (query, limit = 10) => {
    if (!query || query.trim().length < 2) {
      set({ searchResults: [] });
      return { success: true, data: [] };
    }

    try {
      const response = await contactsAPI.search(query, limit);
      set({ searchResults: response.data });
      return { success: true, data: response.data };
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Failed to search contacts';
      set({ error: errorMessage });
      return { success: false, error: errorMessage };
    }
  },

  getContactById: async (id) => {
    try {
      const response = await contactsAPI.getById(id);
      return { success: true, data: response.data };
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Failed to fetch contact';
      return { success: false, error: errorMessage };
    }
  },

  clearError: () => set({ error: null }),
  clearSearchResults: () => set({ searchResults: [] }),

  // Getters
  getContactsByType: (type) => {
    const { contacts } = get();
    if (type === 'personal') {
      return contacts.filter(contact => contact.isPersonal);
    } else if (type === 'business') {
      return contacts.filter(contact => !contact.isPersonal);
    }
    return contacts;
  },

  getContactById: (id) => {
    const { contacts } = get();
    return contacts.find(contact => contact.id === id);
  }
}));

export default useContactStore;
