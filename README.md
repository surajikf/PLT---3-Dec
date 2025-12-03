# IKF Project Livetracker

A comprehensive web-based project management system for tracking projects, budgets, timesheets, and resources.

## 🚀 Features

- **Role-Based Access Control** - 5 distinct user roles (Super Admin, Admin, Project Manager, Team Member, Client)
- **Project Management** - Create, manage, and track projects with stage-based progress
- **Time & Cost Tracking** - Timesheet entry with automatic cost calculation
- **Budget Monitoring** - Real-time budget tracking with alerts
- **Resource Management** - Centralized resource library with external links
- **Customer Management** - Customer database with project association
- **Reporting & Analytics** - Comprehensive reports and insights
- **Health Monitoring** - Project health scoring and risk identification

## 🛠️ Technology Stack

### Backend
- Node.js + Express
- TypeScript
- PostgreSQL
- Prisma ORM
- JWT Authentication
- bcrypt for password hashing

### Frontend
- React 18
- TypeScript
- Vite
- TailwindCSS
- React Router
- Axios

## 📋 Prerequisites

- Node.js 18+ and npm
- PostgreSQL 14+
- Git

## 🔧 Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd ikf-project-livetracker
```

2. Install dependencies:
```bash
npm run install:all
```

3. Set up environment variables:

Backend (.env in backend folder):
```env
DATABASE_URL="postgresql://user:password@localhost:5432/plt_db"
JWT_SECRET="your-secret-key-here"
JWT_EXPIRE="7d"
PORT=5000
NODE_ENV=development
```

Frontend (.env in frontend folder):
```env
VITE_API_URL=http://localhost:5000/api
```

4. Set up the database:
```bash
cd backend
npx prisma migrate dev
npx prisma db seed
```

5. Start development servers:
```bash
# From root directory
npm run dev

# Or separately:
npm run dev:backend  # Runs on http://localhost:5000
npm run dev:frontend # Runs on http://localhost:5173
```

## 📁 Project Structure

```
ikf-project-livetracker/
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── utils/
│   │   └── app.ts
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.ts
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── utils/
│   │   └── App.tsx
│   └── package.json
└── README.md
```

## 👥 User Roles

1. **Super Admin** - System configuration, security, audit
2. **Admin** - Organization-wide project oversight
3. **Project Manager** - Manage assigned projects
4. **Team Member** - Log time and track tasks
5. **Client** - Monitor project progress (external)

## 🔐 Default Credentials

After seeding, default users will be created:
- Super Admin: superadmin@ikf.com / password123
- Admin: admin@ikf.com / password123
- Project Manager: pm@ikf.com / password123

**⚠️ Change these passwords in production!**

## 📝 API Documentation

API endpoints will be available at `http://localhost:5000/api`

Main endpoints:
- `/api/auth` - Authentication
- `/api/users` - User management
- `/api/projects` - Project management
- `/api/timesheets` - Time tracking
- `/api/customers` - Customer management
- `/api/departments` - Department management
- `/api/resources` - Resource management
- `/api/reports` - Reporting

## 🧪 Testing

```bash
# Backend tests
cd backend && npm test

# Frontend tests
cd frontend && npm test
```

## 🚢 Deployment

See deployment guides in `docs/deployment/` folder.

## 📄 License

ISC

## 👨‍💻 Development Team

IKF Development Team

