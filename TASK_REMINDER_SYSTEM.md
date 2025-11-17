# Task Reminder System

## Overview

The Task Reminder System automatically sends email reminders to users 48 hours before their tasks are due. This helps ensure that tasks are completed on time and users are aware of upcoming deadlines.

## Features

- **Automatic Reminders**: Sends emails 48 hours before task due dates
- **Smart Tracking**: Prevents duplicate reminders using the `TaskReminder` model
- **Multiple Recipients**: Sends reminders to lead assignees and co-assignees
- **Beautiful Email Template**: Professional, responsive email design with task details
- **Direct Task Access**: Email links open the task modal directly in the dashboard
- **Admin Controls**: Manual trigger and statistics endpoints for administrators

## How It Works

### 1. Scheduler

The reminder scheduler runs automatically every hour and:
- Checks for tasks due between 48-49 hours from now
- Excludes completed and cancelled tasks
- Excludes archived tasks
- Identifies all users who should receive reminders (lead assignee + co-assignees)
- Sends email reminders to each user
- Records sent reminders to prevent duplicates

### 2. Email Content

Each reminder email includes:
- Task title and description
- Priority level (with color-coded badge)
- Current status
- Due date and time
- Assigned by information
- Direct link to open the task in the dashboard
- Professional, mobile-responsive design

### 3. Task Modal Integration

When users click the link in the reminder email:
1. They're directed to the dashboard with a `taskId` query parameter
2. The dashboard automatically fetches the task
3. The task modal opens with all task details
4. Users can immediately update the task status or add comments

## Database Schema

### TaskReminder Model

```prisma
model TaskReminder {
  id        Int      @id @default(autoincrement())
  taskId    Int
  userId    Int
  sentAt    DateTime @default(now())
  task      Task     @relation(fields: [taskId], references: [id], onDelete: Cascade)

  @@unique([taskId, userId])
  @@index([taskId])
  @@index([sentAt])
}
```

**Key Features:**
- Unique constraint on `(taskId, userId)` prevents duplicate reminders
- Cascade delete ensures reminders are removed when tasks are deleted
- Indexed for efficient queries

## API Endpoints

### 1. Manual Reminder Check (Admin Only)

```
POST /api/reminders/check
Authorization: Bearer <token>
```

**Description**: Manually triggers the reminder check process

**Response**:
```json
{
  "success": true,
  "message": "Reminder check completed",
  "data": {
    "success": true,
    "tasksDueSoon": 5,
    "remindersSent": 8,
    "remindersSkipped": 2
  }
}
```

### 2. Get Reminder Statistics

```
GET /api/reminders/stats
Authorization: Bearer <token>
```

**Description**: Returns reminder statistics for the user's company

**Response**:
```json
{
  "success": true,
  "stats": {
    "totalRemindersSent": 150,
    "remindersLast7Days": 25,
    "upcomingReminders": 10
  }
}
```

### 3. Get Task Reminder History

```
GET /api/reminders/task/:taskId
Authorization: Bearer <token>
```

**Description**: Returns the reminder history for a specific task

**Response**:
```json
{
  "success": true,
  "reminders": [
    {
      "id": 1,
      "taskId": 123,
      "userId": 45,
      "sentAt": "2024-01-15T10:30:00Z"
    }
  ]
}
```

## Setup Instructions

### 1. Database Migration

Run the Prisma migration to add the `TaskReminder` model:

```bash
cd server
npx prisma migrate dev --name add_task_reminder_model
npx prisma generate
```

### 2. Environment Variables

Ensure these environment variables are set in `server/.env`:

```env
# Resend API (for email features)
RESEND_API_KEY="re_your_resend_api_key_here"

# Email Configuration
EMAIL_FROM="onboarding@resend.dev"  # Or your custom domain email

# Client URL (for email links)
CLIENT_URL="https://your-app.vercel.app"
```

### 3. Start the Server

The reminder scheduler starts automatically when the server starts:

```bash
cd server
npm run dev
```

You should see:
```
🚀 Starting task reminder scheduler...
✅ Task reminder scheduler started (checking every hour)
```

## Testing

### Manual Testing

1. **Create a test task** with a due date 48 hours from now
2. **Trigger manual check** (as admin):
   ```bash
   curl -X POST http://localhost:3000/api/reminders/check \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```
3. **Check your email** for the reminder
4. **Click the link** in the email to verify the task modal opens

### Automated Testing

The scheduler runs every hour automatically. To verify:
1. Check server logs for: `🔔 Starting task reminder check...`
2. Monitor email delivery in your Resend dashboard
3. Check reminder statistics via the API

## Customization

### Change Reminder Timing

Edit `server/src/utils/taskReminderScheduler.js`:

```javascript
// Change from 48 hours to 24 hours
const twentyFourHoursFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
const twentyFiveHoursFromNow = new Date(now.getTime() + 25 * 60 * 60 * 1000);
```

### Change Check Frequency

Edit `server/src/utils/taskReminderScheduler.js`:

```javascript
// Change from 1 hour to 30 minutes
const intervalId = setInterval(() => {
  checkAndSendReminders();
}, 30 * 60 * 1000); // 30 minutes
```

### Customize Email Template

Edit `server/src/templates/taskReminderEmail.js` to modify:
- Colors and styling
- Content and messaging
- Layout and structure

## Troubleshooting

### Reminders Not Sending

1. **Check Resend API Key**: Verify `RESEND_API_KEY` is set correctly
2. **Check Email From Address**: Ensure `EMAIL_FROM` is valid
3. **Check Server Logs**: Look for error messages in the console
4. **Verify Task Due Dates**: Ensure tasks have due dates set
5. **Check Task Status**: Reminders only sent for TODO, IN_PROGRESS, and ON_HOLD tasks

### Duplicate Reminders

The system prevents duplicates using the unique constraint on `(taskId, userId)`. If you're seeing duplicates:
1. Check database integrity
2. Verify the migration ran successfully
3. Review server logs for errors

### Email Links Not Working

1. **Check CLIENT_URL**: Ensure it matches your frontend URL
2. **Verify Authentication**: Users must be logged in
3. **Check Task Permissions**: Users must have access to the task

## Performance Considerations

- **Scheduler runs every hour**: Minimal server impact
- **Database queries are indexed**: Fast lookups for due tasks
- **Batch email sending**: Uses Resend's efficient API
- **Duplicate prevention**: Reduces unnecessary emails and database writes

## Future Enhancements

Potential improvements:
- Multiple reminder intervals (e.g., 48h, 24h, 1h before due)
- User preferences for reminder timing
- SMS reminders via Twilio
- In-app notifications in addition to emails
- Reminder snooze functionality
- Digest emails (daily/weekly summary)

## Support

For issues or questions:
1. Check server logs for error messages
2. Review the Resend dashboard for email delivery status
3. Test with the manual trigger endpoint
4. Verify database schema is up to date

## License

This feature is part of the Tialz Task Manager system.

