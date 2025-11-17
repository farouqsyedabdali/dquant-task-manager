import { create } from 'zustand';

// Get initial theme from system preference or localStorage
const getInitialTheme = () => {
  if (typeof window === 'undefined') return 'dark';

  // Check if there's a saved preference
  const saved = localStorage.getItem('theme');
  if (saved === 'light' || saved === 'dark') {
    return saved;
  }

  // Check system preference
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }

  return 'light';
};

const useThemeStore = create((set, get) => {
  // Initialize theme
  const initialTheme = getInitialTheme();

  // Apply theme to document on store creation
  if (typeof window !== 'undefined') {
    if (initialTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }

  return {
    theme: initialTheme,
    
    setTheme: (theme) => {
      set({ theme });
      if (typeof window !== 'undefined') {
        localStorage.setItem('theme', theme);
        if (theme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
    },
    
    toggleTheme: () => {
      const newTheme = get().theme === 'dark' ? 'light' : 'dark';
      get().setTheme(newTheme);
    },
    
    isDark: () => get().theme === 'dark',
    
    isLight: () => get().theme === 'light',
  };
});

export default useThemeStore;

