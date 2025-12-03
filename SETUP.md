# IKF Project Livetracker - Setup Guide

This guide will help you set up and run the IKF Project Livetracker application.

## Prerequisites

- **Node.js** 18+ and npm
- **PostgreSQL** 14+ installed and running
- **Git** (optional, for cloning)

## Quick Start

### 1. Install Dependencies

From the root directory:

```bash
npm run install:all
```

This will install dependencies for both backend and frontend.

### 2. Database Setup

#### Create Database

```sql
CREATE DATABASE plt_db;
```

#### Configure Backend Environment

Create `backend/.env` file:

```env
DATABASE_URL="postgresql://your_username:your_password@localhost:5432/plt_db?schema=public"
JWT_SECRET="your-super-secret-jwt-key-change-in-production-min-32-chars"
JWT_EXPIRE="7d"
PORT=5000
NODE_ENV=development
CORS_ORIGIN="http://localhost:5173"
```

**⚠️ Important:** Replace database credentials and use a strong JWT_SECRET in production!

#### Run Migrations and Seed

```bash
cd backend
npx prisma generate
npx prisma migrate dev --name init
npx prisma db seed
```

This will:
- Generate Prisma Client
- Create all database tables
- Seed initial data (users, departments, stages)

### 3. Configure Frontend Environment

Create `frontend/.env` file:

```env
VITE_API_URL=http://localhost:5000/api
```

### 4. Start Development Servers

From the root directory:

```bash
npm run dev
```

Or run separately:

**Terminal 1 (Backend):**
```bash
npm run dev:backend
```
Backend runs on: http://localhost:5000

**Terminal 2 (Frontend):**
```bash
npm run dev:frontend
```
Frontend runs on: http://localhost:5173

### 5. Access the Application

Open your browser and navigate to: http://localhost:5173

## Default Login Credentials

After seeding, you can login with:

| Role | Email | Password |
|------|-------|----------|
| Super Admin | superadmin@ikf.com | password123 |
| Admin | admin@ikf.com | password123 |
| Project Manager | pm@ikf.com | password123 |
| Team Member | team@ikf.com | password123 |
| Client | client@example.com | password123 |

**⚠️ Change these passwords immediately in production!**

## Project Structure

```
ikf-project-livetracker/
├── backend/
│   ├── src/
│   │   ├── controllers/    # Request handlers
│   │   ├── middleware/     # Auth, validation, error handling
│   │   ├── routes/         # API routes
│   │   ├── utils/          # Utilities (Prisma, JWT, errors)
│   │   └── server.ts       # Express server
│   ├── prisma/
│   │   ├── schema.prisma   # Database schema
│   │   └── seed.ts         # Seed data
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API services
│   │   └── utils/          # Utilities
│   └── package.json
└── README.md
```

## API Endpoints

All API endpoints are prefixed with `/api`

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user

### Projects
- `GET /api/projects` - List projects
- `GET /api/projects/:id` - Get project details
- `POST /api/projects` - Create project
- `PATCH /api/projects/:id` - Update project

### Timesheets
- `GET /api/timesheets` - List timesheets
- `POST /api/timesheets` - Create timesheet
- `POST /api/timesheets/:id/approve` - Approve timesheet
- `POST /api/timesheets/:id/reject` - Reject timesheet

### Other Endpoints
- `/api/users` - User management
- `/api/customers` - Customer management
- `/api/departments` - Department management
- `/api/resources` - Resource management
- `/api/stages` - Stage management
- `/api/reports` - Reports

## Troubleshooting

### Database Connection Error

1. Ensure PostgreSQL is running
2. Check database credentials in `backend/.env`
3. Verify database exists: `psql -l | grep plt_db`

### Port Already in Use

If port 5000 or 5173 is already in use:

**Backend:** Change `PORT` in `backend/.env`
**Frontend:** Change port in `frontend/vite.config.ts`

### Prisma Errors

```bash
cd backend
npx prisma generate
npx prisma migrate reset  # WARNING: This will delete all data
```

### Module Not Found Errors

Ensure all dependencies are installed:

```bash
npm run install:all
```

## Building for Production

### Backend

```bash
cd backend
npm run build
npm start
```

### Frontend

```bash
cd frontend
npm run build
```

Built files will be in `frontend/dist/`

## Next Steps

1. **Change default passwords** for all users
2. **Update JWT_SECRET** to a strong random string
3. **Configure production database** connection
4. **Set up environment variables** for production
5. **Review security settings** (CORS, rate limiting, etc.)

## Support

For issues or questions, please refer to the BRD document or contact the development team.

