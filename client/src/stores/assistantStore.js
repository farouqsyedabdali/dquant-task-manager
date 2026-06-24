import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Persistent AI assistant panel (desktop rail + mobile sheet).
 */
export const useAssistantStore = create(
  persist(
    (set) => ({
      isOpen: false,
      width: 360,
      open: () => set({ isOpen: true }),
      close: () => set({ isOpen: false }),
      toggle: () => set((s) => ({ isOpen: !s.isOpen })),
      setOpen: (isOpen) => set({ isOpen: !!isOpen }),
      setWidth: (width) => set({ width: Math.max(300, Math.min(600, width)) }),
    }),
    { name: 'tialz-assistant-panel' }
  )
);
