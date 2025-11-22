# 🎨 Color System Documentation

## Overview

The Tialz Task Manager uses a **CSS Variables-based theming system** that supports both Light and Dark modes. The system is built with **Tailwind CSS 4** and uses CSS custom properties for dynamic theme switching.

---

## 🏗️ Architecture

### **Files Involved:**

1. **`client/src/index.css`** - Main theme definitions (CSS variables)
2. **`client/src/stores/themeStore.js`** - Zustand store for theme state
3. **`client/src/utils/themeClasses.js`** - Helper utilities for theme-aware classes
4. **`client/src/components/common/ThemeToggle.jsx`** - Theme switcher component
5. **`client/src/App.css`** - Additional theme-aware styles

---

## 🎨 Current Color Variables

### **Light Mode (`:root`)**

```css
:root {
  /* Background Colors */
  --color-bg-primary: #ffffff;      /* Main background (white) */
  --color-bg-secondary: #f9fafb;    /* Cards, panels (very light gray) */
  --color-bg-tertiary: #f3f4f6;     /* Hover states, inputs (light gray) */
  --color-bg-quaternary: #e5e7eb;   /* Active states (medium gray) */
  
  /* Text Colors */
  --color-text-primary: #111827;    /* Main text (near black) */
  --color-text-secondary: #6b7280;  /* Secondary text (medium gray) */
  --color-text-tertiary: #9ca3af;   /* Subtle text (light gray) */
  --color-text-muted: #6b7280;      /* Muted text */
  
  /* Border Colors */
  --color-border-default: #e5e7eb;  /* Default borders */
  --color-border-light: #d1d5db;    /* Light borders */
  --color-border-dark: #9ca3af;     /* Dark borders */
  
  /* Primary Colors (Indigo) */
  --color-primary: #6366f1;         /* Primary brand color */
  --color-primary-hover: #4f46e5;   /* Primary hover state */
  --color-primary-light: #818cf8;   /* Light variant */
  --color-primary-dark: #4338ca;    /* Dark variant */
  
  /* Accent Colors (Purple) */
  --color-accent: #8b5cf6;          /* Accent color */
  --color-accent-hover: #7c3aed;    /* Accent hover */
  
  /* Surface Colors */
  --color-surface: var(--color-bg-secondary);
  --color-surface-hover: var(--color-bg-tertiary);
  --color-surface-active: var(--color-bg-quaternary);
  
  /* Scrollbar Colors */
  --color-scrollbar-track: #f3f4f6;
  --color-scrollbar-thumb: #d1d5db;
  --color-scrollbar-thumb-hover: #9ca3af;
}
```

### **Dark Mode (`.dark`)**

```css
.dark {
  /* Background Colors - Pure Black Theme */
  --color-bg-primary: #0a0a0a;      /* Deep black background */
  --color-bg-secondary: #141414;    /* Cards, panels (very dark gray) */
  --color-bg-tertiary: #1a1a1a;     /* Hover states (dark gray) */
  --color-bg-quaternary: #242424;   /* Active states (medium dark gray) */
  
  /* Text Colors */
  --color-text-primary: #ffffff;    /* Pure white text */
  --color-text-secondary: #b3b3b3;  /* Light gray text */
  --color-text-tertiary: #808080;   /* Medium gray text */
  --color-text-muted: #666666;      /* Muted gray text */
  
  /* Border Colors */
  --color-border-default: #2a2a2a;  /* Subtle borders */
  --color-border-light: #333333;    /* Light borders */
  --color-border-dark: #404040;     /* Dark borders */
  
  /* Primary Colors (Indigo) - Brighter for contrast */
  --color-primary: #6366f1;         /* Primary brand color */
  --color-primary-hover: #818cf8;   /* Lighter on hover */
  --color-primary-light: #a78bfa;   /* Light variant */
  --color-primary-dark: #4f46e5;    /* Dark variant */
  
  /* Accent Colors (Purple) */
  --color-accent: #a78bfa;          /* Lighter accent for dark mode */
  --color-accent-hover: #8b5cf6;    /* Accent hover */
  
  /* Surface Colors */
  --color-surface: var(--color-bg-secondary);
  --color-surface-hover: var(--color-bg-tertiary);
  --color-surface-active: var(--color-bg-quaternary);
  
  /* Scrollbar Colors */
  --color-scrollbar-track: #141414;
  --color-scrollbar-thumb: #2a2a2a;
  --color-scrollbar-thumb-hover: #404040;
}
```

---

## 🔧 How It Works

### **1. Theme Store (Zustand)**

```javascript
// client/src/stores/themeStore.js
const useThemeStore = create((set, get) => ({
  theme: 'dark', // or 'light'
  
  setTheme: (theme) => {
    localStorage.setItem('theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  },
  
  toggleTheme: () => {
    const newTheme = get().theme === 'dark' ? 'light' : 'dark';
    get().setTheme(newTheme);
  },
}));
```

### **2. Theme Toggle Component**

```javascript
// client/src/components/common/ThemeToggle.jsx
const ThemeToggle = () => {
  const { toggleTheme, isDark } = useThemeStore();
  
  return (
    <button onClick={toggleTheme}>
      {isDark() ? <FaSun /> : <FaMoon />}
    </button>
  );
};
```

### **3. Using CSS Variables in Components**

**Method 1: Inline Styles (Recommended for dynamic values)**
```jsx
<div style={{ backgroundColor: 'var(--color-bg-primary)' }}>
  <p style={{ color: 'var(--color-text-primary)' }}>Hello</p>
</div>
```

**Method 2: Tailwind Arbitrary Values**
```jsx
<div className="bg-[var(--color-bg-primary)]">
  <p className="text-[var(--color-text-primary)]">Hello</p>
</div>
```

**Method 3: Helper Utilities**
```javascript
import { themeClasses, themeStyles } from '../utils/themeClasses';

// Using classes
<div className={themeClasses.bgPrimary}>
  <p className={themeClasses.textPrimary}>Hello</p>
</div>

// Using inline styles
<div style={themeStyles.bgPrimary}>
  <p style={themeStyles.textPrimary}>Hello</p>
</div>
```

---

## 📊 Color Usage Guide

### **Backgrounds**

| Variable | Light Mode | Dark Mode | Usage |
|----------|-----------|-----------|-------|
| `--color-bg-primary` | `#ffffff` | `#0a0a0a` | Main page background |
| `--color-bg-secondary` | `#f9fafb` | `#141414` | Cards, panels, modals |
| `--color-bg-tertiary` | `#f3f4f6` | `#1a1a1a` | Hover states, inputs |
| `--color-bg-quaternary` | `#e5e7eb` | `#242424` | Active states, pressed |

### **Text**

| Variable | Light Mode | Dark Mode | Usage |
|----------|-----------|-----------|-------|
| `--color-text-primary` | `#111827` | `#ffffff` | Headings, main content |
| `--color-text-secondary` | `#6b7280` | `#b3b3b3` | Descriptions, labels |
| `--color-text-tertiary` | `#9ca3af` | `#808080` | Subtle info, placeholders |

### **Borders**

| Variable | Light Mode | Dark Mode | Usage |
|----------|-----------|-----------|-------|
| `--color-border-default` | `#e5e7eb` | `#2a2a2a` | Default borders |
| `--color-border-light` | `#d1d5db` | `#333333` | Subtle dividers |
| `--color-border-dark` | `#9ca3af` | `#404040` | Emphasized borders |

### **Brand Colors**

| Variable | Light Mode | Dark Mode | Usage |
|----------|-----------|-----------|-------|
| `--color-primary` | `#6366f1` | `#6366f1` | Primary buttons, links |
| `--color-primary-hover` | `#4f46e5` | `#818cf8` | Hover states |
| `--color-accent` | `#8b5cf6` | `#a78bfa` | Accent elements |

---

## 🎯 Where Colors Are Used

### **Dashboard**
- Background: `--color-bg-primary`
- Task cards: `--color-bg-secondary`
- Hover states: `--color-bg-tertiary`
- Text: `--color-text-primary`, `--color-text-secondary`
- Borders: `--color-border-default`

### **Modals**
- Background: `--color-bg-secondary`
- Backdrop: `rgba(0, 0, 0, 0.5)` (light) / `rgba(0, 0, 0, 0.8)` (dark)
- Text: `--color-text-primary`
- Borders: `--color-border-default`

### **Buttons**
- Primary: `--color-primary` with `--color-primary-hover`
- Secondary: `--color-bg-tertiary` with `--color-border-default`
- Text: `--color-text-primary`

### **Forms**
- Input backgrounds: `--color-bg-tertiary`
- Input borders: `--color-border-default`
- Input text: `--color-text-primary`
- Placeholders: `--color-text-tertiary`

### **Scrollbars**
- Track: `--color-scrollbar-track`
- Thumb: `--color-scrollbar-thumb`
- Thumb hover: `--color-scrollbar-thumb-hover`

---

## 🧪 Testing Your Colors

### **Color Palette Tester**

Visit **`/test`** in your app to access the interactive color palette tester.

**Features:**
- 10 pre-designed Light Mode palettes
- 10 pre-designed Dark Mode palettes
- Live preview of colors
- Click to apply instantly
- Copy CSS code to clipboard
- Reset to default

**Available Palettes:**

**Light Mode:**
1. Classic Light (Current) - Clean white with subtle grays
2. Warm Cream - Soft cream backgrounds
3. Cool Blue - Professional blue-tinted
4. Soft Purple - Elegant purple workspace
5. Mint Fresh - Refreshing green tones
6. Monochrome Light - Pure grayscale
7. Sunset Orange - Energetic orange
8. Rose Garden - Soft pink elegance
9. Ocean Breeze - Calm teal/cyan
10. Lavender Dream - Soft lavender

**Dark Mode:**
1. Pure Black (Current) - Deep black with grays
2. Slate Gray - Professional slate
3. Midnight Blue - Deep blue darkness
4. Forest Night - Dark green ambiance
5. Purple Haze - Rich purple darkness
6. Charcoal - Warm charcoal tones
7. Deep Ocean - Dark teal depths
8. Crimson Night - Dark red ambiance
9. Amber Glow - Warm amber darkness
10. Monochrome Dark - Pure grayscale

---

## 🔄 How to Change Colors

### **Method 1: Using the Tester (Recommended)**

1. Navigate to `/test` in your browser
2. Toggle between Light/Dark mode
3. Click on any palette to preview it
4. Check the live preview at the top
5. Click "Copy CSS Code" button
6. Open `client/src/index.css`
7. Replace the values in `:root` (for light) or `.dark` (for dark)
8. Save and refresh

### **Method 2: Manual Editing**

1. Open `client/src/index.css`
2. Find the `:root` section (for light mode) or `.dark` section (for dark mode)
3. Change the hex color values
4. Save the file
5. The app will hot-reload with new colors

**Example:**
```css
/* Change primary color from indigo to green */
:root {
  --color-primary: #10b981;      /* was #6366f1 */
  --color-primary-hover: #059669; /* was #4f46e5 */
}
```

---

## 💡 Best Practices

### **1. Always Use CSS Variables**
❌ Bad:
```jsx
<div className="bg-gray-900">
```

✅ Good:
```jsx
<div style={{ backgroundColor: 'var(--color-bg-primary)' }}>
```

### **2. Maintain Contrast Ratios**
- Text on background: Minimum 4.5:1 ratio
- Large text: Minimum 3:1 ratio
- Use tools like [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)

### **3. Test Both Themes**
- Always test changes in both light and dark modes
- Use the theme toggle to switch quickly
- Check all pages and components

### **4. Consistent Naming**
- Background colors: `bg-*`
- Text colors: `text-*`
- Border colors: `border-*`
- Brand colors: `primary`, `accent`

### **5. Use Semantic Variables**
- Don't use color names in variable names (e.g., `--color-blue-500`)
- Use purpose-based names (e.g., `--color-primary`, `--color-bg-secondary`)
- This makes theme changes easier

---

## 🐛 Troubleshooting

### **Colors Not Updating**

1. **Hard refresh:** Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
2. **Clear cache:** Clear browser cache and reload
3. **Check CSS:** Ensure CSS variables are defined in `index.css`
4. **Check class:** Ensure `.dark` class is on `<html>` element

### **Theme Not Persisting**

1. **Check localStorage:** Open DevTools → Application → Local Storage
2. **Look for:** `theme` key with value `"light"` or `"dark"`
3. **Clear and retry:** Delete the key and toggle theme again

### **Inconsistent Colors**

1. **Hardcoded colors:** Search for hardcoded Tailwind classes like `bg-gray-900`
2. **Replace with:** CSS variables or theme-aware classes
3. **Use grep:** Search for `bg-gray-`, `text-gray-`, `border-gray-` in your codebase

---

## 📚 Additional Resources

- **Tailwind CSS 4 Docs:** [https://tailwindcss.com/docs](https://tailwindcss.com/docs)
- **CSS Variables Guide:** [MDN Web Docs](https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties)
- **Color Palette Generator:** [Coolors.co](https://coolors.co/)
- **Contrast Checker:** [WebAIM](https://webaim.org/resources/contrastchecker/)

---

## 🎨 Quick Reference

### **Common Patterns**

**Card with theme-aware colors:**
```jsx
<div style={{
  backgroundColor: 'var(--color-bg-secondary)',
  borderColor: 'var(--color-border-default)',
  color: 'var(--color-text-primary)'
}} className="p-6 rounded-lg border">
  <h3 style={{ color: 'var(--color-text-primary)' }}>Title</h3>
  <p style={{ color: 'var(--color-text-secondary)' }}>Description</p>
</div>
```

**Button with hover:**
```jsx
<button
  style={{ backgroundColor: 'var(--color-primary)' }}
  onMouseEnter={(e) => {
    e.currentTarget.style.backgroundColor = 'var(--color-primary-hover)';
  }}
  onMouseLeave={(e) => {
    e.currentTarget.style.backgroundColor = 'var(--color-primary)';
  }}
>
  Click Me
</button>
```

**Input field:**
```jsx
<input
  style={{
    backgroundColor: 'var(--color-bg-tertiary)',
    borderColor: 'var(--color-border-default)',
    color: 'var(--color-text-primary)'
  }}
  className="px-4 py-2 rounded-lg border"
  placeholder="Enter text..."
/>
```

---

**Last Updated:** November 22, 2025
**Version:** 1.0.0

