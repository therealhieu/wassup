# Wassup — Architecture

## Directory Structure

```
src/
├── app/                              # Next.js App Router
│   ├── [[...page]]/page.tsx          # Catch-all route (all dashboard pages)
│   ├── api/auth/[...nextauth]/       # NextAuth route handler
│   ├── api/config/                   # User config CRUD (encrypted)
│   ├── api/fetch-title/              # Fetch page title from URL
│   ├── api/ping/                     # Health check
│   ├── globals.css
│   └── layout.tsx                    # Root layout (providers)
│
├── features/                         # DDD feature modules
│   ├── weather/
│   ├── reddit/
│   ├── youtube/
│   ├── feed/
│   ├── bookmark/
│   ├── github/                       # GitHub trending repos
│   ├── tabs/
│   ├── geocoding/                    # Shared (used by weather)
│   └── lib/                          # Shared feature utilities
│
├── components/
│   ├── Widget.tsx                    # Widget dispatcher (switch on type)
│   ├── DashboardPage.tsx             # Page layout
│   ├── DashboardColumn.tsx           # Column layout
│   ├── AppTheme.tsx                  # MUI ThemeProvider
│   ├── ErrorWidget.tsx               # Error boundary for widgets
│   ├── PassphraseDialog.tsx          # Encryption passphrase prompt
│   ├── app-bar/
│   │   ├── DashboardAppBar.tsx
│   │   ├── PresetSelector.tsx        # Preset dropdown with drag-and-drop reorder, import/export
│   │   ├── RouterMenu.tsx            # Page navigation
│   │   └── ThemeMenu.tsx             # Light/dark toggle
│   ├── auth/
│   │   └── LoginButton.tsx           # GitHub OAuth login/logout
│   └── config-editor/
│       ├── EditModeContainer.tsx      # Main edit mode orchestrator
│       ├── EditablePageTabBar.tsx     # Page tab management (add/rename/delete/reorder)
│       ├── ColumnLayoutEditor.tsx     # Column layout size controls
│       ├── EditableColumn.tsx         # Column with widget cards
│       ├── WidgetCard.tsx             # Widget summary card (drag handle)
│       ├── WidgetFormDialog.tsx       # Widget add/edit dialog
│       ├── SchemaForm.tsx             # Dynamic form from widget registry
│       ├── WidgetPreviewPane.tsx      # Live widget preview in edit mode
│       └── ErrorBoundary.tsx          # Error boundary for editor
│
├── providers/
│   ├── AppConfigProvider.tsx          # Config state (useReducer + localStorage + encrypted sync)
│   ├── EditModeProvider.tsx           # Edit mode toggle context
│   ├── ReactQueryProvider.tsx         # TanStack Query (in-memory)
│   └── SessionProvider.tsx            # NextAuth session context
│
├── hooks/
│   └── useEncryptedSync.ts            # Zero-knowledge encryption sync hook
│
├── infrastructure/
│   └── config.schemas.ts              # Root AppConfig / AppState Zod schemas
│
├── lib/
│   ├── auth.ts                        # NextAuth configuration (GitHub + Prisma adapter)
│   ├── prisma.ts                      # Prisma client singleton
│   ├── presets.ts                     # Seed presets (default configs)
│   ├── widget-registry.ts            # Widget type registry (field definitions, defaults)
│   ├── client-crypto.ts              # AES-256-GCM encrypt/decrypt (Web Crypto API)
│   ├── constants.ts                   # Shared constants
│   ├── csrf.ts                        # CSRF origin validation
│   ├── rate-limit.ts                  # Sliding-window rate limiter (LRU-backed)
│   ├── migration.ts                   # Config format migration utilities
│   ├── utils.ts                       # Shared helpers
│   ├── logger.ts                      # tslog factory
│   └── http/constants.ts             # Shared HTTP config (timeouts, user agents)
│
├── middleware.ts                      # CSP headers + nonce generation
├── themes.ts                          # MUI theme definitions
├── generated/prisma/                  # Prisma generated client
└── types/
    └── monaco.d.ts                    # Monaco editor type declarations

prisma/
├── schema.prisma                      # User, Account, Session, UserConfig models
└── migrations/                        # SQLite migrations
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
Visual Editor / Preset switch
    → Zod validate → AppConfigProvider (useReducer)
    → persisted to localStorage
    → if authenticated: encrypted client-side (AES-256-GCM) → synced to server via /api/config
    → Widget reads sub-config
    → Server Action fetches external data (LRU cached, 5 min TTL)
    → React Query caches client-side (in-memory, 5 min stale)
    → Widget renders
```

## Provider Stack (layout.tsx)

```
SessionProvider (NextAuth)
  └── ReactQueryProvider
      └── AppConfigProvider (useReducer + localStorage + encrypted sync)
          └── AppTheme (MUI light/dark from config)
              └── EditModeProvider
                  └── DashboardAppBar + {children}
```

## Configuration Schema

```
AppStateSchema
├── activePresetId: string
└── presets: PresetSchema[]
   ├── id: string
   ├── name: string (1–100 chars)
   └── config: AppConfigSchema
      └── ui: UiConfigSchema
         ├── theme: "light" | "dark"
         └── pages: PageConfigSchema[]
            └── columns: ColumnConfigSchema[]
               └── widgets: WidgetConfigSchema[]  ← z.union of all widget schemas
```

## Authentication & Encryption

1. **NextAuth v5** with GitHub OAuth provider and Prisma adapter (SQLite)
2. **Zero-knowledge encryption**: Config is encrypted client-side with AES-256-GCM before being sent to the server. PBKDF2 (600k iterations, SHA-256) derives the key from a user passphrase.
3. **Server stores**: ciphertext (base64) + PBKDF2 salt (base64) in `UserConfig` table. Server never sees plaintext.
4. **Passphrase caching**: Cached in localStorage (`wassup-pk`) to avoid re-prompting on page reload.

## Security

- **CSP**: Generated per-request nonce in `middleware.ts`. Strict `script-src`, `img-src`, `connect-src`, `form-action` directives.
- **CSRF**: Origin validation on mutation endpoints (`lib/csrf.ts`).
- **Rate limiting**: Sliding-window rate limiter on API routes (`lib/rate-limit.ts`).
- **Security headers**: `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy` via `next.config.ts`.

## Adding a New Widget

1. Create `src/features/{name}/` with full DDD structure
2. Define `{Name}WidgetConfigSchema` with `type: z.literal("{name}")`
3. Add to union in `src/infrastructure/config.schemas.ts`
4. Add `case "{name}"` in `src/components/Widget.tsx`
5. Add server action with LRU data cache
6. Register in `src/lib/widget-registry.ts` with field definitions
7. Write Storybook stories
