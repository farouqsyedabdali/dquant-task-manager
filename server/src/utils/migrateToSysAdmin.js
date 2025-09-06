const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const migrateToSysAdmin = async () => {
  try {
    console.log('Starting migration to SYSDMIN role system...');

    // Find all companies
    const companies = await prisma.company.findMany({
      include: {
        users: {
          where: {
            role: 'ADMIN'
          }
        }
      }
    });

    console.log(`Found ${companies.length} companies to process`);

    for (const company of companies) {
      if (company.users.length === 0) {
        console.log(`Company ${company.name} (${company.id}) has no ADMIN users, skipping...`);
        continue;
      }

      // For each company, promote the first ADMIN user to SYSDMIN
      const firstAdmin = company.users[0];
      
      console.log(`Promoting user ${firstAdmin.name} (${firstAdmin.id}) to SYSDMIN in company ${company.name}`);

      await prisma.user.update({
        where: { id: firstAdmin.id },
        data: { role: 'SYSDMIN' }
      });

      console.log(`✅ Successfully promoted ${firstAdmin.name} to SYSDMIN in ${company.name}`);
    }

    console.log('Migration completed successfully!');
    
    // Verify the migration
    const sysAdminCount = await prisma.user.count({
      where: { role: 'SYSDMIN' }
    });
    
    const adminCount = await prisma.user.count({
      where: { role: 'ADMIN' }
    });

    console.log(`Migration results:`);
    console.log(`- SYSDMIN users: ${sysAdminCount}`);
    console.log(`- ADMIN users: ${adminCount}`);

  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await prisma.$disconnect();
  }
};

// Run migration if this file is executed directly
if (require.main === module) {
  migrateToSysAdmin();
}

module.exports = { migrateToSysAdmin };
