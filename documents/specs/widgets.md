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
