# Wassup — Development Guide

## Setup

```bash
bun install
cp .env.example .env               # Fill in env vars (GitHub OAuth, etc.)
docker compose up -d postgres       # Start PostgreSQL
bunx prisma migrate dev             # Initialize database
bun run dev                         # Starts Next.js with Turbopack on :2506
```

## Commands

| Command | Purpose |
|---------|---------|
| `bun run dev` | Dev server (Turbopack, port 2506) |
| `bun run build` | Production build |
| `bun test` | Run all tests |
| `bun run test:unit` | Unit tests only |
| `bun run test:integration` | Integration tests only |
| `bun run test:e2e` | E2E tests (Playwright) |
| `bun run test:coverage` | Tests with coverage |
| `bun run storybook` | Storybook dev server (port 6006) |
| `bun run build-storybook` | Build static Storybook |
| `bun run watch-config` | Watch config file changes |

## File Naming Conventions

| Pattern | Meaning |
|---------|---------|
| `*.schemas.ts` | Zod schemas + TypeScript type exports |
| `*.actions.ts` | Next.js Server Actions (`"use server"`) |
| `*.stories.tsx` | Storybook stories |
| `*.unit.test.ts` | Unit tests |
| `*.integration.test.ts` | Integration tests |
| `*.e2e.test.ts` | E2E tests (Playwright) |

## Server Action Caching Pattern

All server actions follow the same pattern — cache **data**, not service instances:

```typescript
const dataCache = new LRUCache<string, WidgetProps>({
  max: 20,
  ttl: 1000 * 60 * 5, // 5 minutes
});

export async function fetchWidgetProps(config) {
  const key = JSON.stringify(config);
  const cached = dataCache.get(key);
  if (cached) return cached;

  const data = await service.fetch();
  dataCache.set(key, data);
  return data;
}
```

## Widget Registry Pattern

All widget types are registered in `src/lib/widget-registry.ts` with:

- `type` / `label` — identifier and display name
- `schema` — Zod schema for validation
- `fields` — field definitions driving the visual config editor forms

The registry powers the `SchemaForm` component, default value generation, and widget summary text.

## External API Dependencies

| API | Auth | Notes |
|-----|------|-------|
| OpenMeteo | None | Weather data (free) |
| Geonames | Optional username | Geocoding (30k req/hr free) |
| Reddit JSON | None | Unofficial — be conservative |
| YouTube RSS | None | Unofficial — may change |
| RSS/Atom feeds | Varies | Some feeds block scrapers |
| GitHub Search API | None | Public search endpoint, rate-limited |

## Database

PostgreSQL via Prisma with `@prisma/adapter-pg` driver adapter. Schema at `prisma/schema.prisma`.

| Model | Purpose |
|-------|---------|
| `User` | NextAuth user record |
| `Account` | OAuth provider link |
| `Session` | Server-side session |
| `VerificationToken` | Email verification |
| `UserConfig` | Encrypted user config (ciphertext + PBKDF2 salt) |
