# Task Manager Desktop - Development Guide

## Local Development Setup

To test the Electron app with your local changes, you need to run both the backend and frontend locally.

### Step 1: Start the Backend Server

```bash
# In the root directory
cd server
npm install
npm start
```

The server should run on `http://localhost:3000`

### Step 2: Start the Frontend Client

```bash
# In the root directory  
cd client
npm install
npm run dev
```

The client should run on `http://localhost:5173`

### Step 3: Start the Electron App

```bash
# In the desktop directory
cd desktop
npm install
npm run dev
```

The Electron app will load `http://localhost:5173` (your local frontend) instead of the deployed version.

## Testing the Taskbar Functionality

1. **Start all three services** (server, client, electron)
2. **Copy some text** (like from an email)
3. **Right-click the taskbar icon** in the Electron app
4. **Select "🆕 Create Task"**
5. **Check the console** (F12 in the Electron app) for debug logs
6. **Verify the modal opens** with your clipboard content prefilled

## Environment Variables

The app automatically detects the environment:
- **Development**: Uses `http://localhost:5173` (local frontend)
- **Production**: Uses `https://abdalitechnologies.com` (deployed frontend)

You can override this with the `APP_URL` environment variable:

```bash
# Use custom URL
APP_URL=http://localhost:3000 npm run dev

# Use production URL in development
APP_URL=https://abdalitechnologies.com npm run dev
```

## Debugging

- **Electron Console**: Press F12 in the Electron app to see console logs
- **Main Process Logs**: Check the terminal where you ran `npm run dev`
- **Web App Logs**: Check the browser console in the Electron app

## Building for Production

```bash
# Build the Electron app
npm run build

# The installer will be created in the dist/ folder
```

## Troubleshooting

### Taskbar Menu Not Appearing
- Make sure you're right-clicking the **taskbar icon**, not the system tray
- The menu should appear when you right-click the app icon in the Windows taskbar

### Modal Not Opening
- Check the console logs for any errors
- Ensure the web app is fully loaded and authenticated
- Try copying text and clicking the taskbar menu again

### Clipboard Content Not Appearing
- Make sure you've copied text before clicking the taskbar menu
- Check that the clipboard content is being read correctly in the console logs
