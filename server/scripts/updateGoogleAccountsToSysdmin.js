require('dotenv').config();
const prisma = require('../src/lib/prisma');

/**
 * Script to update all Google-created personal accounts from EMPLOYEE to SYSDMIN role
 * This ensures Google OAuth signups have the same permissions as regular personal signups
 */
async function updateGoogleAccountsToSysdmin() {
  try {
    console.log('🔍 Finding Google-created personal accounts with EMPLOYEE role...\n');

    // Find all users with:
    // - authProvider = 'google'
    // - role = 'EMPLOYEE'
    // - company.isPersonal = true
    const usersToUpdate = await prisma.user.findMany({
      where: {
        authProvider: 'google',
        role: 'EMPLOYEE',
        company: {
          isPersonal: true
        }
      },
      include: {
        company: true
      }
    });

    if (usersToUpdate.length === 0) {
      console.log('✅ No Google-created personal accounts found with EMPLOYEE role.');
      console.log('   All accounts are already up to date!');
      return;
    }

    console.log(`📋 Found ${usersToUpdate.length} account(s) to update:\n`);
    usersToUpdate.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.name} (${user.email})`);
      console.log(`      Company: ${user.company.name}`);
      console.log(`      Current Role: ${user.role}`);
      console.log('');
    });

    // Update all users to SYSDMIN role
    console.log('🔄 Updating accounts to SYSDMIN role...\n');

    const updateResult = await prisma.user.updateMany({
      where: {
        authProvider: 'google',
        role: 'EMPLOYEE',
        company: {
          isPersonal: true
        }
      },
      data: {
        role: 'SYSDMIN'
      }
    });

    console.log(`✅ Successfully updated ${updateResult.count} account(s) to SYSDMIN role!\n`);

    // Verify the updates
    const updatedUsers = await prisma.user.findMany({
      where: {
        authProvider: 'google',
        role: 'SYSDMIN',
        company: {
          isPersonal: true
        }
      },
      include: {
        company: true
      }
    });

    console.log('📊 Updated accounts:\n');
    updatedUsers.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.name} (${user.email})`);
      console.log(`      Company: ${user.company.name}`);
      console.log(`      New Role: ${user.role}`);
      console.log('');
    });

    console.log('✨ Script completed successfully!');

  } catch (error) {
    console.error('❌ Error updating Google accounts:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
if (require.main === module) {
  updateGoogleAccountsToSysdmin()
    .then(() => {
      console.log('\n✅ All done!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = updateGoogleAccountsToSysdmin;


