# Multi-Source News Widget — Implementation Plan

## Overview

A composite widget that wraps **HN** and **Lobsters** child widgets with a floating pill toggle, allowing users to switch source per-topic. Designed to be used inside Tabs widgets where each tab represents a topic.

### Key Decisions

| Decision | Choice |
| --- | --- |
| Widget type key | `multisourcenews` |
| Component name | `MultiSourceNewsWidget` |
| Feature dir | `src/features/multisourcenews/` |
| Registry label | `"Multi-Source News"` |
| Toggle placement | Floating pill, bottom-right of last story row |
| Toggle UI | MUI `ToggleButtonGroup` with 🔥 and 🦞 emoji icons |
| Child rendering | Reuses existing `HackerNewsWidget` and `LobstersWidget` directly |
| State | Client-only `useState` — no server action needed |
| Default source | `hackernews` |

### Architecture

```
Tabs widget (topic selection)
  └─ Tab "AI"
       └─ MultiSourceNewsWidget
            ├─ config.hackernews: { type: "hackernews", query: "LLM OR AI", ... }
            ├─ config.lobsters:   { type: "lobsters", tag: "ai", ... }
            └─ useState("hackernews")
                 → renders HackerNewsWidget OR LobstersWidget
                 → floating pill in bottom-right of last story toggles source
```

### Preset Config Example

```json
{
  "type": "tabs",
  "labels": ["AI", "Rust", "Database"],
  "tabs": [
    {
      "type": "multisourcenews",
      "hackernews": { "type": "hackernews", "query": "LLM OR AI agent", "sort": "top", "limit": 5, "hideTitle": true },
      "lobsters": { "type": "lobsters", "tag": "ai", "sort": "hottest", "limit": 5, "hideTitle": true }
    },
    {
      "type": "multisourcenews",
      "hackernews": { "type": "hackernews", "query": "rust lang", "sort": "new", "limit": 5, "hideTitle": true },
      "lobsters": { "type": "lobsters", "tag": "rust", "sort": "hottest", "limit": 5, "hideTitle": true }
    },
    {
      "type": "multisourcenews",
      "hackernews": { "type": "hackernews", "query": "database OR SQL", "sort": "new", "limit": 5, "hideTitle": true },
      "lobsters": { "type": "lobsters", "tag": "databases", "sort": "hottest", "limit": 5, "hideTitle": true }
    }
  ]
}
```

### Execution Order

```
Phase 1 (Config Schema) → Phase 2 (Presentation) → Phase 3 (Integration)
```

No domain layer, no repository, no server action — this widget is purely a client-side compositor.

---

## Phase 1: Config Schema

**Goal**: Define the config schema that holds both child configs.

### Task 1.1 — Config schema

**File**: `src/features/multisourcenews/infrastructure/config.schemas.ts` (new)

```typescript
import { z } from "zod";
import { HackerNewsWidgetConfigSchema } from "@/features/hackernews/infrastructure/config.schemas";
import { LobstersWidgetConfigSchema } from "@/features/lobsters/infrastructure/config.schemas";

export const MultiSourceNewsWidgetConfigSchema = z.object({
	type: z.literal("multisourcenews"),
	hackernews: HackerNewsWidgetConfigSchema,
	lobsters: LobstersWidgetConfigSchema,
});

export type MultiSourceNewsWidgetConfig = z.infer<
	typeof MultiSourceNewsWidgetConfigSchema
>;
```

Notes:
- No `hideTitle` — child configs each have their own `hideTitle`
- Both child configs are required — this widget always has both sources available
- The `type` discriminator on each child config (`"hackernews"` / `"lobsters"`) is enforced by the child schemas

### ✅ Phase 1 Checkpoint

- Schema compiles with no type errors

---

## Phase 2: Presentation Layer

**Goal**: A single client component that toggles between HN and Lobsters.

### Task 2.1 — Widget component

**File**: `src/features/multisourcenews/presentation/MultiSourceNewsWidget.tsx` (new)

This is a `"use client"` component. It:
1. Holds `useState<"hackernews" | "lobsters">("hackernews")`
2. Wraps the active child widget in a `position: relative` container
3. Renders the floating pill as `position: absolute; bottom: 8px; right: 8px`

```tsx
"use client";

import { useState } from "react";
import { Box, ToggleButtonGroup, ToggleButton } from "@mui/material";
import { MultiSourceNewsWidgetConfig } from "../infrastructure/config.schemas";
import { HackerNewsWidget } from "@/features/hackernews/presentation/HackerNewsWidget";
import { LobstersWidget } from "@/features/lobsters/presentation/LobstersWidget";

type Source = "hackernews" | "lobsters";

export interface MultiSourceNewsWidgetProps {
	config: MultiSourceNewsWidgetConfig;
}

export const MultiSourceNewsWidget = ({ config }: MultiSourceNewsWidgetProps) => {
	const [source, setSource] = useState<Source>("hackernews");

	return (
		<Box sx={{ position: "relative" }}>
			{source === "hackernews" ? (
				<HackerNewsWidget config={config.hackernews} />
			) : (
				<LobstersWidget config={config.lobsters} />
			)}
			<ToggleButtonGroup
				value={source}
				exclusive
				size="small"
				onChange={(_, val) => val && setSource(val)}
				sx={{
					position: "absolute",
					bottom: 8,
					right: 8,
					zIndex: 1,
					backgroundColor: "rgba(30, 30, 50, 0.85)",
					backdropFilter: "blur(8px)",
					borderRadius: "16px",
					border: "1px solid rgba(255,255,255,0.1)",
					"& .MuiToggleButton-root": {
						border: "none",
						px: 1,
						py: 0.3,
						fontSize: "0.85rem",
						lineHeight: 1,
						"&.Mui-selected": {
							backgroundColor: "rgba(255,255,255,0.12)",
						},
					},
				}}
			>
				<ToggleButton value="hackernews">🔥</ToggleButton>
				<ToggleButton value="lobsters">🦞</ToggleButton>
			</ToggleButtonGroup>
		</Box>
	);
};
```

Key design decisions:
- `backdropFilter: "blur(8px)"` gives the glassmorphism effect on the pill
- `rgba(30, 30, 50, 0.85)` semi-transparent background works on both light/dark themes
- `border: "none"` on toggle buttons removes default MUI borders for cleaner pill look
- `borderRadius: "16px"` on the group makes it pill-shaped
- `zIndex: 1` ensures it floats above the card content

### ✅ Phase 2 Checkpoint

- Component compiles
- Toggle switches between HN and Lobsters content
- Pill renders in bottom-right of the content area

---

## Phase 3: Integration

**Goal**: Wire into config schema, widget dispatcher, and widget registry.

### Task 3.1 — Add to global config schema

**File**: `src/infrastructure/config.schemas.ts` (modify)

Add import:
```typescript
import {
	MultiSourceNewsWidgetConfig,
	MultiSourceNewsWidgetConfigSchema,
} from "@/features/multisourcenews/infrastructure/config.schemas";
```

Add to `WidgetConfigSchema` union and `WidgetConfig` type.

### Task 3.2 — Add to widget dispatcher

**File**: `src/components/Widget.tsx` (modify)

```typescript
import { MultiSourceNewsWidget } from "@/features/multisourcenews/presentation/MultiSourceNewsWidget";

// in switch:
case "multisourcenews":
	return <MultiSourceNewsWidget config={widgetConfig} />;
```

### Task 3.3 — Add to widget registry

**File**: `src/lib/widget-registry.ts` (modify)

```typescript
import { MultiSourceNewsWidgetConfigSchema } from "@/features/multisourcenews/infrastructure/config.schemas";

// getWidgetSummary:
case "multisourcenews":
	return "HN + Lobsters";

// WIDGET_REGISTRY:
multisourcenews: {
	type: "multisourcenews",
	label: "Multi-Source News",
	schema: MultiSourceNewsWidgetConfigSchema,
	fields: [
		// hackernews and lobsters are nested widget configs
		// For now, the visual editor doesn't need to expose these inline —
		// users configure via JSON or preset switching.
		// A future enhancement could add nested-object fields here.
	],
},
```

### Task 3.4 — Add to WidgetPreviewPane exhaustive switch

**File**: `src/components/config-editor/WidgetPreviewPane.tsx` (modify)

Add `case "multisourcenews":` to the fallthrough group with github/hackernews/lobsters/tabs.

### ✅ Phase 3 Checkpoint

- `bun run build` succeeds with no type errors
- `multisourcenews` appears in widget type selector
- A preset config with `type: "multisourcenews"` renders correctly
- Floating pill toggles between HN and Lobsters content

---

## Files Changed Summary

| File | Action |
| --- | --- |
| `src/features/multisourcenews/infrastructure/config.schemas.ts` | Create |
| `src/features/multisourcenews/presentation/MultiSourceNewsWidget.tsx` | Create |
| `src/infrastructure/config.schemas.ts` | Modify — add to union |
| `src/components/Widget.tsx` | Modify — add switch case |
| `src/lib/widget-registry.ts` | Modify — add entry + summary |
| `src/components/config-editor/WidgetPreviewPane.tsx` | Modify — add to exhaustive switch |

**Total: 2 new files, 4 file modifications.**
