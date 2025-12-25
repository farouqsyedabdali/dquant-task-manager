const app = require('./src/app')
const { startReminderScheduler } = require('./src/utils/taskReminderScheduler')
const { startAutoArchiveScheduler } = require('./src/utils/autoArchiveScheduler')
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
    console.log('🔍 Testing database connection...')
    console.log(`🔗 Database URL: ${maskDatabaseUrl(process.env.DATABASE_URL)}`)
    const prisma = require('./src/lib/prisma')
    await prisma.$connect()
    console.log('✅ Database connection successful')
  } catch (error) {
    console.error('❌ Database connection failed:', error.message)
    console.error('🔧 DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : 'Not set')
    process.exit(1)
  }
}

// Start server after database test
async function startServer() {
  await testDatabaseConnection()
  
  app.listen(PORT, () => {
    console.log('🚀 Task Manager Server Starting...')
    console.log(`🌐 Server running on port ${PORT}`)
    console.log(`🔧 NODE_ENV: ${process.env.NODE_ENV}`)
    console.log(`📁 Working directory: ${process.cwd()}`)
    console.log(`🆔 Process ID: ${process.pid}`)
    console.log(`Health check: http://localhost:${PORT}/api/health`)
    console.log('✅ Server ready to accept connections')
    
    // Start the task reminder scheduler
    startReminderScheduler()
    
    // Start the auto-archive scheduler
    startAutoArchiveScheduler()
  })
}

startServer().catch(error => {
  console.error('❌ Failed to start server:', error)
  process.exit(1)
})
