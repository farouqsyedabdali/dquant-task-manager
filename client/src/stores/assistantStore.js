import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Persistent AI assistant panel (desktop rail + mobile sheet).
 */
export const useAssistantStore = create(
  persist(
    (set) => ({
      isOpen: false,
      open: () => set({ isOpen: true }),
      close: () => set({ isOpen: false }),
      toggle: () => set((s) => ({ isOpen: !s.isOpen })),
      setOpen: (isOpen) => set({ isOpen: !!isOpen }),
    }),
    { name: 'tialz-assistant-panel' }
  )
);
