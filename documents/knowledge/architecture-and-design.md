# Architecture & Design in Wassup

## Overview

Wassup is a **configuration-driven personal dashboard** — the entire UI (pages, columns, widgets, themes) is defined by a single JSON document validated against a Zod schema. This approach turns the application into a rendering engine: give it a config, and it produces a dashboard.

The architecture combines three design patterns:

1. **Configuration-Driven UI** — A JSON schema defines what is rendered, replacing hardcoded layouts
2. **Pluggable Widget System** — Each widget is an independent vertical slice (domain → infrastructure → service → presentation)
3. **Zero-Knowledge Persistence** — User data is encrypted client-side before touching the server

```
┌──────────────────────────────────────────────────────────────────────────┐
│                    Wassup Architecture Overview                          │
│                                                                          │
│  ┌──────────────┐    ┌──────────────────────────────────────────────┐    │
│  │   Presets    │    │         Rendering Engine                     │    │
│  │              │    │                                              │    │
│  │  Seed (3x)   │──→ │  AppState → PageConfig → Columns → Widgets   │    │
│  │  User (n)    │    │                                              │    │
│  └──────────────┘    └────────────┬─────────────────────────────────┘    │
│                                   │                                      │
│                      ┌────────────▼──────────────┐                       │
│                      │    Widget Plugin System   │                       │
│                      │                           │                       │
│                      │  ┌─────┐ ┌─────┐ ┌─────┐  │                       │
│                      │  │ YT  │ │ RSS │ │ GH  │  │                       │
│                      │  └──┬──┘ └──┬──┘ └──┬──┘  │                       │
│                      │     │       │       │     │                       │
│                      │     ▼       ▼       ▼     │                       │
│                      │   Server Actions + Cache  │                       │
│                      └───────────────────────────┘                       │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐    │
│  │              Persistence Layer (Zero-Knowledge)                  │    │
│  │                                                                  │    │
│  │  localStorage ←──write-through──→ AES-256-GCM → SQLite (opaque)  │    │
│  └──────────────────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## Core Concepts

### 1. The Configuration Schema (Single Source of Truth)

The entire app state is defined by a hierarchical Zod schema. There are no hardcoded layouts.

```
AppState
├── activePresetId: string
└── presets: Preset[]
    ├── id: string
    ├── name: string
    └── config: AppConfig
        └── ui: UiConfig
            ├── theme: "light" | "dark"
            └── pages: PageConfig[]
                ├── title: string
                ├── path: string (URL route)
                └── columns: ColumnConfig[]
                    ├── size: 1-12 (MUI grid)
                    └── widgets: WidgetConfig[]
                        ├── type: "weather" | "youtube" | "reddit" | ...
                        └── [type-specific fields]
```

**Key files:**

| File | Role |
|---|---|
| `src/infrastructure/config.schemas.ts` | Root schema: AppState, Preset, AppConfig, PageConfig, ColumnConfig |
| `src/features/*/infrastructure/config.schemas.ts` | Per-widget schemas (e.g., `YoutubeWidgetConfigSchema`) |
| `src/lib/widget-registry.ts` | Widget field definitions (drives the visual editor) |
| `src/lib/presets.ts` | Seed preset definitions + `BLANK_CONFIG` |
| `src/lib/constants.ts` | Default AppState, JSON Schema export |

**The WidgetConfig union pattern:**

```typescript
// Each widget defines its own Zod schema with a type discriminator
const YoutubeWidgetConfigSchema = z.object({
  type: z.literal("youtube"),      // discriminator
  channels: z.array(z.string()),
  limit: z.number().default(16),
  // ...
});

// All widget schemas are unioned into WidgetConfig
const WidgetConfigSchema = z.lazy(() =>
  z.union([
    WeatherWidgetConfigSchema,
    YoutubeWidgetConfigSchema,
    RedditWidgetConfigSchema,
    // ... 8 total
  ])
);
```

This is a **discriminated union** — `type` determines which branch of the union to validate against. `z.lazy()` is required because the `TabsWidgetConfig` contains nested `WidgetConfig[]`, creating a circular reference.

### 2. Preset System

Presets encapsulate an entire dashboard configuration. There are two kinds:

```
┌────────────────────────────────────────────────────────────┐
│                    Preset Hierarchy                        │
│                                                            │
│  Seed Presets (read-only, code-defined)                    │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐        │
│  │ Software Eng │ │ Data Eng     │ │ AI Eng       │  ...   │
│  └──────────────┘ └──────────────┘ └──────────────┘        │
│        │                                                   │
│        │ User edits a seed preset                          │
│        ▼                                                   │
│  User Presets (created automatically via auto-duplication) │
│  ┌──────────────────────┐ ┌──────────────────────┐         │
│  │ Software Eng (Custom)│ │ My Dashboard         │         │
│  └──────────────────────┘ └──────────────────────┘         │
└────────────────────────────────────────────────────────────┘
```

**Seed preset rules:**

| Operation | Seed Preset | User Preset |
|---|---|---|
| View/activate | ✅ | ✅ |
| Edit config (SET_CONFIG) | ❌ auto-duplicates to user preset | ✅ |
| Change theme (SET_THEME) | ❌ auto-duplicates | ✅ |
| Rename | ❌ blocked | ✅ |
| Delete | ❌ blocked | ✅ |
| Reorder | ✅ | ✅ |

**Seed preset reconciliation** runs on every hydration (load from storage):

```
reconcileWithSeedPresets(state):
  1. For each stored preset:
     - If it's a seed ID → overwrite with latest code version
     - Else → keep (user preset)
  2. Append any new seed presets the user hasn't seen
  3. Fix activePresetId if it no longer exists
```

This means seed presets are **always up-to-date** with the latest code. Users never have stale seed presets.

### 3. Widget Plugin System

Every widget type is a self-contained feature module following **clean architecture**:

```
src/features/{widget}/
├── domain/               # Pure types + interfaces (zero dependencies)
│   ├── entities/          # Data types (YoutubeVideo, FeedItem, etc.)
│   └── repositories/     # Repository interfaces
│
├── infrastructure/        # External adapters
│   ├── config.schemas.ts  # Zod schema with type discriminator
│   └── repositories/     # Concrete implementations (API clients, scrapers)
│
├── services/              # Orchestration
│   ├── {widget}.ts        # Service class (coordinates repos, applies logic)
│   └── {widget}.actions.ts # Server Action + LRU cache
│
└── presentation/          # React components
    ├── {Widget}Widget.tsx       # Container: useQuery → loading/error/data
    ├── {Widget}WidgetInner.tsx  # Presentational: renders the data
    ├── {Widget}Skeleton.tsx     # Loading state
    └── *.stories.tsx            # Storybook stories
```

**The dependency rule:**

```
Domain ← Infrastructure ← Services ← Presentation

domain knows nothing about React, Next.js, or external APIs
infrastructure implements domain interfaces
services orchestrate infrastructure
presentation renders data from services
```

### 4. Widget Registry (Schema-Driven Forms)

The widget registry is a centralized metadata map that powers the **visual config editor**. It connects each widget type to:

1. Its **Zod schema** (for validation)
2. Its **field definitions** (for form generation)

```typescript
WIDGET_REGISTRY = {
  youtube: {
    type: "youtube",
    label: "YouTube",
    schema: YoutubeWidgetConfigSchema,
    fields: [
      { name: "channels", label: "Channels", type: "string-array", required: true },
      { name: "limit", label: "Limit", type: "number", min: 1, max: 50 },
      // ...
    ]
  },
  // ... one entry per widget type
};
```

The `SchemaForm` component reads `WIDGET_REGISTRY[widgetType].fields` and renders appropriate MUI form controls (text, number, select, boolean switch, string array, nested object, nested widget). No per-widget form code is needed.

---

## Architecture

### Layered Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                         Presentation Layer                            │
│                                                                        │
│  layout.tsx → Provider Stack → CatchAllPage → DashboardPage           │
│                                    │                                   │
│                          ┌─────────┴──────────┐                       │
│                          │                     │                       │
│                     View Mode              Edit Mode                   │
│                   DashboardPage        EditModeContainer                │
│                   └── Grid              └── Visual Config Editor        │
│                       └── DashboardColumn    ├── ColumnLayoutEditor     │
│                           └── Widget         ├── EditableColumn         │
│                               └── {X}Widget  ├── WidgetCard             │
│                                              ├── WidgetFormDialog       │
│                                              └── SchemaForm             │
│                                                  (driven by registry)   │
├──────────────────────────────────────────────────────────────────────┤
│                         Service Layer                                  │
│                                                                        │
│  Server Actions (youtube.actions.ts, hackernews.actions.ts, ...)       │
│  ├── LRU Cache (per-action, in-process)                                │
│  ├── Metrics instrumentation (Prometheus histogram + counters)         │
│  └── Delegates to Service classes                                      │
├──────────────────────────────────────────────────────────────────────┤
│                         Domain Layer                                   │
│                                                                        │
│  Service classes (YoutubeService, FeedService, ...)                    │
│  ├── Coordinates repository calls                                      │
│  ├── Applies business logic (sorting, filtering, limiting)             │
│  └── Returns plain data objects                                        │
├──────────────────────────────────────────────────────────────────────┤
│                         Infrastructure Layer                           │
│                                                                        │
│  Repository implementations                                            │
│  ├── RssYoutubeVideoRepository (XML parser)                            │
│  ├── PageSourceYoutubeChannelRepository (HTML scraper)                 │
│  ├── RedditOAuthRepository (OAuth + JSON)                              │
│  └── ... (one per external data source)                                │
│                                                                        │
│  Config schemas (Zod)                                                  │
│  Database (Prisma + SQLite)                                            │
│  Client cryptography (Web Crypto API)                                  │
└──────────────────────────────────────────────────────────────────────┘
```

### State Management Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                    State Management Flow                         │
│                                                                  │
│  ┌──────────────┐                                                │
│  │ SEED_PRESETS │ (code-defined, read-only)                      │
│  └──────┬───────┘                                                │
│         │ on hydration                                           │
│         ▼                                                        │
│  ┌────────────────┐   reconcile    ┌──────────────┐              │
│  │ localStorage   │──────────────→ │ useReducer   │              │
│  └────────────────┘                │ (AppState)   │              │
│         ▲                          └──────┬───────┘              │
│         │ write-through                   │ dispatch(action)     │
│         │ (synchronous)                   │                      │
│         │                          ┌──────▼───────┐              │
│  ┌──────┴──────┐                   │  Active      │              │
│  │ useEffect   │←──────────────────│  Preset      │              │
│  │ (persist)   │                   │  Config      │──→ render()  │
│  └──────┬──────┘                   └──────────────┘              │
│         │ debounced 1s (async)                                   │
│         ▼                                                        │
│  ┌────────────────┐   encrypt    ┌──────────────────────────┐    │
│  │useEncryptedSync│────────────→ │ PUT /api/config          │    │
│  └────────────────┘              │ (opaque ciphertext blob) │    │
│                                  └──────────┬───────────────┘    │
│                                             │                    │
│                                  ┌──────────▼───────────────┐    │
│                                  │ Prisma + SQLite          │    │
│                                  │ UserConfig table         │    │
│                                  └──────────────────────────┘    │
└──────────────────────────────────────────────────────────────────┘
```

### Database Design

Wassup uses **Prisma + SQLite** — a single-file embedded database with zero infrastructure overhead.

```
┌───────────────────────────────────────────────────┐
│                 Prisma Schema                     │
│                                                   │
│  ┌──────────┐     ┌───────────┐     ┌───────────┐ │
│  │ Account  │─M:1─│   User    │─1:1─│UserConfig │ │
│  │(OAuth)   │     │           │     │(encrypted)│ │
│  └──────────┘     │ id        │     │           │ │
│                   │ name      │     │ data (CT) │ │
│  ┌──────────┐     │ email     │     │ salt      │ │
│  │ Session  │─M:1─│ image     │     │ updatedAt │ │
│  │          │     └───────────┘     └───────────┘ │
│  └──────────┘                                     │
│                                                   │
│  ┌───────────────────┐                            │
│  │VerificationToken  │  (unused, NextAuth req'd)  │
│  └───────────────────┘                            │
└───────────────────────────────────────────────────┘
```

The `UserConfig.data` field stores an **opaque ciphertext blob** — the server has no idea what's inside it. This is the zero-knowledge property.

---

## How It Works

### End-to-End: From Config to Rendered Dashboard

```
1. Hydration
   ├── Load AppState from localStorage (instant)
   ├── Run migrateToAppState() — handles legacy formats
   ├── Run reconcileWithSeedPresets() — update/add/remove seed presets
   └── dispatch(SET_STATE) → React renders

2. Route Matching
   ├── CatchAllPage reads usePathname() → e.g., "/"
   ├── Finds PageConfig: config.ui.pages.find(p => p.path === "/")
   └── Passes PageConfig to DashboardPage

3. Grid Rendering
   ├── DashboardPage renders MUI Grid with columns
   ├── Each column has a `size` (1-12, MUI grid breakpoints)
   ├── DashboardColumn renders Widget components (memoized)
   └── Widget dispatches on widgetConfig.type → specific widget component

4. Data Fetching (per widget)
   ├── Widget uses useQuery() from TanStack Query
   ├── queryFn calls a Server Action (e.g., fetchYoutubeWidgetProps)
   ├── Server Action checks LRU cache → cache miss → Service.fetch()
   ├── Service calls repository implementations
   ├── Data flows back: External API → Repo → Service → Action → Client
   └── Widget renders: Loading → Data → or Error
```

### Adding a New Widget Type (Step-by-Step)

```
Step 1: Domain Layer
  ├── Create src/features/newwidget/domain/entities/item.ts
  │   └── Define Zod schema + TypeScript type
  └── Create src/features/newwidget/domain/repositories/item.ts
      └── Define repository interface

Step 2: Infrastructure Layer
  ├── Create src/features/newwidget/infrastructure/config.schemas.ts
  │   └── Zod schema with type: z.literal("newwidget")
  └── Create src/features/newwidget/infrastructure/repositories/
      └── Concrete repository (API client, scraper, etc.)

Step 3: Service Layer
  ├── Create src/features/newwidget/services/newwidget.ts
  │   └── Service class: coordinates repos, applies business logic
  └── Create src/features/newwidget/services/newwidget.actions.ts
      └── "use server" — LRU cache + metrics + delegates to service

Step 4: Presentation Layer
  ├── Create src/features/newwidget/presentation/NewwidgetWidget.tsx
  │   └── Container: useQuery → loading/error/data
  ├── Create NewwidgetWidgetInner.tsx (presentational)
  └── Create NewwidgetSkeleton.tsx (loading state)

Step 5: Registration (4 files to touch)
  ├── src/infrastructure/config.schemas.ts
  │   └── Add to WidgetConfigSchema union + WidgetConfig type union
  ├── src/components/Widget.tsx
  │   └── Add case "newwidget" to switch
  ├── src/lib/widget-registry.ts
  │   └── Add entry with fields for form generation
  └── (Optional) Add to seed presets in src/lib/presets.ts
```

### Visual Config Editor Flow

The edit mode provides a WYSIWYG-like editor for dashboard configuration:

```
┌──────────────────────────────────────────────────────────────┐
│                   EditModeContainer                          │
│                                                              │
│  ┌────────────────────────────────────┐                      │
│  │ EditablePageTabBar                 │                      │
│  │ [Home] [Trends] [+Add Page]        │ ← rename, reorder,   │
│  └────────────────────────────────────┘   delete pages       │
│                                                              │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ ColumnLayoutEditor                                      │ │
│  │ Layout: [3 | 6 | 3] ← adjustable column ratios          │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌──────────┐ ┌──────────────────────┐ ┌──────────┐          │
│  │ Column 1 │ │ Column 2             │ │ Column 3 │          │
│  │          │ │                      │ │          │          │
│  │ [Widget] │ │ [Widget]             │ │ [Widget] │ ← drag   │
│  │ [Widget] │ │ [Widget]             │ │ [+ Add]  │   & drop │
│  │ [+ Add]  │ │ [+ Add]              │ │          │   across │
│  └──────────┘ └──────────────────────┘ └──────────┘  columns │
│                                                              │
│  On widget click → opens WidgetFormDialog:                   │
│  ┌───────────────────────────────────────────┐               │
│  │ WidgetFormDialog                          │               │
│  │ ┌─────────────────────────────────────┐   │               │
│  │ │ Type: [YouTube ▼]                   │   │               │
│  │ │                                     │   │               │
│  │ │ SchemaForm (auto-generated)         │   │               │
│  │ │ ├── Channels: [@Fireship] [+]       │   │               │
│  │ │ ├── Limit: [16]                     │   │               │
│  │ │ ├── Scroll After Row: [3]           │   │               │
│  │ │ └── Show Title: [✓]                 │   │               │
│  │ └─────────────────────────────────────┘   │               │
│  │ [Cancel] [Save]                           │               │
│  └───────────────────────────────────────────┘               │
│                                                              │
│  [Save All Changes] [Cancel]                                 │
└──────────────────────────────────────────────────────────────┘
```

The form is **not hand-coded per widget type**. `SchemaForm` reads `WIDGET_REGISTRY[type].fields` and renders the correct input for each field type:

| Field Type | MUI Component | Example |
|---|---|---|
| `text` | `TextField` | Location, Subreddit |
| `number` | `TextField[number]` | Limit, Forecast Days |
| `boolean` | `Switch` | Show Title, Hide Title |
| `select` | `Select + MenuItem` | Sort, Temperature Unit |
| `string-array` | Dynamic list of TextFields + add/remove buttons | Channels, Feed URLs |
| `nested-object` | Recursive `SchemaForm` | Sort config (field + direction) |
| `nested-widget` | `TabsEditorField` (type selector + per-tab SchemaForm) | Tabs container |

### Cross-Column Drag-and-Drop

EditModeContainer uses `@dnd-kit` with a lifted `DndContext` to enable widget movement across columns:

```
DndContext (EditModeContainer)
├── SortableContext (Column 0)
│   ├── SortableItem (widget 0.0)
│   └── SortableItem (widget 0.1)
├── SortableContext (Column 1)
│   ├── SortableItem (widget 1.0)
│   └── SortableItem (widget 1.1)
└── DragOverlay (floating preview)
```

**State management during drag:**

| Event | What happens |
|---|---|
| `onDragStart` | Save snapshot of all columns (for cancel revert) |
| `onDragOver` | Move widget from source column to target column (optimistic) |
| `onDragEnd` | Commit the reorder within the target column |
| `onDragCancel` | Restore the saved snapshot (full revert) |

Stable widget IDs are generated via a `WeakMap<WidgetConfig, string>` to avoid identity issues when widgets are cloned during drag operations.

### Migration System

The migration module handles backward compatibility when the schema evolves:

```typescript
migrateToAppState(raw: unknown): AppState
  ├── Try AppStateSchema.safeParse(raw)
  │   └── Success → return as-is (current format)
  ├── Try AppConfigSchema.safeParse(raw)
  │   └── Success → wrap in single-preset AppState (legacy format)
  └── Fallback → return SEED_PRESETS default
```

This three-way fallback ensures the app **never crashes** on invalid stored data — it degrades gracefully to defaults.

---

## Trade-offs & Limitations

### Design Decisions

| Decision | Alternative | Why this choice |
|---|---|---|
| **JSON config as source of truth** | Database-driven layout | Simpler: no schema for layout, everything in one document. Export/import is just JSON |
| **Zod over TypeScript interfaces** | TypeScript-only types | Zod provides runtime validation, which is essential when loading user-provided/stored configs |
| **Discriminated union for widgets** | Inheritance hierarchy | Flat union plays better with TypeScript and Zod; no class hierarchy needed |
| **Widget registry for form generation** | Per-widget form components | One generic form component handles all widget types; adding a widget requires only metadata |
| **useReducer over Zustand/Redux** | External state library | Zero dependencies; the state shape (presets + active config) maps naturally to a reducer |
| **Server Actions over API routes** | REST API for each widget | Less boilerplate; automatic serialization; data never leaves the server boundary |
| **LRU cache in-process** | Redis / Memcached | Single-instance deployment; no cache infrastructure needed |
| **SQLite over PostgreSQL** | Full RDBMS | File-based, zero-config, embedded. Sufficient for personal/small-team use |
| **Memoization (React.memo)** | Fine-grained state (Jotai/Recoil) | Context updates propagate to all consumers; memo prevents cascade re-renders at Widget/Column level |
| **Auto-duplicate seed presets** | Lock icon + explicit clone button | Frictionless UX — users can immediately customize, no extra step |

### Structural Limitations

| Limitation | Impact | Mitigation Path |
|---|---|---|
| **Single-file SQLite** | No concurrent writers, no horizontal scaling | Migrate to PostgreSQL when multi-instance is needed |
| **In-process LRU cache** | Cache is lost on restart, not shared across instances | Add Redis when scaling beyond one instance |
| **No schema versioning** | Config format changes require migration code in `migrateToAppState` | Currently handles 2 formats; add version field when changes become frequent |
| **Widget registry is centralized** | Adding a widget requires touching 4 registration files | Could be automated with a build-time plugin or convention-based auto-discovery |
| **No undo/redo in editor** | Users must cancel and re-enter edit mode to revert | Could add an undo stack with action history |
| **Preset configs are monolithic** | Changing one widget re-serializes the entire config | Acceptable at current scale (<50KB); would need normalization for very large configs |

---

## Use Cases / Real Examples

### Example 1: Seed Preset Reconciliation in Practice

When a new version of Wassup ships with an updated "AI Engineering" preset:

```
User has in localStorage:
  presets: [
    { id: "general-swe",    config: { ... old version ... } },
    { id: "ai-engineering",  config: { ... old version ... } },
    { id: "user-abc",        config: { ... user custom ... } },
  ]

After reconcileWithSeedPresets():
  presets: [
    { id: "general-swe",    config: { ... LATEST version ... } },  ← overwritten
    { id: "ai-engineering",  config: { ... LATEST version ... } },  ← overwritten
    { id: "user-abc",        config: { ... user custom ... } },     ← untouched
    { id: "data-science",   config: { ... LATEST version ... } },  ← NEW (appended)
  ]
```

User presets are never touched. Seed presets are always current.

### Example 2: Auto-Duplication on Edit

When a user tries to change the theme on the "Data Engineering" seed preset:

```
dispatch({ type: "SET_THEME", payload: "dark" })

Reducer detects: isSeedPreset("data-engineering") → true

Instead of modifying the seed:
1. Clone the preset: { id: "random-uuid", name: "Data Engineering (Custom)", config: { ...updated } }
2. Append to presets array
3. Set activePresetId to the new clone

Result: The seed preset is untouched, user has a customized copy
```

### Example 3: Widget Data Fetching Pipeline

For the YouTube widget, data flows through 5 layers:

```
1. YoutubeWidget.tsx (client)
   └── useQuery({ queryKey: ["youtube", ...], queryFn: fetchYoutubeWidgetProps })

2. youtube.actions.ts (server action)
   └── "use server"
   └── LRU cache check (key = JSON.stringify(config))
   └── Metrics: serverActionDuration.startTimer({ action: "youtube" })
   └── On miss: YoutubeService.create(config).fetch()

3. youtube.ts (service)
   └── resolveChannels(): Promise.allSettled → catch & skip failed channels
   └── fetch per channel: Promise.allSettled → catch & skip failed feeds
   └── Sort by publishedAt, apply limit

4. rss.youtube-video-repository.ts (infrastructure)
   └── Fetch YouTube RSS XML → parse with fast-xml-parser
   └── Map to YoutubeVideo domain entity

5. page-source.youtube-channel-repository.ts (infrastructure)
   └── Fetch YouTube page HTML → extract channel ID from meta tags
   └── Map to YoutubeChannel domain entity
```

**Resilience via `Promise.allSettled`:** If one channel's RSS feed returns 404 (a known YouTube intermittent issue), the other channels still return data. The failed channel is logged and skipped.

### Example 4: The Metrics Pipeline

Every server action is instrumented with Prometheus metrics:

```typescript
// In youtube.actions.ts
const end = serverActionDuration.startTimer({ action: "youtube" });
try {
  if (cached) { cacheHits.inc({ cache: "youtube" }); end({ status: "hit" }); }
  else { cacheMisses.inc({ cache: "youtube" }); /* ... */ end({ status: "success" }); }
} catch {
  end({ status: "error" });
}
```

Exposed at `/api/metrics` for Prometheus scraping. The metrics singleton uses `globalThis` caching to survive Next.js module re-evaluation (same pattern as the Prisma client).

---

## Comparisons with Alternatives

### Configuration-Driven UI Approaches

| Approach | Pros | Cons | When to Use |
|---|---|---|---|
| **JSON schema + Zod (Wassup)** | Portable, versionable, exportable. Runtime validation catches corruption | Schema evolution requires migration code | Dashboards, form builders, CMS |
| **Database-driven layout (Retool, Appsmith)** | Fine-grained permissions, real-time collab | Complex backend, harder to export | Multi-user tools with RBAC |
| **Component composition (hardcoded)** | Simple, type-safe, fast | No runtime customization, no user config | Static apps with fixed layouts |
| **Low-code platforms (Bubble, Webflow)** | Visual editor, no code | Vendor lock-in, performance overhead | Non-developers |

### Widget System Patterns

| Pattern | Pros | Cons | When to Use |
|---|---|---|---|
| **Feature modules with clean arch (Wassup)** | Testable, swappable implementations, clear boundaries | More boilerplate per widget | Apps with 5-20 widget types |
| **Monolithic components** | Fast to build, less indirection | Untestable, hard to modify | Prototypes, 1-2 widget types |
| **Micro-frontends** | Independent deployment, team autonomy | Runtime composition complexity, CSS conflicts | Large orgs with many teams |
| **Plugin system (Grafana, VS Code)** | True extensibility, third-party plugins | Plugin API surface, versioning, security | Platforms meant for extension |

### State Persistence Strategies

| Strategy | Pros | Cons | When to Use |
|---|---|---|---|
| **Write-through: localStorage + encrypted server (Wassup)** | Instant local load, durable remote backup, zero-knowledge | Two storage paths to maintain | Privacy-focused apps with sync |
| **Server-only (REST API)** | Single source of truth, simple | Network latency on every change, server sees data | Multi-device apps where server trust is acceptable |
| **localStorage-only** | Zero backend, instant | No cross-device sync, data loss on clear | Single-device, disposable configs |
| **CRDTs (Liveblocks, Yjs)** | Real-time collaboration, conflict-free | Complex, overkill for single-user | Collaborative editors |

### Schema Validation

| Library | Runtime Validation | TypeScript Inference | Bundle Size | When to Use |
|---|---|---|---|---|
| **Zod (Wassup)** | ✅ | ✅ (z.infer) | ~12KB | Default choice: validates configs from storage/API |
| **TypeScript only** | ❌ | ✅ | 0 | When data is always trusted (compile-time only) |
| **Yup** | ✅ | Partial | ~15KB | Form validation (Formik ecosystem) |
| **io-ts** | ✅ | ✅ | ~6KB | FP-oriented projects |
| **Valibot** | ✅ | ✅ | ~2KB | Bundle-size critical apps |
| **JSON Schema + ajv** | ✅ | ❌ (separate) | ~30KB | Polyglot systems (schema shared across languages) |

---

## Key Takeaways

1. **The schema IS the architecture** — `AppState → Preset → AppConfig → PageConfig → ColumnConfig → WidgetConfig`. Every architectural decision flows from this hierarchy.

2. **Discriminated unions scale** — 8 widget types with zero polymorphism overhead. Adding a new widget means adding a new union branch, not extending a class hierarchy.

3. **Registry pattern eliminates per-widget forms** — One `SchemaForm` renders any widget's configuration. The cost of adding a new widget to the editor is one registry entry.

4. **Seed presets are code-as-configuration** — They ship with the app, stay up-to-date, and auto-duplicate on edit. Users get curated starting points without losing customizability.

5. **Clean architecture pays off in services** — The YouTube service doesn't know about RSS, HTML scraping, or React. Swapping from RSS to a YouTube API client requires only a new repository implementation.

6. **Zero-knowledge encryption decouples trust** — The server is a blind vault. The architectural benefit is that the data layer is trivially simple (store/retrieve an opaque blob) with no schema on the server side.

7. **Graceful degradation over crashes** — `migrateToAppState` falls back three ways, `reconcileWithSeedPresets` fixes orphaned preset IDs, and `Promise.allSettled` skips failed external API calls. The dashboard always renders something.
