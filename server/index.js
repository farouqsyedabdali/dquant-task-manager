const app = require('./src/app')
const { startReminderScheduler } = require('./src/utils/taskReminderScheduler')
const { startAutoArchiveScheduler } = require('./src/utils/autoArchiveScheduler')
const secureLogger = require('./src/middleware/secureLogger')
const PORT = process.env.PORT || 3000

// Helper function to mask password in database URL
function maskDatabaseUrl(url) {
  if (!url) return 'Not set';
  try {
    const urlObj = new URL(url);
    if (urlObj.password) {
      urlObj.password = '****';
    }
    return urlObj.toString();
  } catch {
    return 'Invalid URL format';
  }
}

// Test database connection on startup
async function testDatabaseConnection() {
  try {
    secureLogger.info('🔍 Testing database connection...')
    secureLogger.info(`🔗 Database URL: ${maskDatabaseUrl(process.env.DATABASE_URL)}`)
    const prisma = require('./src/lib/prisma')
    await prisma.$connect()
    secureLogger.info('✅ Database connection successful')
  } catch (error) {
    secureLogger.error('❌ Database connection failed:', { message: error.message })
    secureLogger.error('🔧 DATABASE_URL:', { isSet: !!process.env.DATABASE_URL })
    process.exit(1)
  }
}

// Start server after database test
async function startServer() {
  await testDatabaseConnection()
  
  app.listen(PORT, () => {
    secureLogger.info('🚀 Task Manager Server Starting...')
    secureLogger.info(`🌐 Server running on port ${PORT}`)
    secureLogger.info(`🔧 NODE_ENV: ${process.env.NODE_ENV}`)
    secureLogger.info(`📁 Working directory: ${process.cwd()}`)
    secureLogger.info(`🆔 Process ID: ${process.pid}`)
    secureLogger.info(`Health check: http://localhost:${PORT}/api/health`)
    secureLogger.info('✅ Server ready to accept connections')
    
    // Start the task reminder scheduler
    startReminderScheduler()
    
    // Start the auto-archive scheduler
    startAutoArchiveScheduler()
  })
}

startServer().catch(error => {
  secureLogger.error('❌ Failed to start server:', { message: error.message, stack: error.stack })
  process.exit(1)
})
