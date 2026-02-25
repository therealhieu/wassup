# React 19 & Next.js 16 in Wassup

## Overview

Wassup is a personal dashboard built with **React 19** and **Next.js 16** (App Router). It uses a configuration-driven architecture where the entire UI — pages, columns, widgets — is described by a JSON schema. React handles rendering and state; Next.js handles routing, server actions, API routes, and SSR.

**Key versions:**

| Library | Version | Role |
|---|---|---|
| React | 19.x | UI rendering, hooks, memoization |
| Next.js | 16.x | App Router, Server Actions, API Routes, SSR |
| MUI | 7.x | Component library (Material Design) |
| TanStack Query | 5.x | Client-side data fetching & caching |
| Zod | 3.x | Runtime schema validation |
| Prisma | 7.x | ORM (SQLite) |
| NextAuth.js | 5.x (beta) | Authentication |

---

## Core Concepts

### 1. App Router vs Pages Router

Wassup uses the **App Router** (`src/app/`), the modern Next.js routing paradigm. Every file under `src/app/` that exports a default component becomes a route.

| Concept | App Router (Wassup) | Pages Router (Legacy) |
|---|---|---|
| Routing | File-system based under `app/` | File-system based under `pages/` |
| Default rendering | Server Components | Client Components |
| Layouts | Nested `layout.tsx` files | `_app.tsx` wrapper |
| Data fetching | `async` Server Components, Server Actions | `getServerSideProps`, `getStaticProps` |
| Metadata | `export const metadata` object | `<Head>` component |
| API Routes | `route.ts` with `GET`/`POST`/`PUT` exports | `pages/api/*.ts` |

**Wassup's route structure:**

```
src/app/
├── layout.tsx                    # Root layout (providers, fonts, app bar)
├── globals.css                   # Global styles
├── [[...page]]/page.tsx          # Catch-all route (renders DashboardPage)
└── api/
    ├── auth/[...nextauth]/route.ts  # NextAuth catch-all
    ├── config/route.ts              # Encrypted config CRUD
    ├── fetch-title/route.ts         # URL title extraction
    ├── metrics/route.ts             # Prometheus metrics endpoint
    └── ping/route.ts                # Health check
```

The catch-all route `[[...page]]/page.tsx` means every path (including `/`) renders the same component — `CatchAllPage`. The actual page content is determined by matching the URL path against configuration: `config.ui.pages.find(p => p.path === pathname)`.

### 2. Server Components vs Client Components

By default in the App Router, every component is a **Server Component** — it runs on the server, has no access to browser APIs, and cannot use hooks or event handlers.

To opt into the browser, add `"use client"` at the top of the file.

**Wassup's boundary:**

```
                 Server Components                   Client Components
                 (no "use client")                   ("use client")
                 ─────────────────                   ─────────────────
                 layout.tsx (metadata)               AppConfigProvider
                 DashboardPage.tsx                   SessionProvider
                 DashboardColumn.tsx                 ReactQueryProvider
                 Widget.tsx                          EditModeProvider
                 API routes (route.ts)               AppTheme
                                                     YoutubeWidget
                                                     All interactive widgets
                                                     useEncryptedSync
```

> **Important:** The root `layout.tsx` is a Server Component (it exports `metadata`), but all its children are wrapped in client providers. The `"use client"` boundary is at the provider level.

### 3. Server Actions (`"use server"`)

Server Actions are async functions that run on the server but can be called directly from client components — no API route needed. They are Next.js's alternative to REST endpoints for mutations and data fetching.

**Wassup pattern:**

```
Client Component              Server Action                    Service Layer
(YoutubeWidget.tsx)           (youtube.actions.ts)             (youtube.ts)
─────────────────     →       ──────────────────       →       ──────────
useQuery({                    "use server"                     class YoutubeService
  queryFn: () =>              export async function            ├── resolveChannels()
    fetchYoutubeWidgetProps()    fetchYoutubeWidgetProps()     └── fetch()
})                            ├── Check LRU cache
                              ├── Call YoutubeService
                              └── Return serializable data
```

Every widget follows this pattern:
1. **Client** calls a server action via TanStack Query
2. **Server Action** checks an LRU cache, then delegates to a service
3. **Service** fetches external data and returns a plain object
4. **Result** is serialized back to the client (Server Actions auto-serialize)

### 4. React Context Provider Stack

Wassup uses nested React Context providers to share global state. The nesting order matters — inner providers can consume outer ones.

```
layout.tsx renders:

<SessionProvider>                  ← NextAuth session (who is logged in)
  <ReactQueryProvider>             ← TanStack Query client (data fetching cache)
    <AppConfigProvider>            ← App state (presets, config, theme)
      <AppTheme>                   ← MUI ThemeProvider (derived from config)
        <EditModeProvider>         ← UI mode toggle (view vs edit)
          <DashboardAppBar />
          {children}               ← Page content
        </EditModeProvider>
      </AppTheme>
    </AppConfigProvider>
  </ReactQueryProvider>
</SessionProvider>
```

Each provider uses the `createContext` → `Provider` → `useContext` pattern with a custom hook:

```typescript
// Create
const AppConfigContext = createContext<AppConfigContextValue | null>(null);

// Provide
<AppConfigContext.Provider value={value}>{children}</AppConfigContext.Provider>

// Consume (custom hook with null check)
export function useAppConfig(): AppConfigContextValue {
  const ctx = useContext(AppConfigContext);
  if (!ctx) throw new Error("useAppConfig must be used within AppConfigProvider");
  return ctx;
}
```

---

## Architecture

### Component Hierarchy

```
layout.tsx (Server Component — metadata, fonts)
│
├── [Provider Stack] (Client Components)
│   │
│   └── CatchAllPage
│       │
│       ├── [Edit Mode] → EditModeContainer
│       │                  └── Visual Config Editor (form-based)
│       │
│       └── [View Mode] → DashboardPage
│                          └── Grid (MUI)
│                              ├── DashboardColumn (memo)
│                              │   ├── Widget (memo) → WeatherWidget
│                              │   ├── Widget (memo) → YoutubeWidget
│                              │   └── Widget (memo) → TabsWidget
│                              │                       └── [nested Widget per tab]
│                              └── DashboardColumn (memo)
│                                  └── ...
```

### Data Flow

```
┌──────────────────────────────────────────────────────────────────────┐
│                         Data Flow                                    │
│                                                                      │
│  Configuration           Rendering              Data Fetching        │
│  ──────────────          ─────────              ──────────────        │
│                                                                      │
│  localStorage ──┐                                                    │
│                 │  AppConfigProvider                                  │
│  Server API ────┤  ├── useReducer(state)  ──→  DashboardPage         │
│                 │  ├── useEncryptedSync   ──→  DashboardColumn        │
│  SEED_PRESETS ──┘  └── write-through:         └── Widget             │
│                        localStorage + server       │                 │
│                                                    │ useQuery(...)    │
│                                                    ▼                 │
│                                               Server Action          │
│                                               ├── LRU Cache          │
│                                               └── Service Layer      │
│                                                    │                 │
│                                                    ▼                 │
│                                               External APIs          │
│                                               (YouTube RSS,          │
│                                                Reddit, Weather,      │
│                                                HN, GitHub)           │
└──────────────────────────────────────────────────────────────────────┘
```

### Feature Module Structure (Clean Architecture)

Each widget feature follows a layered architecture:

```
src/features/youtube/
├── domain/                          # Pure business logic (no framework deps)
│   ├── entities/
│   │   ├── video.ts                 # YoutubeVideo type
│   │   └── channel.ts              # YoutubeChannel type
│   └── repositories/
│       ├── video.ts                 # YoutubeVideoRepository interface
│       └── channel.ts              # YoutubeChannelRepository interface
│
├── infrastructure/                  # External world adapters
│   ├── config.schemas.ts           # Zod schema for widget config
│   └── repositories/
│       ├── rss.youtube-video-repository.ts        # RSS XML parser
│       └── page-source.youtube-channel-repository.ts  # HTML scraper
│
├── services/                        # Orchestration layer
│   ├── youtube.ts                   # YoutubeService (coordinates repos)
│   └── youtube.actions.ts          # Server Action ("use server") + LRU cache
│
└── presentation/                    # React components
    ├── YoutubeWidget.tsx            # Container (useQuery → skeleton/error/inner)
    ├── YoutubeWidgetInner.tsx       # Presentational (renders video cards)
    ├── YoutubeVideoCard.tsx         # Single video card
    ├── YoutubeWidgetSkeleton.tsx    # Loading state
    └── *.stories.tsx               # Storybook stories
```

This separation means:
- **Domain** is testable without React or Next.js
- **Infrastructure** can swap implementations (e.g., API → RSS → scraper)
- **Services** are cacheable server actions
- **Presentation** is purely rendering

---

## How It Works

### Request Lifecycle

```
1. Browser navigates to /

2. Next.js App Router matches [[...page]]/page.tsx
   └── Server Component renders layout.tsx
       └── Client boundary: <SessionProvider> wraps everything

3. CatchAllPage (client) renders:
   ├── Reads pathname via usePathname()
   ├── Reads config via useAppConfig()
   ├── Finds matching PageConfig (config.ui.pages.find(p => p.path === pathname))
   └── Renders <DashboardPage pageConfig={pageConfig} />

4. DashboardPage renders a MUI Grid of DashboardColumns
   └── Each column renders Widget components based on widgetConfig.type

5. Widget (memoized) dispatches to specific widget component:
   switch (widgetConfig.type) {
     case "youtube": return <YoutubeWidget config={widgetConfig} />;
     case "weather": return <WeatherWidget config={widgetConfig} />;
     // ...
   }

6. YoutubeWidget calls useQuery → fetchYoutubeWidgetProps (server action)
   ├── Server checks LRU cache (12h TTL)
   ├── Cache miss → YoutubeService.create(config).fetch()
   │   ├── Resolve channel IDs (scrape YouTube page)
   │   ├── Fetch RSS feeds for each channel
   │   └── Sort by publishedAt, apply limit
   └── Return serialized data to client

7. YoutubeWidgetInner renders video cards
```

### State Management with useReducer

AppConfigProvider uses `useReducer` instead of `useState` because the state shape is complex (presets, active preset, config within preset) and there are many distinct action types.

**Action types:**

| Action | What it does |
|---|---|
| `SET_STATE` | Full state replacement (hydration from server/localStorage) |
| `SET_CONFIG` | Update config of active preset (auto-duplicates if seed preset) |
| `SET_THEME` | Update theme in active preset config |
| `SET_ACTIVE_PRESET` | Switch to a different preset |
| `UPDATE_PRESET` | Rename or update a user preset |
| `CREATE_PRESET` | Add new blank preset |
| `DELETE_PRESET` | Remove a user preset (blocks seed deletion) |
| `REORDER_PRESETS` | Drag-and-drop reorder |
| `IMPORT_PRESET` | Import from JSON file (assigned new ID) |
| `DUPLICATE_PRESET` | Clone any preset (creates user copy) |

**Auto-duplication pattern:** When a user edits a seed preset (read-only), the reducer automatically creates a `"(Custom)"` copy. This preserves seed presets while allowing customization.

### Write-Through Caching

```
User makes a change
        │
        ▼
useReducer dispatch ──→ New state
        │
        ▼
useEffect fires (state changed)
├── 1. saveToStorage(userId, state)        ← Instant (localStorage)
└── 2. syncToServer(state)                 ← Debounced 1s (encrypted → PUT /api/config)
```

This is a **write-through** cache: localStorage is the fast path, server is the durable path. On hydration, localStorage loads first (instant), then server data reconciles if the user is authenticated.

### TanStack Query Integration

Each widget uses `useQuery` from TanStack Query to manage its data fetching lifecycle:

```typescript
const { data, isLoading, error } = useQuery({
  queryKey: ["youtube", config.showTitle, config.channels, config.limit],
  queryFn: () => fetchYoutubeWidgetProps(config),
  staleTime: 1000 * 60 * 5, // 5 minutes client-side
});
```

**Two-layer caching:**

| Layer | Technology | TTL | Purpose |
|---|---|---|---|
| Client | TanStack Query | 5 min (`staleTime`) | Prevent redundant RPCs during tab lifetime |
| Server | LRU Cache | 12 hours | Prevent redundant external API calls across all clients |

---

## Trade-offs & Limitations

| Decision | Trade-off | Rationale |
|---|---|---|
| **Catch-all route** `[[...page]]` | No route-level code splitting per page | All pages share the same component; configuration determines content. Acceptable because there is only one UI pattern (dashboard grid) |
| **`"use client"` at provider level** | Entire render tree below providers is client-side | SSR benefit is limited to the `<html>` shell. Acceptable for a dashboard with no SEO needs |
| **Server Actions for data fetching** | Tighter coupling to Next.js than REST APIs | Eliminates boilerplate API routes; data is purely internal |
| **LRU cache in server actions** | Cache lives in the Node.js process (no shared cache) | Single-instance deployment (Hetzner VPS). Would need Redis/Memcached for multi-instance |
| **`useReducer` for global state** | Verbose action types compared to Zustand/Jotai | Keeps state management dependency-free and predictable |
| **Zod schemas as source of truth** | Runtime validation cost on every config load | Catches corrupt/invalid configs from localStorage or server. Cost is negligible |
| **`React.memo` on Widget/Column** | Manual memoization burden | Necessary because the parent re-renders on config changes; memoization prevents cascade |
| **MUI as component library** | Large bundle, `'unsafe-inline'` in CSP for styles | Rapid UI development with consistent Material Design. Trade-off documented in CSP policy |

### Known Limitations

1. **No ISR/SSG** — Everything is client-rendered after the initial shell. Static generation would require a fundamentally different architecture since content is user-specific
2. **No Streaming/Suspense** — Widgets manage their own loading states via TanStack Query rather than React Suspense boundaries. Suspense could improve perceived performance
3. **Single process cache** — The LRU cache in server actions is per-process. Horizontal scaling requires an external cache
4. **No React Server Components for widgets** — Widgets could theoretically be RSCs with async data loading, but TanStack Query's client-side caching and refetching is more suited to a dashboard's live-updating nature

---

## Use Cases / Real Examples

### Example 1: Adding a New Widget (End-to-End)

To add a new widget type (e.g., "Hacker News"), you touch these files:

```
1. src/features/hackernews/
   ├── domain/entities/story.ts           # Data types
   ├── domain/repositories/story.ts       # Repository interface
   ├── infrastructure/config.schemas.ts   # Zod schema (type: z.literal("hackernews"))
   ├── infrastructure/repositories/       # API client
   ├── services/hackernews.ts             # Service class
   ├── services/hackernews.actions.ts     # Server action + cache
   └── presentation/HackerNewsWidget.tsx  # React component

2. src/infrastructure/config.schemas.ts   # Add to WidgetConfig union
3. src/components/Widget.tsx              # Add case to switch
4. src/lib/widget-registry.ts            # Add form field definitions
```

### Example 2: Hydration Mismatch Debugging

**Problem:** `usePathname()` returns different values on server vs client for dynamic routes.

**Where it happens in Wassup:**

```typescript
// CatchAllPage — marked "use client"
const pathname = usePathname() || "/";
```

This is safe because the component is explicitly a client component. If it were a Server Component, `usePathname()` would not be available and would cause a build error.

**General rules to avoid hydration mismatches:**

1. Never use `Date.now()`, `Math.random()`, or `window.*` in the initial render of components that might SSR
2. Use `useEffect` for browser-only side effects
3. Use `"use client"` explicitly for components that need hooks or browser APIs
4. Use `suppressHydrationWarning` only as a last resort (e.g., theme flash)

### Example 3: Infinite Re-render Loop in useEffect

**Symptom:** Switching presets caused 100% CPU usage.

**Root cause:** `useEffect` in `AppConfigProvider` depended on functions from `useEncryptedSync`. Those functions were re-created on every render, causing the effect to re-fire → state update → re-render → re-fire.

**Fix:** Wrap all returned functions in `useCallback` with stable dependencies:

```typescript
// ❌ BAD — new function identity every render
const hydrateFromServer = async (...) => { ... };

// ✅ GOOD — stable function identity across renders
const hydrateFromServer = useCallback(async (...) => { ... }, [tryDecrypt]);
```

**Rule:** Any custom hook that returns functions to be used in `useEffect` dependency arrays **must** stabilize those functions with `useCallback`.

### Example 4: Performance Memoization Pattern

```typescript
// Widget.tsx — memoized to prevent re-render when sibling widgets change
export const Widget = memo(function Widget({ widgetConfig }: WidgetComponentProps) {
  // ...
});

// DashboardColumn.tsx — memoized to prevent re-render when other columns change
export const DashboardColumn = memo(function DashboardColumn({ ... }: DashboardColumnProps) {
  // ...
});
```

Without `memo`, changing any widget's config would re-render every widget in every column because `AppConfigProvider` triggers a context update.

---

## Comparisons with Alternatives

### React State Management

| Approach | Pros | Cons | When to Use |
|---|---|---|---|
| **useReducer + Context (Wassup)** | Zero dependencies, predictable, TypeScript-friendly | Boilerplate, no devtools, no middleware | Small-medium apps, few global state consumers |
| **Zustand** | Minimal API, no providers, devtools | Extra dependency (small) | Medium apps wanting less boilerplate |
| **Redux Toolkit** | Middleware, devtools, time-travel debugging | Heavy, opinionated structure | Large apps with many developers |
| **Jotai / Recoil** | Atomic state, fine-grained reactivity | Mental model shift from component state | Highly interactive UIs with many independent state atoms |

### Data Fetching

| Approach | Pros | Cons | When to Use |
|---|---|---|---|
| **TanStack Query + Server Actions (Wassup)** | Automatic caching, retry, stale management; server actions avoid API routes | Server Actions tied to Next.js | Next.js apps with client-side interactivity |
| **SWR** | Similar to TanStack Query, lighter weight | Fewer features (no mutations, no devtools built-in) | Simpler fetch-and-cache needs |
| **React Server Components (async)** | Zero client JS, data at render time | No refetching, no client cache | SEO-heavy pages, mostly-static content |
| **tRPC** | End-to-end type safety, no codegen | Requires custom server setup | Full-stack TypeScript apps wanting type-safe APIs |

### Rendering Strategy

| Strategy | SSR | Client | Use Case |
|---|---|---|---|
| **Wassup (Client-heavy)** | Shell only (layout, metadata) | All widget rendering + data fetching | Personalized dashboards — no SEO, real-time data |
| **Full SSR** | All rendering on server | Hydration only | Content sites, blogs, e-commerce |
| **ISR (Incremental Static Regeneration)** | Build-time + revalidation | Hydration | Product pages, docs with periodic updates |
| **Full CSR (Vite/CRA)** | None | Everything | Internal tools, admin panels |

### Next.js vs Alternatives

| Framework | Language | Rendering | Key Strength |
|---|---|---|---|
| **Next.js (Wassup)** | React/TS | SSR + CSR | Ecosystem, Server Actions, App Router |
| **Remix** | React/TS | SSR + Progressive Enhancement | Loader/Action pattern, web-standard forms |
| **Nuxt** | Vue/TS | SSR + CSR | Vue ecosystem, auto-imports |
| **SvelteKit** | Svelte/TS | SSR + CSR | Compiler-based reactivity, smaller bundles |
| **Astro** | Any framework | Static + Islands | Content-heavy sites with minimal interactivity |

---

## Key Takeaways

1. **`"use client"` is a boundary, not a label** — It marks the entry point into client-rendered territory. Everything imported below it is also client code.

2. **Server Actions replace simple API routes** — For internal data fetching where both client and server are your code, server actions eliminate boilerplate.

3. **Memoize at the right level** — `React.memo` on `Widget` and `DashboardColumn` prevents cascade re-renders from context updates. Without it, a theme change would re-render every widget.

4. **Stabilize hook return values** — Any function returned from a custom hook and used in `useEffect` deps must be wrapped in `useCallback`. Unstable references cause infinite loops.

5. **Two-layer caching is the pattern** — TanStack Query on the client (5 min) + LRU on the server (12h). Client cache prevents redundant RPCs; server cache prevents redundant external API calls.

6. **Zod schemas are the single source of truth** — Config schemas define types, validation, and form generation (via the widget registry). One schema drives the entire pipeline from storage to UI.

7. **Feature modules own their vertical slice** — Domain, infrastructure, service, and presentation layers are co-located per feature. This makes adding a new widget a self-contained task.
