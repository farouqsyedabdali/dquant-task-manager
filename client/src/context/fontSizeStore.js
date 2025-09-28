import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useFontSizeStore = create(
  persist(
    (set) => ({
      fontSize: 'medium', // 'small', 'medium', 'large'
      
      setFontSize: (size) => set({ fontSize: size }),
    }),
    {
      name: 'font-size-storage',
    }
  )
);

export default useFontSizeStore;
