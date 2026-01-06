/**
 * Account Lockout Middleware
 * 
 * Prevents brute force attacks by locking accounts after multiple failed login attempts.
 * This provides defense-in-depth beyond IP-based rate limiting.
 * 
 * Features:
 * - Locks account after MAX_FAILED_ATTEMPTS (default: 5)
 * - Lockout duration: LOCKOUT_DURATION_MINUTES (default: 15 minutes)
 * - Attempts reset after ATTEMPT_WINDOW_MINUTES (default: 15 minutes)
 * - Automatically resets on successful login
 */

const prisma = require('../lib/prisma');
const secureLogger = require('./secureLogger');

// Configuration
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MINUTES = 15;
const ATTEMPT_WINDOW_MINUTES = 15;

/**
 * Check if an account is currently locked
 * @param {string} email - User email address
 * @returns {Promise<{locked: boolean, message?: string, userId?: number, attempts?: number}>}
 */
const checkAccountLockout = async (email) => {
  try {
    const user = await prisma.user.findFirst({
      where: { email },
      select: {
        id: true,
        failedLoginAttempts: true,
        accountLockedUntil: true,
        lastLoginAttempt: true,
      }
    });

    if (!user) {
      return { locked: false };
    }

    // Check if account is currently locked
    if (user.accountLockedUntil && new Date() < user.accountLockedUntil) {
      const remainingMinutes = Math.ceil(
        (user.accountLockedUntil - new Date()) / 1000 / 60
      );
      return {
        locked: true,
        message: `Account locked due to too many failed login attempts. Please try again in ${remainingMinutes} minute(s).`,
        remainingMinutes
      };
    }

    // Reset attempts if last attempt was more than window ago
    if (user.lastLoginAttempt) {
      const minutesSinceLastAttempt = 
        (new Date() - user.lastLoginAttempt) / 1000 / 60;
      
      if (minutesSinceLastAttempt > ATTEMPT_WINDOW_MINUTES) {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            failedLoginAttempts: 0,
            accountLockedUntil: null,
          }
        });
        secureLogger.debug('🔓 Account lockout reset (attempt window expired)', { 
          userId: user.id, 
          email 
        });
        return { locked: false };
      }
    }

    return { 
      locked: false, 
      userId: user.id, 
      attempts: user.failedLoginAttempts 
    };
  } catch (error) {
    secureLogger.error('❌ Error checking account lockout:', { 
      email, 
      error: error.message 
    });
    // On error, allow login attempt (fail open for availability)
    return { locked: false };
  }
};

/**
 * Record a failed login attempt
 * @param {string} email - User email address
 * @returns {Promise<{isLocked: boolean, attempts: number}>}
 */
const recordFailedLogin = async (email) => {
  try {
    const user = await prisma.user.findFirst({ 
      where: { email },
      select: {
        id: true,
        failedLoginAttempts: true
      }
    });
    
    if (!user) {
      // Don't reveal if user exists or not (security best practice)
      return { isLocked: false, attempts: 0 };
    }

    const newAttempts = user.failedLoginAttempts + 1;
    const updateData = {
      failedLoginAttempts: newAttempts,
      lastLoginAttempt: new Date(),
    };

    // Lock account if max attempts reached
    if (newAttempts >= MAX_FAILED_ATTEMPTS) {
      updateData.accountLockedUntil = new Date(
        Date.now() + LOCKOUT_DURATION_MINUTES * 60 * 1000
      );
      
      secureLogger.warn('🔒 Account locked due to failed login attempts', {
        userId: user.id,
        email,
        attempts: newAttempts,
        lockedUntil: updateData.accountLockedUntil
      });
    } else {
      secureLogger.warn('⚠️  Failed login attempt recorded', {
        userId: user.id,
        email,
        attempts: newAttempts,
        remainingAttempts: MAX_FAILED_ATTEMPTS - newAttempts
      });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: updateData
    });

    return {
      isLocked: newAttempts >= MAX_FAILED_ATTEMPTS,
      attempts: newAttempts,
      remainingAttempts: MAX_FAILED_ATTEMPTS - newAttempts
    };
  } catch (error) {
    secureLogger.error('❌ Error recording failed login:', {
      email,
      error: error.message
    });
    return { isLocked: false, attempts: 0 };
  }
};

/**
 * Record a successful login and reset failed attempts
 * @param {number} userId - User ID
 * @returns {Promise<void>}
 */
const recordSuccessfulLogin = async (userId) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        failedLoginAttempts: true,
        accountLockedUntil: true
      }
    });

    if (!user) {
      return;
    }

    // Only update if there were previous failed attempts or account was locked
    if (user.failedLoginAttempts > 0 || user.accountLockedUntil) {
      await prisma.user.update({
        where: { id: userId },
        data: {
          failedLoginAttempts: 0,
          accountLockedUntil: null,
          lastLoginAttempt: new Date(),
        }
      });

      secureLogger.info('✅ Account lockout reset after successful login', {
        userId,
        previousAttempts: user.failedLoginAttempts
      });
    } else {
      // Just update last login attempt
      await prisma.user.update({
        where: { id: userId },
        data: {
          lastLoginAttempt: new Date(),
        }
      });
    }
  } catch (error) {
    secureLogger.error('❌ Error recording successful login:', {
      userId,
      error: error.message
    });
  }
};

/**
 * Manually unlock an account (for admin use)
 * @param {number} userId - User ID
 * @returns {Promise<void>}
 */
const unlockAccount = async (userId) => {
  try {
    await prisma.user.update({
      where: { id: userId },
      data: {
        failedLoginAttempts: 0,
        accountLockedUntil: null,
      }
    });

    secureLogger.info('🔓 Account manually unlocked', { userId });
  } catch (error) {
    secureLogger.error('❌ Error unlocking account:', {
      userId,
      error: error.message
    });
    throw error;
  }
};

/**
 * Get account lockout status (for admin use)
 * @param {number} userId - User ID
 * @returns {Promise<{isLocked: boolean, attempts: number, lockedUntil?: Date}>}
 */
const getAccountStatus = async (userId) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        failedLoginAttempts: true,
        accountLockedUntil: true,
        lastLoginAttempt: true,
      }
    });

    if (!user) {
      return { isLocked: false, attempts: 0 };
    }

    const isLocked = user.accountLockedUntil && new Date() < user.accountLockedUntil;

    return {
      isLocked,
      attempts: user.failedLoginAttempts,
      lockedUntil: user.accountLockedUntil,
      lastLoginAttempt: user.lastLoginAttempt
    };
  } catch (error) {
    secureLogger.error('❌ Error getting account status:', {
      userId,
      error: error.message
    });
    return { isLocked: false, attempts: 0 };
  }
};

module.exports = {
  checkAccountLockout,
  recordFailedLogin,
  recordSuccessfulLogin,
  unlockAccount,
  getAccountStatus,
  // Export constants for testing
  MAX_FAILED_ATTEMPTS,
  LOCKOUT_DURATION_MINUTES,
  ATTEMPT_WINDOW_MINUTES
};
