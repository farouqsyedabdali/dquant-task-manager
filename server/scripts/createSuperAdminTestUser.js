/**
 * Creates or updates a SUPER_ADMIN test user for local/staging use only.
 * Usage (from server/): node scripts/createSuperAdminTestUser.js
 *
 * Requires DATABASE_URL in .env
 */
require('dotenv').config();
const path = require('path');

// Ensure Prisma loads server .env when cwd differs
if (!process.env.DATABASE_URL) {
  require('dotenv').config({ path: path.join(__dirname, '../.env') });
}

const bcrypt = require('bcrypt');
const prisma = require('../src/lib/prisma');

const USER_EMAIL = 'superadmintest@abc.com';
const USER_NAME = 'Super Admin Test';
const PASSWORD = 'pakistan1947';
const ORG_NAME = 'Super Admin Test Org';
const ORG_EMAIL = 'superadmintest-org@abc.com';

async function main() {
  const hashedPassword = await bcrypt.hash(PASSWORD, 10);

  let user = await prisma.user.findFirst({
    where: { email: USER_EMAIL },
    include: { company: true },
  });

  if (user) {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        name: USER_NAME,
        password: hashedPassword,
        role: 'SUPER_ADMIN',
        isEmailVerified: true,
        emailVerificationCode: null,
        emailVerificationExpires: null,
        authProvider: 'email',
      },
    });
    console.log(`Updated existing user id=${user.id} to SUPER_ADMIN (${USER_EMAIL})`);
    console.log(`Company: ${user.company.name} (id=${user.companyId})`);
    return;
  }

  let company = await prisma.company.findUnique({
    where: { email: ORG_EMAIL },
  });

  if (!company) {
    company = await prisma.company.create({
      data: {
        name: ORG_NAME,
        email: ORG_EMAIL,
        subscriptionPlan: 'free',
        autoArchivePeriod: 12,
        authProvider: 'email',
        isPersonal: false,
      },
    });
    console.log(`Created company id=${company.id} (${ORG_EMAIL})`);
  }

  user = await prisma.user.create({
    data: {
      name: USER_NAME,
      email: USER_EMAIL,
      password: hashedPassword,
      role: 'SUPER_ADMIN',
      companyId: company.id,
      isEmailVerified: true,
      authProvider: 'email',
    },
  });

  console.log(`Created SUPER_ADMIN user id=${user.id} (${USER_EMAIL})`);
  console.log(`Company id=${company.id} (${ORG_NAME})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
