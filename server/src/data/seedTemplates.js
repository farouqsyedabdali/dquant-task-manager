/**
 * Template Seeding Script
 * 
 * This script imports templates from JSON files into the database.
 * 
 * Usage:
 *   node server/src/data/seedTemplates.js
 * 
 * Make sure to:
 *   1. Create personal.json and professional.json files in server/src/data/templates/
 *   2. Follow the format specified in templateImportGuide.md
 *   3. Run database migrations first
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function seedTemplates() {
  try {
    console.log('🌱 Starting template seeding...');

    // Read template files
    const personalPath = path.join(__dirname, 'templates', 'personal.json');
    const professionalPath = path.join(__dirname, 'templates', 'professional.json');

    let personalTemplates = [];
    let professionalTemplates = [];

    if (fs.existsSync(personalPath)) {
      const personalData = fs.readFileSync(personalPath, 'utf8');
      personalTemplates = JSON.parse(personalData);
      console.log(`📄 Loaded ${personalTemplates.length} personal templates`);
    } else {
      console.log('⚠️  personal.json not found, skipping personal templates');
    }

    if (fs.existsSync(professionalPath)) {
      const professionalData = fs.readFileSync(professionalPath, 'utf8');
      professionalTemplates = JSON.parse(professionalData);
      console.log(`📄 Loaded ${professionalTemplates.length} professional templates`);
    } else {
      console.log('⚠️  professional.json not found, skipping professional templates');
    }

    // Get or create a system company (for system templates)
    // You may need to adjust this based on your setup
    let systemCompany = await prisma.company.findFirst({
      where: { isPersonal: false }
    });

    if (!systemCompany) {
      console.log('⚠️  No company found. System templates need a company. Please create a company first.');
      return;
    }

    // Get or create a system user (for system templates)
    let systemUser = await prisma.user.findFirst({
      where: { 
        companyId: systemCompany.id,
        role: { in: ['SYSDMIN', 'SUPER_ADMIN', 'ADMIN'] }
      }
    });

    if (!systemUser) {
      systemUser = await prisma.user.findFirst({
        where: { companyId: systemCompany.id }
      });
    }

    if (!systemUser) {
      console.log('⚠️  No user found. System templates need a user. Please create a user first.');
      return;
    }

    let importedCount = 0;
    let skippedCount = 0;

    // Import personal templates
    for (const templateData of personalTemplates) {
      try {
        // Check if template already exists
        const existing = await prisma.projectTemplate.findFirst({
          where: {
            name: templateData.name,
            companyId: systemCompany.id,
            isSystemTemplate: true,
            category: 'PERSONAL'
          }
        });

        if (existing) {
          console.log(`⏭️  Skipping "${templateData.name}" (already exists)`);
          skippedCount++;
          continue;
        }

        // Create template
        await prisma.projectTemplate.create({
          data: {
            name: templateData.name,
            description: templateData.description || null,
            icon: templateData.icon || '📁',
            color: templateData.color || '#6366f1',
            category: 'PERSONAL',
            isSystemTemplate: true,
            tags: templateData.tags || [],
            userId: systemUser.id,
            companyId: systemCompany.id,
            tasks: {
              create: templateData.tasks.map((task, index) => ({
                title: task.title,
                description: task.description || null,
                priority: task.priority || 'MEDIUM',
                order: index,
                daysOffset: 0
              }))
            }
          }
        });

        console.log(`✅ Imported personal template: "${templateData.name}"`);
        importedCount++;
      } catch (error) {
        console.error(`❌ Error importing "${templateData.name}":`, error.message);
      }
    }

    // Import professional templates
    for (const templateData of professionalTemplates) {
      try {
        // Check if template already exists
        const existing = await prisma.projectTemplate.findFirst({
          where: {
            name: templateData.name,
            companyId: systemCompany.id,
            isSystemTemplate: true,
            category: 'PROFESSIONAL'
          }
        });

        if (existing) {
          console.log(`⏭️  Skipping "${templateData.name}" (already exists)`);
          skippedCount++;
          continue;
        }

        // Create template
        await prisma.projectTemplate.create({
          data: {
            name: templateData.name,
            description: templateData.description || null,
            icon: templateData.icon || '📁',
            color: templateData.color || '#6366f1',
            category: 'PROFESSIONAL',
            isSystemTemplate: true,
            tags: templateData.tags || [],
            userId: systemUser.id,
            companyId: systemCompany.id,
            tasks: {
              create: templateData.tasks.map((task, index) => ({
                title: task.title,
                description: task.description || null,
                priority: task.priority || 'MEDIUM',
                order: index,
                daysOffset: 0
              }))
            }
          }
        });

        console.log(`✅ Imported professional template: "${templateData.name}"`);
        importedCount++;
      } catch (error) {
        console.error(`❌ Error importing "${templateData.name}":`, error.message);
      }
    }

    console.log('\n✨ Template seeding complete!');
    console.log(`   ✅ Imported: ${importedCount}`);
    console.log(`   ⏭️  Skipped: ${skippedCount}`);
    console.log(`   📊 Total: ${importedCount + skippedCount}`);

  } catch (error) {
    console.error('❌ Fatal error during seeding:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  seedTemplates()
    .then(() => {
      console.log('Done!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Seeding failed:', error);
      process.exit(1);
    });
}

module.exports = { seedTemplates };

