const admin = require('./firebase-keys.config');

/**
 * Send a push notification using Firebase Cloud Messaging (FCM)
 * @param {string} token - The FCM registration token of the device
 * @param {string} title - The notification title
 * @param {string} body - The notification body content
 * @param {Object} [data] - Optional data payload to send along with the notification
 * @returns {Promise<Object>} Object containing success status, and response or error
 */
async function sendPushNotification(token, title, body, data = {}) {
  if (!token) return { success: false, error: 'No FCM token' };
  
  const message = {
    notification: { title, body },
    token,
    data: data, // Optional: Additional data payload for the app
  };
  
  try {
    const response = await admin.messaging().send(message);
    return { success: true, response };
  } catch (error) {
    console.error('FCM Error:', error.message);
    return { success: false, error: error.code || error.message };
  }
}

module.exports = {
  sendPushNotification,
};
