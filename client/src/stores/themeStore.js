import { create } from 'zustand';
import { getPaletteById } from '../config/colorPalettes';

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

// Get initial palette from localStorage or use defaults
const getInitialPalettes = () => {
  if (typeof window === 'undefined') {
    return { light: 'light-1', dark: 'dark-1' };
  }

  const savedLight = localStorage.getItem('lightPalette') || 'light-1';
  const savedDark = localStorage.getItem('darkPalette') || 'dark-1';

  return { light: savedLight, dark: savedDark };
};

// Apply palette colors to document root
const applyPalette = (paletteId) => {
  if (typeof window === 'undefined') return;

  const palette = getPaletteById(paletteId);
  if (!palette) return;

  const root = document.documentElement;
  Object.entries(palette.colors).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });
};

const useThemeStore = create((set, get) => {
  // Initialize theme and palettes
  const initialTheme = getInitialTheme();
  const initialPalettes = getInitialPalettes();

  // Apply theme class and palette colors on store creation
  if (typeof window !== 'undefined') {
    if (initialTheme === 'dark') {
      document.documentElement.classList.add('dark');
      applyPalette(initialPalettes.dark);
    } else {
      document.documentElement.classList.remove('dark');
      applyPalette(initialPalettes.light);
    }
  }

  return {
    theme: initialTheme,
    lightPalette: initialPalettes.light,
    darkPalette: initialPalettes.dark,
    
    setTheme: (theme) => {
      const { lightPalette, darkPalette } = get();
      set({ theme });
      
      if (typeof window !== 'undefined') {
        localStorage.setItem('theme', theme);
        
        if (theme === 'dark') {
          document.documentElement.classList.add('dark');
          applyPalette(darkPalette);
        } else {
          document.documentElement.classList.remove('dark');
          applyPalette(lightPalette);
        }
      }
    },
    
    setLightPalette: (paletteId) => {
      set({ lightPalette: paletteId });
      
      if (typeof window !== 'undefined') {
        localStorage.setItem('lightPalette', paletteId);
        
        // If currently in light mode, apply the new palette immediately
        if (get().theme === 'light') {
          applyPalette(paletteId);
        }
      }
    },
    
    setDarkPalette: (paletteId) => {
      set({ darkPalette: paletteId });
      
      if (typeof window !== 'undefined') {
        localStorage.setItem('darkPalette', paletteId);
        
        // If currently in dark mode, apply the new palette immediately
        if (get().theme === 'dark') {
          applyPalette(paletteId);
        }
      }
    },
    
    toggleTheme: () => {
      const newTheme = get().theme === 'dark' ? 'light' : 'dark';
      get().setTheme(newTheme);
    },
    
    isDark: () => get().theme === 'dark',
    
    isLight: () => get().theme === 'light',
    
    getCurrentPaletteId: () => {
      const { theme, lightPalette, darkPalette } = get();
      return theme === 'dark' ? darkPalette : lightPalette;
    },
  };
});

export default useThemeStore;

