# Resend Email Setup Guide

## Current Status
✅ Your Resend API key is **WORKING LOCALLY**
❌ Emails not working on **DEPLOYED WEBSITE**

## Issue
The production environment (Railway/Vercel) likely doesn't have the correct environment variables set.

## Fix for Production

### Step 1: Set Environment Variables on Railway (Backend)

Go to your Railway project → `server` service → Variables tab and add:

```env
RESEND_API_KEY=re_your_actual_key_here
EMAIL_FROM=onboarding@resend.dev
# DO NOT set ENABLE_EMAIL_VERIFICATION=false in production
```

**Important:** 
- Remove `ENABLE_EMAIL_VERIFICATION` variable completely (or set it to anything except "false")
- The key must be the same one that works locally

### Step 2: Verify Email Sending Works

After setting the variables:
1. **Redeploy** the Railway service (or it will auto-deploy)
2. **Wait 2-3 minutes** for deployment
3. **Test registration** on your live site
4. **Check server logs** in Railway dashboard

### Step 3: Check Resend Dashboard

1. Go to https://resend.com/emails
2. Log in to the **same account** where you created the API key
3. You should see emails appearing after users register

## Common Issues

### Issue 1: "Email not showing in Resend dashboard"
**Cause:** Using API key from different Resend account
**Fix:** 
1. Log out of Resend
2. Log in to the account where the API key was created
3. Check https://resend.com/emails again

### Issue 2: "Emails going to spam"
**Cause:** Using custom domain (`noreply@abdalitechnologies.com`) without verification
**Fix:** 
- **Option A (Quick):** Use `EMAIL_FROM=onboarding@resend.dev`
- **Option B (Production):** Verify your domain in Resend:
  1. Go to https://resend.com/domains
  2. Add `abdalitechnologies.com`
  3. Add DNS records (SPF, DKIM)
  4. Wait for verification

### Issue 3: "Existing accounts can't log in"
**Fix:** Already handled! 
- Existing accounts bypass email verification
- Only NEW accounts need verification

## Testing Email Delivery

### Local Testing
```bash
cd server
node verify-resend.js
```

### Production Testing
1. Register new account on live site
2. Check Railway logs for "✅ Email sent successfully"
3. Check Resend dashboard for email
4. Check recipient inbox (including spam folder)

## Current Configuration

Your `.env` should have:
```env
RESEND_API_KEY=re_your_key_here
EMAIL_FROM=onboarding@resend.dev
# ENABLE_EMAIL_VERIFICATION is NOT set (enabled by default)
```

Your Railway production variables should match (except DATABASE_URL, JWT_SECRET, CLIENT_URL which are production-specific).

## Disable Email Verification (Development Only)

If you want to disable verification during development:

```env
ENABLE_EMAIL_VERIFICATION=false
```

**DO NOT** set this in production!
