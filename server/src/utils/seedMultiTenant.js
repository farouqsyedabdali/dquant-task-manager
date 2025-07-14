const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting multi-tenant seed...');

  try {
    // Create default company
    const defaultCompany = await prisma.company.create({
      data: {
        name: 'Default Company',
        email: 'admin@default.com',
        passwordHash: await bcrypt.hash('admin123', 10),
        subscriptionPlan: 'free'
      }
    });

    console.log('✅ Created default company:', defaultCompany.name);

    // Create default admin user
    const defaultAdmin = await prisma.user.create({
      data: {
        name: 'Admin User',
        email: 'admin@default.com',
        password: await bcrypt.hash('admin123', 10),
        role: 'ADMIN',
        companyId: defaultCompany.id
      }
    });

    console.log('✅ Created default admin user:', defaultAdmin.name);

    // Create a sample employee
    const sampleEmployee = await prisma.user.create({
      data: {
        name: 'John Employee',
        email: 'john@default.com',
        password: await bcrypt.hash('employee123', 10),
        role: 'EMPLOYEE',
        companyId: defaultCompany.id
      }
    });

    console.log('✅ Created sample employee:', sampleEmployee.name);

    // Create sample tasks
    const sampleTasks = await Promise.all([
      prisma.task.create({
        data: {
          title: 'Welcome to DQuant Task Manager',
          description: 'This is your first task. You can edit, delete, or mark it as complete.',
          status: 'TODO',
          priority: 'MEDIUM',
          createdById: defaultAdmin.id,
          companyId: defaultCompany.id
        }
      }),
      prisma.task.create({
        data: {
          title: 'Set up your team',
          description: 'Invite team members and assign them to projects.',
          status: 'IN_PROGRESS',
          priority: 'HIGH',
          createdById: defaultAdmin.id,
          companyId: defaultCompany.id
        }
      }),
      prisma.task.create({
        data: {
          title: 'Create your first project',
          description: 'Start organizing your work into projects.',
          status: 'TODO',
          priority: 'LOW',
          createdById: defaultAdmin.id,
          companyId: defaultCompany.id
        }
      })
    ]);

    console.log('✅ Created sample tasks');

    // Create sample comments
    await prisma.comment.create({
      data: {
        content: 'Welcome to the team! This task manager will help you stay organized.',
        taskId: sampleTasks[0].id,
        authorId: defaultAdmin.id,
        companyId: defaultCompany.id
      }
    });

    console.log('✅ Created sample comment');

    console.log('🎉 Multi-tenant seed completed successfully!');
    console.log('📧 Default login: admin@default.com / admin123');
    console.log('👤 Employee login: john@default.com / employee123');

  } catch (error) {
    console.error('❌ Error during seeding:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 