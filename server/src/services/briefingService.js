const axios = require('axios')
const { formatInTimeZone, fromZonedTime } = require('date-fns-tz')
const prisma = require('../lib/prisma')
const { buildDashboardTaskVisibilityWhere } = require('../controllers/taskController')
const { createNotification } = require('../controllers/notificationController')
const secureLogger = require('../middleware/secureLogger')

const OPEN_STATUSES = ['TODO', 'IN_PROGRESS', 'ON_HOLD']
function briefingTimeZone(user) {
  const z = user.briefingTimezone && String(user.briefingTimezone).trim()
  return z || 'UTC'
}

function normalizeTimeSlot(s) {
  if (s == null || typeof s !== 'string') return null
  const m = s.trim().match(/^(\d{1,2}):(\d{2})$/)
  if (!m) return null
  let h = parseInt(m[1], 10)
  let min = parseInt(m[2], 10)
  if (Number.isNaN(h) || Number.isNaN(min)) return null
  h = Math.min(23, Math.max(0, h))
  min = Math.min(59, Math.max(0, min))
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`
}

function localDayBounds(localDateStr, tz) {
  const start = fromZonedTime(`${localDateStr}T00:00:00.000`, tz)
  const end = fromZonedTime(`${localDateStr}T23:59:59.999`, tz)
  return { start, end }
}

function isHighPriority(p) {
  return p === 'HIGH' || p === 'URGENT'
}

function buildMorningTemplate({ localDateLabel, dueTodayOpen, overdueOpen }) {
  const dueUrgent = dueTodayOpen.filter((t) => isHighPriority(t.priority))
  const overdueUrgent = overdueOpen.filter((t) => isHighPriority(t.priority))
  const lines = []
  lines.push(`Morning briefing — ${localDateLabel}`)
  lines.push('')
  lines.push(
    `Due today (open): ${dueTodayOpen.length}${dueUrgent.length ? ` (${dueUrgent.length} high/urgent)` : ''}`
  )
  if (dueTodayOpen.length) {
    dueTodayOpen.slice(0, 12).forEach((t) => {
      const flag = isHighPriority(t.priority) ? ` [${t.priority}]` : ''
      lines.push(`• ${t.title}${flag}`)
    })
    if (dueTodayOpen.length > 12) lines.push(`• …and ${dueTodayOpen.length - 12} more`)
  }
  lines.push('')
  lines.push(
    `Overdue (open): ${overdueOpen.length}${overdueUrgent.length ? ` (${overdueUrgent.length} high/urgent)` : ''}`
  )
  if (overdueOpen.length) {
    overdueOpen.slice(0, 8).forEach((t) => {
      const flag = isHighPriority(t.priority) ? ` [${t.priority}]` : ''
      lines.push(`• ${t.title}${flag}`)
    })
    if (overdueOpen.length > 8) lines.push(`• …and ${overdueOpen.length - 8} more`)
  }
  return lines.join('\n')
}

function buildEveningTemplate({ localDateLabel, dueTodayCompleted, dueTodayStillOpen, dueTodayCancelled }) {
  const lines = []
  lines.push(`Evening briefing — ${localDateLabel}`)
  lines.push('')
  const total =
    dueTodayCompleted.length + dueTodayStillOpen.length + dueTodayCancelled.length
  lines.push(
    `Due today: ${total} total — ${dueTodayCompleted.length} completed, ${dueTodayStillOpen.length} still open` +
      (dueTodayCancelled.length ? `, ${dueTodayCancelled.length} cancelled` : '')
  )
  if (dueTodayStillOpen.length) {
    lines.push('')
    lines.push('Still open:')
    dueTodayStillOpen.slice(0, 12).forEach((t) => {
      const flag = isHighPriority(t.priority) ? ` [${t.priority}]` : ''
      lines.push(`• ${t.title}${flag}`)
    })
    if (dueTodayStillOpen.length > 12) lines.push(`• …and ${dueTodayStillOpen.length - 12} more`)
  }
  return lines.join('\n')
}

async function maybeEnhanceWithLlm(kind, draftText) {
  const key = process.env.OPENROUTER_API_KEY
  if (!key || String(key).trim() === '') return draftText

  const model =
    process.env.BRIEFING_OPENROUTER_MODEL || 'openai/gpt-4o-mini'

  try {
    const { data } = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model,
        messages: [
          {
            role: 'system',
            content:
              'You rewrite task briefing notes into a short, friendly notification (max ~1200 chars). Keep facts exact; do not invent tasks or dates. Use plain text, no markdown.'
          },
          {
            role: 'user',
            content: `Briefing type: ${kind}.\n\n${draftText}`
          }
        ],
        max_tokens: 600,
        temperature: 0.3
      },
      {
        headers: {
          Authorization: `Bearer ${key}`,
          'HTTP-Referer': process.env.CLIENT_URL || 'https://localhost',
          'X-Title': 'Tialz briefing'
        },
        timeout: 25_000
      }
    )
    const text = data?.choices?.[0]?.message?.content
    if (text && String(text).trim()) return String(text).trim()
  } catch (e) {
    secureLogger.warn('Briefing LLM skipped', { message: e.message })
  }
  return draftText
}

async function gatherMorningTasks(user, dayStart, dayEnd) {
  const vis = buildDashboardTaskVisibilityWhere(user)
  const open = { status: { in: OPEN_STATUSES } }

  const dueTodayOpen = await prisma.task.findMany({
    where: {
      ...vis,
      ...open,
      dueDate: { gte: dayStart, lte: dayEnd }
    },
    select: { id: true, title: true, priority: true, status: true, dueDate: true }
  })

  const overdueOpen = await prisma.task.findMany({
    where: {
      ...vis,
      ...open,
      dueDate: { lt: dayStart, not: null }
    },
    select: { id: true, title: true, priority: true, status: true, dueDate: true }
  })

  return { dueTodayOpen, overdueOpen }
}

async function gatherEveningTasks(user, dayStart, dayEnd) {
  const vis = buildDashboardTaskVisibilityWhere(user)
  const dueToday = await prisma.task.findMany({
    where: {
      ...vis,
      dueDate: { gte: dayStart, lte: dayEnd }
    },
    select: { id: true, title: true, priority: true, status: true, dueDate: true }
  })
  const dueTodayCompleted = dueToday.filter((t) => t.status === 'COMPLETED')
  const dueTodayStillOpen = dueToday.filter((t) =>
    OPEN_STATUSES.includes(t.status)
  )
  const dueTodayCancelled = dueToday.filter((t) => t.status === 'CANCELLED')
  return { dueTodayCompleted, dueTodayStillOpen, dueTodayCancelled }
}

/**
 * @param {import('@prisma/client').User} user
 * @param {'MORNING' | 'EVENING'} kind
 */
async function runBriefingForUser(user, kind) {
  const tz = briefingTimeZone(user)
  const now = new Date()
  const localDate = formatInTimeZone(now, tz, 'yyyy-MM-dd')
  const localDateLabel = formatInTimeZone(now, tz, 'EEE MMM d')

  const exists = await prisma.briefingLog.findUnique({
    where: {
      userId_kind_localDate: { userId: user.id, kind, localDate }
    }
  })
  if (exists) return { skipped: true, reason: 'already_logged' }

  const { start: dayStart, end: dayEnd } = localDayBounds(localDate, tz)

  let draft
  let title
  let notifType

  if (kind === 'MORNING') {
    const { dueTodayOpen, overdueOpen } = await gatherMorningTasks(user, dayStart, dayEnd)
    if (dueTodayOpen.length === 0 && overdueOpen.length === 0) {
      try {
        await prisma.briefingLog.create({
          data: {
            userId: user.id,
            companyId: user.companyId,
            kind: 'MORNING',
            localDate,
            content: ''
          }
        })
      } catch (e) {
        if (e.code !== 'P2002') throw e
      }
      return { skipped: true, reason: 'nothing_to_report' }
    }
    draft = buildMorningTemplate({
      localDateLabel,
      dueTodayOpen,
      overdueOpen
    })
    title = 'Morning briefing'
    notifType = 'MORNING_BRIEFING'
  } else {
    const { dueTodayCompleted, dueTodayStillOpen, dueTodayCancelled } = await gatherEveningTasks(
      user,
      dayStart,
      dayEnd
    )
    if (
      dueTodayCompleted.length === 0 &&
      dueTodayStillOpen.length === 0 &&
      dueTodayCancelled.length === 0
    ) {
      try {
        await prisma.briefingLog.create({
          data: {
            userId: user.id,
            companyId: user.companyId,
            kind: 'EVENING',
            localDate,
            content: ''
          }
        })
      } catch (e) {
        if (e.code !== 'P2002') throw e
      }
      return { skipped: true, reason: 'nothing_due_today' }
    }
    draft = buildEveningTemplate({
      localDateLabel,
      dueTodayCompleted,
      dueTodayStillOpen,
      dueTodayCancelled,
    })
    title = 'Evening briefing'
    notifType = 'EVENING_BRIEFING'
  }

  const message = await maybeEnhanceWithLlm(kind, draft)

  try {
    await prisma.briefingLog.create({
      data: {
        userId: user.id,
        companyId: user.companyId,
        kind,
        localDate,
        content: message
      }
    })
  } catch (e) {
    if (e.code === 'P2002') return { skipped: true, reason: 'race_duplicate' }
    throw e
  }

  await createNotification(
    notifType,
    title,
    message,
    null,
    user.id,
    user.companyId
  )

  return { skipped: false, kind, localDate }
}

/**
 * Generates a briefing preview without saving it or notifying the user.
 * @param {import('@prisma/client').User} user
 * @param {'MORNING' | 'EVENING'} kind
 */
async function previewBriefingForUser(user, kind) {
  const tz = briefingTimeZone(user)
  const now = new Date()
  const localDateLabel = formatInTimeZone(now, tz, 'EEE MMM d')
  const localDate = formatInTimeZone(now, tz, 'yyyy-MM-dd')
  const { start: dayStart, end: dayEnd } = localDayBounds(localDate, tz)

  let draft
  if (kind === 'MORNING') {
    const { dueTodayOpen, overdueOpen } = await gatherMorningTasks(user, dayStart, dayEnd)
    if (dueTodayOpen.length === 0 && overdueOpen.length === 0) {
      return { skipped: true, reason: 'nothing_to_report', content: 'You have no tasks due today or overdue!' }
    }
    draft = buildMorningTemplate({
      localDateLabel,
      dueTodayOpen,
      overdueOpen
    })
  } else {
    const { dueTodayCompleted, dueTodayStillOpen, dueTodayCancelled } = await gatherEveningTasks(
      user,
      dayStart,
      dayEnd
    )
    if (
      dueTodayCompleted.length === 0 &&
      dueTodayStillOpen.length === 0 &&
      dueTodayCancelled.length === 0
    ) {
      return { skipped: true, reason: 'nothing_due_today', content: 'You had no tasks due today!' }
    }
    draft = buildEveningTemplate({
      localDateLabel,
      dueTodayCompleted,
      dueTodayStillOpen,
      dueTodayCancelled,
    })
  }

  const message = await maybeEnhanceWithLlm(kind, draft)
  return { skipped: false, content: message }
}

async function tickBriefings() {
  const users = await prisma.user.findMany({
    where: {
      OR: [{ briefingMorningEnabled: true }, { briefingEveningEnabled: true }]
    },
    include: { company: true }
  })

  const now = new Date()
  let sent = 0

  for (const user of users) {
    const tz = briefingTimeZone(user)
    const localHM = formatInTimeZone(now, tz, 'HH:mm')

    if (
      user.briefingMorningEnabled &&
      normalizeTimeSlot(user.briefingMorningTime) === localHM
    ) {
      const r = await runBriefingForUser(user, 'MORNING')
      if (!r.skipped) sent++
    }

    if (
      user.briefingEveningEnabled &&
      normalizeTimeSlot(user.briefingEveningTime) === localHM
    ) {
      const r = await runBriefingForUser(user, 'EVENING')
      if (!r.skipped) sent++
    }
  }

  return { checked: users.length, sent }
}

module.exports = {
  briefingTimeZone,
  normalizeTimeSlot,
  runBriefingForUser,
  previewBriefingForUser,
  tickBriefings
}
