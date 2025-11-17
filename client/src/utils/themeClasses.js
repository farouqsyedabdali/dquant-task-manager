/**
 * Theme-aware utility classes
 * These can be used as className strings that work with CSS variables
 * 
 * Note: For Tailwind v4, we use CSS variables directly.
 * These are helper functions that return style objects or class combinations.
 */

export const themeClasses = {
  // Backgrounds
  bgPrimary: 'bg-[var(--color-bg-primary)]',
  bgSecondary: 'bg-[var(--color-bg-secondary)]',
  bgTertiary: 'bg-[var(--color-bg-tertiary)]',
  bgSurface: 'bg-[var(--color-surface)]',
  
  // Text
  textPrimary: 'text-[var(--color-text-primary)]',
  textSecondary: 'text-[var(--color-text-secondary)]',
  textTertiary: 'text-[var(--color-text-tertiary)]',
  
  // Borders
  borderDefault: 'border-[var(--color-border-default)]',
  borderLight: 'border-[var(--color-border-light)]',
  
  // Primary colors
  bgPrimaryColor: 'bg-[var(--color-primary)]',
  bgPrimaryHover: 'hover:bg-[var(--color-primary-hover)]',
  textPrimaryColor: 'text-[var(--color-primary)]',
};

/**
 * Get inline styles for theme-aware colors
 * Use this when Tailwind arbitrary values don't work well
 */
export const themeStyles = {
  bgPrimary: { backgroundColor: 'var(--color-bg-primary)' },
  bgSecondary: { backgroundColor: 'var(--color-bg-secondary)' },
  bgTertiary: { backgroundColor: 'var(--color-bg-tertiary)' },
  bgSurface: { backgroundColor: 'var(--color-surface)' },
  textPrimary: { color: 'var(--color-text-primary)' },
  textSecondary: { color: 'var(--color-text-secondary)' },
  textTertiary: { color: 'var(--color-text-tertiary)' },
  borderDefault: { borderColor: 'var(--color-border-default)' },
  primary: { backgroundColor: 'var(--color-primary)' },
  primaryHover: { backgroundColor: 'var(--color-primary-hover)' },
};




