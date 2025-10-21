const { Client } = require('pg');
require('dotenv').config();

async function testConnection() {
  console.log('🔍 Testing database connection...');
  console.log('📊 DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : 'Not set');
  
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is not set');
    return;
  }

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('🔌 Attempting to connect...');
    await client.connect();
    console.log('✅ Database connection successful!');
    
    // Test a simple query
    const result = await client.query('SELECT NOW() as current_time');
    console.log('⏰ Current database time:', result.rows[0].current_time);
    
    // Test if our tables exist
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('User', 'Company', 'Task')
    `);
    console.log('📋 Found tables:', tablesResult.rows.map(row => row.table_name));
    
  } catch (error) {
    console.error('❌ Database connection failed:');
    console.error('Error type:', error.constructor.name);
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('💡 Possible solutions:');
      console.error('   - Database server is down');
      console.error('   - Wrong host/port in connection string');
      console.error('   - Firewall blocking connection');
    } else if (error.code === 'ENOTFOUND') {
      console.error('💡 Possible solutions:');
      console.error('   - Wrong hostname in connection string');
      console.error('   - DNS resolution issues');
    } else if (error.code === '28P01') {
      console.error('💡 Possible solutions:');
      console.error('   - Wrong username/password');
      console.error('   - User does not exist');
    } else if (error.code === '3D000') {
      console.error('💡 Possible solutions:');
      console.error('   - Database does not exist');
      console.error('   - Wrong database name in connection string');
    }
    
  } finally {
    await client.end();
    console.log('🔌 Connection closed');
  }
}

testConnection();
