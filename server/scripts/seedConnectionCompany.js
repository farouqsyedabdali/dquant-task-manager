/**
 * Seed "Connection Company" with 20 employees + 1 SYSDMIN for local QA
 * (tasks, notifications, sharing, co-assignees).
 *
 * Usage (from server/):
 *   node scripts/seedConnectionCompany.js
 *   node scripts/seedConnectionCompany.js --force   # delete existing company + users, then re-seed
 *
 * Requires: DATABASE_URL in .env (same as Prisma).
 * Password for all users: 123456
 *
 * ⚠️ For development / staging only. Do not use weak passwords on production.
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

const COMPANY_NAME = 'Connection Company';
const COMPANY_EMAIL = 'company@connectioncompany.com';
const DOMAIN = 'connectioncompany.com';
const PLAIN_PASSWORD = '123456';
const EMPLOYEE_COUNT = 20;

/**
 * Remove company and dependent rows (for --force re-seed).
 * Deletes leaf tasks first so subtasks and task-related cascades resolve cleanly.
 */
async function deleteConnectionCompanyCascade(companyId) {
  await prisma.$transaction(async (tx) => {
    let removed = true;
    while (removed) {
      const leaf = await tx.task.findFirst({
        where: {
          companyId,
          subtasks: { none: {} },
        },
        select: { id: true },
      });
      if (leaf) {
        await tx.task.delete({ where: { id: leaf.id } });
      } else {
        removed = false;
      }
    }

    await tx.projectMember.deleteMany({
      where: { project: { companyId } },
    });
    await tx.project.deleteMany({ where: { companyId } });
    await tx.projectTemplate.deleteMany({ where: { companyId } });

    await tx.user.deleteMany({ where: { companyId } });
    await tx.company.delete({ where: { id: companyId } });
  });
}

async function main() {
  const force = process.argv.includes('--force');

  const existing = await prisma.company.findFirst({
    where: { OR: [{ name: COMPANY_NAME }, { email: COMPANY_EMAIL }] },
  });

  if (existing && !force) {
    console.log(
      `⏭️  "${COMPANY_NAME}" (or ${COMPANY_EMAIL}) already exists. Use --force to remove it and all its data, then re-seed.`
    );
    process.exit(0);
  }

  if (existing && force) {
    console.log(`🗑️  Removing existing company id=${existing.id} and related data...`);
    await deleteConnectionCompanyCascade(existing.id);
    console.log('✅ Removed.');
  }

  const passwordHash = await bcrypt.hash(PLAIN_PASSWORD, 10);

  const company = await prisma.company.create({
    data: {
      name: COMPANY_NAME,
      email: COMPANY_EMAIL,
      passwordHash,
      subscriptionPlan: 'free',
      authProvider: 'email',
    },
  });

  console.log(`✅ Company created: ${company.name} (id=${company.id})`);

  const usersData = [];

  for (let i = 1; i <= EMPLOYEE_COUNT; i += 1) {
    usersData.push({
      name: `Person ${i}`,
      email: `person${i}@${DOMAIN}`,
      password: passwordHash,
      role: 'EMPLOYEE',
      companyId: company.id,
      authProvider: 'email',
      isEmailVerified: true,
      emailVerificationCode: null,
    });
  }

  usersData.push({
    name: 'Admin (SYSDMIN)',
    email: `admin@${DOMAIN}`,
    password: passwordHash,
    role: 'SYSDMIN',
    companyId: company.id,
    authProvider: 'email',
    isEmailVerified: true,
    emailVerificationCode: null,
  });

  await prisma.user.createMany({ data: usersData });

  console.log(`✅ Created ${usersData.length} users (person1–person20 + admin).`);
  console.log('');
  console.log('📋 Logins (password for all: 123456)');
  console.log(`   Company record email (not a login user): ${COMPANY_EMAIL}`);
  console.log(`   Employees: person1@${DOMAIN} … person${EMPLOYEE_COUNT}@${DOMAIN}`);
  console.log(`   SYSDMIN: admin@${DOMAIN}`);
  console.log('');
  console.log('⚠️  Dev/staging only — do not use on production.');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
