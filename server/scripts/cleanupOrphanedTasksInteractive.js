const { PrismaClient } = require('@prisma/client');
const readline = require('readline');
const prisma = new PrismaClient();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askQuestion(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function cleanupOrphanedTasks() {
  try {
    console.log('🔍 Starting cleanup of orphaned tasks...\n');

    // IMPORTANT: This script should NOT be used anymore!
    console.log('❌ This script has been disabled to prevent data loss.');
    console.log('❌ Regular tasks also have projectId: null, so we can\'t delete them.');
    console.log('✅ With cascade delete enabled, orphaned tasks won\'t exist anymore.');
    console.log('');
    rl.close();
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
        assignerId: true,
        assigner: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });

    console.log(`📊 Found ${orphanedTasks.length} potentially orphaned tasks\n`);

    if (orphanedTasks.length === 0) {
      console.log('✅ No orphaned tasks found. Database is clean!');
      rl.close();
      await prisma.$disconnect();
      return;
    }

    // Show all tasks
    console.log('📋 Orphaned tasks:');
    orphanedTasks.forEach((task, index) => {
      const date = new Date(task.createdAt).toLocaleDateString();
      console.log(`  ${index + 1}. "${task.title}" (ID: ${task.id})`);
      console.log(`     Created: ${date} by ${task.assigner.name}`);
    });
    console.log('');

    // Ask for confirmation
    console.log('⚠️  WARNING: This will permanently delete these tasks!');
    const answer = await askQuestion('Do you want to proceed? (yes/no): ');

    if (answer.toLowerCase() !== 'yes' && answer.toLowerCase() !== 'y') {
      console.log('\n❌ Cleanup cancelled. No tasks were deleted.');
      rl.close();
      await prisma.$disconnect();
      return;
    }

    console.log('\n🗑️  Deleting orphaned tasks...');
    
    const result = await prisma.task.deleteMany({
      where: {
        projectId: null
      }
    });

    console.log(`\n✅ Successfully deleted ${result.count} orphaned tasks!`);
    console.log('🎉 Cleanup complete!\n');

    rl.close();
    await prisma.$disconnect();

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    rl.close();
    await prisma.$disconnect();
    process.exit(1);
  }
}

// Run the cleanup
cleanupOrphanedTasks();

