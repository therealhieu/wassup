# Application Metrics with prom-client

## Scope

Add Prometheus-compatible metrics to Wassup so VictoriaMetrics can scrape application-level performance data. This covers server action latency, LRU cache effectiveness, and Node.js runtime health.

### What This Plan Does

| Metric | Source | Value |
|---|---|---|
| Server action duration | `prom-client` Histogram | Know which data fetches are slow |
| Cache hit/miss ratio | `prom-client` Counter | Validate cache is working |
| Node.js heap, event loop, GC | `prom-client` default metrics | Detect memory leaks |

### What This Plan Does NOT Do

- **No HTTP request-level metrics** — Next.js 16 doesn't expose middleware hooks for route-level timing in a clean way. Server actions are the real boundary.
- **No client-side metrics** — browser performance is out of scope
- **No alerting** — that's a separate concern (vmalert)

---

## Implementation

### Step 1 — Install prom-client

```bash
bun add prom-client
```

---

### Step 2 — Create Metrics Module

**New file:** `src/lib/metrics.ts`

```typescript
import { Registry, Histogram, Counter, collectDefaultMetrics } from "prom-client";

// globalThis singleton guard — prevents "metric already registered" errors
// during Next.js HMR in development (same pattern as prisma.ts)
const globalForMetrics = globalThis as unknown as { metricsRegistry: Registry };

export const register = globalForMetrics.metricsRegistry ??= (() => {
  const r = new Registry();
  collectDefaultMetrics({ register: r });
  return r;
})();

export const serverActionDuration = new Histogram({
  name: "wassup_server_action_duration_seconds",
  help: "Duration of server action calls",
  labelNames: ["action", "status"] as const,
  buckets: [0.05, 0.1, 0.25, 0.5, 1, 2, 5, 10],
  registers: [register],
});

export const cacheHits = new Counter({
  name: "wassup_cache_hits_total",
  help: "Number of LRU cache hits",
  labelNames: ["cache"] as const,
  registers: [register],
});

export const cacheMisses = new Counter({
  name: "wassup_cache_misses_total",
  help: "Number of LRU cache misses",
  labelNames: ["cache"] as const,
  registers: [register],
});
```

Key decisions:
- **globalThis singleton** — required because Next.js dev mode creates fresh module instances on HMR. Without this, every save crashes with "metric already registered"
- **Dedicated Registry** — avoids polluting the global default registry
- **Histogram buckets** — tuned for external API calls (50ms–10s range)
- **Label `action`** — one of: `weather`, `feed`, `reddit`, `youtube`, `github`, `hackernews`
- **Label `status`** — one of: `hit` (cache), `stale` (served stale), `success`, `error`

---

### Step 3 — Create `/api/metrics` Route

**New file:** `src/app/api/metrics/route.ts`

```typescript
import { register } from "@/lib/metrics";

export async function GET() {
  const metrics = await register.metrics();
  return new Response(metrics, {
    headers: { "Content-Type": register.contentType },
  });
}
```

> **Public exposure note:** This route is accessible at `https://wassup.therealhieu.com/api/metrics`.
> The data is non-sensitive (heap size, action durations) and this is a personal project,
> so no auth is needed. VictoriaMetrics scrapes it from within the Docker network.

---

### Step 4 — Instrument Server Actions

Each `*.actions.ts` gets a thin instrumentation wrapper. The pattern varies slightly by action complexity.

#### Standard Pattern (weather, reddit, youtube, hackernews)

These 4 actions share identical cache-check → fetch → return structure:

```typescript
import { serverActionDuration, cacheHits, cacheMisses } from "@/lib/metrics";

export async function fetchXxxWidgetProps(...) {
  const end = serverActionDuration.startTimer({ action: "xxx" });
  try {
    const cached = dataCache.get(key);
    if (cached) {
      cacheHits.inc({ cache: "xxx" });
      end({ status: "hit" });
      return cached;
    }
    cacheMisses.inc({ cache: "xxx" });

    // ... existing fetch logic ...

    end({ status: "success" });
    return result;
  } catch (e) {
    end({ status: "error" });
    throw e;
  }
}
```

#### Feed Pattern (rss.actions.ts)

Feed exports **two functions**. `fetchSingleFeed` is the high-traffic one (called per-URL by `useQueries`). Instrument **both**, but `fetchSingleFeed` is the priority:

```typescript
export async function fetchSingleFeed(url, limit) {
  const end = serverActionDuration.startTimer({ action: "feed" });
  try {
    const cached = feedCache.get(key);
    if (cached) { cacheHits.inc({ cache: "feed" }); end({ status: "hit" }); return cached; }
    cacheMisses.inc({ cache: "feed" });
    // ... fetch ...
    end({ status: "success" });
    return feeds;
  } catch (e) { end({ status: "error" }); throw e; }
}

// fetchFeedWidgetProps does NOT use the cache — no cache counters needed
export async function fetchFeedWidgetProps(config) {
  const end = serverActionDuration.startTimer({ action: "feed_batch" });
  try {
    // ... existing logic ...
    end({ status: "success" }); return result;
  } catch (e) { end({ status: "error" }); throw e; }
}
```

#### GitHub Pattern (github.actions.ts)

GitHub has stale-while-revalidate with multiple caches and background refresh. Only instrument the **entry point** (`fetchGithubWidgetProps`). Count stale serves as `stale`:

```typescript
export async function fetchGithubWidgetProps(config) {
  const end = serverActionDuration.startTimer({ action: "github" });
  try {
    const cached = resultCache.get(key);
    const isStale = Date.now() - lastRefresh > REFRESH_INTERVAL;

    if (cached && !isStale) {
      cacheHits.inc({ cache: "github" });
      end({ status: "hit" });
      return cached;
    }

    if (cached && isStale) {
      cacheHits.inc({ cache: "github" });
      triggerBackgroundRefresh(key, config);
      end({ status: "stale" });
      return cached;
    }

    cacheMisses.inc({ cache: "github" });
    const result = await freshFetch(key, config);
    end({ status: "success" });
    return result;
  } catch (e) {
    end({ status: "error" });
    throw e;
  }
}
```

> Background `freshFetch` calls are not timed — they're fire-and-forget. The user-facing latency is what matters.

#### Files to modify (6 total):

| File | Action label | Cache label | Pattern |
|---|---|---|---|
| `src/features/weather/services/weather.actions.ts` | `weather` | `weather` | Standard |
| `src/features/feed/services/rss.actions.ts` | `feed`, `feed_batch` | `feed` | Feed (2 functions) |
| `src/features/reddit/services/reddit.actions.ts` | `reddit` | `reddit` | Standard |
| `src/features/youtube/services/youtube.actions.ts` | `youtube` | `youtube` | Standard |
| `src/features/github/services/github.actions.ts` | `github` | `github` | GitHub (stale-while-revalidate) |
| `src/features/hackernews/services/hackernews.actions.ts` | `hackernews` | `hackernews` | Standard |

---

### Step 5 — Enable VictoriaMetrics Scraping (play-infra)

**File:** `play-infra/deploy/hetzner/prometheus.yml`

Uncomment the wassup job:

```yaml
  - job_name: wassup
    static_configs:
      - targets: ["wassup:3000"]
    metrics_path: /api/metrics
```

---

### Step 6 — Verify

1. **Local:** `curl http://localhost:3000/api/metrics` → should return Prometheus text format
2. **Production:** After deploy, query in vmui:

| Query | What it shows |
|---|---|
| `wassup_server_action_duration_seconds_count` | Total action invocations by action type |
| `histogram_quantile(0.95, rate(wassup_server_action_duration_seconds_bucket[5m]))` | p95 latency per action |
| `rate(wassup_cache_hits_total[5m]) / (rate(wassup_cache_hits_total[5m]) + rate(wassup_cache_misses_total[5m]))` | Cache hit ratio per provider |
| `nodejs_heap_size_used_bytes` | Node.js memory usage |
| `nodejs_eventloop_lag_seconds` | Event loop lag |

---

## File Change Summary

| File | Action | Description |
|---|---|---|
| `package.json` | Edit | Add `prom-client` dependency |
| `src/lib/metrics.ts` | **New** | Metric registry with globalThis guard, histogram, counters |
| `src/app/api/metrics/route.ts` | **New** | GET handler returning Prometheus metrics |
| `src/features/weather/services/weather.actions.ts` | Edit | Standard wrap |
| `src/features/feed/services/rss.actions.ts` | Edit | Wrap both exported functions |
| `src/features/reddit/services/reddit.actions.ts` | Edit | Standard wrap |
| `src/features/youtube/services/youtube.actions.ts` | Edit | Standard wrap |
| `src/features/github/services/github.actions.ts` | Edit | Stale-aware wrap at entry point only |
| `src/features/hackernews/services/hackernews.actions.ts` | Edit | Standard wrap |

**Cross-repo (play-infra):**

| File | Action | Description |
|---|---|---|
| `deploy/hetzner/prometheus.yml` | Edit | Uncomment wassup scrape job |

---

## Effort

| Step | Time |
|---|---|
| Install + metrics.ts + route | ~15 min |
| Instrument 6 server actions | ~30 min |
| Enable scrape in play-infra | ~5 min |
| **Total** | **~50 min** |
