# Quick Setup Guide

## Prerequisites
- Node.js 18+ installed
- PostgreSQL 12+ installed and running
- npm or yarn package manager

## Step 1: Database Setup
1. Create a PostgreSQL database:
```bash
createdb dquant_task_manager
```

## Step 2: Environment Configuration
1. Create a `.env` file in the `server` directory with the following content:
```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/dquant_task_manager"

# JWT Secret
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"

# Server Configuration
PORT=3000
NODE_ENV=development

# Client URL for CORS
CLIENT_URL="http://localhost:5173"
```

**Important**: Replace `username:password` with your actual PostgreSQL credentials.

## Step 3: Install Dependencies
```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

## Step 4: Database Migration and Seeding
```bash
# From the server directory
cd server

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# Seed the database with sample data
npm run seed
```

## Step 5: Start the Application
Open two terminal windows:

**Terminal 1 - Backend:**
```bash
cd server
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd client
npm run dev
```

## Step 6: Access the Application
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000

## Demo Credentials
After seeding the database, you can use these credentials:

### Admin User
- **Email**: admin@dquant.com
- **Password**: admin123

### Employee Users
- **Email**: john@dquant.com
- **Password**: employee123
- **Email**: jane@dquant.com
- **Password**: employee123

## Troubleshooting

### Database Connection Issues
- Ensure PostgreSQL is running
- Check your database credentials in the `.env` file
- Verify the database `dquant_task_manager` exists

### Port Conflicts
- If port 3000 is in use, change the PORT in the `.env` file
- If port 5173 is in use, Vite will automatically use the next available port

### CORS Issues
- Ensure the CLIENT_URL in the `.env` file matches your frontend URL
- Check that both servers are running

### Prisma Issues
- Run `npx prisma generate` if you get Prisma client errors
- Run `npx prisma migrate reset` to reset the database if needed 