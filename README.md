# Wassup

A self-hosted personal dashboard that aggregates weather, Reddit, YouTube, RSS feeds, and bookmarks. Configuration is defined in YAML with live editing via Monaco editor.

## Quick Start

```bash
bun install
bun run dev        # → http://localhost:2506
```

## Stack

Next.js 15 · React 19 · MUI 7 · TypeScript · Zod · TanStack Query

## Project Structure

```
src/
├── app/              # Next.js App Router
├── features/         # DDD modules (weather, reddit, youtube, feed, bookmark, tabs)
├── components/       # Shared UI (Widget dispatcher, AppBar, Theme)
├── providers/        # AppConfig, ReactQuery, Monaco
└── infrastructure/   # Root config schema
```

See [documents/specs/](documents/specs/) for detailed specifications.

## Commands

| Command | Purpose |
|---------|---------|
| `bun run dev` | Dev server (Turbopack) |
| `bun run build-no-lint` | Production build |
| `bun test` | Run all tests |
| `bun run storybook` | Component dev |

## TODOs

- [ ] Responsive layout for mobile/tablet
- [ ] Move integration tests to correct location
