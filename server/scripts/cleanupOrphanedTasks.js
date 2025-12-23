const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanupOrphanedTasks() {
  try {
    console.log('🔍 Starting cleanup of orphaned tasks...\n');

    // IMPORTANT: This script should NOT be used anymore!
    // It was too aggressive and deleted ALL tasks without projectId
    // Regular tasks that were never part of a project also have projectId: null
    
    console.log('❌ This script has been disabled to prevent data loss.');
    console.log('❌ Do NOT delete tasks with projectId: null automatically.');
    console.log('✅ With cascade delete enabled, orphaned tasks won\'t exist anymore.');
    console.log('');
    await prisma.$disconnect();
    return;

    // OLD CODE (DO NOT USE):
    const orphanedTasks = await prisma.task.findMany({
      where: {
        projectId: null,
      },
      select: {
        id: true,
        title: true,
        createdAt: true,
        companyId: true,
        assignerId: true
      }
    });

    console.log(`📊 Found ${orphanedTasks.length} potentially orphaned tasks\n`);

    if (orphanedTasks.length === 0) {
      console.log('✅ No orphaned tasks found. Database is clean!');
      await prisma.$disconnect();
      return;
    }

    // Show some examples
    console.log('📋 Sample orphaned tasks:');
    orphanedTasks.slice(0, 5).forEach((task, index) => {
      console.log(`  ${index + 1}. "${task.title}" (ID: ${task.id})`);
    });
    if (orphanedTasks.length > 5) {
      console.log(`  ... and ${orphanedTasks.length - 5} more\n`);
    } else {
      console.log('');
    }

    // Ask for confirmation
    console.log('⚠️  WARNING: This will permanently delete these tasks!');
    console.log('⚠️  Make sure you want to proceed before continuing.\n');

    // For automated execution, delete directly
    // For manual execution, uncomment the readline section below

    console.log('🗑️  Deleting orphaned tasks...');
    
    const result = await prisma.task.deleteMany({
      where: {
        projectId: null
      }
    });

    console.log(`\n✅ Successfully deleted ${result.count} orphaned tasks!`);
    console.log('🎉 Cleanup complete!\n');

    await prisma.$disconnect();
    process.exit(0);

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

// Run the cleanup
cleanupOrphanedTasks();

