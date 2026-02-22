# Wassup — Overview

A self-hosted personal dashboard that aggregates weather, Reddit, YouTube, RSS feeds, GitHub trending repos, and bookmarks into a single page. Configuration is managed via a visual editor (edit mode) or programmatically through presets. Authenticated users get zero-knowledge encrypted cloud sync.

## Tech Stack

| Layer | Technology |
|-------|-----------| 
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript 5 |
| UI | React 19 + MUI 7 |
| Schema | Zod 3 → JSON Schema |
| Auth | NextAuth v5 (GitHub OAuth) |
| Database | Prisma 7 + SQLite (better-sqlite3) |
| Client State | React Context + useReducer (persisted to localStorage) |
| Server Cache | LRU Cache (per server action, 5 min TTL) |
| Client Cache | TanStack React Query (in-memory, 5 min stale) |
| Logging | tslog 4 |
| Package Manager | Bun |
| Tests | Vitest 4 + Playwright 1.58 |
| Visual Testing | Storybook 10 |
| Drag & Drop | @dnd-kit |

## Layout Model

```yaml
ui:
  theme: light | dark
  pages:
    - title: Home
      path: /
      columns:
        - size: 4        # MUI Grid (1–12)
          widgets:
            - type: weather
              location: London
```

Pages → columns (12-col grid) → widgets (stacked vertically). Each page becomes a URL route.

## Widget Types

| Type | Data Source | Network |
|------|-----------|---------| 
| `weather` | OpenMeteo + Geonames geocoding | Yes |
| `reddit` | Reddit public JSON API | Yes |
| `youtube` | YouTube RSS feed | Yes |
| `feed` | Any RSS/Atom URL | Yes |
| `github` | GitHub Search API | Yes |
| `bookmark` | Static config | No |
| `tabs` | Container for other widgets | — |

## Key Design Decisions

1. **Preset system** — Users manage multiple dashboard configurations as presets with drag-and-drop reordering, import/export (JSON), and inline renaming. State is `AppState = { activePresetId, presets[] }`.
2. **Visual config editor** — Edit mode replaces YAML editing. Users add/edit/remove pages, columns, and widgets via a form-based UI with live preview.
3. **DDD per feature** — Each widget is a self-contained module (`domain/`, `infrastructure/`, `presentation/`, `services/`).
4. **Zero-knowledge encryption** — Authenticated users' config is encrypted client-side (AES-256-GCM, PBKDF2 key derivation) before being stored on the server. The server never sees plaintext config.
5. **Server-side data caching** — LRU caches on server actions cache fetched data (not service instances) with 5 min TTL, making reloads instant.
6. **CSP & security** — Content Security Policy via middleware, CSRF origin validation, rate limiting on mutation endpoints.
