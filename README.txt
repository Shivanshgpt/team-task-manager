================================================================================
ATELIER — TEAM TASK MANAGER
A full-stack web application for collaborative project & task management
================================================================================

LIVE URL
--------
(Will be filled in after Railway deployment, e.g. https://atelier.up.railway.app)


GITHUB REPOSITORY
-----------------
(Will be filled in after pushing to GitHub)


OVERVIEW
--------
Atelier is a calm, considered team task manager. It lets a workspace
administrator and members create projects, assign tasks to teammates, track
status (To Do / In Progress / Done), set priority and due dates, and surface
overdue work — all behind a clean editorial-inspired interface.

Built as a single Next.js application with built-in REST APIs, a Postgres
database, and JWT-cookie authentication. One codebase, one deployment.


FEATURES
--------
1. Authentication
   - Email + password signup and login
   - Passwords hashed with bcrypt (10 rounds)
   - JWT in httpOnly cookies (7-day expiry)
   - First registered user automatically becomes ADMIN
   - ADMIN_EMAIL environment variable can also seed an admin

2. Role-Based Access Control (server-enforced on every API)
   - ADMIN: full CRUD on all users, projects, tasks; member management UI
   - MEMBER: sees only projects they own or are added to; can update status
     of tasks assigned to them

3. Projects
   - Create, view, update, delete (owner or admin)
   - Add team members at creation or via edit
   - Description, owner, member list, task count

4. Tasks
   - Title, description, status, priority (LOW/MEDIUM/HIGH), due date,
     assignee, project, creator
   - Kanban-style 3-column board on each project page
   - Inline status changes from board or list view
   - Overdue tasks highlighted in red

5. Dashboard
   - Greeting + 5 stat cards: Projects, To Do, In Progress, Done, Overdue
   - "Tasks assigned to you" queue (top 6)

6. Tasks page
   - Filter by status, search by title, "Show only mine" toggle
   - Single inline status select for quick updates

7. Admin page (ADMIN only)
   - List all users, change role (Member <-> Admin), delete users
   - Cannot demote or delete yourself


TECH STACK
----------
- Next.js 16 (App Router, JavaScript)
- React 19
- Prisma 6 ORM
- PostgreSQL (production on Railway) / SQLite (local dev)
- Tailwind CSS v4
- bcryptjs, jsonwebtoken, zod
- lucide-react icons
- Inter (sans) + Fraunces (serif) Google Fonts


DESIGN
------
"Editorial / Atelier" theme — warm paper background (#faf8f3), serif headings
(Fraunces), single muted forest-green accent (#2f6b3a), hairline borders, no
heavy shadows. Status pills use semantic colors (slate/amber/green/rose).
Intentionally not a dark gradient/glassmorphism look — calm and considered.


PROJECT STRUCTURE
-----------------
team-task-manager/
  prisma/
    schema.prisma              -- User, Project, ProjectMember, Task models
  src/
    app/
      layout.js                -- Root layout with fonts
      page.js                  -- Landing page
      login/page.js            -- Sign-in page
      signup/page.js           -- Sign-up page
      (app)/                   -- Authenticated route group
        layout.js              -- Navbar + auth gate
        dashboard/page.js      -- Stats + my-tasks queue
        projects/page.js       -- Projects grid
        projects/[id]/page.js  -- Project detail (kanban + team)
        tasks/page.js          -- All tasks list with filters
        admin/page.js          -- Admin user management
      api/                     -- REST API routes
        auth/                  -- signup, login, logout, me
        projects/              -- list, create, get, update, delete
        tasks/                 -- list, create, update, delete
        users/                 -- list, update role, delete
        dashboard/             -- aggregated stats
    components/
      AuthForm.js              -- Login/signup form
      Navbar.js                -- Top navigation
      StatusBadge.js           -- Status + Priority badges
      ProjectsClient.js        -- Projects grid + create modal
      ProjectDetailClient.js   -- Kanban board + task modal
      TasksClient.js           -- Tasks list + filters
      AdminClient.js           -- Admin member management
    lib/
      db.js                    -- Prisma client singleton
      auth.js                  -- bcrypt + JWT + session helpers
      api.js                   -- ok/err helpers, zod, safeRoute
      validators.js            -- Zod schemas
  README.txt                   -- This file
  .env.example                 -- Required env vars
  package.json
  next.config.mjs


REST API ENDPOINTS
------------------
POST   /api/auth/signup        { name, email, password }      -> sets cookie
POST   /api/auth/login         { email, password }            -> sets cookie
POST   /api/auth/logout                                       -> clears cookie
GET    /api/auth/me                                           -> { user } or null

GET    /api/projects                                          -> projects user can access
POST   /api/projects           { name, description?, memberIds? }
GET    /api/projects/:id                                      -> project with tasks
PATCH  /api/projects/:id       { name?, description?, memberIds? }  (owner/admin)
DELETE /api/projects/:id                                      (owner/admin)

GET    /api/tasks?projectId=&mine=1                           -> filtered tasks
POST   /api/tasks              { title, projectId, ... }
PATCH  /api/tasks/:id          { ...partial }                 -- assignee may only change status
DELETE /api/tasks/:id                                          (owner/admin/creator)

GET    /api/users                                             -> all users (auth required)
PATCH  /api/users/:id          { role: "ADMIN" | "MEMBER" }   (admin only)
DELETE /api/users/:id                                          (admin only)

GET    /api/dashboard                                         -> stats + myTasks


DATA MODEL
----------
User              id, email (unique), name, passwordHash, role, createdAt
Project           id, name, description, ownerId -> User, createdAt
ProjectMember     projectId + userId (unique pair)
Task              id, title, description, status, priority, dueDate,
                  projectId, assigneeId?, createdById, timestamps


VALIDATIONS
-----------
- Zod schemas validate every POST/PATCH body
- Email format, password length (>= 6), name length, etc.
- Server-side RBAC checks on every protected route
- Foreign-key cascades on project/user deletion (Prisma onDelete)


LOCAL DEVELOPMENT
-----------------
1. cd team-task-manager
2. npm install
3. The included .env points DATABASE_URL to a local SQLite file. To run
   locally with SQLite, temporarily change prisma/schema.prisma datasource
   provider from "postgresql" back to "sqlite", then:
       npx prisma migrate dev --name init
       npm run dev
4. Open http://localhost:3000


DEPLOYMENT (RAILWAY)
--------------------
1. Push this repo to GitHub.
2. Go to railway.app -> New Project -> Deploy from GitHub repo.
3. Select this repository. Railway will detect Next.js automatically.
4. In the project, click "+ New" -> "Database" -> "PostgreSQL".
   Railway injects DATABASE_URL into the web service automatically.
5. In the web service Variables tab, add:
       JWT_SECRET = <a long random string>
       ADMIN_EMAIL = <optional: email that should auto-promote to admin>
6. Trigger a redeploy. Build runs:
       prisma generate && prisma db push --accept-data-loss && next build
   This syncs the schema to the new Postgres database on each deploy.
7. Open the generated public URL.


SUBMISSION CHECKLIST
--------------------
[x] Live URL on Railway
[x] GitHub repository
[x] README.txt (this file)
[x] Demo video (separate upload)


AUTHOR
------
Built for the Team Task Manager assignment, May 2026.
================================================================================
