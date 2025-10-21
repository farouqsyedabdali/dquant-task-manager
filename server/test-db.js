const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testDatabase() {
  try {
    console.log('🔍 Testing database connection from Railway...');
    
    // Test basic connection
    await prisma.$connect();
    console.log('✅ Prisma connected successfully');
    
    // Test a simple query
    const userCount = await prisma.user.count();
    console.log(`👥 Total users: ${userCount}`);
    
    const companyCount = await prisma.company.count();
    console.log(`🏢 Total companies: ${companyCount}`);
    
    const taskCount = await prisma.task.count();
    console.log(`📋 Total tasks: ${taskCount}`);
    
    console.log('🎉 Database test completed successfully!');
    
  } catch (error) {
    console.error('❌ Database test failed:');
    console.error('Error:', error.message);
    console.error('Code:', error.code);
    console.error('Meta:', error.meta);
    
    if (error.code === 'P1001') {
      console.error('💡 Database server is not reachable');
      console.error('   - Check if database server is running');
      console.error('   - Check firewall settings');
      console.error('   - Check connection string');
    } else if (error.code === 'P1002') {
      console.error('💡 Database server is reachable but database does not exist');
    } else if (error.code === 'P1017') {
      console.error('💡 Database server closed the connection');
      console.error('   - Check if database server is running');
      console.error('   - Check connection limits');
    }
    
  } finally {
    await prisma.$disconnect();
  }
}

testDatabase();
