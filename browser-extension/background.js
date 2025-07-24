// Add context menu on install
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'send-to-ai',
    title: 'Send to AI Assistant',
    contexts: ['selection']
  });
});

// Handle context menu click
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'send-to-ai' && info.selectionText) {
    // Send selected text to backend AI endpoint
    const apiUrl = 'http://localhost:3000/api/ai/chat'; // Change if deployed
    const message = info.selectionText;
    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: `From browser extension:\n${message}` })
      });
      const data = await response.json();
      const aiReply = data.response || 'No response from AI.';
      // Show notification with AI's response (first 200 chars)
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icon48.png',
        title: 'AI Assistant',
        message: aiReply.slice(0, 200)
      });
    } catch (err) {
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icon48.png',
        title: 'AI Assistant',
        message: 'Error contacting AI assistant.'
      });
    }
  }
}); 