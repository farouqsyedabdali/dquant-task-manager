const app = require('./src/app')
const PORT = process.env.PORT || 3000

app.listen(PORT, () => {
  console.log('🚀 Task Manager Server Starting...')
  console.log(`🌐 Server running on port ${PORT}`)
  console.log(`🔧 NODE_ENV: ${process.env.NODE_ENV}`)
  console.log(`📁 Working directory: ${process.cwd()}`)
  console.log(`🆔 Process ID: ${process.pid}`)
  console.log(`Health check: http://localhost:${PORT}/api/health`)
  console.log('✅ Server ready to accept connections')
})
