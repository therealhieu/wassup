# Data & Persistence in Wassup

## Overview

Wassup manages two distinct categories of data with very different characteristics:

1. **User Configuration** — Dashboard presets, widget layouts, themes. Persisted across sessions via a **write-through cache** (localStorage → encrypted server sync)
2. **Widget Content** — Fetched from external APIs (YouTube RSS, Reddit, GitHub, Hacker News, Weather). Cached in **server-side LRU caches** with varying TTLs

The persistence architecture is designed around a single principle: **the server should never see plaintext user data**. User config is encrypted client-side before storage. Widget content, being public data, is cached server-side for performance.

```
┌──────────────────────────────────────────────────────────────────────┐
│                     Data Categories in Wassup                        │
│                                                                      │
│  User Configuration (private)         Widget Content (public)        │
│  ──────────────────────────           ─────────────────────          │
│                                                                      │
│  ┌────────────┐  write-through ┌───────────┐                        │
│  │localStorage├───────────────→│/api/config│                        │
│  │(plaintext) │   debounced 1s │(encrypted)│                        │
│  └─────┬──────┘                └─────┬─────┘                        │
│        │                            │                                │
│        │ instant read               │ ciphertext blob                │
│        ▼                            ▼                                │
│  AppConfigProvider              PostgreSQL (Prisma)                   │
│  └── useReducer                 └── UserConfig table                 │
│                                                                      │
│                                ┌──────────────────────────────────┐  │
│  Server Actions                │  LRU Cache (per widget type)     │  │
│  ┌──────────────┐              │                                  │  │
│  │ youtube.actions│───────────→│  youtube:  max=20,  ttl=12h      │  │
│  │ reddit.actions │───────────→│  reddit:   max=20,  ttl=5m       │  │
│  │ github.actions │───────────→│  github:   max=30,  ttl=30m      │  │
│  │ feed.actions   │───────────→│  feed:     max=50,  ttl=5m       │  │
│  │ weather.actions│───────────→│  weather:  max=5,   ttl=5m       │  │
│  │ hn.actions     │───────────→│  hn:       max=20,  ttl=5m       │  │
│  └──────────────┘              │                                  │  │
│                                └──────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────┘
```

---

## Core Concepts

### 1. Write-Through Cache Strategy

A write-through cache writes data to both a fast local store and a durable remote store on every mutation. Wassup implements this with **localStorage** as the fast path and **server API** as the durable path.

```
User action (e.g., switch preset)
        │
        ▼
dispatch({ type: "SET_ACTIVE_PRESET", payload: id })
        │
        ▼
useReducer produces new AppState
        │
        ▼
useEffect fires (state changed, isHydrated = true)
        │
        ├──→ saveToStorage(userId, state)         ← synchronous, <1ms
        │    localStorage.setItem(key, JSON.stringify(state))
        │
        └──→ syncToServer(state)                  ← debounced 1s, async
             ├── encryptConfig(JSON.stringify(state), passphrase, salt)
             └── PUT /api/config { encryptedData, salt }
```

**Storage key scheme:**

| User State | localStorage Key | Legacy Key (migrated from) |
|---|---|---|
| Anonymous | `wassup-state` | `wassup-config` |
| Authenticated (userId = `abc`) | `wassup-state-abc` | `wassup-config-abc` |

**Hydration order (on page load):**

```
1. if (status === "loading") return;           // wait for NextAuth

2. const local = loadFromStorage(userId);       // localStorage (instant)
   ├── Try new key: "wassup-state-{userId}"
   ├── Fallback: try legacy key "wassup-config-{userId}"
   │   └── If found: migrate + save to new key + delete legacy
   └── Parse → migrateToAppState() → reconcileWithSeedPresets()

3. dispatch(SET_STATE, local);                  // render immediately

4. if (isAuthenticated) {
     hydrateFromServer(userId, dispatch);       // async reconciliation
     ├── GET /api/config → { encryptedData, salt }
     ├── Try cached passphrase from sessionStorage
     │   └── Success → decrypt → dispatch(SET_STATE) → overwrite local
     └── Fail → show passphrase dialog
   }
```

**Local-first philosophy:** The user sees their dashboard instantly from localStorage. Server data reconciles asynchronously. If the server is unreachable, the app still works.

### 2. Prisma + PostgreSQL

Wassup uses **Prisma ORM** with **PostgreSQL** via the `@prisma/adapter-pg` driver adapter. PostgreSQL runs as a Docker service alongside the app, providing a robust relational database with connection pooling managed by the adapter.

**Prisma setup:**

```
prisma/
├── schema.prisma          # Schema definition (models, relations)
├── migrations/
│   ├── 20260227045727_init/
│   │   └── migration.sql  # All tables (User, Account, Session, UserConfig)
│   └── migration_lock.toml
└── (prisma.config.ts at project root)
```

**Schema (5 models):**

```
┌───────────────────────────────────────────────────────────────┐
│                    Prisma Schema                              │
│                                                               │
│  NextAuth Models (required by PrismaAdapter):                 │
│  ┌─────────┐  ┌─────────┐  ┌───────────────────┐              │
│  │ Account │  │ Session │  │VerificationToken  │              │
│  │(OAuth)  │  │(cookie) │  │(unused)           │              │
│  └────┬────┘  └────┬────┘  └───────────────────┘              │
│       │M:1         │M:1                                       │
│       ▼            ▼                                          │
│  ┌──────────────────────┐                                     │
│  │       User           │                                     │
│  │  id: cuid()          │                                     │
│  │  name, email, image  │                                     │
│  └──────────┬───────────┘                                     │
│             │ 1:1                                             │
│             ▼                                                 │
│  ┌──────────────────────┐                                     │
│  │    UserConfig        │ ← The only app-specific model       │
│  │  id: cuid()         │                                      │
│  │  userId: unique     │                                      │
│  │  data: String       │  ← Ciphertext (base64 AES-256-GCM)   │
│  │  salt: String       │  ← PBKDF2 salt (base64, 16 bytes)    │
│  │  updatedAt: DateTime│                                      │
│  └─────────────────────┘                                      │
└─────────────────────────────────────────────────────────────-─┘
```

**Key design point:** The `UserConfig.data` field stores an **opaque ciphertext blob**. The server cannot validate its contents because it has no key. It can only validate the shape (string) and size (<500KB).

**Singleton pattern (avoids hot-reload leaks):**

```typescript
// src/lib/prisma.ts
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };
export const prisma = globalForPrisma.prisma ?? createPrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

In development, Next.js re-evaluates modules on each hot reload. Without this pattern, each reload creates a new `PrismaClient`, eventually exhausting the PostgreSQL connection pool. The `globalThis` cache ensures exactly one instance survives across reloads.

**Driver adapter pattern (Prisma 7+):**

```typescript
function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL environment variable is required");
  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({ adapter });
}
```

Prisma 7 introduced driver adapters, decoupling the query engine from the database driver. Wassup uses `@prisma/adapter-pg`, which manages connection pooling internally via the `pg` driver.

### 3. Server-Side LRU Caching

Every widget's server action maintains its own LRU cache to avoid redundant external API calls. The caching pattern is consistent but TTLs vary by data freshness requirements.

**Cache inventory:**

| Widget | Cache Key | Max Entries | TTL | Rationale |
|---|---|---|---|---|
| YouTube | `JSON.stringify(config)` | 20 | **12 hours** | RSS feeds update infrequently; YouTube intermittently 404s |
| Reddit | `JSON.stringify(config)` | 20 | 5 min | Content updates every few minutes |
| Hacker News | `JSON.stringify(config)` | 20 | 5 min | Real-time news; "top" rotates frequently |
| RSS Feed | `${url}\|${limit}` | 50 | 5 min | Blog posts update a few times per day |
| Weather | `JSON.stringify(config)` | 5 | 5 min | Forecasts update hourly; 5 min is sufficient |
| GitHub (search) | `topics+language+dates` | 20 | 15 min | Search results change slowly |
| GitHub (result) | `search+dateRange` | 30 | 30 min (stale-while-revalidate) | Star counts need enrichment |
| GitHub (errors) | result key | 20 | 30 sec | Negative cache to prevent retry storms |

**The standard caching template:**

```typescript
"use server";

const dataCache = new LRUCache<string, WidgetInnerProps>({
  max: 20,
  ttl: 1000 * 60 * 5,
});

export async function fetchWidgetProps(config: WidgetConfig): Promise<WidgetInnerProps> {
  const end = serverActionDuration.startTimer({ action: "widget" });
  try {
    const key = JSON.stringify(config);
    const cached = dataCache.get(key);
    if (cached) {
      cacheHits.inc({ cache: "widget" });
      end({ status: "hit" });
      return cached;
    }
    cacheMisses.inc({ cache: "widget" });

    const data = await service.fetch(config);
    dataCache.set(key, data);
    end({ status: "success" });
    return data;
  } catch (e) {
    end({ status: "error" });
    throw e;
  }
}
```

Every action follows this exact structure: metrics timer → cache check → cache miss → fetch → store → return. This consistency makes the codebase predictable and each action instrumentable.

### 4. Encrypted Sync Hook (`useEncryptedSync`)

The `useEncryptedSync` hook encapsulates the entire encrypted persistence lifecycle. It manages:

1. **Passphrase state** — cached in `sessionStorage` between page reloads
2. **Server hydration** — fetching encrypted data and decrypting it
3. **Dialog coordination** — prompting for passphrase when needed
4. **Encryption on save** — encrypting state before sending to server

```
┌───────────────────────────────────────────────────────────────────────┐
│                    useEncryptedSync State Machine                     │
│                                                                       │
│  ┌─────────────┐                                                      │
│  │ Initial     │                                                      │
│  └──────┬──────┘                                                      │
│         │ hydrateFromServer() called by AppConfigProvider             │
│         ▼                                                             │
│  ┌─────────────────────────────────────────────────────────┐          │
│  │ GET /api/config → { encryptedData, salt }               │          │
│  └──────┬───────────────────────────────────┬──────────────┘          │
│         │ data exists                       │ no data                 │
│         ▼                                   ▼                         │
│  ┌───────────────────────┐           ┌───────────────────────┐        │
│  │ Try cached passphrase │           │ New encryption user   │        │
│  │ (sessionStorage)      │           │ → show dialog         │        │
│  └──────┬───────┬────────┘           │ (creation mode)       │        │
│         │ ok    │ fail               └──────────┬────────────┘        │
│         ▼       ▼                               │                     │
│  ┌──────────┐  ┌───────────────────┐            │                     │
│  │ Hydrate  │  │ Show dialog       │            │                     │
│  │ silently │  │ (decryption mode) │            │                     │
│  └──────────┘  └───────┬───────────┘            │                     │
│                        │ user enters passphrase │ user sets passphrase│
│                        ▼                        ▼                     │
│              ┌───────────────────┐     ┌───────────────────┐          │
│              │ tryDecrypt()      │     │ setPassphrase()   │          │
│              ├─ success → hydrate│     │ cache to session  │          │
│              └─ fail → show error│     │ close dialog      │          │
│                                        │ isHydrated = true │          │
│                                        └───────────────────┘          │
│                                                                       │
│  After hydration, on every state change:                              │
│  syncEncryptedState(appState)                                         │
│  ├── JSON.stringify(appState)                                         │
│  ├── encryptConfig(plaintext, passphrase, existingSalt)               │
│  │   ├── Reuse salt → same derived key                                │
│  │   └── Fresh IV per call → different ciphertext each time           │
│  └── PUT /api/config { encryptedData, salt }                          │
└───────────────────────────────────────────────────────────────────────┘
```

**Passphrase lifecycle:**

| Event | Passphrase Location |
|---|---|
| User enters passphrase | React state + `sessionStorage` |
| Page refresh (same tab) | `sessionStorage` survives → auto-decrypt silently |
| New tab | `sessionStorage` is per-tab → re-prompts |
| Tab close | `sessionStorage` cleared by browser |
| Sign out | `clearPassphrase()` removes from state + `sessionStorage` |

### 5. API Route Security Layers

The `/api/config` route demonstrates a defense-in-depth pattern with four security layers:

```
PUT /api/config
│
├── 1. Authentication: auth() → session?.user?.id
│   └── Reject 401 if not authenticated
│
├── 2. CSRF: validateOrigin(request)
│   └── Origin header must match Host header
│   └── Reject 403 if mismatch
│
├── 3. Rate Limiting: limiter.check(session.user.id)
│   └── 30 requests/min per user (sliding window)
│   └── Reject 429 if exceeded
│
├── 4. Payload Validation: type + size checks
│   └── encryptedData must be string, <500KB
│   └── salt must be string, <100 chars
│   └── Reject 400 if invalid
│
└── 5. Upsert: prisma.userConfig.upsert()
    └── Create if first save, update if exists
```

**Rate limiter implementation** — a sliding-window algorithm backed by LRU:

```typescript
// Each token (userId) stores an array of timestamps
const cache = new LRUCache<string, number[]>({ max: 500, ttl: windowMs });

check(token):
  1. Get timestamps for this token
  2. Filter to only those within the current window
  3. If count >= limit → reject
  4. Otherwise → push current timestamp, accept
```

The `maxTokens = 500` on the LRU prevents memory exhaustion from many distinct users. Old tokens are automatically evicted.

---

## Architecture

### Two-Layer Caching Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                           Client Layer                           │
│                                                                  │
│  TanStack Query (per widget)                                     │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ queryKey: ["youtube", ...config]                           │  │
│  │ staleTime: 5 min        ← don't refetch for 5 min          │  │
│  │ gcTime:    10 min       ← keep in memory for 10 min        │  │
│  │ retry:     1            ← retry once on failure            │  │
│  └───────────────────────────────────┬────────────────────────┘  │
│                                      │ cache miss                │
│                                      ▼                           │
├──────────────────────────────────────────────────────────────────┤
│                           Server Layer                           │
│                                                                  │
│  Server Action (youtube.actions.ts)                              │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ LRU Cache                                                  │  │
│  │ max: 20, ttl: 12h                                          │  │
│  │ key: JSON.stringify(config)                                │  │
│  └───────────────────────────────────┬────────────────────────┘  │
│                                      │ cache miss                │
│                                      ▼                           │
│  Service Layer (YoutubeService.fetch())                          │
│  ├── resolveChannels()  → YouTube HTML scraper                   │
│  └── fetchVideos()      → YouTube RSS XML parser                 │
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│                          External APIs                           │
│ YouTube RSS · Reddit API · GitHub GraphQL · HN API · Weather API │
└──────────────────────────────────────────────────────────────────┘
```

**Why two layers?**

| Layer | Purpose | Scope |
|---|---|---|
| Client (TanStack Query) | Prevent redundant server calls from the same browser tab | Per-tab, per-user |
| Server (LRU Cache) | Prevent redundant external API calls across all users | Per-process, shared |

A cache hit at either layer avoids the downstream call. A client cache hit doesn't even hit the server action.

### GitHub's Advanced Caching: Stale-While-Revalidate

The GitHub widget has the most sophisticated caching because GitHub's API is rate-limited and enrichment (star velocity) is expensive:

```
                         ┌──────────────────────────────┐
                         │           Request            │
                         └──────────────┬───────────────┘
                                        │
                         ┌──────────────▼───────────────┐
                         │     resultCache.get(key)     │
                         └──────────────┬───────────────┘
                                        │
                    ┌───────────┬───────┴────────┬───────────────┐
                    │           │                │               │
                 ✅ Fresh    ⏳ Stale         ❌ Miss         🚫 Error
                    │           │                │            in errorCache
                    │           │                │               │
                  Return      Return          Blocking         Throw
               immediately   + trigger      freshFetch()     (prevents
                            background                      retry storm)
                             refresh
                                │
                                ▼
                   triggerBackgroundRefresh()
                   ├── Deduplicated (refreshing Set)
                   ├── freshFetch() runs async
                   ├── Updates resultCache + refreshedAt
                   └── Errors caught silently (stale data keeps serving)
```

**Four separate caches:**

| Cache | What | TTL | Why |
|---|---|---|---|
| `searchCache` | Raw GitHub search results (repos) | 15 min | Shared across dateRange toggles — avoids re-searching |
| `resultCache` | Enriched results (with star velocity) | 30 min + `allowStale` | Stale data is better than no data |
| `refreshedAt` | Last refresh timestamp per key | N/A (Map) | Determines staleness (5 min interval) |
| `errorCache` | Failed keys | 30 sec | Negative cache — prevents retry storms on API failures |

### Data Flow: Anonymous vs Authenticated

```
                   Anonymous User                    Authenticated User
                   ─────────────                     ──────────────────

Load:              localStorage only                 localStorage + server
                   key: "wassup-state"               key: "wassup-state-{userId}"

Save:              localStorage only                 localStorage + encrypted server
                   (synchronous)                     (sync + debounced 1s async)

Server storage:    N/A                               UserConfig { data, salt }
                                                     (ciphertext — server can't read)

Passphrase:        N/A                               Required (sessionStorage cache)

Cross-device:      ❌ No sync                        ✅ Encrypted sync

Data loss risk:    Browser clear = total loss         Browser clear = re-enter passphrase
```

---

## How It Works

### Prisma Workflow (Development → Production)

**Initial setup:**

```bash
# 1. Define schema in prisma/schema.prisma
# 2. Create migration
npx prisma migrate dev --name init

# Creates:
# prisma/migrations/20260222014239_init/migration.sql
# src/generated/prisma/client  (generated Prisma Client)
```

**Adding a column (e.g., salt for encryption):**

```bash
# 1. Edit schema.prisma — add salt field to UserConfig
# 2. Generate migration
npx prisma migrate dev --name encryption_salt

# Creates:
# prisma/migrations/20260222084838_encryption_salt/migration.sql
```

**Production deployment:**

```bash
# In Dockerfile or CI
npx prisma migrate deploy  # runs pending migrations
next build                  # includes prisma generate via postinstall
```

**Prisma in Next.js standalone output:**

The `next.config.ts` sets `output: "standalone"`. The `pg` driver used by `@prisma/adapter-pg` is pure JavaScript, so no `serverExternalPackages` configuration is needed.

### LRU Cache Lifecycle (lru-cache library)

```
┌───────────────────────────────────────────────────────────--──┐
│                  LRU Cache Operations                         │
│                                                               │
│  .get(key)                                                    │
│  ├── Key exists + not expired → return value (cache hit)      │
│  ├── Key exists + expired → delete + return undefined (miss)  │
│  └── Key not found → return undefined (miss)                  │
│                                                               │
│  .set(key, value)                                             │
│  ├── If cache is full (max reached) → evict LRU entry         │
│  └── Store value with TTL timestamp                           │
│                                                               │
│  Eviction strategy:                                           │
│  1. TTL expiration (time-based)                               │
│  2. LRU eviction (when max entries reached)                   │
│                                                               │
│  Special: allowStale = true (GitHub result cache)             │
│  └── Expired entries are returned AND marked for eviction     │
│      → Enables stale-while-revalidate pattern                 │
└───────────────────────────────────────────────────────────────┘
```

### Metrics Instrumentation

Every cache operation is instrumented for Prometheus:

```
wassup_server_action_duration_seconds{action="youtube", status="hit|success|error|stale"}
wassup_cache_hits_total{cache="youtube|reddit|feed|weather|hackernews|github"}
wassup_cache_misses_total{cache="youtube|reddit|feed|weather|hackernews|github"}
```

**Singleton guard** — same `globalThis` pattern as Prisma:

```typescript
const globalForMetrics = globalThis as unknown as { __metrics: {...} };
const metrics = (globalForMetrics.__metrics ??= (() => {
  const register = new Registry();
  collectDefaultMetrics({ register });
  // ... create Histogram, Counter instances
  return { register, serverActionDuration, cacheHits, cacheMisses };
})());
```

Without this, Next.js module re-evaluation in production would throw "metric already registered" errors from `prom-client`.

---

## Trade-offs & Limitations

| Decision | Trade-off | Rationale |
|---|---|---|
| **localStorage as primary store** | Data loss if browser storage is cleared | Provides instant page loads; server backup exists for authenticated users |
| **No conflict resolution** | Server state wins on hydration (overwrites local) | Acceptable for single-user/single-device primary use. True CRDT would be overkill |
| **Debounced 1s server sync** | Up to 1s of unsaved changes on tab close | Reduces API calls during rapid config edits (preset switching, drag-and-drop) |
| **LRU cache per-process** | Cache lost on restart, not shared across instances | Single-instance deployment (Hetzner VPS). Redis needed for horizontal scaling |
| **PostgreSQL as Docker service** | Adds a second container to manage | Docker Compose handles lifecycle; health-checked dependency ensures ordering |
| **Opaque ciphertext on server** | Server cannot validate stored config structure | By design: zero-knowledge. Size-only validation prevents abuse |
| **No passphrase recovery** | Forgotten passphrase = permanent data loss | Inherent to zero-knowledge. No recovery mechanism is a feature, not a bug |
| **`JSON.stringify(config)` as cache key** | Object key ordering matters; functionally identical configs with different key order = cache miss | Acceptable because configs always originate from the same serialization path |
| **Separate LRU per widget** | Memory not shared globally; one widget can't benefit from another's unused capacity | Isolation simplifies reasoning; each widget team controls their own TTL/max |

### Known Limitations

| Limitation | Impact | Mitigation Path |
|---|---|---|
| **No offline support** | Tab close during server sync = lost changes | Could add Service Worker with IndexedDB queue |
| **No optimistic sync** | If server is down, changes are only in localStorage | Could queue failed PUTs and retry on reconnect |
| **No schema versioning in UserConfig** | Schema changes may make stored ciphertext undecryptable if the structure changes | Current mitigation: Zod's `.safeParse` with defaults. Add a version field before major schema changes |
| **Memory ceiling for LRU** | Each cache holds data in Node.js heap. Many distinct configs = high memory | Max entries are bounded (5-50 per widget). Could add size-based eviction |
| **No cache warming** | First request after restart always hits external APIs | Could persist hot cache entries to disk or pre-warm on startup |

---

## Use Cases / Real Examples

### Example 1: Write-Through in Action (Switching Presets)

```
User clicks "AI Engineering" preset
│
├── 1. dispatch(SET_ACTIVE_PRESET, "ai-engineering")
│       → useReducer returns new AppState with activePresetId changed
│
├── 2. useEffect fires (state changed)
│       ├── saveToStorage("user-123", state)
│       │   → localStorage["wassup-state-user-123"] = JSON.stringify(state)
│       │   → <1ms, synchronous
│       │
│       └── syncToServer(state) [debounced 1s]
│           → (waits 1 second — user might switch again)
│           → encryptConfig(JSON.stringify(state), passphrase, existingSalt)
│           → PUT /api/config { encryptedData: "base64...", salt: "base64..." }
│           → prisma.userConfig.upsert(...)
│
├── 3. Tabs/widgets re-render with new config
│       → Each widget's useQuery fires with updated queryKey
│       → TanStack Query checks its cache
│       → Cache hit → render instantly
│       → Cache miss → call server action → LRU check → external API
│
└── 4. If user switches again within 1s
        → The debounce cancels the previous sync
        → Only the final state is sent to the server
```

### Example 2: Production Issue — YouTube 404s Filling Cache with Errors

**Symptom:** YouTube widget intermittently showed no videos, then worked on reload.

**Root cause:** YouTube's RSS feed occasionally returns 404. The server action was caching the error response, and the 12-hour TTL meant the "error" was served for 12 hours.

**Fix:** Use `Promise.allSettled` in the service and only cache successful results:

```typescript
// YoutubeService.fetch()
const results = await Promise.allSettled(
  channels.map(c => this.videoRepository.fetchMany(c.id))
);

// Only successful channels contribute videos
const videos = results.flatMap((result, i) => {
  if (result.status === "fulfilled") return result.value;
  logger.warn(`Failed to fetch videos for ${channels[i].name}`);
  return [];  // skip failed channels
});
```

The cache now stores only valid data. Failed channels are logged and retried on the next cache miss.

### Example 3: GitHub Stale-While-Revalidate

**Problem:** GitHub API rate limits (60/hour unauthenticated) + enrichment (one API call per repo for star velocity) makes fresh fetches expensive.

**Solution:** Four-cache architecture:

```
Request 1 (cold): blocking freshFetch()
  └── searchCache MISS → GitHub Search API
  └── enrichWithRecentStars() → GitHub Stars API (per repo)
  └── resultCache SET

Request 2 (< 5 min): return fresh cache
  └── resultCache HIT, timestamp < 5 min → return immediately

Request 3 (5-30 min): stale-while-revalidate
  └── resultCache HIT but stale (> 5 min since last refresh)
  └── Return stale data immediately (user sees something)
  └── triggerBackgroundRefresh() runs async
      ├── searchCache HIT (reuse search, save API call)
      └── Re-enrich with fresh star data
      └── Update resultCache + refreshedAt

Request 4 (after API failure): negative cache
  └── freshFetch() throws → errorCache SET (30s TTL)
  └── Next request within 30s → throw immediately
  └── After 30s → retry
```

### Example 4: Rate Limiter Protecting the Config API

**Scenario:** A bug in `useEffect` caused infinite render loops, which triggered continuous `PUT /api/config` calls.

**Defense:**

```
PUT /api/config (loop iteration 1-30): 200 OK
PUT /api/config (loop iteration 31+):  429 Too Many Requests
  └── limiter.check("user-123")
      └── timestamps.length (31) >= limit (30)
      └── { success: false, remaining: 0 }
```

The 30 req/min sliding window rate limiter prevented the database from being hammered. Combined with the 1-second debounce in `syncToServer`, the actual rate was further reduced (maximum ~60/min without debounce, ~1/min with debounce under normal conditions).

---

## Comparisons with Alternatives

### User Config Persistence

| Approach | Pros | Cons | When to Use |
|---|---|---|---|
| **Write-through: localStorage + encrypted server (Wassup)** | Instant local reads, zero-knowledge server, works offline (read) | Two code paths, no conflict resolution | Privacy-focused single-user apps |
| **Server-only (REST API)** | Single source of truth, multi-device | Network latency on every read, server sees data | Multi-user apps with server trust |
| **localStorage-only** | Zero backend | No cross-device, data loss on clear | Throwaway/prototype apps |
| **IndexedDB** | Larger storage, structured data, transactions | More complex API than localStorage | Apps with large client-side datasets (>5MB) |
| **CRDTs (Yjs, Liveblocks)** | Conflict-free multi-device sync, real-time collab | Complex, significant bundle/infra cost | Collaborative editors |

### Database Choice

| Database | Deployment | Scaling | Best For |
|---|---|---|---|
| **PostgreSQL (Wassup)** | Docker service | Multi-writer, horizontal read replicas | Personal to production-scale apps |
| **MySQL / MariaDB** | Server or managed | Multi-writer, horizontal | Legacy/enterprise apps |
| **Turso (libSQL)** | Edge-hosted SQLite | Multi-region read replicas, single-writer | SQLite at scale, edge computing |
| **Supabase** | Managed PostgreSQL | Auto-scaling | Full-stack apps wanting auth + DB + API |

### Server-Side Caching

| Strategy | Pros | Cons | When to Use |
|---|---|---|---|
| **In-process LRU (Wassup)** | Zero infrastructure, <1ms reads, zero network | Lost on restart, per-process, memory-bound | Single-instance apps |
| **Redis** | Shared across instances, persistent, pub/sub | Infrastructure dependency, network latency (~1ms) | Multi-instance apps |
| **Memcached** | Simple key-value, multi-threaded | No persistence, no data structures | Pure cache (no pub/sub needs) |
| **CDN/Edge cache (Cloudflare KV)** | Globally distributed, near-user | Eventually consistent, limited APIs | Static or semi-static content |
| **HTTP cache headers** | Zero server-side code | Coarse-grained, hard to invalidate | Public API responses |

### ORM / Database Access

| Library | Type Safety | Migration | Query | Best For |
|---|---|---|---|---|
| **Prisma (Wassup)** | Full (generated client) | Built-in (`prisma migrate`) | DSL (`findUnique`, `upsert`) | TypeScript apps wanting generated types |
| **Drizzle** | Full (schema-as-code) | Built-in (`drizzle-kit`) | SQL-like TypeScript | Developers who prefer SQL syntax |
| **Knex** | Manual | Built-in | Query builder | SQL-heavy apps, joins |
| **Raw `better-sqlite3`** | Manual | Manual | Raw SQL | Maximum performance, no abstraction |
| **TypeORM** | Decorators | Built-in | Active Record / Repository | Classic OOP codebases |

---

## Key Takeaways

1. **Local-first, server-second** — localStorage loads in <1ms. Server reconciliation is async. The user never waits for the network to see their dashboard.

2. **Debounce mutations, cache reads** — The 1-second debounce on writes prevents server storms during rapid edits. LRU caches on the server prevent external API abuse.

3. **globalThis singletons survive hot reload** — Both Prisma and prom-client require exactly one instance per process. The `globalThis` pattern is the standard Next.js solution.

4. **Stale data is better than no data** — GitHub's `allowStale + background refresh` pattern ensures users always see something, even during API failures.

5. **Negative caching prevents retry storms** — When an external API fails, cache the failure for 30 seconds to avoid hammering a down service.

6. **The server is a blind vault** — `UserConfig.data` is ciphertext. The API validates shape and size, but never structure. This makes the server trivially simple and impossible to breach for user data.

7. **PostgreSQL via Docker** — PostgreSQL runs as a Docker service alongside the app, providing ACID transactions and full SQL capabilities. The `@prisma/adapter-pg` manages connection pooling internally.
