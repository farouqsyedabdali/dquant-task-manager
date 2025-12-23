# Changelog Update - Version 0.0.6

## Changes Made

### 1. Version Number Updated
- **About Section**: Updated from `v0.0.5` to `v0.0.6`
- **Location**: Settings → About

### 2. New Version 0.0.6 Added
**Release Date**: December 23, 2024

#### ✨ New Features
- Project management system with templates
- Project templates for reusable workflows
- Task hierarchy visualization in modal
- Tabbed interface in Task Modal (Team & Sharing / Task Hierarchy)
- Side-by-side parent task and subtasks view
- Project member management with roles
- Draft tasks for project planning
- Task sending and reassignment within projects

#### 🔧 Improvements
- Reorganized Task Modal with cleaner layout
- Better visual hierarchy for task relationships
- Improved space utilization in modals
- Enhanced empty states with helpful messages
- Smooth tab transitions with animations
- Aligned headers and content in hierarchy view

#### 🎨 UI/UX
- Cleaner tab design without badge counters
- Better visual separation between sections
- Improved scrollable subtask lists
- Icon-based navigation for tabs

### 3. Date Corrections
- **v0.0.5**: Changed from "January 22, 2025" to "October 22, 2024"
- **v0.0.3**: Changed from "October 2, 2025" to "October 2, 2024"
- **v0.0.2**: Changed from "September 2025" to "September 2024"
- **v0.0.1**: Changed from "August 2025" to "August 2024"

### 4. "View More" Feature Added
- Changelog now shows only the **last 3 versions** by default (0.0.6, 0.0.5, 0.0.3)
- **"View Older Versions"** button reveals versions 0.0.2 and 0.0.1
- **"Hide Older Versions"** button to collapse older versions
- Smooth toggle functionality with icons

### 5. Visual Improvements
- Version 0.0.6: Green border (latest)
- Version 0.0.5: Blue border
- Version 0.0.3: Gray border
- Older versions (0.0.2, 0.0.1): Gray border (hidden by default)

## Changelog Structure

```
Changelog Modal
├── v0.0.6 (Latest - Green border) ← NEW
├── v0.0.5 (Blue border)
├── v0.0.3 (Gray border)
├── [View Older Versions Button] ← NEW
└── (Hidden by default)
    ├── v0.0.2 (Gray border)
    ├── v0.0.1 (Gray border)
    └── [Hide Older Versions Button] ← NEW
```

## User Experience

### Before
- All 5 versions visible at once
- Long scrolling required
- Cluttered view
- Incorrect dates (2025 instead of 2024)

### After
- Only 3 most recent versions shown initially
- Clean, focused view
- "View More" for historical versions
- Correct dates (2024)
- Smooth expand/collapse functionality

## Files Modified
- `client/src/pages/Settings.jsx`

## Testing Checklist
- [ ] Version number shows as 0.0.6 in About section
- [ ] Changelog opens with 3 versions visible (0.0.6, 0.0.5, 0.0.3)
- [ ] "View Older Versions" button appears
- [ ] Clicking button reveals 0.0.2 and 0.0.1
- [ ] "Hide Older Versions" button appears after expanding
- [ ] Clicking hide button collapses older versions
- [ ] All dates are correct (2024, not 2025)
- [ ] Version 0.0.6 content is accurate and complete
- [ ] Border colors are correct (green for latest, blue for 0.0.5, gray for others)

## Future Enhancements (Optional)
1. Add animation for expand/collapse
2. Add version search/filter
3. Add "What's New" badge on first view
4. Add direct links to specific features
5. Add download links for each version (if applicable)

