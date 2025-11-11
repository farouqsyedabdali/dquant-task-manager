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
      localStorage.setItem('theme', theme);
      
      // Apply theme class to document root with performance optimization
      if (typeof window !== 'undefined') {
        const root = document.documentElement;
        
        // Add transitioning class to disable transitions temporarily
        root.classList.add('theme-transitioning');
        
        // Use requestAnimationFrame for smooth update
        requestAnimationFrame(() => {
          if (theme === 'dark') {
            root.classList.add('dark');
          } else {
            root.classList.remove('dark');
          }
          
          // Remove transitioning class after a short delay
          requestAnimationFrame(() => {
            root.classList.remove('theme-transitioning');
          });
        });
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

