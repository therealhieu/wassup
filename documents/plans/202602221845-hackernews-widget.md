# Hacker News Widget — Implementation Plan

## Overview

Add a Hacker News widget that displays stories from the HN front page or filtered by user-defined topics. Uses a dual-source architecture: **Firebase API** for global feeds (no query) and **Algolia HN Search API** for topic-filtered feeds (with query). Both APIs are free, require no API key, and have no documented rate limits.

### Decisions

| Decision            | Choice                                                    |
| ------------------- | --------------------------------------------------------- |
| Global feeds API    | Firebase HN API (`hacker-news.firebaseio.com/v0`)         |
| Topic search API    | Algolia HN Search API (`hn.algolia.com/api/v1`)           |
| Auth required       | Neither — both are public, read-only                      |
| Caching             | Server-side LRU (5 min TTL) + client React Query (5 min)  |
| Widget type key     | `hackernews`                                              |
| UI pattern          | Same as Reddit widget — MUI Card with list items          |

### Architecture

```
User config { sort: "top", query: "rust", limit: 10 }
    → HackerNewsWidget (useQuery)
    → fetchHackerNewsWidgetProps (server action, LRU cached 5min)
    → HttpHackerNewsStoryRepository.fetchMany()
        → query present?
            YES → Algolia: GET /search?query=rust&tags=story&hitsPerPage=10
                  → single HTTP call → parse hits → map to domain
            NO  → Firebase: GET /topstories.json → slice(0, limit)
                  → Promise.all item fetches → map to domain
    → Zod parse → cache → return to client
    → HackerNewsWidgetInner renders card list
```

### Execution Order

```
Phase 1 (Domain) → Phase 2 (Infrastructure) → Phase 3 (Service) → Phase 4 (Presentation) → Phase 5 (Integration) → Phase 6 (Stories & Tests) → Phase 7 (Docs) → Phase 8 (Verify)
```

---

## Phase 1: Domain Layer

**Goal**: Define the story entity and repository interface.

### Task 1.1 — Story entity

**File**: `src/features/hackernews/domain/entities/story.ts` (new)

```typescript
import { z } from "zod";

export const HackerNewsStorySchema = z.object({
	id: z.number(),
	title: z.string(),
	url: z.string().optional(),
	score: z.number(),
	by: z.string(),
	time: z.number(),
	descendants: z.number().default(0),
});

export type HackerNewsStory = z.infer<typeof HackerNewsStorySchema>;

export const HackerNewsStoryListSchema = z.array(HackerNewsStorySchema);
export type HackerNewsStoryList = z.infer<typeof HackerNewsStoryListSchema>;
```

Notes:
- `url` is optional because Ask HN / polls have no external URL
- `descendants` is the comment count (HN API naming)
- No `type` field needed — we only fetch stories, not comments or polls

### Task 1.2 — Repository interface

**File**: `src/features/hackernews/domain/repositories/story.ts` (new)

```typescript
import { z } from "zod";
import { HackerNewsStory } from "../entities/story";
import { HackerNewsWidgetConfigSchema } from "../../infrastructure/config.schemas";

export const FetchStoryParamsSchema = HackerNewsWidgetConfigSchema;
export type FetchStoryParams = z.infer<typeof FetchStoryParamsSchema>;

export interface HackerNewsStoryRepository {
	fetchMany(params: FetchStoryParams): Promise<HackerNewsStory[]>;
}
```

### ✅ Phase 1 Checkpoint

- Both files compile with no type errors
- No tests needed — pure type definitions

---

## Phase 2: Infrastructure Layer

**Goal**: Config schema, DTOs for both APIs, and the dual-source repository implementation.

### Task 2.1 — Config schema

**File**: `src/features/hackernews/infrastructure/config.schemas.ts` (new)

```typescript
import { z } from "zod";

export const HackerNewsWidgetConfigSchema = z.object({
	type: z.literal("hackernews"),
	sort: z.enum(["top", "best", "new", "ask", "show"]).default("top"),
	limit: z.number().int().positive().max(30).default(10),
	query: z.string().optional(),
	hideTitle: z.boolean().default(false),
});

export type HackerNewsWidgetConfig = z.infer<typeof HackerNewsWidgetConfigSchema>;
```

Config YAML examples:

```yaml
# Global feed (Firebase API)
- type: hackernews
  sort: top
  limit: 15

# Topic-filtered feed (Algolia API)
- type: hackernews
  sort: top
  limit: 15
  query: "rust OR llm OR distributed systems"

# Ask HN only
- type: hackernews
  sort: ask
  limit: 10
```

### Task 2.2 — DTOs

**File**: `src/features/hackernews/infrastructure/repositories/http.dtos.ts` (new)

```typescript
import { z } from "zod";
import { HackerNewsStory, HackerNewsStorySchema } from "../../domain/entities/story";

// ── Firebase /item/{id}.json ────────────────────────────────────────

export const FirebaseItemDtoSchema = z
	.object({
		id: z.number(),
		title: z.string().optional(),
		url: z.string().optional(),
		score: z.number().optional(),
		by: z.string().optional(),
		time: z.number().optional(),
		descendants: z.number().optional(),
		type: z.string().optional(),
	})
	.passthrough();

export type FirebaseItemDto = z.infer<typeof FirebaseItemDtoSchema>;

export function mapFirebaseItemToStory(item: FirebaseItemDto): HackerNewsStory {
	return HackerNewsStorySchema.parse({
		id: item.id,
		title: item.title ?? "",
		url: item.url,
		score: item.score ?? 0,
		by: item.by ?? "",
		time: item.time ?? 0,
		descendants: item.descendants ?? 0,
	});
}

// ── Algolia /search response ────────────────────────────────────────

export const AlgoliaHitDtoSchema = z.object({
	objectID: z.string(),
	title: z.string(),
	url: z.string().nullable().optional(),
	points: z.number().nullable(),
	author: z.string(),
	created_at_i: z.number(),
	num_comments: z.number().nullable(),
});

export type AlgoliaHitDto = z.infer<typeof AlgoliaHitDtoSchema>;

export const AlgoliaSearchResponseSchema = z.object({
	hits: z.array(AlgoliaHitDtoSchema),
});

export type AlgoliaSearchResponse = z.infer<typeof AlgoliaSearchResponseSchema>;

export function mapAlgoliaHitToStory(hit: AlgoliaHitDto): HackerNewsStory {
	return HackerNewsStorySchema.parse({
		id: Number(hit.objectID),
		title: hit.title,
		url: hit.url ?? undefined,
		score: hit.points ?? 0,
		by: hit.author,
		time: hit.created_at_i,
		descendants: hit.num_comments ?? 0,
	});
}
```

### Task 2.3 — Repository implementation

**File**: `src/features/hackernews/infrastructure/repositories/http.hackernews-story-repository.ts` (new)

```typescript
import { HackerNewsStory } from "../../domain/entities/story";
import {
	FetchStoryParams,
	HackerNewsStoryRepository,
} from "../../domain/repositories/story";
import {
	AlgoliaSearchResponseSchema,
	FirebaseItemDtoSchema,
	mapAlgoliaHitToStory,
	mapFirebaseItemToStory,
} from "./http.dtos";

const FIREBASE_SORT_ENDPOINTS: Record<string, string> = {
	top: "/topstories.json",
	best: "/beststories.json",
	new: "/newstories.json",
	ask: "/askstories.json",
	show: "/showstories.json",
};

const ALGOLIA_SORT_TAGS: Record<string, string> = {
	top: "story",
	best: "story",
	new: "story",
	ask: "ask_hn",
	show: "show_hn",
};

export class HttpHackerNewsStoryRepository implements HackerNewsStoryRepository {
	private readonly FIREBASE_BASE = "https://hacker-news.firebaseio.com/v0";
	private readonly ALGOLIA_BASE = "https://hn.algolia.com/api/v1";

	public async fetchMany(params: FetchStoryParams): Promise<HackerNewsStory[]> {
		if (params.query) {
			return this.fetchFromAlgolia(params);
		}
		return this.fetchFromFirebase(params);
	}

	private async fetchFromAlgolia(params: FetchStoryParams): Promise<HackerNewsStory[]> {
		const endpoint = params.sort === "new" ? "search_by_date" : "search";
		const tag = ALGOLIA_SORT_TAGS[params.sort] ?? "story";
		const url =
			`${this.ALGOLIA_BASE}/${endpoint}?` +
			`query=${encodeURIComponent(params.query!)}&tags=${tag}&hitsPerPage=${params.limit}`;

		const response = await fetch(url);
		if (!response.ok) {
			throw new Error(
				`Algolia HN search failed: ${response.status} ${response.statusText}`
			);
		}

		const json = await response.json();
		const parsed = AlgoliaSearchResponseSchema.parse(json);
		return parsed.hits.map(mapAlgoliaHitToStory);
	}

	private async fetchFromFirebase(params: FetchStoryParams): Promise<HackerNewsStory[]> {
		const endpoint =
			FIREBASE_SORT_ENDPOINTS[params.sort] ?? FIREBASE_SORT_ENDPOINTS.top;

		const idsResponse = await fetch(`${this.FIREBASE_BASE}${endpoint}`);
		if (!idsResponse.ok) {
			throw new Error(
				`Firebase HN fetch failed: ${idsResponse.status} ${idsResponse.statusText}`
			);
		}

		const ids: number[] = await idsResponse.json();
		const sliced = ids.slice(0, params.limit);

		const items = await Promise.all(
			sliced.map((id) =>
				fetch(`${this.FIREBASE_BASE}/item/${id}.json`).then((r) => r.json())
			)
		);

		return items
			.filter(Boolean)
			.map((item) => mapFirebaseItemToStory(FirebaseItemDtoSchema.parse(item)));
	}
}
```

API endpoint mapping reference:

| Config `sort` | No query (Firebase)    | With query (Algolia)                          |
| ------------- | ---------------------- | --------------------------------------------- |
| `top`         | `/topstories.json`     | `/search?tags=story` (relevance + points)     |
| `best`        | `/beststories.json`    | `/search?tags=story` (same)                   |
| `new`         | `/newstories.json`     | `/search_by_date?tags=story` (chronological)  |
| `ask`         | `/askstories.json`     | `/search?tags=ask_hn`                         |
| `show`        | `/showstories.json`    | `/search?tags=show_hn`                        |

### ✅ Phase 2 Checkpoint

- Config schema compiles
- DTOs parse real API responses
- Repository compiles with no type errors

---

## Phase 3: Service Layer

**Goal**: Server action with LRU caching.

### Task 3.1 — Server action

**File**: `src/features/hackernews/services/hackernews.actions.ts` (new)

```typescript
"use server";

import { HackerNewsWidgetConfig } from "../infrastructure/config.schemas";
import {
	HackerNewsWidgetInnerProps,
	HackerNewsWidgetInnerPropsSchema,
} from "../presentation/HackerNewsWidgetInner";
import { HttpHackerNewsStoryRepository } from "../infrastructure/repositories/http.hackernews-story-repository";
import { LRUCache } from "lru-cache";

const repository = new HttpHackerNewsStoryRepository();

const dataCache = new LRUCache<string, HackerNewsWidgetInnerProps>({
	max: 20,
	ttl: 1000 * 60 * 5, // 5 minutes
});

export async function fetchHackerNewsWidgetProps(
	config: HackerNewsWidgetConfig
): Promise<HackerNewsWidgetInnerProps> {
	const key = JSON.stringify(config);
	const cached = dataCache.get(key);
	if (cached) return cached;

	const stories = await repository.fetchMany(config);
	const data = HackerNewsWidgetInnerPropsSchema.parse({ config, stories });
	dataCache.set(key, data);
	return data;
}
```

### ✅ Phase 3 Checkpoint

- Server action compiles
- Matches the exact pattern of `reddit.actions.ts`

---

## Phase 4: Presentation Layer

**Goal**: Container, pure render, and skeleton components.

### Task 4.1 — Inner component (pure render)

**File**: `src/features/hackernews/presentation/HackerNewsWidgetInner.tsx` (new)

```tsx
import { memo } from "react";
import { z } from "zod";
import { HackerNewsWidgetConfigSchema } from "../infrastructure/config.schemas";
import { HackerNewsStoryListSchema } from "../domain/entities/story";
import { CardContent, Typography, Card, Divider, Link } from "@mui/material";

export const HackerNewsWidgetInnerPropsSchema = z.object({
	config: HackerNewsWidgetConfigSchema,
	stories: HackerNewsStoryListSchema,
});

export type HackerNewsWidgetInnerProps = z.infer<
	typeof HackerNewsWidgetInnerPropsSchema
>;

function extractDomain(url: string): string {
	try {
		return new URL(url).hostname.replace("www.", "");
	} catch {
		return "";
	}
}

function timeAgo(unixSeconds: number): string {
	const seconds = Math.floor(Date.now() / 1000 - unixSeconds);
	if (seconds < 60) return `${seconds}s ago`;
	const minutes = Math.floor(seconds / 60);
	if (minutes < 60) return `${minutes}m ago`;
	const hours = Math.floor(minutes / 60);
	if (hours < 24) return `${hours}h ago`;
	const days = Math.floor(hours / 24);
	return `${days}d ago`;
}

export const HackerNewsWidgetInner = memo(
	({ config, stories }: HackerNewsWidgetInnerProps) => {
		return (
			<Card>
				{!config.hideTitle && (
					<Typography variant="h6" sx={{ px: 1, pt: 1 }}>
						Hacker News
					</Typography>
				)}
				{stories.map((story) => (
					<div key={story.id}>
						<Link
							href={
								story.url ??
								`https://news.ycombinator.com/item?id=${story.id}`
							}
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
									sx={{
										color: "text.primary",
										fontWeight: 500,
									}}
								>
									{story.title}
								</Typography>
								<Typography variant="caption" color="text.secondary">
									{story.score} points • by {story.by} •{" "}
									{timeAgo(story.time)} •{" "}
									{story.descendants} comments
									{story.url && ` (${extractDomain(story.url)})`}
								</Typography>
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

**File**: `src/features/hackernews/presentation/HackerNewsWidgetSkeleton.tsx` (new)

```tsx
import React from "react";
import { Box, Card, CardContent, Skeleton, Stack } from "@mui/material";

export const HackerNewsWidgetSkeleton: React.FC = () => {
	return (
		<Card>
			<CardContent>
				<Stack spacing={2}>
					{Array(3)
						.fill(0)
						.map((_, index) => (
							<Box
								key={index}
								sx={{
									display: "flex",
									alignItems: "flex-start",
									gap: 1,
								}}
							>
								<Box sx={{ width: "100%" }}>
									<Skeleton variant="text" width="90%" />
									<Skeleton variant="text" width="60%" />
								</Box>
							</Box>
						))}
				</Stack>
			</CardContent>
		</Card>
	);
};
```

### Task 4.3 — Container component

**File**: `src/features/hackernews/presentation/HackerNewsWidget.tsx` (new)

```tsx
import { useQuery } from "@tanstack/react-query";
import { HackerNewsWidgetConfig } from "../infrastructure/config.schemas";
import { fetchHackerNewsWidgetProps } from "../services/hackernews.actions";
import { HackerNewsWidgetInner } from "./HackerNewsWidgetInner";
import { HackerNewsWidgetSkeleton } from "./HackerNewsWidgetSkeleton";
import { ErrorWidget } from "@/components/ErrorWidget";

export interface HackerNewsWidgetProps {
	config: HackerNewsWidgetConfig;
}

export const HackerNewsWidget = ({ config }: HackerNewsWidgetProps) => {
	const {
		data: props,
		isLoading,
		error,
	} = useQuery({
		queryKey: ["hackernews", config.sort, config.limit, config.query],
		queryFn: () => fetchHackerNewsWidgetProps(config),
		staleTime: 1000 * 60 * 5, // 5 minutes
	});

	if (isLoading || !props) {
		return <HackerNewsWidgetSkeleton />;
	}

	if (error) {
		return <ErrorWidget error={error} />;
	}

	return <HackerNewsWidgetInner {...props} />;
};
```

### ✅ Phase 4 Checkpoint

- All three components compile
- Container follows exact same pattern as `RedditWidget.tsx`
- Inner is a pure render (memo'd) — same as `RedditWidgetInner.tsx`

---

## Phase 5: Integration

**Goal**: Wire the new widget into the existing dispatch, registry, and schema systems.

### Task 5.1 — Add to config schema union

**File**: `src/infrastructure/config.schemas.ts` (modify)

Add import:
```typescript
import {
	HackerNewsWidgetConfig,
	HackerNewsWidgetConfigSchema,
} from "@/features/hackernews/infrastructure/config.schemas";
```

Add to `z.discriminatedUnion`:
```typescript
export const WidgetConfigSchema = z.lazy(() =>
	z.discriminatedUnion("type", [
		WeatherWidgetConfigSchema,
		TabsWidgetConfigSchema,
		RedditWidgetConfigSchema,
		YoutubeWidgetConfigSchema,
		BookmarkWidgetConfigSchema,
		FeedWidgetConfigSchema,
		GithubWidgetConfigSchema,
		HackerNewsWidgetConfigSchema,     // ← ADD
	])
);
```

Add to `WidgetConfig` type:
```typescript
export type WidgetConfig =
	| WeatherWidgetConfig
	| TabsWidgetConfig
	| RedditWidgetConfig
	| YoutubeWidgetConfig
	| BookmarkWidgetConfig
	| FeedWidgetConfig
	| GithubWidgetConfig
	| HackerNewsWidgetConfig;             // ← ADD
```

### Task 5.2 — Add to widget dispatcher

**File**: `src/components/Widget.tsx` (modify)

Add import:
```typescript
import { HackerNewsWidget } from "@/features/hackernews/presentation/HackerNewsWidget";
```

Add case:
```typescript
case "hackernews":
	return <HackerNewsWidget config={widgetConfig} />;
```

### Task 5.3 — Add to widget registry

**File**: `src/lib/widget-registry.ts` (modify)

Add import:
```typescript
import { HackerNewsWidgetConfigSchema } from "@/features/hackernews/infrastructure/config.schemas";
```

Add `getWidgetSummary` case:
```typescript
case "hackernews":
	return config.query ?? `${config.sort} stories`;
```

Add registry entry:
```typescript
hackernews: {
	type: "hackernews",
	label: "Hacker News",
	schema: HackerNewsWidgetConfigSchema,
	fields: [
		{
			name: "sort",
			label: "Sort",
			type: "select",
			options: ["top", "best", "new", "ask", "show"],
			defaultValue: "top",
		},
		{
			name: "query",
			label: "Search Query",
			type: "text",
			placeholder: "rust OR llm OR kubernetes",
			helpText: "Optional. Filter stories by topic (supports AND/OR).",
		},
		{
			name: "limit",
			label: "Limit",
			type: "number",
			min: 1,
			max: 30,
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

### ✅ Phase 5 Checkpoint

- `bun run build` succeeds with no type errors
- Widget appears in the visual editor's "Add Widget" dropdown
- Adding a hackernews widget via config renders correctly

---

## Phase 6: Storybook Stories & Tests

### Task 6.1 — Widget stories

**File**: `src/features/hackernews/presentation/HackerNewsWidget.stories.tsx` (new)

Stories to create:

| Story             | Description                                        |
| ----------------- | -------------------------------------------------- |
| `Default`         | Top stories, 5 items, title visible                |
| `BestStories`     | Sort = best, 10 items                              |
| `WithQuery`       | Query = "rust", showing filtered results           |
| `AskHN`           | Sort = ask, no query                               |
| `HiddenTitle`     | `hideTitle: true`                                  |
| `NoUrl`           | Story without URL (Ask HN post) — link to HN item |
| `Empty`           | Empty stories array                                |

All stories render `HackerNewsWidgetInner` directly with mock data (no API calls).

### Task 6.2 — Skeleton stories

**File**: `src/features/hackernews/presentation/HackerNewsWidgetSkeleton.stories.tsx` (new)

Single story showing the loading skeleton state.

### Task 6.3 — Repository integration test

**File**: `src/features/hackernews/infrastructure/repositories/tests/http.hackernews-story-repository/http.hackernews-story-repository.integration.test.ts` (new)

```typescript
import { describe, it, expect } from "vitest";
import { HttpHackerNewsStoryRepository } from "../../http.hackernews-story-repository";

describe("HttpHackerNewsStoryRepository", () => {
	const repository = new HttpHackerNewsStoryRepository();

	describe("fetchFromFirebase (no query)", () => {
		it("should fetch top stories", async () => {
			const stories = await repository.fetchMany({
				type: "hackernews",
				sort: "top",
				limit: 3,
				hideTitle: false,
			});

			expect(stories.length).toBeGreaterThan(0);
			expect(stories.length).toBeLessThanOrEqual(3);
			expect(stories[0]).toHaveProperty("id");
			expect(stories[0]).toHaveProperty("title");
			expect(stories[0]).toHaveProperty("score");
			expect(stories[0]).toHaveProperty("by");
		});

		it("should fetch ask stories", async () => {
			const stories = await repository.fetchMany({
				type: "hackernews",
				sort: "ask",
				limit: 2,
				hideTitle: false,
			});

			expect(stories.length).toBeGreaterThan(0);
		});
	});

	describe("fetchFromAlgolia (with query)", () => {
		it("should search stories by query", async () => {
			const stories = await repository.fetchMany({
				type: "hackernews",
				sort: "top",
				limit: 5,
				query: "rust programming",
				hideTitle: false,
			});

			expect(stories.length).toBeGreaterThan(0);
			expect(stories.length).toBeLessThanOrEqual(5);
			expect(stories[0]).toHaveProperty("id");
			expect(stories[0]).toHaveProperty("title");
		});

		it("should search Ask HN by query", async () => {
			const stories = await repository.fetchMany({
				type: "hackernews",
				sort: "ask",
				limit: 3,
				query: "career advice",
				hideTitle: false,
			});

			expect(stories.length).toBeGreaterThan(0);
		});

		it("should support boolean OR queries", async () => {
			const stories = await repository.fetchMany({
				type: "hackernews",
				sort: "top",
				limit: 5,
				query: "rust OR golang",
				hideTitle: false,
			});

			expect(stories.length).toBeGreaterThan(0);
		});
	});
});
```

### ✅ Phase 6 Checkpoint

- `bun run storybook` — all HN stories render correctly
- `bun run test:integration` — repository tests pass

---

## Phase 7: Documentation

### Task 7.1 — Update widget specs

**File**: `documents/specs/widgets.md` (modify)

Add section:

```markdown
## `hackernews`

Displays stories from Hacker News, optionally filtered by topic.

**Data source:** Firebase HN API (global feeds) + Algolia HN Search API (topic search). Both free, no key.

\```yaml
- type: hackernews
  sort: top
  limit: 15
  query: "rust OR llm"
  hideTitle: false
\```

| Field       | Type                                         | Default | Notes                                |
|-------------|----------------------------------------------|---------|--------------------------------------|
| `sort`      | `"top"` \| `"best"` \| `"new"` \| `"ask"` \| `"show"` | `"top"` | Feed type                            |
| `query`     | string                                       | —       | Optional topic filter (AND/OR)       |
| `limit`     | number                                       | `10`    | Max 30                               |
| `hideTitle` | boolean                                      | `false` | Useful inside tabs                   |

When `query` is absent, fetches from Firebase global feeds. When present, uses Algolia full-text search.
```

### Task 7.2 — Update README

**File**: `README.md` (modify)

- Update "7 widget types" → "8 widget types"
- Add "Hacker News" to the feature list

### ✅ Phase 7 Checkpoint

- Documentation is accurate and complete

---

## Phase 8: Final Verification

### Task 8.1 — Build check

```bash
bun run build
```

Must succeed with no type errors.

### Task 8.2 — Run all tests

```bash
bun run test
```

All existing + new tests pass. No regressions.

### Task 8.3 — Manual smoke test

1. Add a `hackernews` widget via the visual config editor
2. Verify it renders top stories (no query)
3. Edit widget, add query "rust" → verify filtered results appear
4. Switch sort to "ask" → verify Ask HN stories
5. Set `hideTitle: true` → verify title is hidden
6. Verify the widget works inside a `tabs` container

### Task 8.4 — Verify in tabs container

```yaml
- type: tabs
  labels:
    - Rust
    - AI/LLM
    - General
  tabs:
    - type: hackernews
      query: "rust"
      sort: top
      limit: 10
    - type: hackernews
      query: "llm OR AI agents"
      sort: top
      limit: 10
    - type: hackernews
      sort: top
      limit: 10
```

### ✅ Phase 8 Checkpoint

- Build passes
- All tests pass
- Widget renders in all configurations
- No regressions in existing widgets

---

## File Manifest

### New files (14)

| # | File                                                                                              |
|---|---------------------------------------------------------------------------------------------------|
| 1 | `src/features/hackernews/domain/entities/story.ts`                                                |
| 2 | `src/features/hackernews/domain/repositories/story.ts`                                            |
| 3 | `src/features/hackernews/infrastructure/config.schemas.ts`                                        |
| 4 | `src/features/hackernews/infrastructure/repositories/http.dtos.ts`                                |
| 5 | `src/features/hackernews/infrastructure/repositories/http.hackernews-story-repository.ts`         |
| 6 | `src/features/hackernews/infrastructure/repositories/tests/http.hackernews-story-repository/http.hackernews-story-repository.integration.test.ts` |
| 7 | `src/features/hackernews/services/hackernews.actions.ts`                                          |
| 8 | `src/features/hackernews/presentation/HackerNewsWidget.tsx`                                       |
| 9 | `src/features/hackernews/presentation/HackerNewsWidgetInner.tsx`                                  |
| 10| `src/features/hackernews/presentation/HackerNewsWidgetSkeleton.tsx`                               |
| 11| `src/features/hackernews/presentation/HackerNewsWidget.stories.tsx`                               |
| 12| `src/features/hackernews/presentation/HackerNewsWidgetSkeleton.stories.tsx`                       |

### Modified files (5)

| # | File                                  | Change                                        |
|---|---------------------------------------|-----------------------------------------------|
| 1 | `src/infrastructure/config.schemas.ts`| Add to `z.union` + `WidgetConfig` type        |
| 2 | `src/components/Widget.tsx`           | Add `case "hackernews"` + import              |
| 3 | `src/lib/widget-registry.ts`         | Add registry entry + summary case + import    |
| 4 | `documents/specs/widgets.md`          | Add `## hackernews` section                   |
| 5 | `README.md`                           | Update widget count + feature list            |

---

## Risks & Mitigations

| Concern                       | Mitigation                                                                 |
| ----------------------------- | -------------------------------------------------------------------------- |
| Firebase N+1 API calls        | `Promise.all` with sliced limit. Cached 5 min. Max 30 parallel requests.  |
| Story without URL (Ask HN)    | Fallback link: `https://news.ycombinator.com/item?id={id}`                |
| Algolia down                  | Standard `ErrorWidget` fallback via React Query error handling            |
| Large Firebase items          | Zod schema extracts only needed fields, ignores `kids`, `text`, etc.      |
| Algolia sort ≠ HN sort        | Acceptable trade-off. Algolia uses relevance+points; documented clearly.  |

---

## Estimated Effort

| Phase                                    | Time     |
| ---------------------------------------- | -------- |
| Phase 1: Domain                          | 10 min   |
| Phase 2: Infrastructure (schema, DTOs, repo) | 30 min   |
| Phase 3: Service (server action)         | 10 min   |
| Phase 4: Presentation (3 components)     | 30 min   |
| Phase 5: Integration (5 touchpoints)     | 20 min   |
| Phase 6: Stories & tests                 | 30 min   |
| Phase 7: Documentation                   | 10 min   |
| Phase 8: Verification                    | 10 min   |
| **Total**                                | **~2.5h** |
