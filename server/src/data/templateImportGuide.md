# Template Import Guide

This guide explains how to import templates from your Word document into the database.

## Template Data Format

Templates should be provided in JSON format. Each template should follow this structure:

```json
{
  "name": "Template Name",
  "description": "Brief description of what this template is for",
  "icon": "📁",
  "color": "#6366f1",
  "category": "PROFESSIONAL",  // or "PERSONAL"
  "tags": ["tag1", "tag2", "tag3"],  // Optional, for future use
  "tasks": [
    {
      "title": "Task title",
      "description": "Optional task description",
      "priority": "MEDIUM"  // LOW, MEDIUM, HIGH, or URGENT
    },
    {
      "title": "Another task",
      "priority": "HIGH"
    }
  ]
}
```

## Required Fields

- **name**: Template name (string, required)
- **category**: Either "PERSONAL" or "PROFESSIONAL" (required)
- **tasks**: Array of task objects (required, at least one task)
  - **title**: Task title (required)
  - **description**: Optional task description
  - **priority**: One of "LOW", "MEDIUM", "HIGH", "URGENT" (default: "MEDIUM")

## Optional Fields

- **description**: Template description
- **icon**: Emoji icon (default: "📁")
- **color**: Hex color code (default: "#6366f1")
- **tags**: Array of tag strings (for future search functionality)

## Example Templates

### Professional Template
```json
{
  "name": "Website Redesign",
  "description": "Complete website redesign project",
  "icon": "🎨",
  "color": "#8b5cf6",
  "category": "PROFESSIONAL",
  "tags": ["web", "design", "development"],
  "tasks": [
    {
      "title": "Gather requirements",
      "description": "Meet with stakeholders to understand needs",
      "priority": "HIGH"
    },
    {
      "title": "Create wireframes",
      "priority": "HIGH"
    },
    {
      "title": "Design mockups",
      "priority": "MEDIUM"
    }
  ]
}
```

### Personal Template
```json
{
  "name": "Home Renovation",
  "description": "Plan and execute home renovation",
  "icon": "🏠",
  "color": "#10b981",
  "category": "PERSONAL",
  "tags": ["home", "renovation"],
  "tasks": [
    {
      "title": "Get quotes from contractors",
      "priority": "HIGH"
    },
    {
      "title": "Choose materials",
      "priority": "MEDIUM"
    }
  ]
}
```

## Import Process

1. Convert your Word document data to JSON format following the structure above
2. Create two files:
   - `server/src/data/templates/personal.json` - Array of personal templates
   - `server/src/data/templates/professional.json` - Array of professional templates

3. Each file should contain an array of templates:
```json
[
  {
    "name": "Template 1",
    ...
  },
  {
    "name": "Template 2",
    ...
  }
]
```

4. Run the import script (to be created):
```bash
node server/src/data/seedTemplates.js
```

## Notes

- All templates will be marked as `isSystemTemplate: true`
- Templates will be associated with a system company (or the first company in the database)
- Task priorities default to "MEDIUM" if not specified
- Icons should be single emoji characters
- Colors should be valid hex codes (e.g., "#6366f1")

