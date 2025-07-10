const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function seed() {
  try {
    console.log('🌱 Starting database seed...');

    // Create admin user
    const adminPassword = await bcrypt.hash('admin123', 10);
    const admin = await prisma.user.upsert({
      where: { email: 'admin@dquant.com' },
      update: {},
      create: {
        name: 'Admin User',
        email: 'admin@dquant.com',
        password: adminPassword,
        role: 'ADMIN'
      }
    });

    // Create employee users
    const employee1Password = await bcrypt.hash('employee123', 10);
    const employee1 = await prisma.user.upsert({
      where: { email: 'john@dquant.com' },
      update: {},
      create: {
        name: 'John Doe',
        email: 'john@dquant.com',
        password: employee1Password,
        role: 'EMPLOYEE'
      }
    });

    const employee2Password = await bcrypt.hash('employee123', 10);
    const employee2 = await prisma.user.upsert({
      where: { email: 'jane@dquant.com' },
      update: {},
      create: {
        name: 'Jane Smith',
        email: 'jane@dquant.com',
        password: employee2Password,
        role: 'EMPLOYEE'
      }
    });

    // Create sample tasks
    const task1 = await prisma.task.create({
      data: {
        title: 'Design new landing page',
        description: 'Create a modern and responsive landing page for the main website',
        status: 'TODO',
        priority: 'HIGH',
        assignedToId: employee1.id,
        createdById: admin.id
      }
    });

    const task2 = await prisma.task.create({
      data: {
        title: 'Fix login bug',
        description: 'Users are experiencing issues with the login functionality',
        status: 'IN_PROGRESS',
        priority: 'URGENT',
        assignedToId: employee2.id,
        createdById: admin.id
      }
    });

    const task3 = await prisma.task.create({
      data: {
        title: 'Update documentation',
        description: 'Update the API documentation with new endpoints',
        status: 'TODO',
        priority: 'MEDIUM',
        assignedToId: employee1.id,
        createdById: admin.id
      }
    });

    // Create sample comments
    await prisma.comment.create({
      data: {
        content: 'I\'ll start working on this tomorrow morning.',
        taskId: task1.id,
        authorId: employee1.id
      }
    });

    await prisma.comment.create({
      data: {
        content: 'This is a critical issue that needs immediate attention.',
        taskId: task2.id,
        authorId: admin.id
      }
    });

    await prisma.comment.create({
      data: {
        content: 'I\'ve identified the root cause. Working on a fix.',
        taskId: task2.id,
        authorId: employee2.id
      }
    });

    console.log('✅ Database seeded successfully!');
    console.log('\n📋 Sample Users:');
    console.log('Admin: admin@dquant.com / admin123');
    console.log('Employee 1: john@dquant.com / employee123');
    console.log('Employee 2: jane@dquant.com / employee123');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seed(); 