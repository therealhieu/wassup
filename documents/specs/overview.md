# Wassup — Overview

A self-hosted personal dashboard that aggregates weather, Reddit, YouTube, RSS feeds, and bookmarks into a single page. Configuration is defined in YAML, edited via an in-browser Monaco editor with schema validation.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15.5 (App Router, Turbopack) |
| Language | TypeScript 5 |
| UI | React 19 + MUI 7 |
| Schema | Zod 3 → JSON Schema (for Monaco autocomplete) |
| Client State | React Context + useReducer (persisted to localStorage) |
| Server Cache | LRU Cache (per server action, 5 min TTL) |
| Client Cache | TanStack React Query (in-memory, 5 min stale) |
| Logging | tslog 4 |
| Package Manager | Bun |
| Tests | Vitest 3 + Playwright 1.52 |
| Code Editor | Monaco Editor + monaco-yaml |

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
| `bookmark` | Static config | No |
| `tabs` | Container for other widgets | — |

## Key Design Decisions

1. **Config-as-YAML** — Single YAML document defines the entire dashboard. Monaco provides autocomplete from Zod-generated JSON Schema.
2. **DDD per feature** — Each widget is a self-contained module (`domain/`, `infrastructure/`, `presentation/`, `services/`).
3. **No database** — All persistence is browser-side (localStorage for config, React Query in-memory for data).
4. **Server-side data caching** — LRU caches on server actions cache fetched data (not service instances) with 5 min TTL, making reloads instant.
5. **Lazy Monaco** — Monaco editor bundle (~2MB) only loads when the config dialog opens.
