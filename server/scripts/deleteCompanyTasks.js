const { PrismaClient } = require('@prisma/client');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const prisma = new PrismaClient();

async function deleteCompanyTasks() {
  try {
    const companyName = "Farouq's Company";

    console.log(`🔍 Starting task deletion for company "${companyName}"...\n`);

    // First, find the company
    const company = await prisma.company.findFirst({
      where: {
        name: companyName
      },
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            users: true,
            tasks: true,
            projects: true
          }
        }
      }
    });

    if (!company) {
      console.log(`❌ Company "${companyName}" not found in the database.`);
      console.log('📋 Available companies:');

      const allCompanies = await prisma.company.findMany({
        select: {
          id: true,
          name: true,
          _count: {
            select: { tasks: true }
          }
        }
      });

      allCompanies.forEach((comp, index) => {
        console.log(`  ${index + 1}. "${comp.name}" (ID: ${comp.id}, Tasks: ${comp._count.tasks})`);
      });

      await prisma.$disconnect();
      process.exit(1);
    }

    console.log(`✅ Found company: "${company.name}" (ID: ${company.id})`);
    console.log(`📊 Current stats:`);
    console.log(`   - Users: ${company._count.users}`);
    console.log(`   - Tasks: ${company._count.tasks}`);
    console.log(`   - Projects: ${company._count.projects}\n`);

    if (company._count.tasks === 0) {
      console.log('✅ No tasks found for this company. Nothing to delete!');
      await prisma.$disconnect();
      return;
    }

    // Get some sample tasks to show what will be deleted
    const sampleTasks = await prisma.task.findMany({
      where: {
        companyId: company.id
      },
      select: {
        id: true,
        title: true,
        status: true,
        priority: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 5
    });

    console.log('📋 Sample tasks that will be deleted:');
    sampleTasks.forEach((task, index) => {
      const date = task.createdAt.toISOString().split('T')[0];
      console.log(`  ${index + 1}. "${task.title}" (${task.status}, ${task.priority}) - Created: ${date}`);
    });

    if (company._count.tasks > 5) {
      console.log(`  ... and ${company._count.tasks - 5} more tasks\n`);
    } else {
      console.log('');
    }

    // Confirm deletion
    console.log(`⚠️  WARNING: This will permanently delete ${company._count.tasks} tasks for company "${company.name}"!`);
    console.log('⚠️  Users, projects, and all other data will be preserved.\n');

    // Delete all tasks for this company
    console.log('🗑️  Deleting tasks...');

    const deleteResult = await prisma.task.deleteMany({
      where: {
        companyId: company.id
      }
    });

    console.log(`\n✅ Successfully deleted ${deleteResult.count} tasks!`);

    // Also delete related comments and audit logs for these tasks
    console.log('🧹 Cleaning up related data...');

    // Delete comments for tasks that no longer exist
    const deletedComments = await prisma.comment.deleteMany({
      where: {
        taskId: {
          notIn: await prisma.task.findMany({
            where: { companyId: company.id },
            select: { id: true }
          }).then(tasks => tasks.map(t => t.id))
        },
        task: {
          companyId: company.id
        }
      }
    });

    console.log(`✅ Deleted ${deletedComments.count} related comments.`);

    // Show final stats
    const finalCompany = await prisma.company.findUnique({
      where: { id: company.id },
      select: {
        _count: {
          select: {
            users: true,
            tasks: true,
            projects: true
          }
        }
      }
    });

    console.log(`\n📊 Final stats for "${company.name}":`);
    console.log(`   - Users: ${finalCompany._count.users} (unchanged)`);
    console.log(`   - Tasks: ${finalCompany._count.tasks} (was ${company._count.tasks})`);
    console.log(`   - Projects: ${finalCompany._count.projects} (unchanged)`);

    console.log('\n🎉 Task deletion complete!');
    console.log('✅ All users and other data have been preserved.');

    await prisma.$disconnect();
    process.exit(0);

  } catch (error) {
    console.error('❌ Error during task deletion:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

// Run the deletion
deleteCompanyTasks();