// Content script initialization
console.log('Task Manager Extension content script loaded on:', window.location.origin);

// Prevent multiple injections (just log, but continue execution)
if (window.taskManagerExtensionLoaded) {
  console.log('Content script already loaded, but continuing initialization...');
} else {
  window.taskManagerExtensionLoaded = true;
  console.log('Initializing Task Manager Extension content script for the first time...');
}

// Floating button element
let floatBtn = null;
let floatMenu = null;
let lastSelection = '';

function createButton() {
  if (floatBtn) return floatBtn;
  
  // Create main button
  floatBtn = document.createElement('button');
  floatBtn.textContent = 'AI Task ▼';
  floatBtn.style.position = 'absolute';
  floatBtn.style.zIndex = 99999;
  floatBtn.style.padding = '6px 14px';
  floatBtn.style.background = '#2563eb';
  floatBtn.style.color = '#fff';
  floatBtn.style.border = 'none';
  floatBtn.style.borderRadius = '6px';
  floatBtn.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
  floatBtn.style.cursor = 'pointer';
  floatBtn.style.fontSize = '14px';
  floatBtn.style.display = 'none';
  floatBtn.style.transition = 'opacity 0.2s';
  floatBtn.style.fontFamily = 'system-ui, -apple-system, sans-serif';
  
  // Create dropdown menu
  floatMenu = document.createElement('div');
  floatMenu.style.position = 'absolute';
  floatMenu.style.zIndex = 100000;
  floatMenu.style.background = '#fff';
  floatMenu.style.border = '1px solid #ddd';
  floatMenu.style.borderRadius = '6px';
  floatMenu.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
  floatMenu.style.display = 'none';
  floatMenu.style.minWidth = '160px';
  floatMenu.style.fontSize = '14px';
  floatMenu.style.fontFamily = 'system-ui, -apple-system, sans-serif';
  
  // Create menu items
  const createItem = document.createElement('div');
  createItem.textContent = '🆕 Create New Task';
  createItem.style.padding = '10px 15px';
  createItem.style.cursor = 'pointer';
  createItem.style.borderBottom = '1px solid #eee';
  createItem.style.color = '#333';
  createItem.onmouseover = () => createItem.style.background = '#f5f5f5';
  createItem.onmouseout = () => createItem.style.background = 'transparent';
  
  const updateItem = document.createElement('div');
  updateItem.textContent = '📝 Update Existing Task';
  updateItem.style.padding = '10px 15px';
  updateItem.style.cursor = 'pointer';
  updateItem.style.color = '#333';
  updateItem.onmouseover = () => updateItem.style.background = '#f5f5f5';
  updateItem.onmouseout = () => updateItem.style.background = 'transparent';
  
  floatMenu.appendChild(createItem);
  floatMenu.appendChild(updateItem);
  
  document.body.appendChild(floatBtn);
  document.body.appendChild(floatMenu);
  
  return floatBtn;
}

function showButton(x, y) {
  const btn = createButton();
  btn.style.left = `${x}px`;
  btn.style.top = `${y - 36}px`;
  btn.style.display = 'block';
  btn.style.opacity = '1';
}

function hideButton() {
  const btn = createButton();
  btn.style.display = 'none';
  if (floatMenu) {
    floatMenu.style.display = 'none';
  }
}

function showMenu() {
  if (!floatMenu || !floatBtn) return;
  
  const btnRect = floatBtn.getBoundingClientRect();
  floatMenu.style.left = `${btnRect.left + window.scrollX}px`;
  floatMenu.style.top = `${btnRect.bottom + window.scrollY + 5}px`;
  floatMenu.style.display = 'block';
}

function hideMenu() {
  if (floatMenu) {
    floatMenu.style.display = 'none';
  }
}

// Handle mouse events for text selection
document.addEventListener('mouseup', handleSelection);
document.addEventListener('keyup', handleSelection);

function handleSelection() {
  const selection = window.getSelection();
  const selectedText = selection.toString().trim();
  
  if (selectedText.length > 0 && selectedText !== lastSelection) {
    lastSelection = selectedText;
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    showButton(rect.left + window.scrollX, rect.top + window.scrollY);
    
    // Add click handler for the main button (shows menu)
    const btn = createButton();
    btn.onclick = () => {
      showMenu();
    };
    
    // Add click handlers for menu items
    const menuItems = floatMenu.children;
    const createItem = menuItems[0];
    const updateItem = menuItems[1];
    
    createItem.onclick = () => {
      chrome.runtime.sendMessage({
        type: 'TRIGGER_TASK_EXTRACTION',
        selectedText: selectedText
      }, (response) => {
        if (chrome.runtime.lastError) {
          console.error('Extension context error:', chrome.runtime.lastError);
          if (window.location.origin === 'http://localhost:5173') {
            sendTokenToBackground();
          }
        }
      });
      hideButton();
    };
    
    updateItem.onclick = () => {
      chrome.runtime.sendMessage({
        type: 'TRIGGER_TASK_UPDATE',
        selectedText: selectedText
      }, (response) => {
        if (chrome.runtime.lastError) {
          console.error('Extension context error:', chrome.runtime.lastError);
          if (window.location.origin === 'http://localhost:5173') {
            sendTokenToBackground();
          }
        }
      });
      hideButton();
    };
    
  } else if (selectedText.length === 0) {
    hideButton();
    lastSelection = '';
  }
}

// Hide button and menu when clicking elsewhere
document.addEventListener('click', (e) => {
  if (e.target !== floatBtn && !floatMenu?.contains(e.target)) {
    hideButton();
  }
});

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Content script received message:', message);
  
  if (message.type === 'PING') {
    // Background script is checking if we're ready
    sendResponse({ ready: true });
    return true;
    
  } else if (message.type === 'CREATE_TASK_FROM_EXTENSION') {
    // Send message to the web app if we're on the task manager domain
    if (window.location.origin === 'http://localhost:5173') {
      console.log('Forwarding create task message to web app window');
      
      const messageData = {
        type: 'CREATE_TASK_FROM_EXTENSION',
        taskData: message.taskData,
        originalText: message.originalText,
        source: 'browser-extension'
      };
      
      // Post message to window
      window.postMessage(messageData, window.location.origin);
      
      // Also trigger a custom event as fallback
      const customEvent = new CustomEvent('taskFromExtension', {
        detail: messageData
      });
      window.dispatchEvent(customEvent);
      
      sendResponse({ success: true });
    } else {
      sendResponse({ success: false, error: 'Not on task manager domain' });
    }
    return true;
    
  } else if (message.type === 'UPDATE_TASK_FROM_EXTENSION') {
    // Send update message to the web app if we're on the task manager domain
    if (window.location.origin === 'http://localhost:5173') {
      console.log('Forwarding update task message to web app window');
      
      const messageData = {
        type: 'UPDATE_TASK_FROM_EXTENSION',
        updateData: message.updateData,
        originalText: message.originalText,
        source: 'browser-extension'
      };
      
      // Post message to window
      window.postMessage(messageData, window.location.origin);
      
      // Also trigger a custom event as fallback
      const customEvent = new CustomEvent('taskUpdateFromExtension', {
        detail: messageData
      });
      window.dispatchEvent(customEvent);
      
      sendResponse({ success: true });
    } else {
      sendResponse({ success: false, error: 'Not on task manager domain' });
    }
    return true;
    
  } else if (message.type === 'REFRESH_TOKEN') {
    // Background script is asking us to refresh the token
    console.log('Received token refresh request');
    if (window.location.origin === 'http://localhost:5173') {
      sendTokenToBackground();
      sendResponse({ success: true });
    } else {
      sendResponse({ success: false, error: 'Not on task manager domain' });
    }
    return true;
  }
});

// Function to validate token format
function isValidToken(token) {
  if (!token || typeof token !== 'string') return false;
  // JWT tokens have 3 parts separated by dots
  const parts = token.split('.');
  return parts.length === 3 && parts.every(part => part.length > 0);
}

// Function to send token to background script
function sendTokenToBackground() {
  const token = localStorage.getItem('token');
  const isValid = isValidToken(token);
  
  console.log('Checking token:', {
    exists: !!token,
    isValid: isValid,
    length: token ? token.length : 0,
    preview: token ? `${token.substring(0, 20)}...` : 'null'
  });
  
  // Only send valid tokens and avoid duplicates
  if (isValid) {
    // Check if this is the same token we last sent
    if (window.lastSentToken === token) {
      console.log('Token unchanged, skipping send');
      return;
    }
    
    window.lastSentToken = token;
    chrome.runtime.sendMessage({
      type: 'STORE_AUTH_TOKEN',
      token: token
    }, (response) => {
      if (chrome.runtime.lastError) {
        console.error('Error sending token:', chrome.runtime.lastError);
        // Reset so we can try again
        window.lastSentToken = null;
      } else {
        console.log('Token sent successfully:', response);
      }
    });
  } else if (token) {
    console.warn('Invalid token format detected, not sending to background');
  }
}

// Check if we're on the task manager domain and monitor for auth token
if (window.location.origin === 'http://localhost:5173') {
  console.log('On task manager domain, setting up token monitoring');
  
  // Function to check and send token with retry
  function checkTokenWithRetry(retries = 3) {
    const token = localStorage.getItem('token');
    if (isValidToken(token)) {
      sendTokenToBackground();
    } else if (retries > 0) {
      console.log(`Token not ready, retrying in 1s... (${retries} retries left)`);
      setTimeout(() => checkTokenWithRetry(retries - 1), 1000);
    } else {
      console.log('Token not found after retries');
    }
  }
  
  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(() => checkTokenWithRetry(), 500);
    });
  } else {
    // DOM is already ready, check immediately and with retries
    checkTokenWithRetry();
  }
  
  // Monitor for token changes using storage events
  window.addEventListener('storage', (e) => {
    if (e.key === 'token') {
      console.log('Storage event detected for token');
      setTimeout(sendTokenToBackground, 100);
    }
  });
  
  // Also monitor localStorage directly (for same-tab changes)
  const originalSetItem = localStorage.setItem;
  localStorage.setItem = function(key, value) {
    originalSetItem.apply(this, arguments);
    if (key === 'token') {
      console.log('localStorage.setItem called for token');
      setTimeout(sendTokenToBackground, 100);
    }
  };
  
  const originalRemoveItem = localStorage.removeItem;
  localStorage.removeItem = function(key) {
    originalRemoveItem.apply(this, arguments);
    if (key === 'token') {
      console.log('localStorage.removeItem called for token');
      // Send null token to clear it from background
      chrome.runtime.sendMessage({
        type: 'STORE_AUTH_TOKEN',
        token: null
      });
    }
  };
  
  // Periodic check every 10 seconds as fallback (reduced frequency)
  setInterval(() => {
    const currentToken = localStorage.getItem('token');
    if (isValidToken(currentToken) && window.lastSentToken !== currentToken) {
      console.log('Periodic token check - sending updated token');
      sendTokenToBackground();
    }
  }, 30000); // Reduced from 10s to 30s
} 