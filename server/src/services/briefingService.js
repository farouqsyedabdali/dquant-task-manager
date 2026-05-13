const axios = require('axios')
const { formatInTimeZone, fromZonedTime } = require('date-fns-tz')
const prisma = require('../lib/prisma')
const { buildDashboardTaskVisibilityWhere } = require('../controllers/taskController')
const { createNotification } = require('../controllers/notificationController')
const secureLogger = require('../middleware/secureLogger')

const OPEN_STATUSES = ['TODO', 'IN_PROGRESS']
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
      const proj = t.project ? ` (Project: ${t.project.name})` : ''
      lines.push(`• ${t.title}${flag}${proj}`)
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
      const proj = t.project ? ` (Project: ${t.project.name})` : ''
      lines.push(`• ${t.title}${flag}${proj}`)
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
      const proj = t.project ? ` (Project: ${t.project.name})` : ''
      lines.push(`• ${t.title}${flag}${proj}`)
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
              'You are a warm, highly professional, and proactive executive assistant greeting your boss. Speak directly to them in a natural, conversational, and highly human tone—exactly like a real-life secretary would when handing them their morning coffee or giving an evening recap. Do not sound like a robot or AI. Avoid stiff corporate buzzwords. Instead of rigidly listing tasks, analyze their workload and provide a friendly, conversational summary (max ~1500 chars). Group related tasks, gently suggest what they should focus on first, and politely remind them of anything overdue. Offer a brief word of encouragement or a smart tip to set the tone for their day (or wrap up their evening). Keep facts exact; do not invent tasks or dates. Use plain text, no markdown. Do not start with robotic phrases like "Here is your briefing." Start naturally, like "Good morning! Hope you\'re doing well. Taking a look at your plate today..."'
          },
          {
            role: 'user',
            content: `Briefing type: ${kind}.\n\n${draftText}`
          }
        ],
        max_tokens: 500,
        temperature: 0.3
      },
      {
        headers: {
          Authorization: `Bearer ${key}`,
          'HTTP-Referer': process.env.CLIENT_URL || 'https://localhost',
          'X-Title': 'Tialz briefing'
        },
        timeout: 15_000
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
    select: { id: true, title: true, priority: true, status: true, dueDate: true, project: { select: { name: true } }, assignee: { select: { name: true } }, _count: { select: { subtasks: true, comments: true } } },
    orderBy: [{ priority: 'desc' }, { dueDate: 'asc' }]
  })

  const overdueOpen = await prisma.task.findMany({
    where: {
      ...vis,
      ...open,
      dueDate: { lt: dayStart, not: null }
    },
    select: { id: true, title: true, priority: true, status: true, dueDate: true, project: { select: { name: true } }, assignee: { select: { name: true } }, _count: { select: { subtasks: true, comments: true } } },
    orderBy: [{ priority: 'desc' }, { dueDate: 'asc' }]
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
    select: { id: true, title: true, priority: true, status: true, dueDate: true, project: { select: { name: true } }, assignee: { select: { name: true } }, _count: { select: { subtasks: true, comments: true } } },
    orderBy: [{ priority: 'desc' }, { dueDate: 'asc' }]
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

const TASK_PREVIEW_SELECT = {
  id: true, title: true, priority: true, status: true, dueDate: true,
  project: { select: { name: true } },
  assignee: { select: { name: true } },
  _count: { select: { subtasks: true, comments: true } }
}

const PRIORITY_SCORE = { URGENT: 40, HIGH: 30, MEDIUM: 15, LOW: 5 }

function scoreTask(task, dayStart) {
  let score = PRIORITY_SCORE[task.priority] || 10

  if (!task.dueDate) return score

  const due = new Date(task.dueDate)
  const now = dayStart
  const msPerDay = 86400000
  const daysUntilDue = Math.round((due - now) / msPerDay)

  if (daysUntilDue < 0) {
    // Overdue — the more overdue, the higher the urgency
    const daysOverdue = Math.abs(daysUntilDue)
    score += 25 + Math.min(daysOverdue * 3, 30) // cap at +55 total overdue bonus
  } else if (daysUntilDue === 0) {
    score += 20 // due today
  } else if (daysUntilDue === 1) {
    score += 10 // due tomorrow
  } else {
    score += 3  // coming up
  }

  // In-progress tasks get a small boost (you've already started)
  if (task.status === 'IN_PROGRESS') score += 8

  return score
}

/**
 * Generates a briefing preview without saving it or notifying the user.
 * Uses smart scoring to pick and prioritize the most important tasks.
 * @param {import('@prisma/client').User} user
 * @param {'MORNING' | 'EVENING'} kind
 */
async function previewBriefingForUser(user, kind) {
  const tz = briefingTimeZone(user)
  const now = new Date()
  const localDateLabel = formatInTimeZone(now, tz, 'EEE MMM d')
  const localDate = formatInTimeZone(now, tz, 'yyyy-MM-dd')
  const { start: dayStart, end: dayEnd } = localDayBounds(localDate, tz)

  const vis = buildDashboardTaskVisibilityWhere(user)
  const open = { status: { in: OPEN_STATUSES } }

  if (kind === 'MORNING') {
    // 1. Gather overdue tasks
    const overdueTasks = await prisma.task.findMany({
      where: { ...vis, ...open, dueDate: { lt: dayStart, not: null } },
      select: TASK_PREVIEW_SELECT
    })

    // 2. Gather tasks due today
    const dueTodayTasks = await prisma.task.findMany({
      where: { ...vis, ...open, dueDate: { gte: dayStart, lte: dayEnd } },
      select: TASK_PREVIEW_SELECT
    })

    // 3. Gather upcoming tasks (next 3 days)
    const upcomingStart = new Date(dayEnd.getTime() + 1)
    const upcomingEnd = new Date(dayStart.getTime() + 3 * 86400000)
    const upcomingEndOfDay = new Date(upcomingEnd)
    upcomingEndOfDay.setHours(23, 59, 59, 999)

    const upcomingTasks = await prisma.task.findMany({
      where: { ...vis, ...open, dueDate: { gt: dayEnd, lte: upcomingEndOfDay } },
      select: TASK_PREVIEW_SELECT
    })

    // 4. Also grab high-priority tasks with no due date (they might be important)
    const noDueDateUrgent = await prisma.task.findMany({
      where: { ...vis, ...open, dueDate: null, priority: { in: ['URGENT', 'HIGH'] } },
      select: TASK_PREVIEW_SELECT,
      take: 5
    })

    const allTasks = [
      ...overdueTasks.map(t => ({ ...t, _category: 'overdue' })),
      ...dueTodayTasks.map(t => ({ ...t, _category: 'due_today' })),
      ...upcomingTasks.map(t => ({ ...t, _category: 'upcoming' })),
      ...noDueDateUrgent.map(t => ({ ...t, _category: 'high_priority' })),
    ]

    if (allTasks.length === 0) {
      return {
        skipped: true,
        reason: 'nothing_to_report',
        content: null,
        tasks: [],
        stats: { total: 0 }
      }
    }

    // 5. Score and sort
    const scored = allTasks.map(t => ({ ...t, _score: scoreTask(t, dayStart) }))
    scored.sort((a, b) => b._score - a._score)

    // 6. Pick the top tasks as "Focus First" (top 5 highest scored)
    const focusFirst = scored.slice(0, 5).map(t => ({ ...t, category: 'focus_first' }))
    const focusIds = new Set(focusFirst.map(t => t.id))

    // 7. Categorize the rest, but cap at 15 tasks so we don't overwhelm the user
    // Since 'rest' is already sorted by score, we just take the top 15
    const rest = scored.filter(t => !focusIds.has(t.id)).slice(0, 15)
    const categorized = rest.map(t => ({ ...t, category: t._category }))

    const tasks = [...focusFirst, ...categorized]

    // Clean internal fields
    tasks.forEach(t => { delete t._score; delete t._category })

    const stats = {
      total: tasks.length,
      hidden: allTasks.length - tasks.length,
      overdue: overdueTasks.length,
      dueToday: dueTodayTasks.length,
      upcoming: upcomingTasks.length,
      highPriority: allTasks.filter(t => t.priority === 'URGENT' || t.priority === 'HIGH').length,
    }

    return { skipped: false, content: null, tasks, stats, localDate: localDateLabel }

  } else {
    // EVENING briefing — recap of today + preview of tomorrow
    const dueToday = await prisma.task.findMany({
      where: { ...vis, dueDate: { gte: dayStart, lte: dayEnd } },
      select: TASK_PREVIEW_SELECT
    })

    // Also get what's due tomorrow for a heads-up
    const tomorrowStart = new Date(dayEnd.getTime() + 1)
    const tomorrowEnd = new Date(dayStart.getTime() + 86400000)
    tomorrowEnd.setHours(23, 59, 59, 999)

    const dueTomorrowRaw = await prisma.task.findMany({
      where: { ...vis, ...open, dueDate: { gt: dayEnd, lte: tomorrowEnd } },
      select: TASK_PREVIEW_SELECT
    })

    const completed = dueToday.filter(t => t.status === 'COMPLETED')
    const stillOpen = dueToday.filter(t => OPEN_STATUSES.includes(t.status))
    const cancelled = dueToday.filter(t => t.status === 'CANCELLED')
    
    // Sort due tomorrow by priority
    const dueTomorrow = dueTomorrowRaw.map(t => ({ ...t, _score: scoreTask(t, dayStart) })).sort((a, b) => b._score - a._score)
    dueTomorrow.forEach(t => delete t._score)

    if (completed.length === 0 && stillOpen.length === 0 && cancelled.length === 0 && dueTomorrow.length === 0) {
      return {
        skipped: true,
        reason: 'nothing_due_today',
        content: null,
        tasks: [],
        stats: { completed: 0, stillOpen: 0, cancelled: 0, dueTomorrow: 0, hidden: 0 }
      }
    }

    // Cap the lists so it's not overwhelming
    const cappedCompleted = completed.slice(0, 10)
    const cappedStillOpen = stillOpen.slice(0, 10)
    const cappedCancelled = cancelled.slice(0, 5)
    const cappedDueTomorrow = dueTomorrow.slice(0, 10)

    const totalHidden = (completed.length - cappedCompleted.length) + 
                        (stillOpen.length - cappedStillOpen.length) + 
                        (cancelled.length - cappedCancelled.length) + 
                        (dueTomorrow.length - cappedDueTomorrow.length);

    const tasks = [
      ...cappedCompleted.map(t => ({ ...t, category: 'completed' })),
      ...cappedStillOpen.map(t => ({ ...t, category: 'still_open' })),
      ...cappedCancelled.map(t => ({ ...t, category: 'cancelled' })),
      ...cappedDueTomorrow.map(t => ({ ...t, category: 'due_tomorrow' })),
    ]

    const stats = {
      completed: completed.length,
      stillOpen: stillOpen.length,
      cancelled: cancelled.length,
      dueTomorrow: dueTomorrow.length,
      hidden: totalHidden
    }

    return { skipped: false, content: null, tasks, stats, localDate: localDateLabel }
  }
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
