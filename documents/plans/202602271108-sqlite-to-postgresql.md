# SQLite → PostgreSQL Migration

## Scope

Migrate Wassup from embedded SQLite (`better-sqlite3`) to PostgreSQL. This replaces the file-based database with a networked Postgres instance while preserving the existing Prisma ORM layer.

### What This Plan Does

| Area | Before | After |
|---|---|---|
| Database | SQLite (`dev.db` file) | PostgreSQL 17 (Docker service) |
| Prisma adapter | `@prisma/adapter-better-sqlite3` | `@prisma/adapter-pg` |
| Connection | `file:./dev.db` | `postgresql://...` |
| Docker | Volume-mounted `.db` file, `libsqlite3-0` | Postgres container, health-checked dependency |

### What This Plan Does NOT Do

- **No schema changes** — all 5 models are already Postgres-compatible
- **No ORM migration** — Prisma stays as the ORM
- **No data migration script** — re-login + re-save config is simpler for a personal dashboard
- **No managed database** — self-hosted Postgres in Docker, not RDS/Supabase

---

## Current State

| Aspect | Detail |
|---|---|
| **Schema** | 5 models: `Account`, `Session`, `User`, `VerificationToken`, `UserConfig` |
| **Prisma consumers** | `src/lib/auth.ts`, `src/app/api/config/route.ts`, 1 test file |
| **Migrations** | 2 SQLite migrations (disposable) |
| **Docker** | Single container, `libsqlite3-0` runtime dep, volume for `.db` file |
| **`next.config.ts`** | `serverExternalPackages: ["better-sqlite3"]` |

---

## Implementation

### Step 1 — Swap Prisma Datasource Provider

**File:** `prisma/schema.prisma`

```prisma
datasource db {
  provider = "postgresql"  // was "sqlite"
}
```

No model changes. `String`, `DateTime`, `Int`, `@id`, `@unique`, `@relation`, `@default(cuid())` are all portable between SQLite and PostgreSQL.

---

### Step 2 — Replace Driver Adapter

**File:** `src/lib/prisma.ts`

```typescript
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL environment variable is required");
  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({ adapter });
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

Key decisions:
- **`PrismaPg({ connectionString })`** — Prisma 7 manages connection pooling internally via the adapter. No need to create an external `pg.Pool`. The adapter uses the `pg` driver underneath but handles pool lifecycle itself.
- **Same `globalThis` guard** — Next.js HMR still creates fresh module instances. The guard prevents connection pool leaks during development.

---

### Step 3 — Swap npm Dependencies

```diff
  # Remove SQLite packages
- "@prisma/adapter-better-sqlite3": "^7.4.1",
- "better-sqlite3": "^12.6.2",
- "@types/better-sqlite3": "^7.6.13",  # devDependencies

  # Add PostgreSQL adapter (pg is a transitive dependency, not a direct one)
+ "@prisma/adapter-pg": "^7.4.1",
```

Run:

```bash
bun remove @prisma/adapter-better-sqlite3 better-sqlite3 @types/better-sqlite3
bun add @prisma/adapter-pg
```

---

### Step 4 — Remove `better-sqlite3` from Next.js Config

**File:** `next.config.ts`

```diff
  const nextConfig: NextConfig = {
    output: "standalone",
-   serverExternalPackages: ["better-sqlite3"],
    images: {
```

`better-sqlite3` was listed because it's a native C++ addon that can't be bundled by webpack. `pg` is pure JavaScript — no special treatment needed.

---

### Step 5 — Fresh Migration Baseline

The 2 existing SQLite migrations are not portable. Start clean:

```bash
rm -rf prisma/migrations/
bunx prisma migrate dev --name init
```

This generates a single, clean PostgreSQL migration. Safe because:
- Only 2 prior migrations with trivial schema
- No production data worth preserving (see scope)
- `migration_lock.toml` will auto-update to `provider = "postgresql"`

---

### Step 6 — Update Docker Compose

**File:** `compose.yml`

```yaml
services:
  postgres:
    image: postgres:17.4-alpine
    container_name: wassup-db
    environment:
      POSTGRES_DB: wassup
      POSTGRES_USER: wassup
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - pg-data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U wassup"]
      interval: 5s
      timeout: 3s
      retries: 5
    restart: unless-stopped

  wassup:
    container_name: wassup
    build: .
    ports:
      - "2506:2506"
    depends_on:
      postgres:
        condition: service_healthy
    environment:
      DATABASE_URL: postgresql://wassup:${POSTGRES_PASSWORD}@postgres:5432/wassup
    env_file:
      - .env
    restart: unless-stopped

volumes:
  pg-data:
```

Key decisions:
- **`service_healthy`** — Wassup waits for Postgres to accept connections before running `prisma migrate deploy`
- **Port `5432` exposed** — allows running `bunx prisma migrate dev` from the host during development
- **Database name `wassup`** — Wassup data lives under the `wassup` database

---

### Step 7 — Update Dockerfile

**File:** `Dockerfile`

Remove all SQLite-specific lines:

```diff
  # Runner stage: remove libsqlite3-0
  RUN apt-get update && apt-get install -y --no-install-recommends \
      openssl \
-     libsqlite3-0 \
      && rm -rf /var/lib/apt/lists/*

  # Remove SQLite DB directory and env var
- # SQLite DB lives here — mount a volume in production
- RUN mkdir -p /app/data
- ENV DATABASE_URL=file:/app/data/wassup.db
```

The build-time `DATABASE_URL` in the builder stage also changes:

```diff
  # Builder stage: dummy DATABASE_URL for prisma generate
- ENV DATABASE_URL=file:/tmp/build.db
+ ENV DATABASE_URL=postgresql://build:build@localhost:5432/build
```

> This URL doesn't need to be reachable — it's only used by `prisma generate` to parse the connection string format. No actual connection is made at build time.

The `CMD` remains unchanged — `prisma migrate deploy && node server.js` works identically for PostgreSQL.

---

### Step 8 — Update Environment Configuration

**File:** `.env.example`

```diff
  # Database
- DATABASE_URL=file:./dev.db
+ DATABASE_URL=postgresql://wassup:password@localhost:5432/wassup
+ POSTGRES_PASSWORD=changeme  # used by Docker Compose for the postgres service
```

For local development, start Postgres via the compose file from Step 6:

```bash
docker compose up -d postgres
```

---

### Step 9 — Verify Tests

**No changes needed.** The test file (`config-route.test.ts`) fully mocks `@/lib/prisma` via `vi.mock` — it never touches a real database. The tests are database-agnostic and will pass without modification.

---

### Step 10 — Update Documentation

| File | Change |
|---|---|
| `README.md` | Update quickstart: `docker compose up -d postgres` before `bunx prisma migrate dev` |
| `documents/specs/overview.md` | `Prisma 7 + PostgreSQL` (was `Prisma 7 + SQLite`) |
| `documents/specs/development.md` | Update DB setup instructions, remove `better-sqlite3` references |
| `documents/specs/architecture.md` | Update infra diagram |
| `documents/knowledge/data-and-persistence.md` | Update persistence layer description |
| `documents/knowledge/architecture-and-design.md` | Update architecture diagrams |
| `documents/knowledge/auth-and-security.md` | Update adapter references |

---

### Step 11 — Cleanup

Delete files no longer needed:

```bash
rm dev.db          # SQLite database file
rm dev.db-journal  # SQLite WAL file (if exists)
```

Add to `.gitignore` (if not already): remove `dev.db`, add nothing (Postgres data lives in a Docker volume).

---

## Risk Assessment

| Risk | Level | Mitigation |
|---|---|---|
| **Schema incompatibility** | 🟢 None | Schema uses only portable Prisma types. No SQLite-specific features. |
| **Driver adapter mismatch** | 🟢 Low | Prisma 7 has first-class `@prisma/adapter-pg` — same pattern as current `adapter-better-sqlite3`. |
| **Migration history** | 🟢 None | Fresh baseline. 2 old SQLite migrations are disposable. |
| **Data loss** | 🟡 Low | Personal dashboard — re-login via GitHub OAuth recreates user/session. Re-save config from localStorage. |
| **Infra complexity** | 🟡 Medium | Goes from zero-infra (embedded file) to a Postgres process. Docker Compose handles it, but it's a new container to manage. |
| **Connection pooling misconfiguration** | 🟡 Medium | `PrismaPg` manages pooling internally via `pg`. Defaults differ from Prisma 6 (e.g. no connection timeout). Monitor with `pg_stat_activity` if needed. |

---

## File Change Summary

| File | Action | Description |
|---|---|---|
| `prisma/schema.prisma` | Edit | `provider = "postgresql"` |
| `src/lib/prisma.ts` | Edit | Replace `PrismaBetterSqlite3` with `PrismaPg({ connectionString })` |
| `package.json` | Edit | Swap SQLite deps for Postgres deps |
| `next.config.ts` | Edit | Remove `serverExternalPackages: ["better-sqlite3"]` |
| `prisma/migrations/` | Delete + Recreate | Fresh PostgreSQL baseline migration |
| `compose.yml` | Edit | Add `postgres` service, update `wassup` with `depends_on` |
| `Dockerfile` | Edit | Remove `libsqlite3-0`, remove SQLite volume setup |
| `.env.example` | Edit | PostgreSQL connection string |
| `README.md` | Edit | Update quickstart |
| `documents/specs/*` | Edit | Update references |
| `documents/knowledge/*` | Edit | Update architecture descriptions |
| `dev.db` | Delete | No longer needed |

---

## Effort

| Step | Time |
|---|---|
| Schema + driver swap (Steps 1–4) | ~15 min |
| Fresh migration baseline (Step 5) | ~5 min |
| Docker Compose + Dockerfile (Steps 6–7) | ~20 min |
| Environment + tests (Steps 8–9) | ~15 min |
| Documentation updates (Step 10) | ~20 min |
| Cleanup + verification (Step 11) | ~10 min |
| **Total** | **~1.5 hours** |
