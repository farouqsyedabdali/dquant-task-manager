const { contextBridge } = require('electron');

// Expose minimal surface for future use (e.g., updates notifications)
contextBridge.exposeInMainWorld('desktop', {
  version: '0.1.0'
});


