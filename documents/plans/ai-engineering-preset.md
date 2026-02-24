# AI Engineering Preset — Implementation Plan

## Overview

Add a curated **"AI Engineering"** seed preset targeting AI/ML engineers, LLM practitioners, and applied AI builders. The preset focuses on the **applied side** of AI — building with LLMs, agents, RAG pipelines, and MLOps — distinctly separated from the theory-heavy Data Science preset.

### Differentiation from Existing Presets

| Preset | Focus |
|---|---|
| **Software Engineer** | General SWE — webdev, programming, platform |
| **Data Engineering** | Pipelines, infrastructure, Spark, Kafka |
| **AI Engineering** *(new)* | **Applied AI** — LLMs, agents, RAG, MLOps, inference, prompt engineering |
| **Data Science** | Theory-heavy — statistics, EDA, visualization, ML fundamentals |

### Decisions

| Decision | Choice |
|---|---|
| Preset ID | `ai-engineering` |
| Preset name | `AI Engineering` |
| Theme | `dark` |
| Pages | 3: **Home**, **Research**, **Trends** |
| Target persona | AI engineers, ML engineers, LLM app developers, MLOps practitioners |
| Content focus | LLMs, agents, RAG, prompt engineering, MLOps, inference — minimal overlap with Data Science |

### Final SEED_PRESETS Order

1. `general-swe` (Software Engineer)
2. `DATA_ENGINEERING_PRESET` (Data Engineering)
3. `ai-engineering` (AI Engineering) ← **new**
4. `data-science` (Data Science)

> **Note**: Remove `blank` preset from `SEED_PRESETS`. Redefine `BLANK_CONFIG` as a standalone constant.

---

## Page Layout

```
Home (/)
├── Col 1 (size: 3) — Bookmarks (AI Engineering Toolkit)
├── Col 2 (size: 6) — Reddit tabs (5 AI communities) + YouTube (6 channels)
└── Col 3 (size: 3) — RSS Feed (4 AI/ML blogs)

Research (/research)
├── Col 1 (size: 5) — HackerNews × 2 (LLM + AI agents queries)
└── Col 2 (size: 7) — Reddit tabs (3 communities: LocalLLaMA, LLMDevs, PromptEngineering)

Trends (/trends)
└── Col 1 (size: 12) — GitHub tabs (LLM / Agents, RAG / Retrieval, MLOps / Serving)
```

---

## Phase 1: Modify `src/lib/presets.ts`

### Task 1.1 — Add `AI_ENGINEERING_PRESET` & reorder `SEED_PRESETS`

**File**: `src/lib/presets.ts` (modify)

Insert the AI Engineering preset into `SEED_PRESETS` at position 3 (after Data Engineering, before Data Science). Reorder existing entries. Remove the `blank` entry. Redefine `BLANK_CONFIG` as a standalone constant.

```typescript
export const SEED_PRESETS: Preset[] = [
  { id: "general-swe", name: "Software Engineer", config: ... },
  DATA_ENGINEERING_PRESET,
  {
    id: "ai-engineering",
    name: "AI Engineering",
    config: AppConfigSchema.parse({
      ui: {
        theme: "dark",
        pages: [
          // Page 1: Home — see Content Details below
          // Page 2: Research
          // Page 3: Trends
        ],
      },
    }),
  },
  { id: "data-science", name: "Data Science", config: ... },
];

// Standalone — no longer derived from SEED_PRESETS
export const BLANK_CONFIG = AppConfigSchema.parse({
  ui: {
    theme: "light",
    pages: [{ title: "Home", path: "/", columns: [{ size: 12, widgets: [] }] }],
  },
});
```

---

## Content Details

### Bookmarks (Home, Col 1)

| Group | Links | Purpose |
|---|---|---|
| **Frameworks** | [LangChain docs](https://python.langchain.com/docs), [LlamaIndex docs](https://docs.llamaindex.ai), [Hugging Face](https://huggingface.co), [Vercel AI SDK](https://sdk.vercel.ai/docs) | Core LLM/agent frameworks for building AI apps |
| **Platforms** | [OpenAI Platform](https://platform.openai.com), [Anthropic docs](https://docs.anthropic.com), [Replicate](https://replicate.com), [Together AI](https://www.together.ai) | Model providers & inference APIs |
| **MLOps & Eval** | [LangSmith](https://smith.langchain.com), [Weights & Biases](https://wandb.ai), [Langfuse](https://langfuse.com), [Ollama](https://ollama.com) | Experiment tracking, evaluation, observability, local inference |

### Reddit Communities (Home, Col 2 — Tabs)

| Subreddit | Members | Why |
|---|---|---|
| `r/LocalLLaMA` | 1M+ | Open-source LLM community — models, inference, quantization, fine-tuning |
| `r/MachineLearning` | 3M+ | Research-heavy, SOTA papers, industry discussions |
| `r/artificial` | 1M+ | Broad AI news, big-picture debates, capabilities discourse |
| `r/LLMDevs` | Growing | Dedicated to LLM development — tools, frameworks, deployment patterns |
| `r/singularity` | 1M+ | AI capabilities frontier, AGI discourse, industry trends |

### YouTube Channels (Home, Col 2)

| Channel | Handle | Focus |
|---|---|---|
| Andrej Karpathy | `@AndrejKarpathy` | Deep learning internals, building LLMs from scratch, neural net fundamentals |
| Yannic Kilcher | `@YannicKilcher` | AI research paper reviews, in-depth technical breakdowns |
| AI Explained | `@aiexplained-official` | AI capabilities analysis, model comparisons, benchmarking (405K subs) |
| Latent Space | `@LatentSpacePod` | AI Engineer podcast — founders, builders, infra, agents |
| Stanford Online | `@stanfordonline` | Free Stanford lectures: NLP with Deep Learning, Agents & RAG |
| Fireship | `@Fireship` | Rapid-fire tech explainers, AI tool reviews, developer trends |

### RSS Feeds (Home, Col 3)

| Blog | RSS URL | Focus |
|---|---|---|
| Lilian Weng | `https://lilianweng.github.io/index.xml` | In-depth technical posts on LLM agents, prompt engineering, RL, RAG (OpenAI researcher) |
| Simon Willison | `https://simonwillison.net/atom/everything` | Practical LLM tooling, AI engineering, open-source AI experiments |
| Chip Huyen | `https://huyenchip.com/feed` | ML systems design, MLOps, AI engineering best practices |
| Latent Space Blog | `https://www.latent.space/feed` | AI engineering industry analysis, infra, startups, agent patterns |

### Hacker News (Research, Col 1)

| Widget | Config | Purpose |
|---|---|---|
| Top LLM stories | `sort: top, limit: 15, query: "LLM OR large language model"` | Curated LLM discussions from HN |
| Show HN AI agents | `sort: show, limit: 10, query: "AI agent OR RAG"` | New AI tools, agent frameworks, and projects |

### Reddit (Research, Col 2 — Tabs)

| Subreddit | Why |
|---|---|
| `r/LocalLLaMA` | Open weights models, quantization, local deployment, fine-tuning |
| `r/LLMDevs` | LLM application development, tooling, patterns |
| `r/PromptEngineering` | Prompt design, system prompts, jailbreaking, optimization |

### GitHub Trends (Trends page — Tabs)

| Tab | Topics | Tracks |
|---|---|---|
| **LLM / Agents** | `llm`, `ai-agents`, `langchain`, `autogen` | LLM frameworks, agent orchestration, multi-agent systems |
| **RAG / Retrieval** | `rag`, `vector-database`, `embeddings`, `semantic-search` | Retrieval-augmented generation stack, vector stores |
| **MLOps / Serving** | `mlops`, `model-serving`, `llm-inference`, `fine-tuning` | Production ML infrastructure, model serving, training pipelines |

---

## Phase 2: Verify

### Task 2.1 — Build check

```bash
bun run build
```

Expect: clean build, no type errors.

### Task 2.2 — Runtime check

```bash
bun run dev
```

1. Open browser → preset selector shows 4 presets in order: Software Engineer, Data Engineering, AI Engineering, Data Science
2. Select "AI Engineering" preset
3. Verify **Home** page renders:
   - Bookmark widget with 3 groups (Frameworks, Platforms, MLOps & Eval)
   - Reddit tabs (5 subreddits)
   - YouTube widget (6 channels)
   - Feed widget (4 RSS sources)
4. Navigate to **Research** page:
   - Two Hacker News widgets (LLM + AI agents queries)
   - Reddit tabs (3 subreddits)
5. Navigate to **Trends** page:
   - GitHub tabs (3 topic groups)

### Task 2.3 — Verify `BLANK_CONFIG` consumers

Ensure `AppConfigProvider.tsx` still works correctly with the standalone `BLANK_CONFIG` constant.

### ✅ Checkpoints

- Clean build, no type errors
- `SEED_PRESETS` array has 4 entries in correct order (no `blank`)
- `BLANK_CONFIG` is still exported and functional as a fallback
- All widgets load data without console errors
- Preset switching works correctly (no infinite loops)
- No visual regressions on other presets

---

## Content Rationale

### Why these specific resources?

**Blogs chosen for signal quality over popularity:**
- **Lilian Weng** — OpenAI researcher, writes the definitive technical reference posts (e.g., "LLM Powered Autonomous Agents", "Prompt Engineering")
- **Simon Willison** — Prolific AI engineer, tracks every major LLM release, builds practical tools (Datasette, LLM CLI)
- **Chip Huyen** — Author of "Designing Machine Learning Systems", focuses on production ML and AI engineering
- **Latent Space** — The premier AI engineering podcast/blog, covers infrastructure, agents, and startups

**YouTube prioritizes depth and technical accuracy:**
- Karpathy, Kilcher, AI Explained for research understanding
- Latent Space, Stanford for industry/academic bridge
- Fireship for staying current on broader tech trends

**Subreddits balance signal vs. noise:**
- `r/LocalLLaMA` and `r/LLMDevs` are high-signal communities with practitioner focus
- `r/MachineLearning` provides research context
- `r/PromptEngineering` covers the craft of working with LLMs
- `r/artificial` and `r/singularity` for broader trends/capabilities

**GitHub topics target the production AI stack:**
- LLM/Agents: frameworks for building
- RAG/Retrieval: the dominant pattern for grounding LLMs
- MLOps/Serving: getting models to production
