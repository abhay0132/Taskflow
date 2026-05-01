# TaskFlow — Project & Task Management App

A full-stack project management app with role-based access control, built with Node.js, PostgreSQL, and React.

## Live Demo
<!-- Replace with your Railway URL after deployment -->
🔗 **https://taskflow-production.up.railway.app**

## Features

- **Authentication** — Signup / Login with JWT (7-day tokens)
- **Projects** — Create projects, invite team members by email
- **Role-Based Access** — Admins manage members & delete tasks; Members create & update tasks
- **Task Management** — Kanban board with 4 statuses (To Do, In Progress, In Review, Done)
- **Task Details** — Title, description, priority (Low/Medium/High/Urgent), due date, assignee
- **Dashboard** — Overview stats, task status breakdown, my active tasks, overdue tasks
- **Overdue Tracking** — Highlights tasks past their due date

## Tech Stack

| Layer | Technology |
|-------|------------|
| Backend | Node.js + Express |
| Database | PostgreSQL + Prisma ORM |
| Auth | JWT + bcryptjs |
| Frontend | React + Vite + Tailwind CSS |
| Deployment | Railway |

## API Endpoints

### Auth
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/signup` | Register new user |
| POST | `/api/auth/login` | Login, returns JWT |
| GET | `/api/auth/me` | Get current user |

### Projects
| Method | Path | Access | Description |
|--------|------|--------|-------------|
| GET | `/api/projects` | Any member | List user's projects |
| POST | `/api/projects` | Authenticated | Create project |
| GET | `/api/projects/:id` | Member | Get project with tasks |
| PUT | `/api/projects/:id` | Admin | Update project |
| DELETE | `/api/projects/:id` | Owner | Delete project |
| POST | `/api/projects/:id/members` | Admin | Add member by email |
| DELETE | `/api/projects/:id/members/:userId` | Admin | Remove member |
| PUT | `/api/projects/:id/members/:userId` | Admin | Update member role |

### Tasks
| Method | Path | Access | Description |
|--------|------|--------|-------------|
| GET | `/api/projects/:id/tasks` | Member | List project tasks |
| POST | `/api/projects/:id/tasks` | Member | Create task |
| GET | `/api/tasks/:id` | Member | Get task |
| PUT | `/api/tasks/:id` | Member | Update task |
| DELETE | `/api/tasks/:id` | Admin | Delete task |
| PATCH | `/api/tasks/:id/status` | Member | Update task status |

### Dashboard
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/dashboard` | Stats + recent/overdue tasks |

## Local Development

### Prerequisites
- Node.js 18+
- PostgreSQL database

### Setup

```bash
# Clone
git clone https://github.com/your-username/taskflow.git
cd taskflow

# Install backend dependencies
npm install

# Install & build frontend
npm run build

# Set environment variables
cp .env.example .env
# Edit .env with your DATABASE_URL and JWT_SECRET

# Run DB migrations
npx prisma migrate dev --name init

# Start development server
npm run dev
```

For frontend hot-reload (separate terminal):
```bash
cd client
npm run dev
```

The frontend dev server proxies `/api` requests to `http://localhost:3001`.

### Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Secret key for JWT signing |
| `PORT` | Server port (default: 3001) |
| `NODE_ENV` | `development` or `production` |

## Deploying to Railway

1. Push your code to GitHub
2. Create a new Railway project → **Deploy from GitHub repo**
3. Add a **PostgreSQL** service (Railway provides one free)
4. Set environment variables in Railway:
   - `DATABASE_URL` → auto-filled by Railway PostgreSQL plugin
   - `JWT_SECRET` → generate a strong random string
   - `NODE_ENV` → `production`
5. Railway auto-detects `railway.json` and runs migrations + starts the server

The `railway.json` build command:
```
npm install && npm run build
```
Start command:
```
npx prisma db push && node src/app.js
```

## Database Schema

```
User ──< ProjectMember >── Project ──< Task
                                        │
                               assignee (User?)
                               creator (User)
```

- **User**: id, name, email, password
- **Project**: id, name, description, ownerId
- **ProjectMember**: projectId, userId, role (ADMIN | MEMBER)
- **Task**: id, title, description, status, priority, dueDate, projectId, assigneeId, creatorId

## Role Permissions

| Action | Member | Admin |
|--------|--------|-------|
| View project & tasks | ✅ | ✅ |
| Create tasks | ✅ | ✅ |
| Update tasks / status | ✅ | ✅ |
| Delete tasks | ❌ | ✅ |
| Invite members | ❌ | ✅ |
| Remove members | ❌ | ✅ |
| Update project info | ❌ | ✅ |
| Delete project | ❌ | Owner only |
