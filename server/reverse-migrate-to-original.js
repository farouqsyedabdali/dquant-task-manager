const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function reverseMigrateToOriginal() {
  console.log('Starting reverse migration to original task people system...');

  try {
    // Migrate TaskPeople back to original tables
    console.log('Migrating TaskPeople back to original tables...');
    const people = await prisma.taskPeople.findMany({
      include: { task: true, user: true, contact: true }
    });

    for (const person of people) {
      console.log(`Processing person: ${person.user?.name || person.contact?.name || person.email || 'Unknown'} with role ${person.role}`);

      if (person.role === 'LEAD') {
        // LEAD role - this should already be in Task.assigneeId, but let's ensure it's set
        const task = await prisma.task.findUnique({
          where: { id: person.taskId }
        });
        if (task && person.userId && task.assigneeId !== person.userId) {
          await prisma.task.update({
            where: { id: person.taskId },
            data: { assigneeId: person.userId }
          });
          console.log(`Set assigneeId for task ${person.taskId} to user ${person.userId}`);
        }
      } else if (person.role === 'CO_ASSIGNEE') {
        // Internal co-assignee
        const existing = await prisma.taskCoAssignee.findFirst({
          where: {
            taskId: person.taskId,
            userId: person.userId
          }
        });
        if (!existing && person.userId) {
          await prisma.taskCoAssignee.create({
            data: {
              taskId: person.taskId,
              userId: person.userId,
              companyId: person.companyId
            }
          });
          console.log(`Created TaskCoAssignee for user ${person.userId} on task ${person.taskId}`);
        }
      } else {
        // All other roles go to TaskShare
        let permissionLevel;
        let isExternal = false;

        switch (person.role) {
          case 'EXTERNAL_CO_ASSIGNEE':
            permissionLevel = 'EDITOR';
            isExternal = true;
            break;
          case 'COMMENTER':
            permissionLevel = 'COMMENTER';
            break;
          case 'EXTERNAL_COMMENTER':
            permissionLevel = 'COMMENTER';
            isExternal = true;
            break;
          case 'VIEWER':
            permissionLevel = 'VIEWER';
            break;
          case 'EXTERNAL_VIEWER':
            permissionLevel = 'VIEWER';
            isExternal = true;
            break;
          default:
            permissionLevel = 'VIEWER'; // fallback
        }

        // Check if this person already exists in TaskShare
        const whereClause = person.userId
          ? { taskId: person.taskId, userId: person.userId }
          : person.contactId
          ? { taskId: person.taskId, contactId: person.contactId }
          : { taskId: person.taskId, email: person.email };

        const existing = await prisma.taskShare.findFirst({
          where: whereClause
        });

        if (!existing) {
          await prisma.taskShare.create({
            data: {
              taskId: person.taskId,
              userId: person.userId,
              contactId: person.contactId,
              email: person.email,
              companyId: person.companyId,
              permissionLevel: permissionLevel,
              isExternal: isExternal,
              token: person.token
            }
          });
          const personName = person.user?.name || person.contact?.name || person.email || 'Unknown';
          console.log(`Created TaskShare for ${personName} (${permissionLevel}${isExternal ? ' external' : ''}) on task ${person.taskId}`);
        }
      }
    }

    console.log('Reverse migration completed successfully!');

    // Optional: Clean up TaskPeople table (uncomment when ready)
    // console.log('Cleaning up TaskPeople table...');
    // await prisma.taskPeople.deleteMany();
    // console.log('TaskPeople table cleaned up.');

  } catch (error) {
    console.error('Reverse migration failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

reverseMigrateToOriginal();
