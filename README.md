# TaskFlow — MERN Team Task Manager

A full-stack task management system built with **MongoDB, Express, React, Node.js** for a 15-member team. Admins assign daily tasks; members track and update their work.

---

## 📁 Folder Structure

```
task-manager/
├── backend/
│   ├── config/
│   │   ├── db.js                # MongoDB connection
│   │   └── seed.js              # Seed: 1 admin + 15 members
│   ├── controllers/
│   │   ├── authController.js    # Login, me, change password
│   │   ├── userController.js    # CRUD for team members
│   │   ├── taskController.js    # CRUD for tasks + comments
│   │   └── dashboardController.js # Admin & member dashboards
│   ├── middleware/
│   │   └── auth.js              # JWT protect + adminOnly guards
│   ├── models/
│   │   ├── User.js              # User schema (admin/member)
│   │   └── Task.js              # Task schema with comments
│   ├── routes/
│   │   ├── auth.js
│   │   ├── users.js
│   │   ├── tasks.js
│   │   └── dashboard.js
│   ├── .env.example
│   ├── package.json
│   └── server.js
│
└── frontend/
    ├── public/
    │   └── index.html
    ├── src/
    │   ├── components/
    │   │   └── common/
    │   │       └── Layout.js    # Sidebar + nav shell
    │   ├── context/
    │   │   └── AuthContext.js   # Auth state + JWT storage
    │   ├── pages/
    │   │   ├── LoginPage.js
    │   │   ├── AdminDashboard.js
    │   │   ├── MemberDashboard.js
    │   │   ├── TasksPage.js     # Task list + create/edit modal
    │   │   ├── TaskDetailPage.js # Task detail + comments
    │   │   └── TeamPage.js      # Team CRUD (admin)
    │   ├── utils/
    │   │   └── api.js           # Axios instance + interceptors
    │   ├── App.js               # Router + protected routes
    │   ├── index.js
    │   └── styles.css           # Global design system
    └── package.json
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)

### 1. Clone & Install

```bash
# Backend
cd task-manager/backend
cp .env.example .env
# Edit .env with your MONGO_URI
npm install

# Frontend
cd ../frontend
npm install
```

### 2. Configure `.env` (backend)

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/taskmanager
JWT_SECRET=your_secret_key_here
JWT_EXPIRE=7d
```

### 3. Seed Database

```bash
cd backend
npm run seed
```

This creates:
- **Admin**: admin@team.com / password123
- **15 Members**: alice@team.com, bob@team.com … (all password123)

### 4. Run

```bash
# Terminal 1 — Backend
cd backend
npm run dev        # runs on :5000

# Terminal 2 — Frontend
cd frontend
npm start          # runs on :3000
```

Open **http://localhost:3000**

---

## 🔑 API Endpoints

### Auth
| Method | Endpoint | Access |
|--------|----------|--------|
| POST | /api/auth/login | Public |
| GET | /api/auth/me | Protected |
| PUT | /api/auth/change-password | Protected |

### Users
| Method | Endpoint | Access |
|--------|----------|--------|
| GET | /api/users | Admin |
| POST | /api/users | Admin |
| GET | /api/users/:id | Protected |
| PUT | /api/users/:id | Admin |
| DELETE | /api/users/:id | Admin |

### Tasks
| Method | Endpoint | Access |
|--------|----------|--------|
| GET | /api/tasks | Protected (members see own) |
| POST | /api/tasks | Admin |
| GET | /api/tasks/today | Protected |
| GET | /api/tasks/:id | Protected |
| PUT | /api/tasks/:id | Admin (full) / Member (status) |
| DELETE | /api/tasks/:id | Admin |
| POST | /api/tasks/:id/comments | Protected |

### Dashboard
| Method | Endpoint | Access |
|--------|----------|--------|
| GET | /api/dashboard | Admin |
| GET | /api/dashboard/member | Protected |

---

## ✨ Features

**Admin:**
- Dashboard with stats: total tasks, overdue, workload per member
- Assign tasks to any of the 15 members with priority, due date, category, tags
- Edit/delete tasks
- Team management: add, edit, deactivate members, view per-department
- Filter tasks by member, status, priority

**Member:**
- Personal dashboard showing today's tasks and all assigned tasks
- View task details, update task status
- Add comments to tasks
- Overdue task alerts

**Task fields:** title, description, assignee, priority (low/medium/high/urgent), status (pending/in-progress/completed/on-hold), category, due date, tags, comments

---

## 🛠 Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React 18, React Router 6 |
| Styling | Custom CSS (no UI lib dependency) |
| HTTP | Axios |
| Backend | Node.js, Express 4 |
| Database | MongoDB, Mongoose |
| Auth | JWT (jsonwebtoken) + bcryptjs |
| Dev | Nodemon |
