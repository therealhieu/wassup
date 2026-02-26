# Lobste.rs Widget — Implementation Plan

## Overview

Add a Lobste.rs widget that displays stories from [lobste.rs](https://lobste.rs), optionally filtered by tag. Uses the public lobste.rs JSON API — no authentication required, no API key, read-only.

The widget is a **first-class sibling of the HN widget**, not a variant of it. The two serve complementary use cases: HN excels at full-text search across a huge corpus; Lobste.rs excels at tag-curated browsing of a higher signal-to-noise community.

### Key Decisions

| Decision | Choice |
| --- | --- |
| API | `lobste.rs` public JSON API (no auth) |
| Sort | `hottest`, `newest`, `active` — maps to `/hottest.json`, `/newest.json`, `/active.json` |
| Tag filter | `/t/{tag}.json` — returns hottest for that tag |
| Story ID | `short_id` (string, e.g. `"abc123"`) not a number |
| Comment link | `comments_url` field provided directly in payload |
| Caching | Server-side LRU (5 min TTL, 20 slots) + client React Query (5 min) |
| Widget type key | `lobsters` |
| UI pattern | Same as HN widget + MUI `<Chip size="small">` row for tags |

### API Endpoint Mapping

| Config | Endpoint |
| --- | --- |
| No tag, `hottest` | `https://lobste.rs/hottest.json` |
| No tag, `newest` | `https://lobste.rs/newest.json` |
| No tag, `active` | `https://lobste.rs/active.json` |
| With tag (any sort) | `https://lobste.rs/t/{tag}.json` |

> **Note**: The tag endpoint always returns hottest for that tag regardless of `sort`. This is a lobste.rs API limitation — document it in the config schema help text.

### Architecture

```
User config { sort: "hottest", tag: "rust", limit: 10 }
    → LobstersWidget (useQuery)
    → fetchLobstersWidgetProps (server action, LRU cached 5min)
    → HttpLobstersStoryRepository.fetchMany()
        → tag present?
            YES → GET https://lobste.rs/t/{tag}.json → slice to limit
            NO  → GET https://lobste.rs/{sort}.json  → slice to limit
    → Zod parse → cache → return to client
    → LobstersWidgetInner renders card list with tag chips
```

### Execution Order

```
Phase 1 (Domain) → Phase 2 (Infrastructure) → Phase 3 (Service) → Phase 4 (Presentation) → Phase 5 (Integration)
```

No Storybook stories or integration tests are in scope for the initial implementation.

---

## Phase 1: Domain Layer

**Goal**: Define the story entity and repository interface.

### Task 1.1 — Story entity

**File**: `src/features/lobsters/domain/entities/story.ts` (new)

```typescript
import { z } from "zod";

export const LobstersStorySchema = z.object({
    short_id: z.string(),
    title: z.string(),
    url: z.string(),
    score: z.number(),
    submitter_user: z.string(),
    created_at: z.string(),       // ISO 8601 string
    comment_count: z.number(),
    comments_url: z.string(),
    tags: z.array(z.string()),
});

export type LobstersStory = z.infer<typeof LobstersStorySchema>;

export const LobstersStoryListSchema = z.array(LobstersStorySchema);
export type LobstersStoryList = z.infer<typeof LobstersStoryListSchema>;
```

Notes:
- `url` can be empty for self/ask posts — the DTO mapper falls back to `comments_url`
- `comments_url` is provided directly — no need to construct it
- `submitter_user` is a plain string (not an object) in list endpoints
- `created_at` is ISO string, not unix timestamp — parse with `new Date()`

### Task 1.2 — Repository interface

**File**: `src/features/lobsters/domain/repositories/story.ts` (new)

```typescript
import { LobstersStory } from "../entities/story";
import { LobstersWidgetConfig } from "../../infrastructure/config.schemas";

export type FetchLobstersStoryParams = Pick<
    LobstersWidgetConfig,
    "sort" | "tag" | "limit"
>;

export interface LobstersStoryRepository {
    fetchMany(params: FetchLobstersStoryParams): Promise<LobstersStory[]>;
}
```

### ✅ Phase 1 Checkpoint

- Both files compile with no type errors

---

## Phase 2: Infrastructure Layer

**Goal**: Config schema, HTTP DTO, and the repository implementation.

### Task 2.1 — Config schema

**File**: `src/features/lobsters/infrastructure/config.schemas.ts` (new)

```typescript
import { z } from "zod";

export const LobstersWidgetConfigSchema = z.object({
    type: z.literal("lobsters"),
    sort: z.enum(["hottest", "newest", "active"]).default("hottest"),
    tag: z.string().optional(),
    limit: z.number().int().positive().max(25).default(10),
    hideTitle: z.boolean().default(false),
});

export type LobstersWidgetConfig = z.infer<typeof LobstersWidgetConfigSchema>;
```

Config examples:

```json
// Hottest stories across all tags
{ "type": "lobsters", "sort": "hottest", "limit": 10 }

// Newest Rust stories
{ "type": "lobsters", "tag": "rust", "limit": 10 }

// In a tabs widget (hideTitle: true)
{ "type": "lobsters", "tag": "programming", "limit": 5, "hideTitle": true }
```

### Task 2.2 — HTTP DTO

**File**: `src/features/lobsters/infrastructure/repositories/http.dtos.ts` (new)

The lobste.rs API returns rich objects. We only map fields we display.

```typescript
import { z } from "zod";
import { LobstersStory, LobstersStorySchema } from "../../domain/entities/story";

export const LobstersApiItemSchema = z
    .object({
        short_id: z.string(),
        title: z.string(),
        url: z.string().default(""),
        score: z.number(),
        submitter_user: z.string(),
        created_at: z.string(),
        comment_count: z.number(),
        comments_url: z.string(),
        tags: z.array(z.string()),
    })
    .passthrough();

export type LobstersApiItem = z.infer<typeof LobstersApiItemSchema>;

export const LobstersApiResponseSchema = z.array(LobstersApiItemSchema);

export function mapApiItemToStory(item: LobstersApiItem): LobstersStory {
    return LobstersStorySchema.parse({
        short_id: item.short_id,
        title: item.title,
        url: item.url || item.comments_url,
        score: item.score,
        submitter_user: item.submitter_user,
        created_at: item.created_at,
        comment_count: item.comment_count,
        comments_url: item.comments_url,
        tags: item.tags,
    });
}
```

### Task 2.3 — Repository implementation

**File**: `src/features/lobsters/infrastructure/repositories/http.lobsters-story-repository.ts` (new)

```typescript
import { LobstersStory } from "../../domain/entities/story";
import {
    FetchLobstersStoryParams,
    LobstersStoryRepository,
} from "../../domain/repositories/story";
import { LobstersApiResponseSchema, mapApiItemToStory } from "./http.dtos";

const BASE = "https://lobste.rs";

export class HttpLobstersStoryRepository implements LobstersStoryRepository {
    public async fetchMany(
        params: FetchLobstersStoryParams
    ): Promise<LobstersStory[]> {
        const url = params.tag
            ? `${BASE}/t/${encodeURIComponent(params.tag)}.json`
            : `${BASE}/${params.sort}.json`;

        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(
                `Lobste.rs fetch failed: ${response.status} ${response.statusText}`
            );
        }

        const json = await response.json();
        const items = LobstersApiResponseSchema.parse(json);
        return items.slice(0, params.limit).map(mapApiItemToStory);
    }
}
```

### ✅ Phase 2 Checkpoint

- Config schema compiles
- Repository compiles with no type errors
- `LobstersApiResponseSchema.parse()` correctly parses a real lobste.rs response

---

## Phase 3: Service Layer

**Goal**: Server action with LRU caching and metrics — identical pattern to `hackernews.actions.ts`.

### Task 3.1 — Server action

**File**: `src/features/lobsters/services/lobsters.actions.ts` (new)

```typescript
"use server";

import { LobstersWidgetConfig } from "../infrastructure/config.schemas";
import {
    LobstersWidgetInnerProps,
    LobstersWidgetInnerPropsSchema,
} from "../presentation/LobstersWidgetInner";
import { HttpLobstersStoryRepository } from "../infrastructure/repositories/http.lobsters-story-repository";
import { LRUCache } from "lru-cache";
import { serverActionDuration, cacheHits, cacheMisses } from "@/lib/metrics";

const repository = new HttpLobstersStoryRepository();

const dataCache = new LRUCache<string, LobstersWidgetInnerProps>({
    max: 20,
    ttl: 1000 * 60 * 5, // 5 minutes
});

export async function fetchLobstersWidgetProps(
    config: LobstersWidgetConfig
): Promise<LobstersWidgetInnerProps> {
    const end = serverActionDuration.startTimer({ action: "lobsters" });
    try {
        const key = JSON.stringify(config);
        const cached = dataCache.get(key);
        if (cached) {
            cacheHits.inc({ cache: "lobsters" });
            end({ status: "hit" });
            return cached;
        }
        cacheMisses.inc({ cache: "lobsters" });

        const stories = await repository.fetchMany(config);
        const data = LobstersWidgetInnerPropsSchema.parse({ config, stories });
        dataCache.set(key, data);
        end({ status: "success" });
        return data;
    } catch (e) {
        end({ status: "error" });
        throw e;
    }
}
```

### ✅ Phase 3 Checkpoint

- Server action compiles
- Pattern is identical to `hackernews.actions.ts`

---

## Phase 4: Presentation Layer

**Goal**: Container, pure render, and skeleton components.

### Task 4.1 — Inner component (pure render)

**File**: `src/features/lobsters/presentation/LobstersWidgetInner.tsx` (new)

Key differences from HN inner:
- Tags rendered as MUI `<Chip size="small">` row below meta line
- `created_at` is ISO string — use `new Date(created_at)` for time calculation
- Comment link is `comments_url` (direct), story link is `url`

```typescript
import { memo } from "react";
import { z } from "zod";
import { LobstersWidgetConfigSchema } from "../infrastructure/config.schemas";
import { LobstersStoryListSchema } from "../domain/entities/story";
import {
    Card, CardContent, Typography, Divider, Link, Chip, Box,
} from "@mui/material";

export const LobstersWidgetInnerPropsSchema = z.object({
    config: LobstersWidgetConfigSchema,
    stories: LobstersStoryListSchema,
});

export type LobstersWidgetInnerProps = z.infer<
    typeof LobstersWidgetInnerPropsSchema
>;

function timeAgo(isoString: string): string {
    const seconds = Math.floor(
        (Date.now() - new Date(isoString).getTime()) / 1000
    );
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
}

export const LobstersWidgetInner = memo(
    function LobstersWidgetInner({ config, stories }: LobstersWidgetInnerProps) {
        return (
            <Card>
                {!config.hideTitle && (
                    <Typography variant="h6" sx={{ px: 1, pt: 1 }}>
                        Lobste.rs
                    </Typography>
                )}
                {stories.map((story) => (
                    <div key={story.short_id}>
                        <Link
                            href={story.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            underline="none"
                            color="inherit"
                        >
                            <CardContent
                                sx={{
                                    paddingLeft: 1,
                                    paddingTop: 1,
                                    paddingBottom: 1,
                                    cursor: "pointer",
                                    "&:hover": {
                                        backgroundColor: "rgba(0, 0, 0, 0.04)",
                                    },
                                }}
                            >
                                <Typography
                                    variant="subtitle1"
                                    sx={{ color: "text.primary", fontWeight: 500 }}
                                >
                                    {story.title}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    {story.score} points • by {story.submitter_user} •{" "}
                                    {timeAgo(story.created_at)} •{" "}
                                    {story.comment_count} comments
                                </Typography>
                                {story.tags.length > 0 && (
                                    <Box sx={{ mt: 0.5, display: "flex", gap: 0.5, flexWrap: "wrap" }}>
                                        {story.tags.map((tag) => (
                                            <Chip
                                                key={tag}
                                                label={tag}
                                                size="small"
                                                variant="outlined"
                                                sx={{ height: 18, fontSize: "0.65rem" }}
                                            />
                                        ))}
                                    </Box>
                                )}
                            </CardContent>
                        </Link>
                        <Divider />
                    </div>
                ))}
            </Card>
        );
    }
);
```

### Task 4.2 — Skeleton component

**File**: `src/features/lobsters/presentation/LobstersWidgetSkeleton.tsx` (new)

Identical structure to `HackerNewsWidgetSkeleton` — add a third skeleton line per row to simulate the tag chips row.

```typescript
import { Box, Card, CardContent, Skeleton, Stack } from "@mui/material";

export const LobstersWidgetSkeleton = () => (
    <Card>
        <CardContent>
            <Stack spacing={2}>
                {Array(3).fill(0).map((_, i) => (
                    <Box key={i}>
                        <Skeleton variant="text" width="90%" />
                        <Skeleton variant="text" width="60%" />
                        <Skeleton variant="text" width="30%" height={18} />
                    </Box>
                ))}
            </Stack>
        </CardContent>
    </Card>
);
```

### Task 4.3 — Container component

**File**: `src/features/lobsters/presentation/LobstersWidget.tsx` (new)

```typescript
import { useQuery } from "@tanstack/react-query";
import { LobstersWidgetConfig } from "../infrastructure/config.schemas";
import { fetchLobstersWidgetProps } from "../services/lobsters.actions";
import { LobstersWidgetInner } from "./LobstersWidgetInner";
import { LobstersWidgetSkeleton } from "./LobstersWidgetSkeleton";
import { ErrorWidget } from "@/components/ErrorWidget";

export interface LobstersWidgetProps {
    config: LobstersWidgetConfig;
}

export const LobstersWidget = ({ config }: LobstersWidgetProps) => {
    const { data: props, isLoading, error } = useQuery({
        queryKey: ["lobsters", config.sort, config.tag, config.limit],
        queryFn: () => fetchLobstersWidgetProps(config),
        staleTime: 1000 * 60 * 5,
    });

    if (isLoading || !props) return <LobstersWidgetSkeleton />;
    if (error) return <ErrorWidget error={error} />;

    return <LobstersWidgetInner {...props} />;
};
```

### ✅ Phase 4 Checkpoint

- All three components compile
- Container follows exact same pattern as `HackerNewsWidget.tsx`

---

## Phase 5: Integration

**Goal**: Wire the new widget into config schema, widget dispatcher, and widget registry.

### Task 5.1 — Add to global config schema

**File**: `src/infrastructure/config.schemas.ts` (modify)

Add import:
```typescript
import {
    LobstersWidgetConfig,
    LobstersWidgetConfigSchema,
} from "@/features/lobsters/infrastructure/config.schemas";
```

Add to `WidgetConfigSchema` union:
```typescript
export const WidgetConfigSchema = z.lazy(() =>
    z.union([
        // ... existing entries ...
        LobstersWidgetConfigSchema,   // ← ADD
    ])
);
```

Add to `WidgetConfig` type union:
```typescript
export type WidgetConfig =
    | WeatherWidgetConfig
    // ... existing types ...
    | HackerNewsWidgetConfig
    | LobstersWidgetConfig;           // ← ADD
```

### Task 5.2 — Add to widget dispatcher

**File**: `src/components/Widget.tsx` (modify)

Add import:
```typescript
import { LobstersWidget } from "@/features/lobsters/presentation/LobstersWidget";
```

Add case:
```typescript
case "lobsters":
    return <LobstersWidget config={widgetConfig} />;
```

### Task 5.3 — Add to widget registry

**File**: `src/lib/widget-registry.ts` (modify)

Add import:
```typescript
import { LobstersWidgetConfigSchema } from "@/features/lobsters/infrastructure/config.schemas";
```

Add `getWidgetSummary` case:
```typescript
case "lobsters":
    return config.tag ?? `${config.sort} stories`;
```

Add registry entry:
```typescript
lobsters: {
    type: "lobsters",
    label: "Lobste.rs",
    schema: LobstersWidgetConfigSchema,
    fields: [
        {
            name: "sort",
            label: "Sort",
            type: "select",
            options: ["hottest", "newest", "active"],
            defaultValue: "hottest",
        },
        {
            name: "tag",
            label: "Tag",
            type: "text",
            placeholder: "rust",
            helpText: "Optional. Filter by tag. When set, sort is ignored (lobste.rs limitation).",
        },
        {
            name: "limit",
            label: "Limit",
            type: "number",
            min: 1,
            max: 25,
            defaultValue: 10,
        },
        {
            name: "hideTitle",
            label: "Hide Title",
            type: "boolean",
            defaultValue: false,
        },
    ],
},
```

### Task 5.4 — CSP update

**File**: `next.config.ts` (modify)

Add `https://lobste.rs` to `connect-src` directive:

```typescript
"connect-src": [
    // ... existing entries ...
    "https://lobste.rs",
],
```

### ✅ Phase 5 Checkpoint

- `bun run build` succeeds with no type errors
- `lobsters` widget appears in the visual editor's widget type selector
- A `{ type: "lobsters", sort: "hottest", limit: 10 }` config renders stories correctly
- Tag chips appear and link correctly

---

## Files Changed Summary

| File | Action |
| --- | --- |
| `src/features/lobsters/domain/entities/story.ts` | Create |
| `src/features/lobsters/domain/repositories/story.ts` | Create |
| `src/features/lobsters/infrastructure/config.schemas.ts` | Create |
| `src/features/lobsters/infrastructure/repositories/http.dtos.ts` | Create |
| `src/features/lobsters/infrastructure/repositories/http.lobsters-story-repository.ts` | Create |
| `src/features/lobsters/services/lobsters.actions.ts` | Create |
| `src/features/lobsters/presentation/LobstersWidgetInner.tsx` | Create |
| `src/features/lobsters/presentation/LobstersWidgetSkeleton.tsx` | Create |
| `src/features/lobsters/presentation/LobstersWidget.tsx` | Create |
| `src/infrastructure/config.schemas.ts` | Modify — add to union |
| `src/components/Widget.tsx` | Modify — add switch case |
| `src/lib/widget-registry.ts` | Modify — add entry + summary |
| `next.config.ts` | Modify — add CSP `connect-src` |

**Total: 9 new files, 4 file modifications.**
