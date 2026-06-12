const admin = require('firebase-admin');
require('dotenv').config();

const firebaseCredentials = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'), // Fix newlines
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
};

if (!admin.apps.length) {
  if (
    !firebaseCredentials.projectId ||
    !firebaseCredentials.privateKey ||
    !firebaseCredentials.clientEmail
  ) {
    console.warn('⚠️ Missing Firebase credentials in .env. Push notifications will not work.');
  } else {
    try {
      admin.initializeApp({
        credential: admin.credential.cert(firebaseCredentials),
      });
      console.log('✅ Firebase Admin initialized successfully.');
    } catch (error) {
      console.error('❌ Error initializing Firebase Admin:', error.message);
    }
  }
}

module.exports = admin;
