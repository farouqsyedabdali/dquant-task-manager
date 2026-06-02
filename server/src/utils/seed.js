const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function seed() {
  try {
    console.log('🌱 Starting database seed...');

    // 1. Create a default company
    const company = await prisma.company.upsert({
      where: { email: 'info@companyname.com' },
      update: {},
      create: {
        name: 'Default Company',
        email: 'info@companyname.com',
        subscriptionPlan: 'free'
      }
    });
    console.log(`✅ Default company created (ID: ${company.id})`);

    // 2. Create admin user
    const adminPassword = await bcrypt.hash('admin123', 10);
    const admin = await prisma.user.upsert({
      where: { 
        email_companyId: { 
          email: 'admin@companyname.com', 
          companyId: company.id 
        } 
      },
      update: {},
      create: {
        name: 'Admin User',
        email: 'admin@companyname.com',
        password: adminPassword,
        role: 'ADMIN',
        companyId: company.id,
        isEmailVerified: true
      }
    });
    console.log(`✅ Admin user created (ID: ${admin.id})`);

    // 3. Create employee users
    const employee1Password = await bcrypt.hash('employee123', 10);
    const employee1 = await prisma.user.upsert({
      where: { 
        email_companyId: { 
          email: 'john@companyname.com', 
          companyId: company.id 
        } 
      },
      update: {},
      create: {
        name: 'John Doe',
        email: 'john@companyname.com',
        password: employee1Password,
        role: 'EMPLOYEE',
        companyId: company.id,
        isEmailVerified: true
      }
    });
    console.log(`✅ Employee John Doe created (ID: ${employee1.id})`);

    const employee2Password = await bcrypt.hash('employee123', 10);
    const employee2 = await prisma.user.upsert({
      where: { 
        email_companyId: { 
          email: 'jane@companyname.com', 
          companyId: company.id 
        } 
      },
      update: {},
      create: {
        name: 'Jane Smith',
        email: 'jane@companyname.com',
        password: employee2Password,
        role: 'EMPLOYEE',
        companyId: company.id,
        isEmailVerified: true
      }
    });
    console.log(`✅ Employee Jane Smith created (ID: ${employee2.id})`);

    // 4. Create sample tasks
    const task1 = await prisma.task.create({
      data: {
        title: 'Design new landing page',
        description: 'Create a modern and responsive landing page for the main website',
        status: 'TODO',
        priority: 'HIGH',
        assigneeId: employee1.id,
        assignerId: admin.id,
        companyId: company.id,
        dueDate: new Date(new Date().setHours(23, 59, 59, 999)) // Due today
      }
    });

    const task2 = await prisma.task.create({
      data: {
        title: 'Fix login bug',
        description: 'Users are experiencing issues with the login functionality',
        status: 'IN_PROGRESS',
        priority: 'URGENT',
        assigneeId: employee2.id,
        assignerId: admin.id,
        companyId: company.id,
        dueDate: new Date(Date.now() - 24 * 60 * 60 * 1000) // Overdue by 1 day
      }
    });

    const task3 = await prisma.task.create({
      data: {
        title: 'Update documentation',
        description: 'Update the API documentation with new endpoints',
        status: 'TODO',
        priority: 'MEDIUM',
        assigneeId: employee1.id,
        assignerId: admin.id,
        companyId: company.id,
        dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000) // Due in 2 days
      }
    });

    console.log('✅ Sample tasks created');

    // 5. Create sample comments
    await prisma.comment.create({
      data: {
        content: "I'll start working on this tomorrow morning.",
        taskId: task1.id,
        authorId: employee1.id,
        companyId: company.id
      }
    });

    await prisma.comment.create({
      data: {
        content: 'This is a critical issue that needs immediate attention.',
        taskId: task2.id,
        authorId: admin.id,
        companyId: company.id
      }
    });

    await prisma.comment.create({
      data: {
        content: "I've identified the root cause. Working on a fix.",
        taskId: task2.id,
        authorId: employee2.id,
        companyId: company.id
      }
    });

    console.log('✅ Database seeded successfully!');
    console.log('\n📋 Sample Credentials:');
    console.log('Admin: admin@companyname.com / admin123');
    console.log('Employee 1: john@companyname.com / employee123');
    console.log('Employee 2: jane@companyname.com / employee123');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seed();