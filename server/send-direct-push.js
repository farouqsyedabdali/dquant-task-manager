require('dotenv').config();
const admin = require('firebase-admin');

// 1. Get the token from command-line arguments
const token = process.argv[2];

if (!token) {
  console.error('\n❌ Error: Please provide your phone\'s FCM token as an argument.');
  console.error('Usage: node send-direct-push.js "YOUR_FCM_TOKEN_HERE"\n');
  process.exit(1);
}

// 2. Initialize Firebase
const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

if (!projectId || !clientEmail || !privateKey) {
  console.error('❌ Error: Missing Firebase credentials in your server/.env file.');
  process.exit(1);
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  });
}

// 3. Define the push message
const message = {
  notification: {
    title: '🚀 Tialz Push Test!',
    body: 'If you see this, push notifications are working end-to-end!',
  },
  token: token.trim(),
};

// 4. Send the message
console.log(`⏳ Attempting to send push notification to token: ${token.substring(0, 15)}...`);

admin.messaging().send(message)
  .then((response) => {
    console.log('✅ Success! Message sent successfully.');
    console.log('Response ID:', response);
  })
  .catch((error) => {
    console.error('❌ Failed to send notification.');
    console.error('Error Code:', error.code);
    console.error('Error Message:', error.message);
  });
