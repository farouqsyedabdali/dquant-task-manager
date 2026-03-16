const { PrismaClient } = require('@prisma/client');

// Global Prisma client instance with connection pooling
const globalForPrisma = globalThis;

const prisma = globalForPrisma.prisma || new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  // Connection pool configuration optimized for Azure PostgreSQL
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'], // Reduced logging
});

// Prevent multiple instances in development
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Graceful shutdown with better error handling
const disconnect = async () => {
  try {
    await prisma.$disconnect();
    console.log('✅ Database disconnected successfully');
  } catch (error) {
    console.error('❌ Error disconnecting from database:', error);
  }
};

process.on('beforeExit', disconnect);

process.on('SIGINT', async () => {
  await disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await disconnect();
  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', async (error) => {
  console.error('❌ Uncaught Exception:', error);
  await disconnect();
  process.exit(1);
});

module.exports = prisma;


