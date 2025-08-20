#!/usr/bin/env node

/**
 * AI Task Assistant Desktop Launcher
 * 
 * This script opens the AI Task Assistant popup directly, which auto-resizes to 320x400px.
 * 
 * Usage:
 *   node launcher.js
 * 
 * Or make it executable and run directly:
 *   chmod +x launcher.js
 *   ./launcher.js
 */

const { spawn } = require('child_process');
const path = require('path');
const os = require('os');

// Configuration
const POPUP_URL = 'http://localhost:5173/popup.html?direct=true';

// Open the popup directly in default browser
function openPopup() {
  const platform = os.platform();
  let command, args;

  switch (platform) {
    case 'win32':
      command = 'cmd';
      args = ['/c', 'start', '""', `"${POPUP_URL}"`];
      break;

    case 'darwin':
      command = 'open';
      args = [POPUP_URL];
      break;

    case 'linux':
      command = 'xdg-open';
      args = [POPUP_URL];
      break;

    default:
      console.error(`Unsupported platform: ${platform}`);
      process.exit(1);
  }

  console.log('🚀 Opening AI Task Assistant Popup directly...');
  console.log(`🌐 URL: ${POPUP_URL}`);

  const child = spawn(command, args, {
    detached: true,
    stdio: 'ignore'
  });

  child.unref();

  setTimeout(() => {
    console.log('✅ AI Task Assistant popup opened!');
    console.log('');
    console.log('📝 How to use:');
    console.log('   1. The popup window should auto-resize to 320x400px');
    console.log('   2. Copy text and use Create/Update Task buttons');
    console.log('   3. Task manager will open in regular tabs');
    console.log('');
    console.log('💡 Tip: The popup will auto-resize and center itself!');
  }, 1000);
}



// Check if server is running
function checkServer() {
  return new Promise((resolve) => {
    const http = require('http');
    const options = {
      hostname: 'localhost',
      port: 5173,
      path: '/popup.html',
      timeout: 3000
    };

    const req = http.request(options, (res) => {
      resolve(true);
    });

    req.on('error', () => {
      resolve(false);
    });

    req.on('timeout', () => {
      resolve(false);
    });

    req.end();
  });
}

// Main execution
async function main() {
  console.log('🤖 AI Task Assistant Desktop Launcher');
  console.log('=====================================');

  // Check if the development server is running
  const serverRunning = await checkServer();
  
  if (!serverRunning) {
    console.error('❌ Task Manager server is not running!');
    console.log('');
    console.log('Please start your development server first:');
    console.log('   cd client');
    console.log('   npm run dev');
    console.log('');
    process.exit(1);
  }

  console.log('✅ Task Manager server is running');

  // Open launcher page
  openPopup();
}

// Run the launcher
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { openPopup, checkServer }; 