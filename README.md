# DQuant Task Manager

A modern, Jira-like task management system built with React, Node.js, and PostgreSQL. Features role-based access control with admin and employee user types.

## Features

### Admin Features
- **Full Task Management**: Create, edit, delete, and assign tasks
- **Priority Management**: Set and change task priorities (Low, Medium, High, Urgent)
- **Status Management**: Update task statuses (To Do, In Progress, Completed)
- **User Management**: View all employees and assign tasks
- **Comments**: Add, edit, and delete comments on any task
- **Dashboard**: Overview of all tasks with statistics

### Employee Features
- **Task Viewing**: View only assigned tasks
- **Status Updates**: Mark tasks as completed or in progress
- **Comments**: Add comments to assigned tasks
- **Dashboard**: Personal task overview

### Shared Features
- **Modern UI**: Beautiful, responsive interface with Tailwind CSS and DaisyUI
- **Real-time Updates**: Live task updates and notifications
- **Search & Filtering**: Advanced search and filter capabilities
- **Sorting**: Sort tasks by any column
- **Mobile Responsive**: Works perfectly on all devices

## Tech Stack

### Frontend
- **React 19** - Modern React with hooks
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **DaisyUI** - Component library for Tailwind
- **Zustand** - Lightweight state management
- **React Router** - Client-side routing
- **Axios** - HTTP client

### Backend
- **Node.js** - JavaScript runtime
- **Express** - Web framework
- **Prisma** - Database ORM
- **PostgreSQL** - Database
- **JWT** - Authentication
- **bcrypt** - Password hashing
- **CORS** - Cross-origin resource sharing

## Prerequisites

- Node.js 18+ 
- PostgreSQL 12+
- npm or yarn

## Installation

### 1. Clone the repository
```bash
git clone <repository-url>
cd dquant-task-manager
```

### 2. Set up the database
```bash
# Create a PostgreSQL database
createdb dquant_task_manager
```

### 3. Configure environment variables

Create a `.env` file in the `server` directory:
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

### 4. Install dependencies
```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### 5. Set up the database
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

### 6. Start the development servers

**Terminal 1 - Start the backend:**
```bash
cd server
npm run dev
```

**Terminal 2 - Start the frontend:**
```bash
cd client
npm run dev
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000

## Demo Credentials

After running the seed script, you can use these credentials:

### Admin User
- **Email**: admin@dquant.com
- **Password**: admin123

### Employee Users
- **Email**: john@dquant.com
- **Password**: employee123
- **Email**: jane@dquant.com
- **Password**: employee123

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - Register new user (admin only)
- `GET /api/auth/me` - Get current user info

### Tasks
- `GET /api/tasks` - Get tasks (admin: all, employee: assigned)
- `POST /api/tasks` - Create task (admin only)
- `GET /api/tasks/:id` - Get single task
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task (admin only)
- `PATCH /api/tasks/:id/status` - Update task status
- `PATCH /api/tasks/:id/priority` - Update task priority (admin only)

### Comments
- `GET /api/comments/task/:taskId` - Get task comments
- `POST /api/comments/task/:taskId` - Add comment
- `PUT /api/comments/:id` - Update comment (admin only)
- `DELETE /api/comments/:id` - Delete comment (admin only)

## Project Structure

```
dquant-task-manager/
├── client/                          # React Frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── auth/                # Authentication components
│   │   │   ├── tasks/               # Task-related components
│   │   │   ├── comments/            # Comment components
│   │   │   └── layout/              # Layout components
│   │   ├── pages/                   # Page components
│   │   ├── stores/                  # Zustand stores
│   │   ├── services/                # API services
│   │   ├── utils/                   # Utility functions
│   │   └── context/                 # React context
│   └── public/
├── server/                          # Node.js Backend
│   ├── src/
│   │   ├── controllers/             # Route controllers
│   │   ├── middleware/              # Express middleware
│   │   ├── routes/                  # API routes
│   │   └── utils/                   # Utility functions
│   ├── prisma/                      # Database schema and migrations
│   └── index.js                     # Server entry point
└── README.md
```

## Database Schema

### Users
- `id` - Primary key
- `name` - User's full name
- `email` - Unique email address
- `password` - Hashed password
- `role` - User role (ADMIN/EMPLOYEE)
- `createdAt` - Account creation timestamp
- `updatedAt` - Last update timestamp

### Tasks
- `id` - Primary key
- `title` - Task title
- `description` - Task description (optional)
- `status` - Task status (TODO/IN_PROGRESS/COMPLETED)
- `priority` - Task priority (LOW/MEDIUM/HIGH/URGENT)
- `assignedToId` - Foreign key to assigned user
- `createdById` - Foreign key to task creator
- `createdAt` - Task creation timestamp
- `updatedAt` - Last update timestamp

### Comments
- `id` - Primary key
- `content` - Comment text
- `taskId` - Foreign key to task
- `authorId` - Foreign key to comment author
- `createdAt` - Comment creation timestamp

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, email support@dquant.com or create an issue in the repository. 