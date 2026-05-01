# Atelier — Team Task Manager

A calm, considered full-stack task manager for small teams. Built with Next.js 16, Prisma, PostgreSQL, and Tailwind v4.

See **[README.txt](./README.txt)** for the full submission documentation, feature list, REST API reference, and deployment guide.

## Quick start (local)

```bash
npm install
# For local dev with SQLite: change prisma/schema.prisma datasource
# provider from "postgresql" to "sqlite", then:
npx prisma migrate dev --name init
npm run dev
```

Open http://localhost:3000.

## Deploy on Railway

1. Push this repo to GitHub.
2. Railway → New Project → Deploy from GitHub repo.
3. Add the PostgreSQL plugin (auto-injects `DATABASE_URL`).
4. Set env vars: `JWT_SECRET` (long random string), optional `ADMIN_EMAIL`.
5. Deploy. The build runs `prisma db push` to sync the schema.
