# Wassup — Architecture

## Directory Structure

```
src/
├── app/                          # Next.js App Router
│   ├── [[...page]]/page.tsx      # Catch-all route (all dashboard pages)
│   ├── api/fetch-title/          # Fetch page title from URL
│   ├── api/ping/                 # Health check
│   └── layout.tsx                # Root layout (providers)
│
├── features/                     # DDD feature modules
│   ├── weather/
│   ├── reddit/
│   ├── youtube/
│   ├── feed/
│   ├── bookmark/
│   ├── tabs/
│   └── geocoding/                # Shared (used by weather)
│
├── components/
│   ├── Widget.tsx                # Widget dispatcher (switch on type)
│   ├── DashboardPage.tsx         # Page layout
│   ├── DashboardColumn.tsx       # Column layout
│   ├── AppTheme.tsx              # MUI ThemeProvider
│   └── app-bar/
│       ├── DashboardAppBar.tsx
│       ├── ConfigEditor.tsx      # Monaco YAML editor
│       ├── EditorPanel.tsx       # Dialog wrapping editor + docs
│       ├── SchemaDocPanel.tsx    # Widget config documentation
│       ├── RouterMenu.tsx        # Page navigation
│       └── ThemeMenu.tsx         # Light/dark toggle
│
├── providers/
│   ├── AppConfigProvider.tsx     # Config state (useReducer + localStorage)
│   ├── ReactQueryProvider.tsx    # TanStack Query (in-memory)
│   └── MonacoProvider.tsx        # Lazy Monaco editor context
│
├── infrastructure/
│   └── config.schemas.ts         # Root AppConfig Zod schema
│
├── lib/
│   ├── constants.ts              # DEFAULT_CONFIG, JSON Schema
│   ├── utils.ts                  # getDataKey helper
│   ├── logger.ts                 # tslog factory
│   └── http/constants.ts         # Shared HTTP config (timeouts, retries, user agents)
│
└── themes.ts                     # MUI theme definitions
```

## Feature Module Structure

Each widget under `src/features/{name}/` follows DDD:

```
{feature}/
├── domain/
│   ├── entities/                 # TypeScript types / value objects
│   └── repositories/             # Repository interfaces
├── infrastructure/
│   ├── config.schemas.ts         # Zod schema for widget config
│   └── repositories/             # Concrete implementations + tests/
├── presentation/
│   ├── {Widget}.tsx              # React component (uses React Query)
│   ├── {Widget}Inner.tsx         # Pure render component
│   └── {Widget}.stories.tsx      # Storybook stories
└── services/
    ├── {widget}.ts               # Domain service
    └── {widget}.actions.ts       # Server Action ("use server")
```

**Dependency rule:** `presentation → services → domain ← infrastructure`

## Data Flow

```
YAML in Monaco → parse → Zod validate → AppConfigProvider (useReducer)
    → persisted to localStorage
    → Widget reads sub-config
    → Server Action fetches external data (LRU cached, 5 min TTL)
    → React Query caches client-side (in-memory, 5 min stale)
    → Widget renders
```

## Provider Stack (layout.tsx)

```
AppRouterCacheProvider
  └── ReactQueryProvider
      └── AppConfigProvider (useReducer + localStorage)
          └── AppTheme (MUI light/dark from config)
              └── DashboardAppBar + {children}
```

MonacoProvider is **not** in the provider stack — it wraps only the `EditorPanel` dialog content to enable lazy loading.

## Configuration Schema

```
AppConfigSchema
└── ui: UiConfigSchema
   ├── theme: "light" | "dark"
   └── pages: PageConfigSchema[]
      └── columns: ColumnConfigSchema[]
         └── widgets: WidgetConfigSchema[]  ← z.union of all widget schemas
```

## Adding a New Widget

1. Create `src/features/{name}/` with full DDD structure
2. Define `{Name}WidgetConfigSchema` with `type: z.literal("{name}")`
3. Add to union in `src/infrastructure/config.schemas.ts`
4. Add `case "{name}"` in `src/components/Widget.tsx`
5. Add server action with LRU data cache
6. Add YAML example + fields in `SchemaDocPanel.tsx` WIDGET_DOCS array
7. Write Storybook stories
