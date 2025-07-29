#!/usr/bin/env node

/**
 * AI Task Assistant Desktop Launcher
 * 
 * This script opens a small popup window (256x256) with the AI Task Assistant.
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
const LAUNCHER_URL = 'http://localhost:5173/popup-launcher.html';

// Open the launcher page in default browser
function openPopup() {
  const platform = os.platform();
  let command, args;

  switch (platform) {
    case 'win32':
      command = 'cmd';
      args = ['/c', 'start', '""', `"${LAUNCHER_URL}"`];
      break;

    case 'darwin':
      command = 'open';
      args = [LAUNCHER_URL];
      break;

    case 'linux':
      command = 'xdg-open';
      args = [LAUNCHER_URL];
      break;

    default:
      console.error(`Unsupported platform: ${platform}`);
      process.exit(1);
  }

  console.log('🚀 Opening AI Task Assistant Launcher...');
  console.log(`🌐 URL: ${LAUNCHER_URL}`);

  const child = spawn(command, args, {
    detached: true,
    stdio: 'ignore'
  });

  child.unref();

  setTimeout(() => {
    console.log('✅ Launcher opened! Click "Launch AI Assistant" to open the popup.');
    console.log('');
    console.log('📝 How to use:');
    console.log('   1. Click "Launch AI Assistant" on the launcher page');
    console.log('   2. A 256x256 popup window will open');
    console.log('   3. Copy text and use Create/Update Task buttons');
    console.log('   4. Task manager will open in regular tabs');
    console.log('');
    console.log('💡 Tip: Bookmark the launcher for easy access!');
  }, 1000);
}



// Check if server is running
function checkServer() {
  return new Promise((resolve) => {
    const http = require('http');
    const options = {
      hostname: 'localhost',
      port: 5173,
      path: '/popup-launcher.html',
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