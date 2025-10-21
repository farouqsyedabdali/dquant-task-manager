const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const promoteToSuperAdmin = async (userEmail) => {
  try {
    console.log(`Promoting user ${userEmail} to SUPER_ADMIN...`);

    // Find the user by email
    const user = await prisma.user.findFirst({
      where: { email: userEmail },
      include: { company: true }
    });

    if (!user) {
      console.error(`User with email ${userEmail} not found`);
      return;
    }

    // Update user role to SUPER_ADMIN
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { role: 'SUPER_ADMIN' },
      include: { company: true }
    });

    console.log(`✅ Successfully promoted ${updatedUser.name} (${updatedUser.email}) to SUPER_ADMIN`);
    console.log(`Company: ${updatedUser.company.name}`);
    console.log(`User ID: ${updatedUser.id}`);

  } catch (error) {
    console.error('Promotion failed:', error);
  } finally {
    await prisma.$disconnect();
  }
};

// Run promotion if this file is executed directly
if (require.main === module) {
  const userEmail = process.argv[2];
  
  if (!userEmail) {
    console.error('Usage: node promoteToSuperAdmin.js <user-email>');
    process.exit(1);
  }
  
  promoteToSuperAdmin(userEmail);
}

module.exports = { promoteToSuperAdmin };
