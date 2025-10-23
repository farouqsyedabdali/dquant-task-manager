const { contextBridge, ipcRenderer } = require('electron');

// Expose minimal surface for future use (e.g., updates notifications)
contextBridge.exposeInMainWorld('desktop', {
  version: '0.1.0',
  
  // Listen for taskbar actions from main process
  onTaskbarAction: (callback) => {
    ipcRenderer.on('taskbar-action', (event, data) => {
      callback(data);
    });
  },
  
  // Remove listeners to prevent memory leaks
  removeAllListeners: (channel) => {
    ipcRenderer.removeAllListeners(channel);
  }
});


