# AI Feed Digest

## Overview

A new `digest` widget that collects items from other widgets on the same page, sends them to an LLM, and renders a structured summary — a "daily briefing" with 5-7 key takeaways from all feeds in one place.

## Architecture

```
┌─────────────────────────────────────────────────┐
│                   User's Page                    │
│  ┌──────────┐ ┌──────────┐ ┌──────────────────┐ │
│  │ Reddit   │ │ HN       │ │ Digest Widget    │ │
│  │ Widget   │ │ Widget   │ │                  │ │
│  │          │ │          │ │ "Today's top 5:  │ │
│  │          │ │          │ │  1. Rust 2.0...  │ │
│  │          │ │          │ │  2. OpenAI...    │ │
│  └──────────┘ └──────────┘ └──────────────────┘ │
└─────────────────────────────────────────────────┘
         │              │              ▲
         ▼              ▼              │
    ┌─────────────────────────┐        │
    │  Digest Server Action   │        │
    │  1. Fetch sibling data  │────────┘
    │  2. Build prompt        │
    │  3. Call LLM API        │
    │  4. Return markdown     │
    └─────────────────────────┘
```

## Data Flow

1. **Digest widget config** specifies which source types to include (e.g., `["reddit", "hackernews", "feed"]`) and an optional focus prompt (e.g., `"Focus on AI and systems programming"`)
2. **Server action** re-fetches data from the same sources the user has configured on that page (reads the page config, finds matching widgets, calls their existing fetch logic)
3. **Prompt construction** — Collects titles + metadata into a structured prompt, asks the LLM for a summary
4. **LLM call** — OpenAI / Anthropic / local via OpenAI-compatible API
5. **Response** — Markdown rendered in the widget
6. **Cache** — LRU cache keyed on `hash(sourceItems + prompt)`, 30 min TTL

## DDD Structure

```
src/features/digest/
├── domain/
│   └── entities/digest.ts              # DigestResult type
├── infrastructure/
│   ├── config.schemas.ts               # DigestWidgetConfigSchema
│   └── repositories/
│       └── llm.digest-repository.ts    # LLM API call
├── presentation/
│   ├── DigestWidget.tsx                # React Query wrapper
│   ├── DigestWidgetInner.tsx           # Markdown render
│   └── DigestWidget.stories.tsx
└── services/
    ├── digest.ts                       # Orchestrator: collect → prompt → call
    └── digest.actions.ts               # Server action (cached)
```

## Config Schema

```typescript
DigestWidgetConfigSchema = z.object({
  type: z.literal("digest"),
  sources: z.array(z.enum(["reddit", "hackernews", "feed", "github"]))
           .default(["reddit", "hackernews", "feed"]),
  prompt: z.string().optional(),       // e.g. "Focus on backend engineering"
  maxItems: z.number().default(50),    // max items to send to LLM
  provider: z.enum(["openai", "anthropic"]).default("openai"),
  hideTitle: z.boolean().default(false),
})
```

## Design Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Source data | Re-fetch via existing server actions | Reuses all caching, no new data layer |
| LLM provider | Configurable, OpenAI-compatible API | Flexibility — works with local Ollama too |
| API key storage | Server-side env var (`LLM_API_KEY`) | Never expose to client; same pattern as other server actions |
| Context window | Send titles + scores only, not full content | Keeps tokens low, titles are sufficient for a digest |
| Caching | Hash of (sorted item titles + prompt) → 30 min TTL | Avoids re-calling LLM for same data |
| Rendering | Markdown via `react-markdown` | Simple, flexible |
| Refresh | Manual "Regenerate" button (not auto) | Cost control, user agency |

## Prompt Template

```
You are a tech news curator. Given the following items from multiple sources,
produce a concise digest with 5-7 key takeaways.

{user_prompt ? `Focus: ${user_prompt}` : ""}

## Sources
{items.map(i => `- [${i.source}] ${i.title} (score: ${i.score})`).join("\n")}

Rules:
- Group related items
- Highlight emerging trends
- Use markdown with bullet points
- Be concise — max 200 words
```

## Implementation Steps

| Step | Task | Effort |
|---|---|---|
| 1 | Add `LLM_API_KEY` env var + config | Small |
| 2 | Create `digest` feature module (schema, types) | Small |
| 3 | Build `llm.digest-repository.ts` — thin wrapper over `fetch` to OpenAI-compatible `/chat/completions` | Small |
| 4 | Build `digest.ts` service — collects sibling widget data, constructs prompt, calls repo | Medium |
| 5 | Build `digest.actions.ts` server action with LRU cache | Small |
| 6 | Build `DigestWidget.tsx` + `DigestWidgetInner.tsx` (markdown render) | Medium |
| 7 | Register in `widget-registry.ts` + add to `Widget.tsx` dispatcher | Small |
| 8 | Add to a seed preset to demo | Small |

**Total estimate:** ~1 day of focused work.

## Open Questions

1. **Multi-provider** — Start with just OpenAI, or abstract from day one for Anthropic/Ollama?
2. **Cost control** — Daily budget cap or per-request cost display?
3. **Sibling awareness** — Should the digest config explicitly list source widget configs, or auto-discover siblings on the same page?
