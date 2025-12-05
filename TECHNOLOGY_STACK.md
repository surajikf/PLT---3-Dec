# 📚 Technology Stack - IKF Project Livetracker

Complete overview of all technologies, frameworks, libraries, and tools used in this project.

---

## 🎯 Overview

This is a **full-stack web application** built with modern JavaScript/TypeScript technologies, following a **separated frontend and backend architecture**.

---

## 🔧 Backend Technologies

### Core Runtime & Framework
- **Node.js** - JavaScript runtime environment
- **Express.js** (v4.18.2) - Web application framework for Node.js
- **TypeScript** (v5.3.3) - Typed superset of JavaScript for type safety

### Database & ORM
- **MySQL** - Relational database management system
  - Database: `db_projectlivetracker`
  - Host: `192.168.2.100:3306`
- **Prisma** (v5.7.1) - Next-generation ORM (Object-Relational Mapping)
  - Prisma Client - Type-safe database client
  - Prisma Migrate - Database migration tool
  - Prisma Studio - Database GUI tool

### Authentication & Security
- **JSON Web Tokens (JWT)** (v9.0.2) - Token-based authentication
- **bcryptjs** (v2.4.3) - Password hashing library
- **Helmet** (v7.1.0) - Security middleware (HTTP headers)
- **express-rate-limit** (v8.2.1) - Rate limiting middleware

### Validation & Middleware
- **express-validator** (v7.0.1) - Input validation and sanitization
- **CORS** (v2.8.5) - Cross-Origin Resource Sharing middleware
- **compression** (v1.7.4) - Response compression middleware
- **morgan** (v1.10.0) - HTTP request logger middleware

### Development Tools
- **tsx** (v4.7.0) - TypeScript execution engine (for dev scripts)
- **dotenv** (v16.3.1) - Environment variable management
- **ESLint** (v8.56.0) - Code linting
- **@typescript-eslint/eslint-plugin** - TypeScript-specific ESLint rules
- **Jest** - Testing framework (configured)

---

## 🎨 Frontend Technologies

### Core Framework & Language
- **React** (v18.2.0) - UI library for building user interfaces
- **React DOM** (v18.2.0) - React renderer for web
- **TypeScript** (v5.2.2) - Typed JavaScript

### Build Tool & Development
- **Vite** (v7.2.6) - Fast build tool and dev server
- **@vitejs/plugin-react** (v4.2.1) - React plugin for Vite

### Routing & Navigation
- **React Router DOM** (v6.20.1) - Declarative routing for React

### Styling
- **TailwindCSS** (v3.3.6) - Utility-first CSS framework
- **PostCSS** (v8.4.32) - CSS processing tool
- **Autoprefixer** (v10.4.16) - CSS vendor prefixing

### HTTP Client & State Management
- **Axios** (v1.6.2) - Promise-based HTTP client
- **React Query** (v3.39.3) - Data fetching and state management library

### UI Components & Icons
- **Lucide React** (v0.303.0) - Beautiful icon library
- **React Hot Toast** (v2.4.1) - Toast notification library

### Data Visualization
- **Recharts** (v2.10.3) - Composable charting library built on React components

### Utilities
- **date-fns** (v2.30.0) - Modern JavaScript date utility library

### Development Tools
- **ESLint** (v8.55.0) - Code linting
- **eslint-plugin-react-hooks** - React Hooks linting rules
- **eslint-plugin-react-refresh** - Fast refresh linting rules

---

## 🗄️ Database Schema

The project uses **Prisma Schema** to define the database structure with the following main entities:
- Users (with roles: SUPER_ADMIN, ADMIN, PROJECT_MANAGER, TEAM_MEMBER, CLIENT)
- Projects (with stages and status tracking)
- Timesheets (time tracking with approval workflow)
- Customers
- Departments
- Resources (external links, documents)
- Tasks
- Budgets
- Stages (project lifecycle stages)

---

## 🚀 Deployment & Infrastructure

### Development Environment
- **Node.js 18+** - Required runtime version
- **npm** - Package manager

### Production Deployment Options

#### Option 1: Vercel (Cloud Platform)
- **Backend**: Deployed on Vercel
  - URL: `https://plt-3-dec-backend.vercel.app`
  - Serverless functions
- **Frontend**: Can be deployed on Vercel
  - Static site hosting

#### Option 2: Windows Server with IIS
- **IIS (Internet Information Services)** - Web server on Windows
- **iisnode** - Node.js hosting module for IIS
- **IIS URL Rewrite Module** - URL rewriting
- **IIS Application Request Routing (ARR)** - Reverse proxy
- **Windows Server** - Operating system

---

## 📦 Package Management

- **npm** - Node Package Manager (used for both frontend and backend)
- Separate `package.json` files:
  - `backend/package.json` - Backend dependencies
  - `frontend/package.json` - Frontend dependencies

---

## 🔐 Environment Configuration

### Backend Environment Variables
- `DATABASE_URL` - MySQL connection string
- `JWT_SECRET` - Secret key for JWT tokens
- `JWT_EXPIRE` - Token expiration time
- `PORT` - Server port (default: 5000)
- `NODE_ENV` - Environment (development/production)
- `CORS_ORIGIN` - Allowed CORS origins

### Frontend Environment Variables
- `VITE_API_URL` - Backend API URL

---

## 🛠️ Development Scripts

### Backend Scripts
- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Start production server
- `prisma:generate` - Generate Prisma Client
- `prisma:migrate` - Run database migrations
- `prisma:studio` - Open Prisma Studio (database GUI)
- `prisma:seed` - Seed database with initial data

### Frontend Scripts
- `npm run dev` - Start Vite development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

---

## 📊 Project Architecture

### Backend Structure
```
backend/
├── src/
│   ├── routes/       # API route handlers
│   ├── controllers/  # Business logic
│   ├── middleware/   # Custom middleware
│   ├── utils/        # Utility functions
│   └── server.ts     # Entry point
├── prisma/
│   ├── schema.prisma # Database schema
│   └── seed.ts       # Seed data script
└── dist/             # Compiled JavaScript (production)
```

### Frontend Structure
```
frontend/
├── src/
│   ├── pages/        # Page components
│   ├── components/   # Reusable components
│   ├── hooks/        # Custom React hooks
│   ├── services/     # API service functions
│   ├── utils/        # Utility functions
│   └── App.tsx       # Main app component
└── dist/             # Built static files (production)
```

---

## 🔄 Data Flow

1. **Frontend (React)** → Makes HTTP requests via **Axios**
2. **API Request** → Goes to **Backend (Express.js)**
3. **Middleware** → Authentication (JWT), validation, CORS, etc.
4. **Controllers** → Handle business logic
5. **Prisma Client** → Interacts with **MySQL Database**
6. **Response** → Sent back to frontend
7. **React Query** → Manages state and caching

---

## 📝 Key Features Enabled by Technologies

- **Type Safety**: TypeScript ensures type safety across the entire stack
- **Fast Development**: Vite provides instant HMR (Hot Module Replacement)
- **Database Type Safety**: Prisma generates type-safe database clients
- **Modern UI**: React 18 with TailwindCSS for responsive design
- **Efficient State Management**: React Query for server state
- **Secure Authentication**: JWT with bcrypt password hashing
- **API Validation**: express-validator for input validation
- **Data Visualization**: Recharts for charts and graphs
- **Professional Icons**: Lucide React icon library

---

## 📚 Additional Notes

- **Monorepo Structure**: Both frontend and backend are in the same repository
- **RESTful API**: Backend follows REST API principles
- **Role-Based Access Control**: 5 user roles with different permissions
- **Responsive Design**: Mobile-friendly UI with TailwindCSS
- **Production Ready**: Includes security, validation, error handling, and logging

---

**Last Updated**: Based on current project configuration files
**Project Name**: IKF Project Livetracker (PLT)

