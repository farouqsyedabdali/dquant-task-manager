# Quick Domain Setup for Email Feature

## Step 1: Buy Domain (5 minutes)

1. Go to **https://www.namecheap.com**
2. Search for: `dquant` or `dquanttask` or your preferred name
3. Add `.xyz` extension (cheapest ~$1.18/year)
4. Checkout (no extra services needed)

## Step 2: Add Domain to Resend (2 minutes)

1. Go to **https://resend.com/domains**
2. Click **"Add Domain"**
3. Enter your domain: `yourdomain.xyz`
4. Resend will show you 3 DNS records to add

Example records you'll see:
```
Type: TXT
Name: _resend
Value: [some long string]

Type: TXT  
Name: resend._domainkey
Value: [some long string]

Type: TXT
Name: _dmarc
Value: [some string]
```

## Step 3: Configure DNS in Namecheap (5 minutes)

1. Login to Namecheap
2. Dashboard → **Domain List**
3. Click **"Manage"** next to your domain
4. Go to **"Advanced DNS"** tab
5. Click **"Add New Record"**

For each record Resend gave you:
- **Type**: Select "TXT Record"
- **Host**: Copy from Resend (e.g., `_resend` or `resend._domainkey`)
- **Value**: Copy from Resend
- **TTL**: Automatic

6. Click **Save All Changes**

## Step 4: Verify Domain (30 minutes wait)

1. Wait 10-30 minutes for DNS to propagate
2. Go back to **Resend → Domains**
3. Click **"Verify"** button
4. Should show ✅ Verified

## Step 5: Update Your App

In `server/.env`:
```env
EMAIL_FROM=noreply@yourdomain.xyz
```

In **Railway** (for production):
1. Go to Railway dashboard
2. Select your backend service
3. Go to **Variables** tab
4. Update `EMAIL_FROM` to `noreply@yourdomain.xyz`

## Done! 🎉

Now you can send emails to **ANYONE** without restrictions!

Total cost: ~$1-2/year
Total time: ~45 minutes

