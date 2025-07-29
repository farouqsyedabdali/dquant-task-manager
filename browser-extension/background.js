// Add context menu on install
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'send-to-ai',
    title: 'Send to AI Assistant',
    contexts: ['selection']
  });
  
  chrome.contextMenus.create({
    id: 'create-task-ai',
    title: '🆕 Create Task',
    contexts: ['selection']
  });
  
  chrome.contextMenus.create({
    id: 'update-task-ai',
    title: '📝 Update Task',
    contexts: ['selection']
  });
  
  console.log('Browser extension installed and context menus created');
});

// Function to validate token format
function isValidToken(token) {
  if (!token || typeof token !== 'string') return false;
  const parts = token.split('.');
  return parts.length === 3 && parts.every(part => part.length > 0);
}

// Function to refresh token from web app
async function refreshTokenFromWebApp() {
  console.log('Attempting to refresh token from web app...');
  try {
    const tabs = await chrome.tabs.query({ url: 'http://localhost:5173/*' });
    if (tabs.length > 0) {
      // Ask content script to re-check and send token
      chrome.tabs.sendMessage(tabs[0].id, { type: 'REFRESH_TOKEN' }, (response) => {
        if (chrome.runtime.lastError) {
          console.log('Could not refresh token from web app tab');
        } else {
          console.log('Token refresh requested');
        }
      });
      return true;
    }
  } catch (error) {
    console.error('Error refreshing token:', error);
  }
  return false;
}

// Function to check if content script is ready
async function isContentScriptReady(tabId) {
  return new Promise((resolve) => {
    chrome.tabs.sendMessage(tabId, { type: 'PING' }, (response) => {
      if (chrome.runtime.lastError) {
        resolve(false);
      } else {
        resolve(response && response.ready);
      }
    });
  });
}

// Function to inject content script if needed
async function ensureContentScript(tabId) {
  try {
    await chrome.scripting.executeScript({
      target: { tabId: tabId },
      files: ['content.js']
    });
    console.log('Content script injected manually');
    // Wait a moment for it to initialize
    await new Promise(resolve => setTimeout(resolve, 500));
    return true;
  } catch (error) {
    console.error('Failed to inject content script:', error);
    return false;
  }
}

// Function to handle task extraction and communication
async function handleTaskExtraction(selectedText, retryCount = 0) {
  console.log('Starting task extraction for text:', selectedText.substring(0, 100) + '...');
  const apiUrl = 'http://localhost:3000/api/ai/extract-task';
  
  try {
    // Get auth token from local storage
    const authToken = await new Promise((resolve) => {
      chrome.storage.local.get(['authToken'], (result) => {
        console.log('Retrieved auth token from storage:', {
          exists: !!result.authToken,
          isValid: isValidToken(result.authToken),
          preview: result.authToken ? `${result.authToken.substring(0, 20)}...` : 'null'
        });
        resolve(result.authToken);
      });
    });

    if (!authToken || !isValidToken(authToken)) {
      console.log('No valid auth token found');
      
      // Try to refresh token from web app if we haven't retried yet
      if (retryCount === 0) {
        const refreshed = await refreshTokenFromWebApp();
        if (refreshed) {
          // Wait a bit and retry
          setTimeout(() => handleTaskExtraction(selectedText, retryCount + 1), 2000);
          return;
        }
      }
      
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icon48.png',
        title: 'AI Assistant',
        message: 'Please login to your task manager first, then try again.'
      });
      return;
    }

    console.log('Making API call to extract task...');
    
    // Call the task extraction endpoint
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({ text: selectedText })
    });

    console.log('API response status:', response.status);

    // Handle 401 - token might be expired
    if (response.status === 401 && retryCount === 0) {
      console.log('Received 401, attempting token refresh...');
      
      // Clear the stored token
      chrome.storage.local.remove(['authToken']);
      
      // Try to refresh token
      const refreshed = await refreshTokenFromWebApp();
      if (refreshed) {
        // Wait and retry
        setTimeout(() => handleTaskExtraction(selectedText, retryCount + 1), 2000);
        return;
      }
      
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icon48.png',
        title: 'AI Assistant',
        message: 'Please login to your task manager again and try again.'
      });
      return;
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API call failed:', response.status, errorText);
      throw new Error(`API call failed: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('Task extraction successful:', data);
    
    if (data.success && data.taskData) {
      // Send the extracted task data to the web app
      const webAppUrl = 'http://localhost:5173';
      
      // Try to find an existing tab with the web app
      const tabs = await chrome.tabs.query({ url: `${webAppUrl}/*` });
      console.log('Found web app tabs:', tabs.length);
      
      if (tabs.length > 0) {
        const tabId = tabs[0].id;
        
        // Check if content script is ready
        let scriptReady = await isContentScriptReady(tabId);
        console.log('Content script ready:', scriptReady);
        
        // If not ready, try to inject it
        if (!scriptReady) {
          console.log('Content script not ready, attempting injection...');
          await ensureContentScript(tabId);
          scriptReady = await isContentScriptReady(tabId);
          console.log('Content script ready after injection:', scriptReady);
        }
        
        if (scriptReady) {
          // Content script is ready, send message
          const message = {
            type: 'CREATE_TASK_FROM_EXTENSION',
            taskData: data.taskData,
            originalText: selectedText
          };
          
          console.log('Sending message to web app tab:', message);
          
          chrome.tabs.sendMessage(tabId, message, (response) => {
            if (chrome.runtime.lastError) {
              console.error('Failed to send message to web app:', chrome.runtime.lastError);
              // Use URL fallback
              openTaskManagerWithData(data.taskData, selectedText);
            } else {
              console.log('Message sent successfully to web app');
              chrome.notifications.create({
                type: 'basic',
                iconUrl: 'icon48.png',
                title: 'Task Ready',
                message: `Task "${data.taskData.title}" is ready to be created!`
              });
            }
          });
        } else {
          // Content script failed to load, use URL fallback
          console.log('Content script failed to load, using URL fallback');
          openTaskManagerWithData(data.taskData, selectedText);
        }
        
      } else {
        // Web app is not open, open it with the task data
        openTaskManagerWithData(data.taskData, selectedText);
      }
    } else {
      throw new Error('Failed to extract task data');
    }
  } catch (err) {
    console.error('Extension error:', err);
    
    let errorMessage = 'Failed to extract task. Please try again.';
    if (err.message.includes('401')) {
      errorMessage = 'Please login to your task manager and try again.';
    } else if (err.message.includes('Failed to fetch')) {
      errorMessage = 'Cannot connect to task manager. Make sure it\'s running.';
    }
    
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icon48.png',
      title: 'AI Assistant Error',
      message: errorMessage
    });
  }
}

// Function to open task manager with data (fallback method)
function openTaskManagerWithData(taskData, originalText) {
  const webAppUrl = 'http://localhost:5173';
  const url = `${webAppUrl}/dashboard?createTask=${encodeURIComponent(JSON.stringify(taskData))}&originalText=${encodeURIComponent(originalText)}`;
  console.log('Opening/updating tab with URL method:', url);
  
  // Try to update existing tab first
  chrome.tabs.query({ url: `${webAppUrl}/*` }, (tabs) => {
    if (tabs.length > 0) {
      chrome.tabs.update(tabs[0].id, { url: url, active: true });
    } else {
      chrome.tabs.create({ url: url });
    }
  });
  
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icon48.png',
    title: 'Task Extracted',
    message: `Task "${taskData.title}" will be loaded in your task manager.`
  });
}

// Function to handle task updates
async function handleTaskUpdate(selectedText, retryCount = 0) {
  console.log('Starting task update identification for text:', selectedText.substring(0, 100) + '...');
  const apiUrl = 'http://localhost:3000/api/ai/identify-task-update';
  
  try {
    // Get auth token from local storage
    const authToken = await new Promise((resolve) => {
      chrome.storage.local.get(['authToken'], (result) => {
        console.log('Retrieved auth token for update:', {
          exists: !!result.authToken,
          isValid: isValidToken(result.authToken),
          preview: result.authToken ? `${result.authToken.substring(0, 20)}...` : 'null'
        });
        resolve(result.authToken);
      });
    });

    if (!authToken || !isValidToken(authToken)) {
      console.log('No valid auth token found for update');
      
      if (retryCount === 0) {
        const refreshed = await refreshTokenFromWebApp();
        if (refreshed) {
          setTimeout(() => handleTaskUpdate(selectedText, retryCount + 1), 2000);
          return;
        }
      }
      
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icon48.png',
        title: 'AI Assistant',
        message: 'Please login to your task manager first, then try again.'
      });
      return;
    }

    console.log('Making API call to identify task update...');
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({ text: selectedText })
    });

    console.log('Task update API response status:', response.status);

    if (response.status === 401 && retryCount === 0) {
      console.log('Received 401 for update, attempting token refresh...');
      chrome.storage.local.remove(['authToken']);
      const refreshed = await refreshTokenFromWebApp();
      if (refreshed) {
        setTimeout(() => handleTaskUpdate(selectedText, retryCount + 1), 2000);
        return;
      }
      
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icon48.png',
        title: 'AI Assistant',
        message: 'Please login to your task manager again and try again.'
      });
      return;
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Task update API call failed:', response.status, errorText);
      throw new Error(`API call failed: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('Task update identification successful:', data);
    
    if (data.success && data.updateData) {
      const webAppUrl = 'http://localhost:5173';
      const tabs = await chrome.tabs.query({ url: `${webAppUrl}/*` });
      console.log('Found web app tabs for update:', tabs.length);
      
      if (tabs.length > 0) {
        const tabId = tabs[0].id;
        let scriptReady = await isContentScriptReady(tabId);
        
        if (!scriptReady) {
          console.log('Content script not ready for update, attempting injection...');
          await ensureContentScript(tabId);
          scriptReady = await isContentScriptReady(tabId);
        }
        
        if (scriptReady) {
          const message = {
            type: 'UPDATE_TASK_FROM_EXTENSION',
            updateData: data.updateData,
            originalText: selectedText
          };
          
          console.log('Sending update message to web app tab:', message);
          
          chrome.tabs.sendMessage(tabId, message, (response) => {
            if (chrome.runtime.lastError) {
              console.error('Failed to send update message to web app:', chrome.runtime.lastError);
              openTaskManagerWithUpdate(data.updateData, selectedText);
            } else {
              console.log('Update message sent successfully to web app');
              
              const notificationMessage = data.updateData.taskFound 
                ? `Update ready for task: "${data.updateData.taskId}"`
                : 'No matching task found - review suggested actions';
                
              chrome.notifications.create({
                type: 'basic',
                iconUrl: 'icon48.png',
                title: 'Task Update',
                message: notificationMessage
              });
            }
          });
        } else {
          console.log('Content script failed to load for update, using URL fallback');
          openTaskManagerWithUpdate(data.updateData, selectedText);
        }
        
      } else {
        openTaskManagerWithUpdate(data.updateData, selectedText);
      }
    } else {
      throw new Error('Failed to identify task update');
    }
  } catch (err) {
    console.error('Task update error:', err);
    
    let errorMessage = 'Failed to identify task update. Please try again.';
    if (err.message.includes('401')) {
      errorMessage = 'Please login to your task manager and try again.';
    } else if (err.message.includes('Failed to fetch')) {
      errorMessage = 'Cannot connect to task manager. Make sure it\'s running.';
    }
    
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icon48.png',
      title: 'AI Assistant Error',
      message: errorMessage
    });
  }
}

// Function to open task manager with update data (fallback method)
function openTaskManagerWithUpdate(updateData, originalText) {
  const webAppUrl = 'http://localhost:5173';
  const url = `${webAppUrl}/dashboard?updateTask=${encodeURIComponent(JSON.stringify(updateData))}&originalText=${encodeURIComponent(originalText)}`;
  console.log('Opening/updating tab with update URL method:', url);
  
  chrome.tabs.query({ url: `${webAppUrl}/*` }, (tabs) => {
    if (tabs.length > 0) {
      chrome.tabs.update(tabs[0].id, { url: url, active: true });
    } else {
      chrome.tabs.create({ url: url });
    }
  });
  
  const notificationMessage = updateData.taskFound 
    ? `Task update will be loaded for task: "${updateData.taskId}"`
    : 'No matching task found - suggestions will be provided';
    
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icon48.png',
    title: 'Task Update',
    message: notificationMessage
  });
}

// Handle context menu click
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (!info.selectionText) return;
  
  console.log(`Context menu clicked: ${info.menuItemId} with selection:`, info.selectionText.substring(0, 100) + '...');
  
  switch (info.menuItemId) {
    case 'send-to-ai':
    case 'create-task-ai':
      await handleTaskExtraction(info.selectionText);
      break;
      
    case 'update-task-ai':
      await handleTaskUpdate(info.selectionText);
      break;
      
    default:
      console.log('Unknown context menu item:', info.menuItemId);
  }
});

// Listen for messages from content script (for auth token and floating button)
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'STORE_AUTH_TOKEN') {
    // Only log if it's a new/different token to reduce noise
    chrome.storage.local.get(['authToken'], (result) => {
      const isDifferent = result.authToken !== request.token;
      
      if (isDifferent || !result.authToken) {
        console.log('Storing new auth token:', {
          provided: !!request.token,
          isValid: isValidToken(request.token),
          changed: isDifferent
        });
      }
      
      chrome.storage.local.set({ authToken: request.token }, () => {
        if (chrome.runtime.lastError) {
          console.error('Error storing auth token:', chrome.runtime.lastError);
          sendResponse({ success: false, error: chrome.runtime.lastError.message });
        } else {
          // Only log success for new tokens to reduce noise
          if (isDifferent || !result.authToken) {
            console.log('Auth token stored successfully');
          }
          sendResponse({ success: true });
        }
      });
    });
    
    return true;
    
  } else if (request.type === 'TRIGGER_TASK_EXTRACTION') {
    // Handle trigger from floating button in content script
    console.log('Triggered task extraction from floating button');
    handleTaskExtraction(request.selectedText);
    sendResponse({ success: true });
    return true;
    
  } else if (request.type === 'TRIGGER_TASK_UPDATE') {
    // Handle trigger from floating button in content script
    console.log('Triggered task update from floating button');
    handleTaskUpdate(request.selectedText);
    sendResponse({ success: true });
    return true;
  }
}); 