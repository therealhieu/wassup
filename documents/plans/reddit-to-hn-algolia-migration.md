# Reddit → HN Algolia Migration Plan

## Context

Reddit blocks all API access (including RSS) from datacenter IPs without approved OAuth credentials.
A Reddit API application has been submitted but approval is uncertain and may take weeks.

**Decision:** Replace Reddit widgets in presets with HN Algolia equivalents.
The Reddit widget code stays in place — dormant but ready if credentials are approved later.

---

## Current State

- HN Algolia integration is **already fully implemented** in the codebase
  - `HttpHackerNewsStoryRepository` routes to Algolia when `query` is present
  - Widget registry already exposes a `query` field with AND/OR support
  - Presets already use HN Algolia on Research pages
- Reddit widget code is functional — only missing credentials on VPS
- All 21 subreddits across presets return `403` from Hetzner IP

---

## Implementation Steps

### Step 1 — Replace Reddit tabs with HN Algolia tabs in `presets.ts`

**File:** `src/lib/presets.ts`

For each preset, replace the Reddit `tabs` widget with an equivalent HN Algolia `tabs` widget.
Update tab labels from `"r/subreddit"` to human-readable topic names.

#### Mapping per preset:

**Data Engineering (Home, lines 70–116):**

| Current tab (Reddit) | Replacement (HN Algolia) | Tab label |
|---|---|---|
| `r/compsci` | `query: "computer science"` | Computer Science |
| `r/rust` | `query: "rust lang"` | Rust |
| `r/vozforums` | *Drop — no HN equivalent* | — |
| `r/dataengineering` | `query: "data engineering OR data pipeline"` | Data Engineering |
| `r/leetcode` | `query: "leetcode OR coding interview"` | Interview Prep |

**Software Engineer (Home, lines 272–301):**

| Current tab (Reddit) | Replacement (HN Algolia) | Tab label |
|---|---|---|
| `r/programming` | `query: "programming"` | Programming |
| `r/webdev` | `query: "webdev OR frontend OR react"` | Web Dev |
| `r/typescript` | `query: "typescript"` | TypeScript |

**AI Engineering (Home, lines 430–476):**

| Current tab (Reddit) | Replacement (HN Algolia) | Tab label |
|---|---|---|
| `r/LocalLLaMA` | `query: "local llm OR ollama OR llama"` | Local LLMs |
| `r/MachineLearning` | `query: "machine learning"` | Machine Learning |
| `r/artificial` | `query: "artificial intelligence"` | AI |
| `r/LLMDevs` | `query: "LLM OR large language model"` | LLM Dev |
| `r/singularity` | `query: "AGI OR singularity OR superintelligence"` | Singularity |

**AI Engineering (Research, lines 532–562):**

| Current tab (Reddit) | Replacement (HN Algolia) | Tab label |
|---|---|---|
| `r/LocalLLaMA` | `query: "local llm OR self-hosted AI"` | Local LLMs |
| `r/LLMDevs` | `query: "LLM development"` | LLM Dev |
| `r/PromptEngineering` | `query: "prompt engineering OR prompting"` | Prompting |

**Data Science (Home, lines 684–731):**

| Current tab (Reddit) | Replacement (HN Algolia) | Tab label |
|---|---|---|
| `r/datascience` | `query: "data science"` | Data Science |
| `r/MachineLearning` | `query: "machine learning"` | ML |
| `r/statistics` | `query: "statistics OR statistical"` | Statistics |
| `r/dataanalysis` | `query: "data analysis"` | Data Analysis |
| `r/dataisbeautiful` | `query: "data visualization"` | Data Viz |

**Data Science (Research, lines 787–815):**

| Current tab (Reddit) | Replacement (HN Algolia) | Tab label |
|---|---|---|
| `r/deeplearning` | `query: "deep learning OR neural network"` | Deep Learning |
| `r/LanguageTechnology` | `query: "NLP OR language model"` | NLP |
| `r/kaggle` | `query: "kaggle OR competition"` | Kaggle |

### Step 2 — Build & verify locally

```bash
npm run build
npm run dev  # verify widgets load with Algolia data
```

### Step 3 — Deploy

Push to main → CI/CD deploys to Hetzner VPS automatically.

### Step 4 (Future) — Restore Reddit if API approved

If Reddit approves the API application:
1. Add `REDDIT_CLIENT_ID` and `REDDIT_CLIENT_SECRET` to SOPS secrets
2. Deploy secrets: `make secrets-deploy`
3. Recreate container: `docker compose up -d --force-recreate wassup`
4. Optionally restore Reddit widgets in presets using the archived config below

---

## DO NOT DELETE — Archived Reddit Widget Configs

These are the exact Reddit widget configurations from each preset.
Restore them when Reddit API credentials are approved.

### Data Engineering Preset (Home)

```json
{
  "type": "tabs",
  "labels": ["r/compsci", "r/rust", "r/vozforums", "r/dataengineering", "r/leetcode"],
  "tabs": [
    { "type": "reddit", "subreddit": "compsci", "hideTitle": true, "sort": "new", "limit": 5 },
    { "type": "reddit", "subreddit": "rust", "hideTitle": true, "sort": "new", "limit": 5 },
    { "type": "reddit", "subreddit": "vozforums", "hideTitle": true, "sort": "new", "limit": 5 },
    { "type": "reddit", "subreddit": "dataengineering", "hideTitle": true, "sort": "new", "limit": 5 },
    { "type": "reddit", "subreddit": "leetcode", "hideTitle": true, "sort": "new", "limit": 5 }
  ]
}
```

### Software Engineer Preset (Home)

```json
{
  "type": "tabs",
  "labels": ["r/programming", "r/webdev", "r/typescript"],
  "tabs": [
    { "type": "reddit", "subreddit": "programming", "hideTitle": true, "sort": "new", "limit": 5 },
    { "type": "reddit", "subreddit": "webdev", "hideTitle": true, "sort": "new", "limit": 5 },
    { "type": "reddit", "subreddit": "typescript", "hideTitle": true, "sort": "new", "limit": 5 }
  ]
}
```

### AI Engineering Preset (Home)

```json
{
  "type": "tabs",
  "labels": ["r/LocalLLaMA", "r/MachineLearning", "r/artificial", "r/LLMDevs", "r/singularity"],
  "tabs": [
    { "type": "reddit", "subreddit": "LocalLLaMA", "hideTitle": true, "sort": "hot", "limit": 5 },
    { "type": "reddit", "subreddit": "MachineLearning", "hideTitle": true, "sort": "hot", "limit": 5 },
    { "type": "reddit", "subreddit": "artificial", "hideTitle": true, "sort": "hot", "limit": 5 },
    { "type": "reddit", "subreddit": "LLMDevs", "hideTitle": true, "sort": "hot", "limit": 5 },
    { "type": "reddit", "subreddit": "singularity", "hideTitle": true, "sort": "hot", "limit": 5 }
  ]
}
```

### AI Engineering Preset (Research)

```json
{
  "type": "tabs",
  "labels": ["r/LocalLLaMA", "r/LLMDevs", "r/PromptEngineering"],
  "tabs": [
    { "type": "reddit", "subreddit": "LocalLLaMA", "hideTitle": true, "sort": "hot", "limit": 8 },
    { "type": "reddit", "subreddit": "LLMDevs", "hideTitle": true, "sort": "hot", "limit": 8 },
    { "type": "reddit", "subreddit": "PromptEngineering", "hideTitle": true, "sort": "hot", "limit": 8 }
  ]
}
```

### Data Science Preset (Home)

```json
{
  "type": "tabs",
  "labels": ["r/datascience", "r/MachineLearning", "r/statistics", "r/dataanalysis", "r/dataisbeautiful"],
  "tabs": [
    { "type": "reddit", "subreddit": "datascience", "hideTitle": true, "sort": "hot", "limit": 5 },
    { "type": "reddit", "subreddit": "MachineLearning", "hideTitle": true, "sort": "hot", "limit": 5 },
    { "type": "reddit", "subreddit": "statistics", "hideTitle": true, "sort": "hot", "limit": 5 },
    { "type": "reddit", "subreddit": "dataanalysis", "hideTitle": true, "sort": "hot", "limit": 5 },
    { "type": "reddit", "subreddit": "dataisbeautiful", "hideTitle": true, "sort": "hot", "limit": 5 }
  ]
}
```

### Data Science Preset (Research)

```json
{
  "type": "tabs",
  "labels": ["r/deeplearning", "r/LanguageTechnology", "r/kaggle"],
  "tabs": [
    { "type": "reddit", "subreddit": "deeplearning", "hideTitle": true, "sort": "hot", "limit": 8 },
    { "type": "reddit", "subreddit": "LanguageTechnology", "hideTitle": true, "sort": "hot", "limit": 8 },
    { "type": "reddit", "subreddit": "kaggle", "hideTitle": true, "sort": "hot", "limit": 8 }
  ]
}
```

---

## Notes

- **Reddit widget code is NOT removed** — it remains functional for users who have their own API credentials
- The `reddit` type stays in `widget-registry.ts` and `config.schemas.ts`
- The `nested-widget` default in `buildDefaults` still references `"reddit"` — change to `"hackernews"` if Reddit is eventually removed
- HN Algolia has no auth, no rate limit issues, and works from any IP
- Algolia `query` supports `AND`/`OR` operators for combining topics
