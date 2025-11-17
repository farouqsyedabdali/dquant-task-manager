# Task Reminder System - Deployment Guide

## Quick Start

This guide will help you deploy the task reminder system to your production environment.

## Pre-Deployment Checklist

- [ ] Resend API key configured
- [ ] Email FROM address verified in Resend
- [ ] CLIENT_URL environment variable set
- [ ] Database backup completed
- [ ] Testing completed in development

## Step-by-Step Deployment

### 1. Database Migration

#### Local/Development

```bash
cd server
npx prisma migrate dev --name add_task_reminder_model
npx prisma generate
```

#### Production (Railway/Heroku)

```bash
# SSH into your production server or use Railway CLI
cd server
npx prisma migrate deploy
npx prisma generate
```

**Important**: The migration will:
- Create the `TaskReminder` table
- Add the `reminders` relation to the `Task` model
- Create indexes for performance

### 2. Environment Variables

Add these to your production environment:

#### Railway

```bash
# Via Railway CLI
railway variables set RESEND_API_KEY=re_your_key_here
railway variables set EMAIL_FROM=noreply@yourdomain.com
railway variables set CLIENT_URL=https://your-app.vercel.app
```

#### Vercel (for frontend)

The frontend doesn't need additional environment variables for this feature.

#### Manual Setup

Add to your production `.env` file:

```env
RESEND_API_KEY=re_your_production_key_here
EMAIL_FROM=noreply@yourdomain.com
CLIENT_URL=https://your-production-domain.com
```

### 3. Deploy Backend

#### Railway

```bash
# Commit your changes
git add .
git commit -m "Add task reminder system"
git push origin main

# Railway will auto-deploy
```

#### Manual Deployment

```bash
# Build and restart your server
cd server
npm install
npm run start
```

### 4. Deploy Frontend

#### Vercel

```bash
# Commit your changes
git add .
git commit -m "Add task reminder URL handling"
git push origin main

# Vercel will auto-deploy
```

### 5. Verify Deployment

#### Check Server Logs

Look for these messages on startup:

```
✅ Database connection successful
🚀 Starting task reminder scheduler...
✅ Task reminder scheduler started (checking every hour)
🔔 Starting task reminder check...
```

#### Test Manual Trigger

```bash
# Get an admin token from your app
TOKEN="your_admin_token_here"

# Trigger manual check
curl -X POST https://your-api-domain.com/api/reminders/check \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"
```

Expected response:
```json
{
  "success": true,
  "message": "Reminder check completed",
  "data": {
    "success": true,
    "tasksDueSoon": 0,
    "remindersSent": 0,
    "remindersSkipped": 0
  }
}
```

#### Test Email Delivery

1. Create a test task with due date 48 hours from now
2. Wait for the next hourly check OR trigger manually
3. Check your email inbox
4. Click the link and verify the task modal opens

### 6. Monitor

#### Check Resend Dashboard

1. Log into [resend.com](https://resend.com)
2. Go to "Emails" section
3. Verify reminders are being sent
4. Check delivery rates

#### Check Server Logs

Monitor for:
- `✅ Sent reminder for task "..." to user@email.com`
- `⏭️ Skipping reminder for task X to user@email.com - already sent`
- Any error messages

#### Check Database

```sql
-- Count total reminders sent
SELECT COUNT(*) FROM "TaskReminder";

-- Recent reminders
SELECT * FROM "TaskReminder" 
ORDER BY "sentAt" DESC 
LIMIT 10;

-- Reminders by task
SELECT t.title, COUNT(tr.id) as reminder_count
FROM "Task" t
LEFT JOIN "TaskReminder" tr ON t.id = tr."taskId"
GROUP BY t.id, t.title
HAVING COUNT(tr.id) > 0
ORDER BY reminder_count DESC;
```

## Rollback Plan

If you need to rollback:

### 1. Stop the Scheduler

Edit `server/index.js` and comment out:

```javascript
// startReminderScheduler()
```

Redeploy.

### 2. Revert Database Migration

```bash
cd server
npx prisma migrate resolve --rolled-back add_task_reminder_model
```

### 3. Remove Code Changes

```bash
git revert HEAD
git push origin main
```

## Production Considerations

### Email Limits

- **Resend Free Tier**: 100 emails/day
- **Resend Pro**: 50,000 emails/month
- Monitor your usage in the Resend dashboard

### Server Resources

The scheduler is lightweight:
- Runs once per hour
- Minimal CPU usage
- Database queries are indexed
- No memory leaks

### Scaling

For large deployments:
- Consider using a dedicated job queue (Bull, BullMQ)
- Implement rate limiting for email sending
- Use Redis for distributed locking (if multiple servers)
- Monitor database performance

### Monitoring Recommendations

Set up alerts for:
- Failed email deliveries (via Resend webhooks)
- Database connection errors
- Scheduler failures
- High email volume

## Troubleshooting

### Issue: Scheduler Not Running

**Symptoms**: No log messages about reminder checks

**Solution**:
1. Check server logs for startup errors
2. Verify `startReminderScheduler()` is called in `server/index.js`
3. Restart the server

### Issue: Emails Not Sending

**Symptoms**: Logs show reminders sent but emails not received

**Solution**:
1. Check Resend API key is valid
2. Verify EMAIL_FROM domain is verified in Resend
3. Check spam folder
4. Review Resend dashboard for delivery errors

### Issue: Duplicate Reminders

**Symptoms**: Users receiving multiple reminders for same task

**Solution**:
1. Verify database migration completed successfully
2. Check for unique constraint on `(taskId, userId)`
3. Review server logs for errors during reminder creation

### Issue: Links Not Working

**Symptoms**: Email links don't open task modal

**Solution**:
1. Verify CLIENT_URL is set correctly
2. Check that users are logged in
3. Verify task permissions
4. Check browser console for errors

## Best Practices

1. **Test in Staging First**: Always test in a staging environment
2. **Monitor Email Deliverability**: Check Resend dashboard regularly
3. **Set Up Alerts**: Configure alerts for failures
4. **Regular Backups**: Backup database before migrations
5. **Document Changes**: Keep track of configuration changes
6. **User Communication**: Inform users about the new feature

## Support

For deployment issues:
1. Check server logs first
2. Review Resend dashboard
3. Test with manual trigger endpoint
4. Verify all environment variables
5. Check database migration status

## Post-Deployment

After successful deployment:

1. **Announce the Feature**: Notify users about task reminders
2. **Monitor for 24 Hours**: Watch logs and email delivery
3. **Gather Feedback**: Ask users about reminder timing
4. **Optimize as Needed**: Adjust timing or frequency based on usage

## Success Metrics

Track these metrics:
- Email delivery rate (target: >95%)
- Email open rate (target: >40%)
- Link click rate (target: >20%)
- Task completion rate improvement
- User satisfaction with reminders

## Maintenance

### Weekly
- Check email delivery rates
- Review error logs
- Monitor database size

### Monthly
- Analyze reminder effectiveness
- Review user feedback
- Optimize timing if needed
- Clean up old reminder records (optional)

### Quarterly
- Review and update email template
- Assess feature usage
- Plan enhancements

---

**Deployment Date**: _____________

**Deployed By**: _____________

**Version**: 1.0.0

**Status**: ☐ Pending  ☐ In Progress  ☐ Completed  ☐ Rolled Back

