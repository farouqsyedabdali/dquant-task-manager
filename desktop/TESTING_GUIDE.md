# Task Manager Desktop - Testing Guide

## The Problem You're Experiencing

The issue you're seeing (Electron opening a new window with the default Electron page) happens because:

1. **Jump List Actions**: When you click jump list items, Windows launches a new instance of the app with command line arguments
2. **Single Instance Lock**: The app should prevent multiple instances, but jump list actions might bypass this
3. **URL Loading**: The app might be failing to load the localhost URL and falling back to the default Electron page

## Comprehensive Debugging Setup

I've added extensive debugging to help identify the exact issue:

### Desktop App Debugging
- **Instance ID**: Each app instance gets a unique ID
- **Process ID**: Track which process is handling what
- **Command Line Args**: See exactly what arguments are passed
- **Window State**: Track if windows exist, are destroyed, etc.
- **URL Loading**: Monitor if the URL loads successfully

### Server Debugging
- **Startup Info**: Process ID, working directory, NODE_ENV
- **Connection Logs**: Track incoming requests

## Testing Steps

### 1. Start All Services

**Terminal 1 - Server:**
```bash
cd server
npm start
```
*Look for: 🚀 Task Manager Server Starting...*

**Terminal 2 - Client:**
```bash
cd client
npm run dev
```
*Should show Vite dev server starting*

**Terminal 3 - Desktop:**
```bash
cd desktop
npm run dev
```
*Look for: 🚀 Electron app starting... with Instance ID*

### 2. Test the Functionality

1. **Copy some text** (like from an email)
2. **Right-click the taskbar icon** in the Electron app
3. **Select "🆕 Create Task"** from the context menu
4. **Watch the terminal** for debug messages

### 3. Debug Messages to Look For

**When clicking Create Task, you should see:**
```
🆕 Create Task clicked from application menu
🔍 Main window exists: true/false
🔍 Main window is destroyed: true/false
🎯 handleTaskbarAction called with action: create-task
🪟 Main window exists, focusing and sending action...
🪟 Window focused
📋 Clipboard content: [your copied text]
📤 Sending taskbar action immediately: create-task
```

**In the web app console (F12), you should see:**
```
Setting up taskbar action listener
Received taskbar action in App: {action: 'create-task', clipboardText: '...'}
Dashboard: Handling taskbar action: {action: 'create-task', clipboardText: '...'}
Dashboard: Opening create task modal with data: [your text]
```

## Troubleshooting

### Issue 1: New Electron Window Opens
**Cause**: Jump list is launching a new instance instead of using existing one
**Solution**: The single instance lock should prevent this, but if it's not working:
- Check if you see "❌ Another instance is already running, quitting..."
- If not, the single instance lock isn't working properly

### Issue 2: Default Electron Page Shows
**Cause**: The app can't load the localhost URL
**Solution**: 
- Make sure the client is running on http://localhost:5173
- Check the terminal for "❌ Failed to load URL" messages
- The app will retry loading after 3 seconds

### Issue 3: Modal Doesn't Open
**Cause**: The web app isn't receiving the taskbar action
**Solution**:
- Check if you see "Received taskbar action in App" in the web console
- Check if you see "Dashboard: Handling taskbar action" in the web console
- The app has fallback mechanisms that retry after 2 and 5 seconds

## Alternative Testing Approach

If the jump list isn't working, try this approach:

1. **Use the Application Menu**: Right-click the taskbar icon and use the context menu items
2. **Test with Browser**: Open http://localhost:5173 in your browser and test the functionality there first
3. **Check Network**: Make sure the Electron app can reach the localhost server

## Expected Behavior

- ✅ **Single Window**: Only one Electron window should exist
- ✅ **Context Menu**: Right-clicking taskbar icon should show the custom menu
- ✅ **Modal Opens**: Create task modal should open with clipboard content
- ✅ **No New Windows**: Jump list actions should use existing window, not create new ones

## If Nothing Works

1. **Deploy to Production**: Test with the deployed version to see if it's a localhost issue
2. **Check Windows Version**: Some Windows versions have jump list limitations
3. **Try Different Approach**: We can implement a different method if jump lists don't work reliably
