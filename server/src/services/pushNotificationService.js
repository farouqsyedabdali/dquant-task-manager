const admin = require('firebase-admin');
const prisma = require('../lib/prisma');

let firebaseInitialized = false;

const initializeFirebase = () => {
  if (firebaseInitialized) return true;

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    console.warn('⚠️  Firebase not configured — push notifications disabled. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY env vars.');
    return false;
  }

  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        // Private key comes as escaped newlines in env vars
        privateKey: privateKey.replace(/\\n/g, '\n'),
      }),
    });
    firebaseInitialized = true;
    console.log('✅ Firebase Admin initialized for push notifications');
    return true;
  } catch (error) {
    console.error('❌ Firebase Admin init failed:', error.message);
    return false;
  }
};

/**
 * Send a push notification to a specific user on all their registered devices.
 * Silently no-ops if Firebase is not configured.
 */
const sendPushToUser = async (userId, { title, body, data = {} }) => {
  if (!initializeFirebase()) return;

  try {
    const deviceTokens = await prisma.deviceToken.findMany({
      where: { userId },
      select: { id: true, token: true },
    });

    if (deviceTokens.length === 0) return;

    const tokens = deviceTokens.map((dt) => dt.token);

    const message = {
      notification: { title, body },
      data: Object.fromEntries(
        Object.entries(data).map(([k, v]) => [k, String(v)])
      ),
      tokens,
    };

    const response = await admin.messaging().sendEachForMulticast(message);

    // Clean up any tokens that are no longer valid
    if (response.failureCount > 0) {
      const staleTokenIds = [];
      response.responses.forEach((resp, idx) => {
        if (
          !resp.success &&
          resp.error &&
          (resp.error.code === 'messaging/invalid-registration-token' ||
            resp.error.code === 'messaging/registration-token-not-registered')
        ) {
          staleTokenIds.push(deviceTokens[idx].id);
        }
      });

      if (staleTokenIds.length > 0) {
        await prisma.deviceToken.deleteMany({
          where: { id: { in: staleTokenIds } },
        });
        console.log(`🧹 Cleaned up ${staleTokenIds.length} stale device token(s) for user ${userId}`);
      }
    }
  } catch (error) {
    console.error(`❌ Push notification error for user ${userId}:`, error.message);
  }
};

module.exports = { sendPushToUser };
