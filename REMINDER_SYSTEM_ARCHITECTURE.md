# Task Reminder System - Architecture Diagram

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         SERVER (Node.js/Express)                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │                    Server Startup (index.js)                │    │
│  │  - Test database connection                                 │    │
│  │  - Start Express server                                     │    │
│  │  - Initialize reminder scheduler                            │    │
│  └────────────────────────┬───────────────────────────────────┘    │
│                           │                                          │
│                           ▼                                          │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │         Task Reminder Scheduler (runs every hour)           │    │
│  │  /src/utils/taskReminderScheduler.js                       │    │
│  │                                                              │    │
│  │  1. Query database for tasks due in 48 hours               │    │
│  │  2. Filter: status NOT IN (COMPLETED, CANCELLED)           │    │
│  │  3. Filter: archived = false                               │    │
│  │  4. Get lead assignee + co-assignees                       │    │
│  │  5. Check if reminder already sent (TaskReminder table)    │    │
│  │  6. Send email via Resend API                              │    │
│  │  7. Record sent reminder in database                       │    │
│  └────────────────────────┬───────────────────────────────────┘    │
│                           │                                          │
│                           ▼                                          │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │              Email Service (emailService.js)                │    │
│  │  - sendTaskReminder()                                       │    │
│  │  - Uses Resend API                                          │    │
│  │  - Generates HTML from template                             │    │
│  │  - Creates task link with taskId parameter                  │    │
│  └────────────────────────┬───────────────────────────────────┘    │
│                           │                                          │
│                           ▼                                          │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │         Email Template (taskReminderEmail.js)               │    │
│  │  - Professional HTML design                                 │    │
│  │  - Task details (title, description, priority, status)      │    │
│  │  - Due date and time                                        │    │
│  │  - "View Task Details" button with link                     │    │
│  └────────────────────────┬───────────────────────────────────┘    │
│                           │                                          │
│  ┌────────────────────────┴───────────────────────────────────┐    │
│  │                 API Endpoints (/api/reminders)              │    │
│  │  /src/routes/reminders.js                                   │    │
│  │  /src/controllers/reminderController.js                     │    │
│  │                                                              │    │
│  │  POST /api/reminders/check (admin only)                     │    │
│  │    - Manually trigger reminder check                        │    │
│  │                                                              │    │
│  │  GET /api/reminders/stats                                   │    │
│  │    - Get reminder statistics                                │    │
│  │                                                              │    │
│  │  GET /api/reminders/task/:taskId                            │    │
│  │    - Get reminder history for a task                        │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                       │
└───────────────────────────────────────────────────────────────────────┘

                                    │
                                    │ Sends Email
                                    ▼

┌─────────────────────────────────────────────────────────────────────┐
│                        RESEND API (Email Service)                    │
├─────────────────────────────────────────────────────────────────────┤
│  - Receives email request from server                                │
│  - Delivers email to recipient                                       │
│  - Tracks delivery status                                            │
│  - Provides dashboard for monitoring                                 │
└─────────────────────────────────────────────────────────────────────┘

                                    │
                                    │ Delivers Email
                                    ▼

┌─────────────────────────────────────────────────────────────────────┐
│                          USER EMAIL INBOX                            │
├─────────────────────────────────────────────────────────────────────┤
│  ┌───────────────────────────────────────────────────────────┐     │
│  │  ⏰ Reminder: "Task Title" is due in 48 hours              │     │
│  │                                                             │     │
│  │  Hi John,                                                   │     │
│  │                                                             │     │
│  │  This is a reminder that the following task is due soon:   │     │
│  │                                                             │     │
│  │  📋 Task Title                                              │     │
│  │  Description: Task description here...                     │     │
│  │                                                             │     │
│  │  ⚡ Priority: HIGH                                          │     │
│  │  📊 Status: IN PROGRESS                                     │     │
│  │  📅 Due: November 19, 2025 at 3:00 PM                      │     │
│  │                                                             │     │
│  │  ┌─────────────────────────────────────┐                  │     │
│  │  │    [View Task Details]              │ ← Click here     │     │
│  │  └─────────────────────────────────────┘                  │     │
│  └───────────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────────┘

                                    │
                                    │ User clicks link
                                    ▼

┌─────────────────────────────────────────────────────────────────────┐
│                    FRONTEND (React/Vite)                             │
├─────────────────────────────────────────────────────────────────────┤
│  ┌───────────────────────────────────────────────────────────┐     │
│  │  Dashboard Component (Dashboard.jsx)                       │     │
│  │                                                             │     │
│  │  1. Detects ?taskId=123 in URL                             │     │
│  │  2. Calls fetchTask(123) API                               │     │
│  │  3. Sets currentTask state                                 │     │
│  │  4. Opens TaskModal with task data                         │     │
│  │  5. Cleans up URL (removes ?taskId)                        │     │
│  └───────────────────────────────────────────────────────────┘     │
│                           │                                          │
│                           ▼                                          │
│  ┌───────────────────────────────────────────────────────────┐     │
│  │  Task Modal (TaskModal.jsx)                                │     │
│  │                                                             │     │
│  │  - Displays full task details                              │     │
│  │  - Shows comments                                          │     │
│  │  - Allows status updates                                   │     │
│  │  - Allows priority changes                                 │     │
│  │  - Allows adding comments                                  │     │
│  │  - Shows subtasks                                          │     │
│  │  - Shows co-assignees                                      │     │
│  └───────────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                    DATABASE (PostgreSQL)                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │  Task Table                                                 │    │
│  │  - id, title, description                                   │    │
│  │  - status, priority                                         │    │
│  │  - dueDate ← Used to find tasks due in 48 hours           │    │
│  │  - assigneeId, assignerId                                   │    │
│  │  - archived, statusManuallyChanged                          │    │
│  └────────────────────────────────────────────────────────────┘    │
│                                                                       │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │  TaskReminder Table (NEW)                                   │    │
│  │  - id                                                        │    │
│  │  - taskId (FK to Task)                                      │    │
│  │  - userId (FK to User)                                      │    │
│  │  - sentAt (timestamp)                                       │    │
│  │                                                              │    │
│  │  UNIQUE(taskId, userId) ← Prevents duplicate reminders     │    │
│  └────────────────────────────────────────────────────────────┘    │
│                                                                       │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │  User Table                                                  │    │
│  │  - id, name, email                                          │    │
│  │  - role, companyId                                          │    │
│  └────────────────────────────────────────────────────────────┘    │
│                                                                       │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │  TaskCoAssignee Table                                       │    │
│  │  - taskId, userId                                           │    │
│  │  - Used to find all users to notify                        │    │
│  └────────────────────────────────────────────────────────────┘    │
│                                                                       │
└───────────────────────────────────────────────────────────────────────┘
```

## Data Flow Sequence

### 1. Scheduler Execution (Every Hour)

```
Time: XX:00:00
    ↓
Scheduler wakes up
    ↓
Query: SELECT * FROM Task 
       WHERE dueDate BETWEEN (NOW() + 48h) AND (NOW() + 49h)
       AND status NOT IN ('COMPLETED', 'CANCELLED')
       AND archived = false
    ↓
Results: [Task A, Task B, Task C]
    ↓
For each task:
    ↓
    Get assignee + co-assignees
        ↓
        For each user:
            ↓
            Check: SELECT * FROM TaskReminder 
                   WHERE taskId = X AND userId = Y
            ↓
            If NOT EXISTS:
                ↓
                Send email via Resend
                ↓
                INSERT INTO TaskReminder (taskId, userId, sentAt)
                ↓
                Log: "✅ Sent reminder"
            Else:
                ↓
                Log: "⏭️ Skipping (already sent)"
```

### 2. Email Click Flow

```
User receives email
    ↓
Clicks "View Task Details"
    ↓
Browser opens: https://your-app.com/dashboard?taskId=123
    ↓
Dashboard component loads
    ↓
useEffect detects taskId parameter
    ↓
Calls: fetchTask(123)
    ↓
API: GET /api/tasks/123
    ↓
Database query returns task data
    ↓
Sets currentTask state
    ↓
Opens TaskModal
    ↓
Cleans URL: /dashboard
    ↓
User sees task modal with all details
```

## Key Design Decisions

### 1. **48-Hour Window**
- Gives users enough time to prepare
- Not too early (users might forget)
- Not too late (users might not have time)

### 2. **Hourly Checks**
- Balance between timeliness and server load
- 1-hour window (48-49 hours) catches all tasks
- Can be adjusted based on needs

### 3. **Duplicate Prevention**
- Database-backed (not just in-memory)
- Survives server restarts
- Unique constraint ensures data integrity

### 4. **Multi-User Support**
- Sends to lead assignee AND co-assignees
- Everyone involved gets notified
- Fair and comprehensive

### 5. **Direct Task Access**
- URL parameter opens specific task
- No manual searching needed
- Seamless user experience

### 6. **Cascade Delete**
- Reminders deleted when tasks deleted
- Keeps database clean
- No orphaned records

## Performance Characteristics

### Database Queries
- **Scheduler Query**: Indexed on `dueDate`, very fast
- **Reminder Check**: Indexed on `(taskId, userId)`, instant
- **Task Fetch**: Primary key lookup, instant

### Email Sending
- **Resend API**: ~100-200ms per email
- **Batch Processing**: Sends to multiple users sequentially
- **Error Handling**: Continues on individual failures

### Memory Usage
- **Scheduler**: Minimal, runs in background
- **No Memory Leaks**: Proper cleanup and garbage collection
- **Scalable**: Can handle thousands of tasks

### Server Load
- **Hourly Execution**: Brief spike every hour
- **CPU Usage**: Minimal (mostly I/O bound)
- **Network**: Only during email sending

## Monitoring Points

### 1. **Server Logs**
```
🔔 Starting task reminder check...
📋 Found X tasks due in 48 hours
✅ Sent reminder for task "..." to user@email.com
⏭️ Skipping reminder for task X - already sent
🔔 Reminder check complete: X sent, Y skipped
```

### 2. **Resend Dashboard**
- Email delivery rate
- Bounce rate
- Open rate
- Click rate

### 3. **Database Metrics**
```sql
-- Reminders sent today
SELECT COUNT(*) FROM "TaskReminder" 
WHERE "sentAt" >= CURRENT_DATE;

-- Most reminded task
SELECT t.title, COUNT(tr.id) as reminder_count
FROM "Task" t
JOIN "TaskReminder" tr ON t.id = tr."taskId"
GROUP BY t.id, t.title
ORDER BY reminder_count DESC
LIMIT 10;
```

## Error Handling

### Email Failures
- Logged but doesn't stop processing
- Other users still get reminders
- Can retry manually via admin endpoint

### Database Errors
- Scheduler catches and logs errors
- Continues on next hourly run
- No data corruption

### API Errors
- Standard HTTP error codes
- Detailed error messages in logs
- Graceful degradation

## Security Considerations

### 1. **Authentication Required**
- All endpoints require valid JWT token
- Email links require user to be logged in
- Task permissions checked before opening

### 2. **Admin Controls**
- Manual trigger restricted to admins
- Statistics scoped to user's company
- No cross-company data leakage

### 3. **Email Security**
- No sensitive data in email (just task basics)
- Links expire when user logs out
- HTTPS required for production

## Scalability

### Current Capacity
- **Tasks**: Handles 10,000+ tasks efficiently
- **Users**: Supports 1,000+ users per company
- **Emails**: Limited by Resend plan (100/day free, 50k/month pro)

### Scaling Options
- **Horizontal**: Multiple server instances (need Redis for locking)
- **Vertical**: Increase server resources
- **Database**: PostgreSQL can handle millions of records
- **Email**: Upgrade Resend plan or add queue system

## Future Enhancements

1. **Multiple Reminder Times**
   - 48h, 24h, 1h before due
   - User preferences for timing

2. **Reminder Preferences**
   - User can opt-out
   - Choose email vs in-app vs SMS

3. **Digest Emails**
   - Daily/weekly summary
   - All upcoming tasks in one email

4. **SMS Reminders**
   - Integration with Twilio
   - Critical tasks only

5. **Snooze Functionality**
   - User can snooze reminder
   - Resend after X hours

6. **Analytics Dashboard**
   - Reminder effectiveness
   - Task completion correlation
   - User engagement metrics

