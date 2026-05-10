#!/usr/bin/env node
/**
 * Test script for morning/evening briefings.
 *
 * Usage:
 *   node scripts/testBriefing.js                  # morning briefing for first user with briefings enabled
 *   node scripts/testBriefing.js --kind EVENING   # evening briefing
 *   node scripts/testBriefing.js --user 1         # specific user ID
 *   node scripts/testBriefing.js --user 1 --kind EVENING --force
 *
 * Options:
 *   --kind     MORNING (default) or EVENING
 *   --user     User ID to run briefing for. If omitted, picks first user with briefings enabled.
 *   --force    Delete today's existing BriefingLog so the briefing can re-run.
 */

require('dotenv').config();
const prisma = require('../src/lib/prisma');
const { runBriefingForUser, briefingTimeZone } = require('../src/services/briefingService');
const { formatInTimeZone } = require('date-fns-tz');

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = { kind: 'MORNING', userId: null, force: false };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--kind' && args[i + 1]) {
      opts.kind = args[++i].toUpperCase();
    } else if (args[i] === '--user' && args[i + 1]) {
      opts.userId = parseInt(args[++i], 10);
    } else if (args[i] === '--force') {
      opts.force = true;
    }
  }
  if (!['MORNING', 'EVENING'].includes(opts.kind)) {
    console.error('--kind must be MORNING or EVENING');
    process.exit(1);
  }
  return opts;
}

async function main() {
  const opts = parseArgs();

  let user;
  if (opts.userId) {
    user = await prisma.user.findUnique({
      where: { id: opts.userId },
      include: { company: true },
    });
    if (!user) {
      console.error(`User ${opts.userId} not found.`);
      process.exit(1);
    }
  } else {
    user = await prisma.user.findFirst({
      where: {
        OR: [{ briefingMorningEnabled: true }, { briefingEveningEnabled: true }],
      },
      include: { company: true },
    });
    if (!user) {
      // Fall back to any user
      user = await prisma.user.findFirst({ include: { company: true } });
    }
    if (!user) {
      console.error('No users found in the database.');
      process.exit(1);
    }
  }

  const tz = briefingTimeZone(user);
  const now = new Date();
  const localDate = formatInTimeZone(now, tz, 'yyyy-MM-dd');

  console.log('=== Briefing Test ===');
  console.log(`User:      ${user.name} (id=${user.id})`);
  console.log(`Company:   ${user.company?.name} (id=${user.companyId})`);
  console.log(`Kind:      ${opts.kind}`);
  console.log(`Timezone:  ${tz}`);
  console.log(`LocalDate: ${localDate}`);
  console.log('');

  if (opts.force) {
    const deleted = await prisma.briefingLog.deleteMany({
      where: { userId: user.id, kind: opts.kind, localDate },
    });
    if (deleted.count > 0) {
      console.log(`Deleted ${deleted.count} existing BriefingLog(s) for today (--force).`);
    }
  }

  console.log(`Running ${opts.kind} briefing...\n`);
  const result = await runBriefingForUser(user, opts.kind);

  if (result.skipped) {
    console.log(`⏭  Skipped: ${result.reason}`);
    if (result.reason === 'already_logged') {
      console.log('   (Use --force to delete the existing log and re-run.)');
    }
  } else {
    console.log(`✅ Briefing sent! Kind=${result.kind}, LocalDate=${result.localDate}`);
    // Fetch the created log to show the content
    const log = await prisma.briefingLog.findUnique({
      where: {
        userId_kind_localDate: { userId: user.id, kind: opts.kind, localDate: result.localDate },
      },
    });
    if (log) {
      console.log('\n--- Briefing Content ---');
      console.log(log.content);
      console.log('--- End ---');
    }

    // Also show the notification
    const notif = await prisma.notification.findFirst({
      where: {
        userId: user.id,
        type: opts.kind === 'MORNING' ? 'MORNING_BRIEFING' : 'EVENING_BRIEFING',
      },
      orderBy: { createdAt: 'desc' },
    });
    if (notif) {
      console.log(`\nNotification created (id=${notif.id}, read=${notif.isRead})`);
    }
  }

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
