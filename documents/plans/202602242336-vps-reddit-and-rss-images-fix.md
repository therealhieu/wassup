# Fix: VPS Reddit Widget & RSS Feed Images

## Problem Summary

Two issues on the Hetzner VPS deployment:

1. **Reddit widget returns no data** — Reddit blocks datacenter IPs (Hetzner). The current unauthenticated `www.reddit.com/r/.../hot.json` endpoint rejects requests from non-residential IPs.
2. **RSS feed images don't load** — The CSP `img-src` directive only allowlists a few specific domains. RSS thumbnails from arbitrary external domains are silently blocked by the browser.

---

## Fix 1: CSP `img-src` — RSS Feed Images

**Effort:** ~2 min, 1 file

### Change

**File:** `src/middleware.ts` (line 13)

```ts
// Before
`img-src 'self' https://avatars.githubusercontent.com https://authjs.dev https://*.ytimg.com https://openweathermap.org data: blob:`

// After
`img-src 'self' https: data: blob:`
```

### Rationale

- RSS feeds pull thumbnails from arbitrary domains (`cdn.substack.com`, `miro.medium.com`, etc.)
- Allowlisting `https:` permits any HTTPS image while still blocking insecure HTTP
- This is the standard approach for content aggregator apps

---

## Fix 2: Reddit OAuth API

**Effort:** ~30 min, 3 files + env config

### Why OAuth?

- Reddit's public JSON endpoint blocks known datacenter IP ranges (Hetzner, AWS, GCP, etc.)
- OAuth-authenticated requests are explicitly allowed at **60 req/min** regardless of IP type
- Combined with the existing **LRU cache (5-min TTL)**, actual request rate is ~1 req/min per unique subreddit — well within budget
- The OAuth token is stored server-side only; users never see it

### Step 0 — Register Reddit App

1. Go to `https://www.reddit.com/prefs/apps`
2. Create a **"script"** type app
   - Name: `wassup-dashboard`
   - Redirect URI: `http://localhost` (unused for script apps)
3. Note the `client_id` (shown under the app name) and `client_secret`

### Step 1 — Create OAuth Token Service

**New file:** `src/features/reddit/infrastructure/reddit-auth.ts`

```ts
class RedditAuthService {
  private token: string | null;
  private expiresAt: number;
  private refreshPromise: Promise<string | null> | null; // mutex for concurrent callers

  get isConfigured(): boolean
  // true if REDDIT_CLIENT_ID and REDDIT_CLIENT_SECRET are set

  async getAccessToken(): Promise<string | null>
  // If token is valid and not within expiry buffer (5 min), return cached token
  // If a refresh is already in-flight, await the same promise (dedup)
  // Otherwise:
  //   POST https://www.reddit.com/api/v1/access_token
  //   Body: grant_type=client_credentials
  //   Auth: Basic base64(client_id:client_secret)
  //   Cache token in-memory until (expiresAt - 5min buffer)
  //   On failure: log error, return null (caller falls back to unauthenticated)
}

export const redditAuth = new RedditAuthService();
```

Key details:
- Token is cached in-memory (singleton) — no DB or file needed
- Refresh automatically **5 minutes before expiry** to avoid mid-request token expiration
- **Mutex pattern:** If multiple requests trigger a refresh simultaneously, they all await the same in-flight promise — no duplicate token requests
- **Failure resilience:** If token fetch fails (bad credentials, Reddit API down), log the error and return `null` — repository gracefully falls back to unauthenticated endpoint
- If env vars are missing, return `null` to signal fallback

### Step 2 — Update Repository

**File:** `src/features/reddit/infrastructure/repositories/http.reddit-post-repository.ts`

```ts
class HttpRedditPostRepository {
  // Conditional base URL
  private get baseUrl() {
    return redditAuth.isConfigured
      ? "https://oauth.reddit.com/r"
      : "https://www.reddit.com/r";
  }

  async fetchMany(params) {
    // Reddit API requires a descriptive User-Agent with contact info
    // Replace YOUR_REDDIT_USERNAME with your actual Reddit username
    const headers: Record<string, string> = {
      "User-Agent": "wassup-dashboard/1.0 (by /u/YOUR_REDDIT_USERNAME)",
    };

    // Add OAuth token if available
    const token = await redditAuth.getAccessToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(url, { headers });
    // ... rest unchanged
  }
}
```

Fallback behavior:
- **With env vars (VPS):** Uses `oauth.reddit.com` with bearer token
- **Without env vars (local dev):** Falls back to `www.reddit.com` unauthenticated (works from residential IPs)

### Step 3 — Deploy

Add to `wassup.env` on VPS:

```env
REDDIT_CLIENT_ID=xxxx
REDDIT_CLIENT_SECRET=xxxx
```

Redeploy the container.

---

## File Change Summary

| File | Action | Description |
|------|--------|-------------|
| `src/middleware.ts` | Edit | Widen `img-src` to `https:` |
| `src/features/reddit/infrastructure/reddit-auth.ts` | **New** | OAuth token service with in-memory caching |
| `src/features/reddit/infrastructure/repositories/http.reddit-post-repository.ts` | Edit | Use OAuth endpoint + bearer token |
| `wassup.env` (VPS only) | Edit | Add `REDDIT_CLIENT_ID`, `REDDIT_CLIENT_SECRET` |

## Verification

1. **RSS images:** Deploy, open Feeds widget — thumbnails should render
2. **Reddit widget:** Deploy with env vars, open Reddit widget — posts should load
3. **Local dev:** Run without env vars — Reddit should still work via unauthenticated fallback
