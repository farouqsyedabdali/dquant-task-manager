const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  try {
    const tokens = await prisma.deviceToken.findMany({
      include: {
        user: {
          select: { name: true, email: true }
        }
      }
    });
    console.log('\n--- Registered Device Tokens in Database ---');
    if (tokens.length === 0) {
      console.log('No tokens registered yet.');
    } else {
      tokens.forEach(t => {
        console.log(`User: ${t.user.name} (${t.user.email})`);
        console.log(`Platform: ${t.platform}`);
        console.log(`Token: ${t.token}`);
        console.log('--------------------------------------------');
      });
    }
  } catch (err) {
    console.error('Error reading database:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

check();
