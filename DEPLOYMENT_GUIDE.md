# 🚀 Complete Deployment Guide: Vercel + Railway

This guide will help you deploy your DQuant Task Manager to production using Vercel (frontend) and Railway (backend).

## 📋 Prerequisites

- GitHub account
- Azure PostgreSQL database (already set up)
- OpenRouter API key for AI features
- Your code pushed to GitHub

## 🎯 What We're Deploying

- **Frontend (React)**: Vercel
- **Backend (Node.js)**: Railway  
- **Database**: Azure PostgreSQL (existing)
- **Desktop App**: Updated to use hosted URLs

## 📊 Architecture Overview

```
User → Desktop App → Vercel (Frontend) → Railway (Backend) → Azure PostgreSQL
     ↘ Browser → Vercel (Frontend) → Railway (Backend) → Azure PostgreSQL
```

## 🚀 Step 1: Deploy Backend to Railway

### 1.1 Create Railway Account
1. Go to [railway.app](https://railway.app)
2. Click "Start a New Project"
3. Sign up with GitHub
4. Authorize Railway to access your repositories

### 1.2 Deploy Your Server
1. Click "Deploy from GitHub repo"
2. Select your `dquant-task-manager` repository
3. Choose "Deploy from a folder"
4. Select the `server` folder
5. Railway will automatically detect it's a Node.js project

### 1.3 Configure Environment Variables
In Railway dashboard, go to your project → Variables tab:

```env
DATABASE_URL=your_azure_postgresql_connection_string
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
NODE_ENV=production
PORT=3000
CLIENT_URL=https://your-app.vercel.app
OPENROUTER_API_KEY=your-openrouter-api-key
```

**Important**: Replace `your_azure_postgresql_connection_string` with your actual Azure PostgreSQL connection string.

### 1.4 Get Your Railway URL
After deployment, Railway will give you a URL like:
`https://your-app-production.up.railway.app`

**Save this URL** - you'll need it for the frontend!

## 🌐 Step 2: Deploy Frontend to Vercel

### 2.1 Create Vercel Account
1. Go to [vercel.com](https://vercel.com)
2. Click "Sign up"
3. Sign up with GitHub
4. Authorize Vercel to access your repositories

### 2.2 Deploy Your Client
1. Click "New Project"
2. Import your `dquant-task-manager` repository
3. Set **Root Directory** to `client`
4. Vercel will auto-detect it's a Vite project

### 2.3 Configure Environment Variables
In Vercel dashboard, go to your project → Settings → Environment Variables:

```env
VITE_API_URL=https://your-app-production.up.railway.app
```

**Important**: Replace with your actual Railway URL from Step 1.4

### 2.4 Deploy
1. Click "Deploy"
2. Wait for deployment to complete
3. Vercel will give you a URL like: `https://your-app.vercel.app`

**Save this URL** - you'll need it for the Electron app!

## 🖥️ Step 3: Update Electron Desktop App

### 3.1 Update Electron Configuration
1. Open `desktop/main/main.js`
2. Update line 6:
```javascript
const APP_URL = process.env.APP_URL || 'https://your-app.vercel.app';
```

### 3.2 Create Production Environment File
Create `desktop/.env`:
```env
APP_URL=https://your-app.vercel.app
```

### 3.3 Rebuild Desktop App
```bash
cd desktop
npm run build
```

This will create a new installer in `desktop/dist/` with the updated URL.

## 🔄 Step 4: Update Railway Environment

### 4.1 Update CORS URL
Go back to Railway → Variables and update:
```env
CLIENT_URL=https://your-app.vercel.app
```

This ensures your backend accepts requests from your frontend.

## 🧪 Step 5: Test Your Deployment

### 5.1 Test Web Version
1. Open `https://your-app.vercel.app` in your browser
2. Try logging in with your test credentials
3. Create a task and verify it works

### 5.2 Test Desktop Version
1. Install the new desktop app from `desktop/dist/`
2. Open the desktop app
3. Verify it loads your hosted application
4. Test all functionality

## 📱 Step 6: Update Your Landing Page

Update your landing page to point users to:
- **Web version**: `https://your-app.vercel.app`
- **Desktop download**: Link to your installer

## 🔧 Step 7: Database Setup

### 7.1 Run Database Migrations
Connect to your Railway backend and run:
```bash
# This will be done automatically by Railway, but you can verify
npx prisma migrate deploy
```

### 7.2 Seed Your Database
```bash
# Run this on your Railway backend
npm run seed
```

## 🚨 Troubleshooting

### Common Issues:

#### 1. CORS Errors
- Ensure `CLIENT_URL` in Railway matches your Vercel URL exactly
- Check that your Railway backend is running

#### 2. Database Connection Issues
- Verify your Azure PostgreSQL connection string
- Ensure your Azure database allows connections from Railway IPs

#### 3. Frontend Not Loading
- Check that `VITE_API_URL` in Vercel matches your Railway URL
- Verify your Railway backend is deployed and running

#### 4. Desktop App Issues
- Ensure `APP_URL` in desktop app points to your Vercel URL
- Rebuild the desktop app after making changes

## 📊 Monitoring Your Deployment

### Vercel Dashboard
- View deployment logs
- Monitor performance
- Check build status

### Railway Dashboard  
- View server logs
- Monitor resource usage
- Check environment variables

## 🔄 Automatic Deployments

Both platforms support automatic deployments:

### Vercel
- Push to `main` branch → Auto-deploy
- Preview deployments for pull requests

### Railway
- Push to `main` branch → Auto-deploy
- Automatic builds and deployments

## 💰 Cost Breakdown

- **Vercel**: $0/month (free tier)
- **Railway**: $0/month (free tier with $5 credit)
- **Azure PostgreSQL**: Your existing setup
- **OpenRouter API**: Pay-per-use

**Total: $0/month** (within free tiers)

## 🎉 Success!

Your application is now:
- ✅ **24/7 available** - No local server needed
- ✅ **Globally accessible** - Fast worldwide
- ✅ **Auto-scaling** - Handles traffic spikes
- ✅ **Professional URLs** - Custom domains available
- ✅ **SSL secured** - Automatic HTTPS
- ✅ **Auto-updating** - Push to GitHub = auto-deploy

## 📞 Support

If you encounter issues:
1. Check Railway logs for backend issues
2. Check Vercel logs for frontend issues
3. Verify all environment variables are set correctly
4. Ensure your database is accessible from Railway

## 🔄 Future Updates

To update your application:
1. Make changes to your code
2. Push to GitHub
3. Vercel and Railway will automatically deploy
4. Rebuild desktop app if needed
5. Distribute new installer

Your application is now production-ready! 🚀

