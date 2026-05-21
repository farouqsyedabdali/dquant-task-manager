require('dotenv').config();
const { sendPushToUser } = require('./src/services/pushNotificationService');
const admin = require('firebase-admin');

async function testFirebaseConnection() {
  console.log('--- Testing Firebase Push Notifications ---');
  
  // 1. Manually check if admin can initialize and connect
  try {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
    }

    console.log('✅ 1. Firebase Admin SDK Initialized Successfully.');
    
    // 2. Try to send a message to a deliberately fake token 
    // This tests if Google actually accepts our credentials
    console.log('⏳ 2. Pinging Google Firebase Servers with test message...');
    const testMessage = {
      notification: { title: 'Test', body: 'Test' },
      token: 'fake-token-just-for-testing-connection' 
    };

    try {
      await admin.messaging().send(testMessage);
    } catch (err) {
      // We expect an "invalid-registration-token" error because the token is fake.
      // If we get this specific error, it means authentication WORKED!
      if (err.code === 'messaging/invalid-registration-token') {
        console.log('✅ 3. Connection SUCCESS! Google accepted our credentials (rejected the fake token, as expected).');
      } else {
        console.error('❌ Connection Failed. Unexpected error:', err.message);
      }
    }

  } catch (error) {
    console.error('❌ Firebase Admin init failed:', error.message);
  }
}

testFirebaseConnection();
