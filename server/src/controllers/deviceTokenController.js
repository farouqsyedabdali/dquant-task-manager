const prisma = require('../lib/prisma');

const VALID_PLATFORMS = ['android', 'ios', 'web'];

/**
 * Register (or refresh) a device token for push notifications.
 * POST /api/device-tokens
 * Body: { token: string, platform: "android" | "ios" | "web" }
 */
const registerDeviceToken = async (req, res) => {
  try {
    const userId = req.user.id;
    const { token, platform } = req.body;

    if (!token || typeof token !== 'string' || token.trim().length === 0) {
      return res.status(400).json({ error: 'Device token is required' });
    }

    if (!platform || !VALID_PLATFORMS.includes(platform)) {
      return res.status(400).json({
        error: `Platform must be one of: ${VALID_PLATFORMS.join(', ')}`,
      });
    }

    const deviceToken = await prisma.deviceToken.upsert({
      where: {
        token_userId: { token: token.trim(), userId },
      },
      update: {
        platform,
        updatedAt: new Date(),
      },
      create: {
        token: token.trim(),
        platform,
        userId,
      },
    });

    res.status(200).json({
      success: true,
      message: 'Device token registered',
      deviceToken: {
        id: deviceToken.id,
        platform: deviceToken.platform,
        createdAt: deviceToken.createdAt,
      },
    });
  } catch (error) {
    console.error('Error registering device token:', error);
    res.status(500).json({ error: 'Failed to register device token' });
  }
};

/**
 * Unregister a device token (e.g. on logout).
 * DELETE /api/device-tokens
 * Body: { token: string }
 */
const unregisterDeviceToken = async (req, res) => {
  try {
    const userId = req.user.id;
    const { token } = req.body;

    if (!token || typeof token !== 'string' || token.trim().length === 0) {
      return res.status(400).json({ error: 'Device token is required' });
    }

    const deleted = await prisma.deviceToken.deleteMany({
      where: {
        token: token.trim(),
        userId,
      },
    });

    if (deleted.count === 0) {
      return res.status(404).json({ error: 'Device token not found' });
    }

    res.json({ success: true, message: 'Device token unregistered' });
  } catch (error) {
    console.error('Error unregistering device token:', error);
    res.status(500).json({ error: 'Failed to unregister device token' });
  }
};

module.exports = { registerDeviceToken, unregisterDeviceToken };
