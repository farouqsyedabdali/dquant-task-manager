# Tialz Task Manager

Tialz is an AI-native task management workspace for turning conversations, emails, browser snippets, and team instructions into structured tasks and projects. The current codebase is an alpha product with a React web app, Express API, PostgreSQL database, optional Electron desktop wrapper, browser extension, and Python email worker.

## Product Scope

- Company and personal workspaces
- Admin, employee, system admin, and super admin roles
- Tasks, subtasks, priorities, statuses, due dates, comments, co-assignees, collaborators, sharing, and invitations
- Projects and reusable project templates
- Contacts and Google Contacts integration
- Notifications, reminders, archive settings, audit logs, and security/admin screens
- AI chat, quick actions, task extraction, task updates, and project idea generation
- Internal email worker support for converting important inbound emails into tasks
- Optional desktop shell and browser extension

## Stack

- **Client:** React 19, Vite, React Router, Zustand, Tailwind CSS, DaisyUI, Framer Motion
- **Server:** Node.js, Express, Prisma, PostgreSQL, JWT, bcrypt, Resend, OpenRouter, Google APIs, Firebase Admin
- **Database:** Azure PostgreSQL in the current deployment plan
- **Hosting:** Railway backend, Vercel frontend
- **Worker:** Python email agent under `tialz_agent/`
- **Desktop:** Electron wrapper under `desktop/`

## Repository Layout

```text
client/              React/Vite frontend
server/              Express/Prisma backend
desktop/             Electron desktop wrapper
browser-extension/   Chrome extension for sending selected text to the assistant
tialz_agent/         Python email worker
```

The repository/package names have not been renamed yet, so some package metadata may still use older placeholder names.

## Local Setup

### 1. Install dependencies

```bash
cd server
npm install

cd ../client
npm install
```

### 2. Configure environment variables

Copy the examples and fill in real values:

```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
```

Important local values:

```env
# server/.env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DBNAME?sslmode=require"
JWT_SECRET="replace-with-a-long-random-secret"
CLIENT_URL="http://localhost:5173"
PORT=3000

# client/.env
VITE_API_URL="http://localhost:3000/api"
```

### 3. Prepare the database

```bash
cd server
npx prisma generate
npx prisma migrate dev
npm run seed
```

### 4. Run the app

```bash
# Terminal 1
cd server
npm run dev

# Terminal 2
cd client
npm run dev
```

Frontend: `http://localhost:5173`  
Backend: `http://localhost:3000/api`

## Tests and Validation

```bash
cd client
npm run lint
npm test
npm run build

cd ../server
npx prisma validate
npm test
```

CI is configured in `.github/workflows/ci.yml` for client lint/test/build and server Prisma validation/test.

## Deployment Notes

- Backend deploys to Railway.
- Frontend deploys to Vercel.
- Database is Azure PostgreSQL.
- Configure `VITE_API_URL` in Vercel instead of hardcoding the Railway API URL in app code.
- Configure Railway with the server env values from `server/.env.example`.

## Current Status

This is an alpha codebase. Before using Tialz with real customer data, complete the remaining hardening work: production secrets review, Google token encryption, deeper tenant isolation tests, full AI action safety controls, billing, observability, and a production incident/recovery plan.
