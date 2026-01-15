# Server Scripts

This directory contains utility scripts for managing the Tialz Task Manager database.

## Available Scripts

### `deleteCompanyTasks.js`
**Purpose:** Delete all tasks for a specific company while preserving users and other data.

**Usage:**
```bash
cd server
npm run delete:company-tasks
```

**What it does:**
- Finds the company named "Farouq's Company"
- Shows statistics (users, tasks, projects) before deletion
- Lists sample tasks that will be deleted
- Permanently deletes all tasks for that company
- Cleans up related comments and audit logs
- Preserves all users, projects, and other company data

**Safety features:**
- Shows detailed preview of what will be deleted
- Requires exact company name match
- Shows company statistics before/after
- Provides clear warnings about data loss
- Graceful error handling

**Warning:** This action is irreversible. Make sure to backup your database before running this script.

### Other Scripts

- `cleanupOrphanedTasks.js` - Clean up tasks without project associations (DISABLED)
- `cleanupOrphanedTasksInteractive.js` - Interactive version of cleanup (DISABLED)
- `updateGoogleAccountsToSysdmin.js` - Update Google account roles

## Environment Setup

All scripts automatically load environment variables from `../.env` file. Make sure your `.env` file contains the correct `DATABASE_URL`.

## Running Scripts

From the server directory:
```bash
npm run <script-name>
```

Or directly:
```bash
node scripts/<script-file>.js
```