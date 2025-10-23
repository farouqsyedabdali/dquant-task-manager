const { app, BrowserWindow, shell, Menu, clipboard } = require('electron');
const path = require('path');
const { autoUpdater } = require('electron-updater');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// For local testing, use localhost. For production, use the deployed URL
const APP_URL = process.env.APP_URL || (process.env.NODE_ENV === 'development' ? 'http://localhost:5173' : 'https://abdalitechnologies.com');

// Generate unique instance ID for debugging
const instanceId = Math.random().toString(36).substr(2, 9);
console.log('🚀 Electron app starting...');
console.log('🆔 Instance ID:', instanceId);
console.log('📍 APP_URL:', APP_URL);
console.log('🔧 NODE_ENV:', process.env.NODE_ENV);
console.log('📁 __dirname:', __dirname);
console.log('📋 Command line args:', process.argv);
console.log('🔍 Process ID:', process.pid);
console.log('🔍 Process title:', process.title);
console.log('🔍 Current working directory:', process.cwd());

let mainWindow;

function createWindow() {
  console.log('🪟 Creating main window... [Instance:', instanceId + ']');
  
  // Prevent creating multiple windows
  if (mainWindow && !mainWindow.isDestroyed()) {
    console.log('⚠️ Main window already exists, focusing instead of creating new one [Instance:', instanceId + ']');
    mainWindow.focus();
    return;
  }
  
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 640,
    backgroundColor: '#111827',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, '..', 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true
    }
  });

  console.log('🪟 Window created, loading URL:', APP_URL);

  mainWindow.once('ready-to-show', () => {
    console.log('🪟 Window ready to show');
    mainWindow.show();
  });

  // Load hosted web app
  console.log('🌐 Attempting to load URL:', APP_URL);
  mainWindow.loadURL(APP_URL).catch(err => {
    console.error('❌ Failed to load URL:', err);
    console.log('💡 Make sure the frontend is running on http://localhost:5173');
    console.log('🔄 Retrying in 3 seconds...');
    
    // Retry loading after a delay
    setTimeout(() => {
      console.log('🔄 Retrying to load URL...');
      mainWindow.loadURL(APP_URL).catch(retryErr => {
        console.error('❌ Retry failed:', retryErr);
        console.log('💡 Please start the frontend with: cd client && npm run dev');
        console.log('ℹ️ App will continue running for taskbar functionality');
      });
    }, 3000);
  });

  // Open external links in default browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    console.log('🔗 Opening external link:', url);
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // Security: disable devtools in production
  if (process.env.NODE_ENV === 'production') {
    mainWindow.webContents.on('devtools-opened', () => {
      mainWindow.webContents.closeDevTools();
    });
  }

  // Set up taskbar context menu
  console.log('🎯 Setting up taskbar context menu...');
  setupTaskbarContextMenu();
  
  // Handle window close
  mainWindow.on('closed', () => {
    console.log('🪟 Main window closed');
    console.log('ℹ️ Window closed, but keeping app running for taskbar functionality');
    mainWindow = null;
  });
}

// Function to set up the taskbar context menu
function setupTaskbarContextMenu() {
  console.log('🎯 Setting up taskbar context menu for platform:', process.platform);
  
  if (process.platform === 'win32') {
    console.log('🪟 Setting up Windows-specific taskbar menu...');
    
    // Set up the application menu (this creates the taskbar context menu on Windows)
    const template = [
      {
        label: '🆕 Create Task',
        click: () => {
          console.log('🆕 Create Task clicked from application menu');
          console.log('🔍 Main window exists:', !!mainWindow);
          console.log('🔍 Main window is destroyed:', mainWindow ? mainWindow.isDestroyed() : 'N/A');
          handleTaskbarAction('create-task');
        }
      },
      {
        label: '📝 Update Task',
        click: () => {
          console.log('📝 Update Task clicked from application menu');
          handleTaskbarAction('update-task');
        }
      },
      {
        label: '➕ Add Subtask',
        click: () => {
          console.log('➕ Add Subtask clicked from application menu');
          handleTaskbarAction('add-subtask');
        }
      },
      { type: 'separator' },
      {
        label: '📋 Show Task Manager',
        click: () => {
          console.log('📋 Show Task Manager clicked from application menu');
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
          }
        }
      }
    ];

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
    console.log('✅ Application menu set');
    
    // Set up jump list for Windows taskbar
    app.setJumpList([
      {
        type: 'custom',
        name: 'Quick Actions',
        items: [
          {
            type: 'task',
            title: 'Create Task',
            description: 'Create a new task',
            program: process.execPath,
            args: '--create-task',
            iconPath: path.join(__dirname, '..', 'main', 'icon.ico'),
            iconIndex: 0
          },
          {
            type: 'task',
            title: 'Update Task',
            description: 'Update an existing task',
            program: process.execPath,
            args: '--update-task',
            iconPath: path.join(__dirname, '..', 'main', 'icon.ico'),
            iconIndex: 0
          },
          {
            type: 'task',
            title: 'Add Subtask',
            description: 'Add a subtask',
            program: process.execPath,
            args: '--add-subtask',
            iconPath: path.join(__dirname, '..', 'main', 'icon.ico'),
            iconIndex: 0
          }
        ]
      }
    ]);
    console.log('✅ Jump list set');
  } else {
    console.log('ℹ️ Non-Windows platform, skipping taskbar menu setup');
  }
}

// Function to handle taskbar actions
function handleTaskbarAction(action) {
  console.log('🎯 handleTaskbarAction called with action:', action);
  console.log('🔍 Main window exists:', !!mainWindow);
  console.log('🔍 Main window is destroyed:', mainWindow ? mainWindow.isDestroyed() : 'N/A');
  console.log('🔍 Current process ID:', process.pid);
  
  if (!mainWindow || mainWindow.isDestroyed()) {
    console.log('🪟 No main window exists or window is destroyed, creating new window...');
    createWindow();
    // Wait for window to be ready before sending message
    mainWindow.webContents.once('did-finish-load', () => {
      console.log('🪟 Window loaded, waiting for web app to be ready...');
      // Add extra delay to ensure the web app is fully loaded and user is authenticated
      setTimeout(() => {
        const clipboardText = clipboard.readText();
        console.log('📋 Sending taskbar action to new window:', action, 'with clipboard:', clipboardText);
        mainWindow.webContents.send('taskbar-action', {
          action: action,
          clipboardText: clipboardText
        });
      }, 3000); // 3 second delay to ensure web app is ready
    });
    return;
  }

  console.log('🪟 Main window exists, focusing and sending action...');
  
  // Ensure window is visible and focused
  if (mainWindow.isMinimized()) {
    console.log('🪟 Window was minimized, restoring...');
    mainWindow.restore();
  }
  mainWindow.focus();
  console.log('🪟 Window focused');

  // Get clipboard content for prefilling
  const clipboardText = clipboard.readText();
  console.log('📋 Clipboard content:', clipboardText);
  
  // Send message to renderer process with the action and clipboard data
  // Wait for the page to be ready if it's still loading
  if (mainWindow.webContents.isLoading()) {
    console.log('⏳ Page is still loading, waiting for did-finish-load...');
    mainWindow.webContents.once('did-finish-load', () => {
      console.log('✅ Page finished loading, sending action...');
      // Add delay to ensure web app is ready
      setTimeout(() => {
        console.log('📤 Sending taskbar action after page load:', action);
        mainWindow.webContents.send('taskbar-action', {
          action: action,
          clipboardText: clipboardText
        });
      }, 2000);
    });
  } else {
    console.log('✅ Page already loaded, sending action immediately...');
    // Add delay even if page is loaded to ensure web app is ready
    setTimeout(() => {
      console.log('📤 Sending taskbar action immediately:', action);
      mainWindow.webContents.send('taskbar-action', {
        action: action,
        clipboardText: clipboardText
      });
    }, 2000);
  }
  
  // Add a fallback mechanism - try again after a longer delay
  setTimeout(() => {
    console.log('🔄 Fallback: Sending taskbar action again:', action);
    mainWindow.webContents.send('taskbar-action', {
      action: action,
      clipboardText: clipboardText
    });
  }, 5000);
}

// Set up single instance lock BEFORE any other app setup
console.log('🔒 Requesting single instance lock... [Instance:', instanceId + ']');
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  console.log('❌ Another instance is already running, quitting... [Instance:', instanceId + ']');
  console.log('ℹ️ This prevents duplicate windows - use the existing app instead');
  console.log('🔍 Current process will exit now');
  app.quit();
} else {
  console.log('✅ Got single instance lock, setting up app... [Instance:', instanceId + ']');
  console.log('ℹ️ Only one instance will be allowed');
  console.log('🔍 Process ID that got the lock:', process.pid);
  
  // Set up second instance handler BEFORE app.whenReady()
  app.on('second-instance', (event, commandLine, workingDirectory) => {
    console.log('🔄 Second instance detected!');
    console.log('📋 Command line:', commandLine);
    console.log('📁 Working directory:', workingDirectory);
    console.log('🔍 Second instance process ID:', process.pid);
    console.log('🔍 Main window exists:', !!mainWindow);
    
    // Handle jump list actions from second instance
    if (commandLine.includes('--create-task')) {
      console.log('🆕 Jump list: Create Task action detected');
      handleTaskbarAction('create-task');
    } else if (commandLine.includes('--update-task')) {
      console.log('📝 Jump list: Update Task action detected');
      handleTaskbarAction('update-task');
    } else if (commandLine.includes('--add-subtask')) {
      console.log('➕ Jump list: Add Subtask action detected');
      handleTaskbarAction('add-subtask');
    } else {
      // Regular second instance - just focus the window
      console.log('🔄 Focusing existing window');
      if (mainWindow) {
        if (mainWindow.isMinimized()) {
          console.log('🔄 Window was minimized, restoring...');
          mainWindow.restore();
        }
        console.log('🔄 Focusing window...');
        mainWindow.focus();
      } else {
        console.log('⚠️ Main window not found, creating new one...');
        createWindow();
      }
    }
  });

  // Set up app ready handler
  app.whenReady().then(() => {
    console.log('🚀 App is ready, creating window...');
    createWindow();
    
    // Check for command line arguments on first launch
    const args = process.argv.slice(1);
    if (args.includes('--create-task')) {
      console.log('🆕 First launch: Create Task action detected');
      handleTaskbarAction('create-task');
    } else if (args.includes('--update-task')) {
      console.log('📝 First launch: Update Task action detected');
      handleTaskbarAction('update-task');
    } else if (args.includes('--add-subtask')) {
      console.log('➕ First launch: Add Subtask action detected');
      handleTaskbarAction('add-subtask');
    } else {
      console.log('ℹ️ First launch: Normal startup');
    }
    
    // Auto-updates
    try {
      console.log('🔄 Checking for updates...');
      autoUpdater.checkForUpdatesAndNotify();
    } catch (error) {
      console.log('⚠️ Auto-updater error:', error);
    }
  });
}

app.on('window-all-closed', () => {
  console.log('🪟 All windows closed');
  console.log('ℹ️ Keeping app running for taskbar functionality');
  console.log('ℹ️ You can still use the taskbar context menu');
  // Don't quit the app - keep it running for taskbar functionality
  // This allows the taskbar menu to work even when the window is closed
});

app.on('activate', () => {
  console.log('🔄 App activated');
  if (BrowserWindow.getAllWindows().length === 0) {
    console.log('🪟 No windows open, creating new window');
    createWindow();
  } else {
    console.log('🪟 Windows already exist');
  }
});


