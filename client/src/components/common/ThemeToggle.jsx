import { useEffect } from 'react';
import useThemeStore from '../../stores/themeStore';
import { FaSun, FaMoon } from 'react-icons/fa';

const ThemeToggle = () => {
  const { theme, toggleTheme, isDark } = useThemeStore();

  useEffect(() => {
    // Ensure theme is applied on mount
    const currentTheme = useThemeStore.getState().theme;
    useThemeStore.getState().setTheme(currentTheme);
  }, []);

  return (
    <button
      onClick={toggleTheme}
      className="flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
      style={{
        backgroundColor: 'var(--color-bg-tertiary)',
        color: 'var(--color-text-secondary)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = 'var(--color-surface-hover)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'var(--color-bg-tertiary)';
      }}
      aria-label={isDark() ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark() ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {isDark() ? (
        <FaSun className="w-5 h-5 transition-transform duration-300" />
      ) : (
        <FaMoon className="w-5 h-5 transition-transform duration-300" />
      )}
    </button>
  );
};

export default ThemeToggle;

