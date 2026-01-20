import { create } from 'zustand';
import api from '../services/api';

// Use same API_BASE_URL logic as api.js
const API_BASE_URL = import.meta.env.VITE_API_URL ||
  (import.meta.env.MODE === 'production'
    ? 'https://dquant-task-manager-production.up.railway.app/api'
    : 'http://localhost:3000/api');

const useGoogleContactsStore = create((set, get) => ({
  // State
  contacts: [],
  isLoading: false,
  error: null,
  accessStatus: {
    hasAccess: false,
    isGoogleUser: false,
    hasContactsScope: false,
    tokenExpired: false,
    needsReconnect: false
  },
  searchTerm: '',
  selectedContacts: new Set(),
  pagination: {
    nextPageToken: null,
    hasMore: false,
    totalItems: 0
  },

  // Actions
  fetchAccessStatus: async () => {
    try {
      set({ error: null });
      const response = await api.get('/google-contacts/status');
      set({ accessStatus: response.data });
      return response.data;
    } catch (error) {
      console.error('Error fetching Google contacts access status:', error);
      set({
        error: error.response?.data?.error || 'Failed to check access status',
        accessStatus: {
          hasAccess: false,
          isGoogleUser: false,
          hasContactsScope: false,
          tokenExpired: false,
          needsReconnect: true
        }
      });
      return null;
    }
  },

  fetchContacts: async (options = {}) => {
    try {
      set({ isLoading: true, error: null });

      const params = {};
      if (options.search) params.search = options.search;
      if (options.limit) params.limit = options.limit;
      if (options.pageToken) params.pageToken = options.pageToken;

      const response = await api.get('/google-contacts', { params });

      const { contacts, nextPageToken, hasMore, totalItems } = response.data;

      set(state => ({
        contacts: options.pageToken ? [...state.contacts, ...contacts] : contacts,
        pagination: {
          nextPageToken,
          hasMore,
          totalItems
        },
        isLoading: false
      }));

      return response.data;
    } catch (error) {
      console.error('Error fetching Google contacts:', error);
      set({
        isLoading: false,
        error: error.response?.data?.error || 'Failed to fetch contacts'
      });
      throw error;
    }
  },

  searchContacts: async (searchTerm) => {
    set({ searchTerm });
    await get().fetchContacts({ search: searchTerm });
  },

  loadMoreContacts: async () => {
    const { pagination, searchTerm } = get();
    if (!pagination.hasMore) return;

    await get().fetchContacts({
      search: searchTerm,
      pageToken: pagination.nextPageToken
    });
  },

  connectGoogleAccount: async (forContacts = false) => {
    try {
      set({ error: null });
      console.log('🔗 Connecting Google account, forContacts:', forContacts);

      const response = await api.post('/google-contacts/connect', { forContacts });
      console.log('📡 Connect response:', response.data);

      if (response.data.authUrl) {
        console.log('Redirecting to auth URL:', response.data.authUrl);
        // Redirect to Google OAuth
        window.location.href = response.data.authUrl;
        return { success: true, needsRedirect: true };
      }

      // Already connected
      console.log('Already connected, fetching status...');
      await get().fetchAccessStatus();
      return { success: true, alreadyConnected: true };
    } catch (error) {
      console.error('Error connecting Google account:', error);
      const errorData = error.response?.data;
      console.log('Error data:', errorData);

      // Handle case where user needs basic Google auth first
      if (errorData?.needsBasicAuth) {
        console.log('🔄 User needs basic auth, redirecting to Google auth');
        // Redirect to regular Google auth using same pattern as other components
        window.location.href = `${API_BASE_URL}/auth/google`;
        return { success: false, needsBasicAuth: true };
      }
      set({ error: error.response?.data?.error || 'Failed to connect Google account' });
      return { success: false, error: error.response?.data?.error };
    }
  },

  disconnectGoogleContacts: async () => {
    try {
      set({ error: null });
      await api.post('/google-contacts/disconnect');

      // Reset state
      set({
        contacts: [],
        selectedContacts: new Set(),
        accessStatus: {
          hasAccess: false,
          isGoogleUser: false,
          hasContactsScope: false,
          tokenExpired: false,
          needsReconnect: true
        },
        pagination: {
          nextPageToken: null,
          hasMore: false,
          totalItems: 0
        }
      });

      return { success: true };
    } catch (error) {
      console.error('Error disconnecting Google contacts:', error);
      set({ error: error.response?.data?.error || 'Failed to disconnect Google contacts' });
      return { success: false, error: error.response?.data?.error };
    }
  },

  importContacts: async (contactIds) => {
    try {
      set({ error: null });
      const response = await api.post('/google-contacts/import', { contactIds });

      return {
        success: true,
        imported: response.data.imported,
        skipped: response.data.skipped,
        contacts: response.data.contacts,
        skippedContacts: response.data.skippedContacts
      };
    } catch (error) {
      console.error('Error importing contacts:', error);
      set({ error: error.response?.data?.error || 'Failed to import contacts' });
      return { success: false, error: error.response?.data?.error };
    }
  },

  // Selection management
  toggleContactSelection: (contactId) => {
    set(state => {
      const newSelected = new Set(state.selectedContacts);
      if (newSelected.has(contactId)) {
        newSelected.delete(contactId);
      } else {
        newSelected.add(contactId);
      }
      return { selectedContacts: newSelected };
    });
  },

  selectAllContacts: () => {
    const { contacts } = get();
    const allIds = contacts.map(contact => contact.googleId);
    set({ selectedContacts: new Set(allIds) });
  },

  deselectAllContacts: () => {
    set({ selectedContacts: new Set() });
  },

  // Getters
  getSelectedContacts: () => {
    const { contacts, selectedContacts } = get();
    return contacts.filter(contact => selectedContacts.has(contact.googleId));
  },

  getSelectedCount: () => {
    return get().selectedContacts.size;
  },

  isContactSelected: (contactId) => {
    return get().selectedContacts.has(contactId);
  },

  // Clear state
  clearState: () => {
    set({
      contacts: [],
      isLoading: false,
      error: null,
      searchTerm: '',
      selectedContacts: new Set(),
      pagination: {
        nextPageToken: null,
        hasMore: false,
        totalItems: 0
      }
    });
  }
}));

export default useGoogleContactsStore;