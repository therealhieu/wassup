# Wassup — Widget Reference

All widgets are specified under `columns[].widgets[]` in the config. Every widget must have a `type` field.

---

## `weather`

Displays a multi-day weather forecast.

**Data source:** OpenMeteo (free, no key) + Geonames geocoding.

```yaml
- type: weather
  location: Ho Chi Minh City
  forecastDays: 5
  temperatureUnit: C
```

| Field | Type | Default | Notes |
|-------|------|---------|-------|
| `location` | string | *required* | Geocoded city name |
| `forecastDays` | number | `5` | Days ahead (1–14) |
| `temperatureUnit` | `"C"` \| `"F"` | `"C"` | |

---

## `reddit`

Displays posts from a subreddit.

**Data source:** Reddit public JSON API.

```yaml
- type: reddit
  subreddit: compsci
  sort: new
  limit: 5
  hideTitle: true
```

| Field | Type | Default | Notes |
|-------|------|---------|-------|
| `subreddit` | string | *required* | No `r/` prefix |
| `sort` | `"hot"` \| `"new"` \| `"top"` \| `"rising"` | *required* | |
| `limit` | number | `5` | Max 20 |
| `hideTitle` | boolean | `false` | Useful inside tabs |

---

## `youtube`

Displays recent videos from YouTube channels in a grid.

**Data source:** YouTube RSS feed. Handles (`@username`) are resolved to channel IDs.

```yaml
- type: youtube
  channels:
    - "@Fireship"
    - UCsXVk37bltHxD1rDPwtNM8Q
  limit: 16
  scrollAfterRow: 3
  showTitle: true
```

| Field | Type | Default | Notes |
|-------|------|---------|-------|
| `channels` | string[] | *required* | `@handle` or `UC...` channel ID. Min 1 |
| `limit` | number | `16` | 1–50 |
| `scrollAfterRow` | number | `3` | Rows before scroll |
| `showTitle` | boolean | `true` | |

---

## `feed`

Aggregates posts from multiple RSS/Atom feeds with round-robin balancing.

```yaml
- type: feed
  urls:
    - https://blog.cloudflare.com/rss/
    - https://eng.uber.com/rss/
  limit: 15
  scrollAfterRow: 6
```

| Field | Type | Default | Notes |
|-------|------|---------|-------|
| `urls` | string[] | *required* | Valid URL format |
| `limit` | number | `15` | Total across all feeds |
| `showTitle` | boolean | `true` | |
| `scrollAfterRow` | number | `6` | |

Thumbnails are fetched via OG image scraping (LRU cached, 1h TTL).

---

## `github`

Displays trending GitHub repositories filtered by language, topics, and date range.

**Data source:** GitHub Search API (public, no key required).

```yaml
- type: github
  language: typescript
  topics:
    - llm
    - ai-agents
  dateRange: 90d
  createdAfter: "2024-01-01"
  limit: 25
  minStars: 100
  sort:
    field: velocity
    direction: desc
```

| Field | Type | Default | Notes |
|-------|------|---------|-------|
| `language` | string | — | Optional language filter |
| `topics` | string[] | — | Optional topic filters |
| `createdAfter` | string | `"2024-01-01"` | ISO date string |
| `createdBefore` | string | — | Optional upper bound |
| `dateRange` | `"7d"` \| `"30d"` \| `"90d"` | `"90d"` | Lookback window |
| `limit` | number | `25` | 1–50 |
| `minStars` | number | — | Minimum star count |
| `maxStars` | number | — | Maximum star count |
| `sort.field` | `"stars"` \| `"velocity"` \| `"forks"` \| `"createdAt"` | `"velocity"` | |
| `sort.direction` | `"asc"` \| `"desc"` | `"desc"` | |

---

## `bookmark`

Static hierarchical bookmark list. No network requests.

```yaml
- type: bookmark
  title: Bookmarks
  bookmarks:
    - https://example.com
    - title: GitHub
      url: https://github.com
  groups:
    - title: DSA
      bookmarks:
        - https://neetcode.io
      groups: []             # Recursive nesting supported
```

| Field | Type | Default | Notes |
|-------|------|---------|-------|
| `title` | string | *required* | |
| `bookmarks` | `string[] \| {title, url}[]` | `[]` | Simple URLs or labeled |
| `groups` | BookmarkGroup[] | `[]` | Recursive structure |

---

## `tabs`

Container widget that renders other widgets in a tab switcher.

```yaml
- type: tabs
  labels:
    - r/compsci
    - r/rust
  tabs:
    - type: reddit
      subreddit: compsci
      sort: new
    - type: reddit
      subreddit: rust
      sort: new
```

| Field | Type | Default | Notes |
|-------|------|---------|-------|
| `labels` | string[] | *required* | Tab header text |
| `tabs` | widget[] | *required* | Must match `labels` length |

> **Note:** When `multisourcenews` widgets are children of a `tabs` widget, their source selection (🔥 / 🦞 / DEV) is **shared across all topic tabs**. This is implemented via React Context (`MultiSourceNewsProvider`) scoped to the `tabs` container.

---

## `hackernews`

Displays stories from Hacker News, optionally filtered by topic.

**Data source:** Firebase HN API (global feeds) + Algolia HN Search API (topic search). Both free, no key required.

```yaml
- type: hackernews
  sort: top
  limit: 15
  query: "rust OR llm"
  hideTitle: false
```

| Field | Type | Default | Notes |
|-------|------|---------|-------|
| `sort` | `"top"` \| `"best"` \| `"new"` \| `"ask"` \| `"show"` | `"top"` | Feed type |
| `query` | string | — | Optional topic filter (supports AND/OR) |
| `limit` | number | `10` | Max 30 |
| `hideTitle` | boolean | `false` | Useful inside tabs |

When `query` is absent, fetches from Firebase global feeds. When present, uses Algolia full-text search.

---

## `lobsters`

Displays stories from [Lobste.rs](https://lobste.rs), optionally filtered by tag.

**Data source:** Lobste.rs public JSON API. No key required.

```yaml
- type: lobsters
  sort: hottest
  tag: programming
  limit: 10
  hideTitle: false
```

| Field | Type | Default | Notes |
|-------|------|---------|-------|
| `sort` | `"hottest"` \| `"newest"` \| `"active"` | `"hottest"` | Feed type |
| `tag` | string | — | Optional tag filter (e.g. `"programming"`, `"rust"`) |
| `limit` | number | `10` | Max 25 |
| `hideTitle` | boolean | `false` | Useful inside tabs |

---

## `devto`

Displays articles from [DEV Community](https://dev.to), optionally filtered by tags.

**Data source:** DEV.to public API. No key required.

```yaml
- type: devto
  tags:
    - javascript
    - webdev
  top: "7"
  limit: 10
  hideTitle: false
```

| Field | Type | Default | Notes |
|-------|------|---------|-------|
| `tags` | string[] | — | Optional tag filters; multiple tags are OR-combined |
| `top` | `"1"` \| `"7"` \| `"30"` \| `"365"` | `"7"` | Articles from the top N days |
| `limit` | number | `10` | Max 30 |
| `hideTitle` | boolean | `false` | Useful inside tabs |

---

## `multisourcenews`

A unified news widget that aggregates Hacker News, Lobste.rs, and optionally DEV Community into a single view with a source toggle (🔥 / 🦞 / DEV) in the bottom-right corner.

When used inside a `tabs` widget, the source selection is **global across all topic tabs** — switching from PROGRAMMING to SYSTEM DESIGN applies the same source to that tab too.

**Data sources:** Same as `hackernews`, `lobsters`, and `devto` respectively.

```yaml
- type: multisourcenews
  scrollAfterRow: 6
  hackernews:
    type: hackernews
    sort: top
    query: "rust OR systems"
    limit: 15
    hideTitle: true
  lobsters:
    type: lobsters
    sort: hottest
    tag: programming
    limit: 15
    hideTitle: true
  devto:                   # Optional; omit to hide the DEV toggle
    type: devto
    tags:
      - webdev
    top: "7"
    limit: 15
    hideTitle: true
```

| Field | Type | Default | Notes |
|-------|------|---------|-------|
| `hackernews` | HackerNews config | *required* | Embedded HN widget config (without `hideTitle` override needed) |
| `lobsters` | Lobsters config | *required* | Embedded Lobsters widget config |
| `devto` | DEV config | — | Optional; when absent the DEV toggle button is hidden |
| `scrollAfterRow` | number | — | Enables vertical scrolling after N rows |

