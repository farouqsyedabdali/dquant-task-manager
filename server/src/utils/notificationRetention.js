const prisma = require('../lib/prisma');

const NOTIFICATION_RETENTION_MONTHS = 3;

function getNotificationCutoffDate() {
  const d = new Date();
  d.setMonth(d.getMonth() - NOTIFICATION_RETENTION_MONTHS);
  return d;
}

/**
 * Delete notifications older than {@link NOTIFICATION_RETENTION_MONTHS} (by createdAt).
 * @param {{ userId?: number, companyId?: number }} [scope] - omit for global purge (scheduler)
 * @param {import('@prisma/client').PrismaClient} [prismaClient]
 * @returns {Promise<number>} deleted count
 */
async function purgeExpiredNotifications(scope = null, prismaClient = prisma) {
  const cutoff = getNotificationCutoffDate();
  const where = {
    createdAt: { lt: cutoff },
    ...(scope && scope.userId != null && scope.companyId != null
      ? { userId: scope.userId, companyId: scope.companyId }
      : {})
  };
  const result = await prismaClient.notification.deleteMany({ where });
  return result.count;
}

module.exports = {
  NOTIFICATION_RETENTION_MONTHS,
  getNotificationCutoffDate,
  purgeExpiredNotifications
};
