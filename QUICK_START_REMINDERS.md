# Task Reminder System - Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Step 1: Run Database Migration (1 min)

```bash
cd server
npx prisma migrate deploy
npx prisma generate
```

### Step 2: Verify Environment Variables (1 min)

Check your `server/.env` file has:

```env
RESEND_API_KEY=re_your_key_here
EMAIL_FROM=noreply@yourdomain.com
CLIENT_URL=https://your-frontend-url.com
```

### Step 3: Start the Server (1 min)

```bash
cd server
npm run dev
```

Look for this in the logs:
```
✅ Task reminder scheduler started (checking every hour)
```

### Step 4: Test It (2 min)

#### Option A: Create a Test Task

1. Log into your app
2. Create a task with due date **exactly 48 hours from now**
3. Wait for the next hour (or trigger manually)

#### Option B: Manual Trigger (Faster)

```bash
# Get your admin token from the app (inspect localStorage)
TOKEN="your_admin_token"

# Trigger reminder check
curl -X POST http://localhost:3000/api/reminders/check \
  -H "Authorization: Bearer $TOKEN"
```

### Step 5: Check Your Email

You should receive an email like this:

```
⏰ Reminder: "Your Task Title" is due in 48 hours

Hi John,

This is a reminder that the following task is due soon:

📋 Your Task Title
Description: Task description here...

⚡ Priority: HIGH
📊 Status: IN PROGRESS
📅 Due: November 19, 2025 at 3:00 PM

[View Task Details] ← Click this button
```

### Step 6: Click the Link

The link will:
1. Open your dashboard
2. Automatically fetch the task
3. Open the task modal
4. Show all task details

**That's it! You're done!** 🎉

---

## 📊 Monitor Reminders

### Check Statistics

```bash
curl http://localhost:3000/api/reminders/stats \
  -H "Authorization: Bearer $TOKEN"
```

Response:
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

### Check Server Logs

Look for:
```
🔔 Starting task reminder check...
📋 Found 5 tasks due in 48 hours
✅ Sent reminder for task "..." to user@email.com
🔔 Reminder check complete: 8 sent, 2 skipped
```

### Check Resend Dashboard

1. Go to [resend.com/emails](https://resend.com/emails)
2. See all sent reminders
3. Check delivery status
4. View open/click rates

---

## 🔧 Troubleshooting

### "No reminders being sent"

**Check:**
1. ✅ Scheduler is running (check logs)
2. ✅ Tasks have due dates set
3. ✅ Tasks are not completed/cancelled
4. ✅ Due date is 48 hours from now
5. ✅ Resend API key is valid

### "Emails not arriving"

**Check:**
1. ✅ Spam folder
2. ✅ EMAIL_FROM is verified in Resend
3. ✅ Resend dashboard for delivery errors
4. ✅ Email address is correct

### "Links not working"

**Check:**
1. ✅ CLIENT_URL is correct
2. ✅ User is logged in
3. ✅ User has access to the task
4. ✅ Browser console for errors

---

## 🎯 What's Next?

### Customize Timing

Want 24 hours instead of 48?

Edit `server/src/utils/taskReminderScheduler.js`:

```javascript
// Change this:
const fortyEightHoursFromNow = new Date(now.getTime() + 48 * 60 * 60 * 1000);

// To this:
const twentyFourHoursFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
```

### Customize Email

Edit `server/src/templates/taskReminderEmail.js`:

- Change colors
- Modify text
- Add/remove sections
- Update styling

### Add More Reminders

Want multiple reminders (48h, 24h, 1h)?

1. Duplicate the scheduler logic
2. Create separate time windows
3. Track each reminder type separately

---

## 📚 Documentation

- **Full Documentation**: `TASK_REMINDER_SYSTEM.md`
- **Deployment Guide**: `REMINDER_DEPLOYMENT_GUIDE.md`
- **Architecture**: `REMINDER_SYSTEM_ARCHITECTURE.md`
- **Summary**: `REMINDER_SYSTEM_SUMMARY.md`

---

## 💡 Pro Tips

1. **Test First**: Always test with a real task before relying on it
2. **Monitor Initially**: Watch logs closely for the first few days
3. **User Feedback**: Ask users if 48 hours works for them
4. **Adjust Timing**: You can easily change the reminder window
5. **Check Spam**: Ensure emails aren't being filtered

---

## ✅ Checklist

Before going live:

- [ ] Database migration completed
- [ ] Environment variables set
- [ ] Server restarted
- [ ] Test task created and reminder received
- [ ] Email link tested and working
- [ ] Resend dashboard checked
- [ ] Server logs verified
- [ ] Users notified about new feature

---

## 🎉 Success!

You now have a fully functional task reminder system that will:

✅ Automatically check for tasks due in 48 hours
✅ Send beautiful reminder emails
✅ Include direct links to tasks
✅ Prevent duplicate reminders
✅ Support multiple assignees
✅ Provide admin controls and statistics

**Enjoy never missing a deadline again!** 🚀

---

## Need Help?

1. Check the logs first
2. Review the full documentation
3. Test with manual trigger
4. Verify environment variables
5. Check Resend dashboard

**Questions?** Review `TASK_REMINDER_SYSTEM.md` for detailed information.

