# IB4G BugTracker

A local-first bug tracker for IB4G-style Jira reports. Paste an IB4G bug template into one
textarea and the parser extracts 16+ structured fields (environment, preconditions, steps to
reproduce, 3-tier impact analysis, technical notes). Includes a dashboard with trend/burndown
charts, saved filters, bulk actions, labels, comments, and a full audit timeline.

Built with **Next.js 16 · React 19 · Prisma 6 + SQLite · TanStack Query · Zustand · Tailwind v4 ·
shadcn/ui**, running on [Bun](https://bun.sh).

## Prerequisites

- [Bun](https://bun.sh) >= 1.3 (package manager + runtime)
- Docker (only for the deployment path in [Docker deployment](#docker-deployment))

## Setup (development)

```bash
bun install
cp .env.example .env          # then edit DATABASE_URL if needed
bun run db:deploy             # apply migrations (creates db/custom.db on first run)
bun run db:seed               # optional: sample labels + bugs
bun run dev                   # http://localhost:3000
```

> **SQLite path rule**: Prisma resolves relative SQLite paths against `prisma/schema.prisma`,
> not the working directory. The default `file:../db/custom.db` points at `<repo>/db/custom.db`.

## Scripts

| Script                | What it does                                                     |
| --------------------- | ---------------------------------------------------------------- |
| `bun run dev`         | Start the dev server on port 3000                                |
| `bun run build`       | Production build + copy static assets into `.next/standalone`    |
| `bun run start`       | Run the standalone production server                             |
| `bun run lint`        | ESLint                                                           |
| `bun run db:generate` | Generate the Prisma client                                       |
| `bun run db:migrate`  | Create/apply a migration in development (`prisma migrate dev`)   |
| `bun run db:deploy`   | Apply pending migrations (idempotent — safe for CI/containers)   |
| `bun run db:seed`     | Seed sample labels + bugs (idempotent)                           |
| `bun run db:reseed`   | **Destructive**: wipe and reseed with back-dated demo data       |

## Database

SQLite, managed by Prisma. The schema lives in `prisma/schema.prisma`; changes go through
versioned migrations in `prisma/migrations/` (never `db push` on a real database). The DB file
itself (`db/custom.db`) is **not** in git — each environment creates its own via migrations.

**Workflow for schema changes:**

1. Edit `prisma/schema.prisma`
2. `bun run db:migrate -- --name <change>` (generates + applies a migration)
3. Commit `prisma/migrations/**` together with the schema change

### Adopting an existing database

If you have a pre-migrations `custom.db` (e.g. from the old Z.ai artifact or an earlier copy):

```bash
cp /path/to/old/custom.db db/custom.db
bunx prisma migrate resolve --applied 0_init   # mark baseline as applied
bunx prisma migrate status                     # should report "up to date"
```

### Backups

```bash
# local file
sqlite3 db/custom.db ".backup db/backup-$(date +%F).db"

# docker volume (host side — see Docker deployment)
bash scripts/backup-db.sh
```

For continuous replication, consider [Litestream](https://litestream.io/) (not configured here).

## Docker deployment

Primary deployment path: a multi-stage Dockerfile (bun-based) producing the Next.js standalone
server, with the SQLite file on a named volume so data survives rebuilds.

```bash
docker compose up --build -d        # builds, migrates (entrypoint), starts on :3000
```

- Migrations run automatically at container start (`prisma migrate deploy` in
  `docker-entrypoint.sh`) — idempotent.
- Seed optionally: `docker compose exec app bun scripts/seed.ts`
- Data lives in the `app-data` volume (`/app/data/custom.db` inside the container).
- Healthcheck: `GET /api/health`.

On a VPS: clone the repo, `docker compose up --build -d`, and map port 80 if desired
(`ports: ["80:3000"]`). Put TLS in front with your reverse proxy of choice (Caddy/Traefik/nginx).

## Project layout

```
prisma/schema.prisma        # Bug, Label, BugLabel, BugEvent, BugComment
prisma/migrations/          # versioned migrations
scripts/                    # seed, reseed, backup, standalone-asset copy
src/app/api/                # REST API (Zod-validated)
src/components/bugs/        # feature components (views, cards, dialogs)
src/hooks/use-bugs.ts       # TanStack Query hooks for all API data
src/lib/template-parser.ts  # IB4G template → structured bug fields
src/store/                  # Zustand client state (filters, settings, notifications)
```

`worklog.md` contains the full development history and design notes.
