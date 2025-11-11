# Dark/Light Mode Implementation Plan

## Overview
Implement a comprehensive dark/light mode system for Tialz Task Manager using Tailwind CSS v4's new approach with CSS variables and theme switching.

## Current State
- **Tailwind Version**: v4.1.8 (new architecture)
- **Current Theme**: Dark mode only (dark blue/purple)
- **Color Usage**: Hardcoded Tailwind classes (`bg-gray-800`, `text-gray-300`, `bg-indigo-600`, etc.)
- **Custom CSS**: Status/priority badges, scrollbars, and some CSS variables exist

## Tailwind v4 Approach
Tailwind v4 uses:
- **CSS Variables** for theme colors
- **@theme directive** in CSS (instead of tailwind.config.js)
- **Class-based or data-attribute** switching (`dark` class or `data-theme`)
- **CSS custom properties** that map to Tailwind utilities

---

## Implementation Strategy

### Phase 1: Setup Theme System Foundation

#### 1.1 Create Theme Store (Zustand)
**File**: `client/src/stores/themeStore.js`
- Store current theme (`dark` | `light`)
- Persist to localStorage
- Provide toggle function
- Detect system preference on first load

#### 1.2 Update CSS with Theme Variables
**File**: `client/src/index.css` or `client/src/App.css`
- Define CSS variables for both themes
- Use `:root` for light mode
- Use `.dark` class or `[data-theme="dark"]` for dark mode
- Map variables to Tailwind utilities using `@theme` directive

#### 1.3 Create Theme Toggle Component
**File**: `client/src/components/common/ThemeToggle.jsx`
- Toggle button with sun/moon icons
- Accessible (ARIA labels)
- Smooth transitions

---

### Phase 2: Define Color Palette

#### 2.1 Color Structure
```css
/* Light Mode Colors */
--bg-primary: #ffffff
--bg-secondary: #f9fafb
--bg-tertiary: #f3f4f6
--text-primary: #111827
--text-secondary: #6b7280
--text-tertiary: #9ca3af
--border: #e5e7eb
--primary: #6366f1 (indigo)
--primary-hover: #4f46e5
--accent: #8b5cf6 (purple)

/* Dark Mode Colors */
--bg-primary: #111827 (gray-900)
--bg-secondary: #1f2937 (gray-800)
--bg-tertiary: #374151 (gray-700)
--text-primary: #ffffff
--text-secondary: #d1d5db (gray-300)
--text-tertiary: #9ca3af (gray-400)
--border: #374151 (gray-700)
--primary: #6366f1 (indigo)
--primary-hover: #818cf8
--accent: #a78bfa (purple)
```

#### 2.2 Status & Priority Colors (Theme-Aware)
- Keep semantic colors but adjust brightness for light mode
- Use CSS variables for status/priority badges

---

### Phase 3: Update Components

#### 3.1 Replace Hardcoded Colors
**Pattern**: Replace `bg-gray-800` → `bg-surface`, `text-gray-300` → `text-secondary`

**Key Replacements**:
- `bg-gray-900` → `bg-primary` (main background)
- `bg-gray-800` → `bg-secondary` (cards, modals)
- `bg-gray-700` → `bg-tertiary` (inputs, dropdowns)
- `text-white` → `text-primary`
- `text-gray-300` → `text-secondary`
- `text-gray-400` → `text-tertiary`
- `border-gray-700` → `border-default`
- `bg-indigo-600` → `bg-primary` (buttons)
- `bg-indigo-700` → `bg-primary-hover`

#### 3.2 Components to Update (Priority Order)
1. **App.jsx** - Root background
2. **Header.jsx** - Navigation bar
3. **Dashboard.jsx** - Main page
4. **TaskCard.jsx** - Task cards
5. **TaskModal.jsx** - Task modals
6. **AddTaskModal.jsx** - Form modals
7. **TaskFilters.jsx** - Filter components
8. **CommentSection.jsx** - Comments
9. **All other components** - Systematic replacement

---

### Phase 4: Custom CSS Updates

#### 4.1 Status/Priority Badges
- Convert to use CSS variables
- Ensure contrast in both themes

#### 4.2 Scrollbars
- Theme-aware scrollbar colors
- Light mode: lighter grays
- Dark mode: current dark colors

#### 4.3 Modals & Overlays
- Backdrop colors for both themes
- Modal backgrounds

---

## Technical Implementation Details

### CSS Variable Structure (Tailwind v4)

```css
@theme {
  /* Light Mode (default) */
  --color-bg-primary: #ffffff;
  --color-bg-secondary: #f9fafb;
  --color-bg-tertiary: #f3f4f6;
  --color-text-primary: #111827;
  --color-text-secondary: #6b7280;
  --color-text-tertiary: #9ca3af;
  --color-border: #e5e7eb;
  --color-primary: #6366f1;
  --color-primary-hover: #4f46e5;
  
  /* Map to Tailwind utilities */
  --color-surface: var(--color-bg-secondary);
  --color-surface-hover: var(--color-bg-tertiary);
}

/* Dark Mode */
.dark {
  --color-bg-primary: #111827;
  --color-bg-secondary: #1f2937;
  --color-bg-tertiary: #374151;
  --color-text-primary: #ffffff;
  --color-text-secondary: #d1d5db;
  --color-text-tertiary: #9ca3af;
  --color-border: #374151;
  --color-primary: #6366f1;
  --color-primary-hover: #818cf8;
}
```

### Theme Store Structure

```javascript
{
  theme: 'dark' | 'light',
  toggleTheme: () => void,
  setTheme: (theme: 'dark' | 'light') => void,
  isDark: boolean
}
```

### Theme Toggle Component

- Icon: Sun (light mode) / Moon (dark mode)
- Placement: Header (next to profile dropdown)
- Animation: Smooth icon transition
- Persistence: localStorage

---

## Color Mapping Reference

### Background Colors
| Current (Dark) | New Variable | Light Mode | Dark Mode |
|---------------|--------------|------------|-----------|
| `bg-gray-900` | `bg-primary` | `#ffffff` | `#111827` |
| `bg-gray-800` | `bg-secondary` | `#f9fafb` | `#1f2937` |
| `bg-gray-700` | `bg-tertiary` | `#f3f4f6` | `#374151` |
| `bg-gray-600` | `bg-quaternary` | `#e5e7eb` | `#4b5563` |

### Text Colors
| Current (Dark) | New Variable | Light Mode | Dark Mode |
|---------------|--------------|------------|-----------|
| `text-white` | `text-primary` | `#111827` | `#ffffff` |
| `text-gray-300` | `text-secondary` | `#6b7280` | `#d1d5db` |
| `text-gray-400` | `text-tertiary` | `#9ca3af` | `#9ca3af` |
| `text-gray-500` | `text-muted` | `#6b7280` | `#6b7280` |

### Border Colors
| Current (Dark) | New Variable | Light Mode | Dark Mode |
|---------------|--------------|------------|-----------|
| `border-gray-700` | `border-default` | `#e5e7eb` | `#374151` |
| `border-gray-600` | `border-light` | `#d1d5db` | `#4b5563` |

### Primary Colors (Indigo)
| Current | New Variable | Light Mode | Dark Mode |
|---------|--------------|------------|-----------|
| `bg-indigo-600` | `bg-primary` | `#6366f1` | `#6366f1` |
| `bg-indigo-700` | `bg-primary-hover` | `#4f46e5` | `#818cf8` |
| `text-indigo-400` | `text-primary` | `#818cf8` | `#a78bfa` |

---

## Implementation Steps

### Step 1: Create Theme Infrastructure
1. ✅ Create `themeStore.js` with Zustand
2. ✅ Update `index.css` with theme variables
3. ✅ Create `ThemeToggle.jsx` component
4. ✅ Add theme toggle to Header

### Step 2: Update Core Components
1. ✅ Update `App.jsx` root background
2. ✅ Update `Header.jsx` navigation
3. ✅ Update `Dashboard.jsx` main layout
4. ✅ Update status/priority badge CSS

### Step 3: Update Task Components
1. ✅ Update `TaskCard.jsx`
2. ✅ Update `TaskModal.jsx`
3. ✅ Update `AddTaskModal.jsx`
4. ✅ Update `TaskFilters.jsx`
5. ✅ Update `TaskList.jsx` / `TaskTable.jsx`

### Step 4: Update Other Components
1. ✅ Update `CommentSection.jsx`
2. ✅ Update `NotificationBoard.jsx`
3. ✅ Update all modals
4. ✅ Update form components
5. ✅ Update settings pages

### Step 5: Polish & Testing
1. ✅ Test theme switching
2. ✅ Verify contrast ratios
3. ✅ Test persistence
4. ✅ Fix any color inconsistencies
5. ✅ Add smooth transitions

---

## Considerations

### Accessibility
- **Contrast Ratios**: Ensure WCAG AA compliance in both themes
- **Focus States**: Visible in both themes
- **Status Colors**: Maintain semantic meaning

### Performance
- CSS variables are performant
- No runtime color calculations needed
- Smooth transitions with CSS

### User Experience
- **System Preference**: Detect and respect OS theme
- **Persistence**: Remember user choice
- **Smooth Transitions**: Animate theme changes
- **Visual Feedback**: Clear toggle button state

### DaisyUI Compatibility
- DaisyUI works with Tailwind v4
- May need to configure DaisyUI themes
- Test all DaisyUI components in both themes

---

## Testing Checklist

- [ ] Theme toggle works
- [ ] Theme persists on page reload
- [ ] System preference detection works
- [ ] All components render correctly in light mode
- [ ] All components render correctly in dark mode
- [ ] Status/priority badges visible in both themes
- [ ] Forms are readable in both themes
- [ ] Modals have proper contrast
- [ ] Icons are visible in both themes
- [ ] Scrollbars are visible in both themes
- [ ] No color flashes on initial load
- [ ] Smooth transitions between themes

---

## Files to Create/Modify

### New Files
1. `client/src/stores/themeStore.js` - Theme state management
2. `client/src/components/common/ThemeToggle.jsx` - Toggle component
3. `THEME_IMPLEMENTATION_PLAN.md` - This file

### Files to Modify
1. `client/src/index.css` - Add theme variables
2. `client/src/App.css` - Update custom classes
3. `client/src/App.jsx` - Apply theme class
4. `client/src/components/layout/Header.jsx` - Add toggle button
5. All component files - Replace hardcoded colors

---

## Estimated Effort

- **Phase 1** (Foundation): 2-3 hours
- **Phase 2** (Color System): 1-2 hours
- **Phase 3** (Component Updates): 4-6 hours
- **Phase 4** (Polish): 1-2 hours
- **Total**: ~8-13 hours

---

## Next Steps

1. Review and approve this plan
2. Start with Phase 1 (Theme infrastructure)
3. Test incrementally as we go
4. Get feedback on light mode colors
5. Iterate and refine

