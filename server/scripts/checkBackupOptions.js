const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkBackupOptions() {
  try {
    console.log('🔍 Checking for recovery options...\n');

    // Check audit logs for task creation/deletion
    const recentAuditLogs = await prisma.auditLog.findMany({
      where: {
        OR: [
          { action: 'TASK_CREATED' },
          { action: 'TASK_DELETED' }
        ]
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        user: {
          select: { name: true, email: true }
        }
      }
    });

    console.log(`📊 Found ${recentAuditLogs.length} recent task audit logs\n`);

    // Show some recent task creations
    const taskCreations = recentAuditLogs.filter(log => log.action === 'TASK_CREATED');
    console.log('📋 Recent task creations (might be recoverable):');
    taskCreations.slice(0, 10).forEach((log, index) => {
      console.log(`  ${index + 1}. ${log.description}`);
      console.log(`     By: ${log.user.name}, At: ${new Date(log.createdAt).toLocaleString()}`);
      if (log.metadata) {
        console.log(`     Metadata:`, log.metadata);
      }
      console.log('');
    });

    await prisma.$disconnect();

  } catch (error) {
    console.error('❌ Error:', error);
    await prisma.$disconnect();
  }
}

checkBackupOptions();


