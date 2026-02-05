/**
 * Script to close idle database connections
 * Run this when you get "too many connections" errors
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function closeIdleConnections() {
  try {
    console.log('🔍 Checking for idle connections...');
    
    // Query to find and terminate idle connections
    const result = await prisma.$queryRaw`
      SELECT 
        pg_terminate_backend(pid)
      FROM 
        pg_stat_activity
      WHERE 
        datname = current_database()
        AND pid <> pg_backend_pid()
        AND state = 'idle'
        AND state_change < current_timestamp - INTERVAL '5 minutes';
    `;
    
    console.log('✅ Closed idle connections:', result);
    
    // Show current connection count
    const connections = await prisma.$queryRaw`
      SELECT 
        count(*) as connection_count,
        max_conn as max_connections
      FROM 
        pg_stat_activity,
        (SELECT setting::int as max_conn FROM pg_settings WHERE name = 'max_connections') as max
      WHERE 
        datname = current_database()
      GROUP BY max_conn;
    `;
    
    console.log('📊 Current connections:', connections);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

closeIdleConnections();
