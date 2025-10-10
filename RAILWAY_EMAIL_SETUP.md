# Fix Email Service in Railway - Quick Guide

## Problem
Email features are failing in production with:
- "Failed to submit feedback. Please try again."
- "Internal server error" for task invitations
- Task invitations are created but emails don't send

## Root Cause
Missing `RESEND_API_KEY` environment variable in Railway.

---

## 🔧 Fix (5 minutes)

### Step 1: Get Your Resend API Key

1. Go to **https://resend.com/api-keys**
2. Login if needed
3. You should see your existing API key
4. If you don't have it saved, create a new one:
   - Click **"Create API Key"**
   - Name it: "Task Manager Production"
   - Click **"Add"**
   - **COPY THE KEY IMMEDIATELY** (starts with `re_`)

### Step 2: Add to Railway

1. Go to **https://railway.app/dashboard**
2. Click on your **backend service** (server project)
3. Click on the **"Variables"** tab
4. Click **"New Variable"**
5. Add these THREE variables:

#### Variable 1: RESEND_API_KEY
```
Variable Name: RESEND_API_KEY
Value: re_your_actual_api_key_here
```

#### Variable 2: EMAIL_FROM
```
Variable Name: EMAIL_FROM
Value: onboarding@resend.dev
```
(Or use your custom domain email if you have one set up)

#### Variable 3: FRONTEND_URL
```
Variable Name: FRONTEND_URL
Value: https://your-actual-vercel-app.vercel.app
```
(Replace with your actual Vercel URL)

### Step 3: Save and Redeploy

1. After adding all three variables, Railway will automatically redeploy
2. Wait 2-3 minutes for the deployment to complete
3. Watch the deployment logs to ensure it starts successfully

---

## ✅ Verify It's Working

### Test Feedback Form:
1. Go to your production app
2. Settings → Feedback
3. Submit feedback
4. Should see success message
5. Check your email: farouqsyedabdali@gmail.com

### Test Task Invitation:
1. Create a task
2. Click "📧 Email" button
3. Enter an email: farouqsyedabdali@gmail.com
4. Click "Send Invitation"
5. Should see success message
6. Check your email inbox

---

## 🐛 Still Not Working?

### Check Railway Logs:
1. In Railway dashboard
2. Click your backend service
3. Click "Deployments"
4. Click on the latest deployment
5. Check logs for errors

### Common Issues:

**Issue: "Error: Missing API key"**
- Solution: Make sure RESEND_API_KEY is exactly that (case-sensitive)
- No extra spaces in the variable name

**Issue: "Invalid API key"**
- Solution: Copy the API key again from Resend
- Make sure you're using the full key (starts with `re_`)

**Issue: "Email not delivered"**
- Solution: Check Resend dashboard for delivery status
- Make sure you're sending to farouqsyedabdali@gmail.com (verified)

**Issue: Variables not showing**
- Solution: Make sure you're in the RIGHT service (backend, not frontend)
- Railway has separate variables for each service

---

## 📝 Current Variables You Should Have

In Railway backend service:

```
✅ DATABASE_URL          (already set)
✅ JWT_SECRET            (already set)
✅ CLIENT_URL            (already set)
✅ OPENROUTER_API_KEY    (already set)
✅ RESEND_API_KEY        (ADD THIS)
✅ EMAIL_FROM            (ADD THIS)
✅ FRONTEND_URL          (ADD THIS)
```

---

## 🚀 After Adding Variables

Railway will automatically:
1. Detect the new environment variables
2. Rebuild your backend
3. Redeploy with new config
4. Email features will start working!

**Total time: ~5 minutes**

---

## Need Help?

If it's still not working after following these steps, check:
1. Railway deployment logs
2. Browser console for errors
3. Resend dashboard for delivery status

Let me know what error you see and I can help debug further!

