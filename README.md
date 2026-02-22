# Wassup

A self-hosted personal dashboard that aggregates weather, Reddit, YouTube, RSS feeds, GitHub trending repos, and bookmarks into a single page. Manage multiple dashboard presets with a visual editor. Authenticated users get zero-knowledge encrypted cloud sync.

## Quick Start

```bash
bun install
bunx prisma migrate dev   # Initialize SQLite database
bun run dev                # → http://localhost:2506
```

## Tech Stack

Next.js 16 · React 19 · MUI 7 · TypeScript · Zod · TanStack Query · Prisma + SQLite · NextAuth v5 · @dnd-kit

## Features

- **8 widget types** — Weather, Reddit, YouTube, RSS Feed, GitHub Trending, Hacker News, Bookmarks, Tabs (container)
- **Visual config editor** — Add/edit/remove pages, columns, and widgets via forms with live preview
- **Preset system** — Multiple dashboard configs with drag-and-drop reorder, import/export (JSON)
- **Authentication** — GitHub OAuth via NextAuth v5
- **Zero-knowledge encryption** — Config encrypted client-side (AES-256-GCM) before server storage
- **Security** — CSP with per-request nonce, CSRF origin validation, rate limiting

## Project Structure

```
src/
├── app/              # Next.js App Router + API routes (auth, config)
├── features/         # DDD modules (weather, reddit, youtube, feed, bookmark, github, hackernews, tabs)
├── components/       # Widget dispatcher, AppBar, config-editor, auth
├── providers/        # AppConfig, ReactQuery, Session, EditMode
├── hooks/            # useEncryptedSync
├── lib/              # Auth, presets, widget-registry, crypto, rate-limit
└── infrastructure/   # Root config schema (AppState, Preset, AppConfig)

prisma/               # SQLite schema + migrations
documents/specs/      # Detailed specifications
```

See [documents/specs/](documents/specs/) for full documentation.

## Commands

| Command | Purpose |
|---------|---------|
| `bun run dev` | Dev server (Turbopack, port 2506) |
| `bun run build` | Production build |
| `bun test` | Run all tests |
| `bun run test:unit` | Unit tests only |
| `bun run test:integration` | Integration tests only |
| `bun run test:e2e` | E2E tests (Playwright) |
| `bun run storybook` | Storybook dev server |
