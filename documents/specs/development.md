# Wassup — Development Guide

## Setup

```bash
bun install
cp .env.local.example .env.local   # Fill in env vars
bun run dev                        # Starts Next.js with Turbopack on :2506
```

## Commands

| Command | Purpose |
|---------|---------|
| `bun run dev` | Dev server (Turbopack) |
| `bun run build-no-lint` | Production build (skip lint) |
| `bun test` | Run all tests |
| `bun run storybook` | Visual component development |

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

## External API Dependencies

| API | Auth | Notes |
|-----|------|-------|
| OpenMeteo | None | Weather data (free) |
| Geonames | Optional username | Geocoding (30k req/hr free) |
| Reddit JSON | None | Unofficial — be conservative |
| YouTube RSS | None | Unofficial — may change |
| RSS/Atom feeds | Varies | Some feeds block scrapers |
