# Data Science Preset — Implementation Plan

## Overview

Add a curated "Data Science" seed preset targeting data scientists and data analysts. The preset covers **fundamentals** (statistics, analysis methods), **standards** (core tools, references, best practices), and **trends** (trending ML repos, visualization tools, EDA libraries). No data engineering content.

### Decisions

| Decision             | Choice                                                                 |
| -------------------- | ---------------------------------------------------------------------- |
| Preset ID            | `data-science`                                                         |
| Preset name          | `Data Science`                                                         |
| Theme                | `dark` — standard preference in DS tooling (Jupyter, VS Code, Colab)   |
| Pages                | 3: Home, Research, Trends                                              |
| Target persona       | Data scientists, data analysts, ML practitioners, statisticians        |
| Content focus        | DS fundamentals, analytics, ML/DL, statistics, visualization — no DE   |

### Page Layout

```
Home (/)
├── Col 1 (size: 3) — Weather + Bookmarks (DS Toolkit)
├── Col 2 (size: 6) — Reddit tabs (5 communities) + YouTube (6 channels)
└── Col 3 (size: 3) — RSS Feed (4 blogs)

Research (/research)
├── Col 1 (size: 5) — Hacker News × 2 (ML + DS queries)
└── Col 2 (size: 7) — Reddit tabs (deeplearning, NLP, kaggle)

Trends (/trends)
└── Col 1 (size: 12) — GitHub tabs (ML/DL, Data Viz, EDA/Statistics)
```

---

## Phase 1: Add Preset to SEED_PRESETS

**Goal**: Add the Data Science preset object to `SEED_PRESETS` array.

### Task 1.1 — Add preset entry

**File**: `src/lib/presets.ts` (modify)

Add the following preset object to the `SEED_PRESETS` array, before the `blank` preset:

```typescript
{
  id: "data-science",
  name: "Data Science",
  config: AppConfigSchema.parse({
    ui: {
      theme: "dark",
      pages: [
        // Page 1: Home
        {
          title: "Home",
          path: "/",
          columns: [
            {
              size: 3,
              widgets: [
                { type: "weather", location: "San Francisco" },
                {
                  type: "bookmark",
                  title: "DS Toolkit",
                  groups: [
                    {
                      title: "Learning",
                      bookmarks: [
                        "https://kaggle.com",
                        "https://fast.ai",
                        "https://huggingface.co",
                        "https://paperswithcode.com",
                      ],
                    },
                    {
                      title: "References",
                      bookmarks: [
                        "https://scikit-learn.org",
                        "https://pytorch.org/docs",
                        "https://pandas.pydata.org/docs",
                        "https://docs.python.org/3/",
                      ],
                    },
                    {
                      title: "Tools",
                      bookmarks: [
                        "https://colab.research.google.com",
                        "https://wandb.ai",
                        "https://streamlit.io",
                      ],
                    },
                  ],
                },
              ],
            },
            {
              size: 6,
              widgets: [
                {
                  type: "tabs",
                  labels: [
                    "r/datascience",
                    "r/MachineLearning",
                    "r/statistics",
                    "r/dataanalysis",
                    "r/dataisbeautiful",
                  ],
                  tabs: [
                    { type: "reddit", subreddit: "datascience",     hideTitle: true, sort: "hot", limit: 5 },
                    { type: "reddit", subreddit: "MachineLearning", hideTitle: true, sort: "hot", limit: 5 },
                    { type: "reddit", subreddit: "statistics",      hideTitle: true, sort: "hot", limit: 5 },
                    { type: "reddit", subreddit: "dataanalysis",    hideTitle: true, sort: "hot", limit: 5 },
                    { type: "reddit", subreddit: "dataisbeautiful", hideTitle: true, sort: "hot", limit: 5 },
                  ],
                },
                {
                  type: "youtube",
                  channels: [
                    "@statquest",         // StatQuest — stats & ML fundamentals
                    "@3blue1brown",       // 3Blue1Brown — math intuition
                    "@AndrejKarpathy",    // Andrej Karpathy — deep learning from scratch
                    "@TwoMinutePapers",   // Two Minute Papers — latest AI research
                    "@AlexTheAnalyst",    // Alex The Analyst — analytics career & tools
                    "@LukeBarousse",      // Luke Barousse — SQL, Python, analytics
                  ],
                },
              ],
            },
            {
              size: 3,
              widgets: [
                {
                  type: "feed",
                  limit: 12,
                  scrollAfterRow: 7,
                  urls: [
                    "https://towardsdatascience.com/feed",
                    "https://machinelearningmastery.com/feed/",
                    "https://simplystatistics.org/index.xml",
                    "https://flowingdata.com/feed",
                  ],
                },
              ],
            },
          ],
        },
        // Page 2: Research
        {
          title: "Research",
          path: "/research",
          columns: [
            {
              size: 5,
              widgets: [
                { type: "hackernews", sort: "top",  limit: 15, query: "machine learning" },
                { type: "hackernews", sort: "show", limit: 10, query: "data science" },
              ],
            },
            {
              size: 7,
              widgets: [
                {
                  type: "tabs",
                  labels: ["r/deeplearning", "r/LanguageTechnology", "r/kaggle"],
                  tabs: [
                    { type: "reddit", subreddit: "deeplearning",       hideTitle: true, sort: "hot", limit: 8 },
                    { type: "reddit", subreddit: "LanguageTechnology", hideTitle: true, sort: "hot", limit: 8 },
                    { type: "reddit", subreddit: "kaggle",             hideTitle: true, sort: "hot", limit: 8 },
                  ],
                },
              ],
            },
          ],
        },
        // Page 3: Trends
        {
          title: "Trends",
          path: "/trends",
          columns: [
            {
              size: 12,
              widgets: [
                {
                  type: "tabs",
                  labels: ["ML / Deep Learning", "Data Visualization", "EDA / Statistics"],
                  tabs: [
                    {
                      type: "github",
                      topics: ["machine-learning", "deep-learning", "pytorch", "transformers"],
                      createdAfter: "2024-01-01",
                      dateRange: "90d",
                      limit: 20,
                    },
                    {
                      type: "github",
                      topics: ["data-visualization", "dashboard", "streamlit", "plotly"],
                      createdAfter: "2024-01-01",
                      dateRange: "90d",
                      limit: 20,
                    },
                    {
                      type: "github",
                      topics: ["exploratory-data-analysis", "statistics", "pandas", "data-analysis"],
                      createdAfter: "2024-01-01",
                      dateRange: "90d",
                      limit: 20,
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  }),
},
```

### ✅ Phase 1 Checkpoint

- `bun run build` succeeds with no type errors
- The `SEED_PRESETS` array now has 3 entries: `general-swe`, `data-science`, `blank`

---

## Phase 2: Verify

**Goal**: Visual and functional verification.

### Task 2.1 — Build check

```bash
bun run build
```

Expect: clean build, no type errors.

### Task 2.2 — Runtime check

```bash
bun run dev
```

1. Open browser, confirm the preset selector shows "Data Science"
2. Select "Data Science" preset
3. Verify **Home** page renders:
   - Weather widget (San Francisco)
   - Bookmark widget with 3 groups (Learning, References, Tools)
   - Reddit tabs (5 subreddits)
   - YouTube widget (6 channels)
   - Feed widget (4 RSS sources)
4. Navigate to **Research** page:
   - Two Hacker News widgets (ML + DS queries)
   - Reddit tabs (3 subreddits)
5. Navigate to **Trends** page:
   - GitHub tabs (3 topic groups)

### ✅ Phase 2 Checkpoint

- All widgets load data without errors
- All pages render correctly
- Preset can be selected/switched without issues

---

## Content Rationale

### Reddit Communities

| Subreddit | Page | Why |
|---|---|---|
| r/datascience | Home | Core DS community (2.6M members) — career, industry, tools |
| r/MachineLearning | Home | Research-heavy, paper discussions, SOTA models |
| r/statistics | Home | Foundational theory, statistical methods, inference |
| r/dataanalysis | Home | Practical analytics: methods, tools, approaches |
| r/dataisbeautiful | Home | Visualization inspiration and critique |
| r/deeplearning | Research | Deep learning research and architectures |
| r/LanguageTechnology | Research | NLP, transformers, language models |
| r/kaggle | Research | Competitions, datasets, practical ML |

### YouTube Channels

| Channel | Handle | Focus |
|---|---|---|
| StatQuest | @statquest | Statistics & ML fundamentals with visual explanations |
| 3Blue1Brown | @3blue1brown | Mathematical intuition (linear algebra, calculus, neural nets) |
| Andrej Karpathy | @AndrejKarpathy | Deep learning from scratch, neural network internals |
| Two Minute Papers | @TwoMinutePapers | Bite-sized AI/ML research summaries |
| Alex The Analyst | @AlexTheAnalyst | Data analytics career, SQL, Excel, Power BI, Python |
| Luke Barousse | @LukeBarousse | SQL, Python, Tableau, analytics tutorials |

### RSS Feeds

| Blog | URL | Focus |
|---|---|---|
| Towards Data Science | towardsdatascience.com/feed | Broad DS community blog on Medium |
| Machine Learning Mastery | machinelearningmastery.com/feed/ | Practical ML tutorials and guides |
| Simply Statistics | simplystatistics.org/index.xml | Accessible statistics for practitioners |
| FlowingData | flowingdata.com/feed | Data visualization and storytelling |

### Bookmarks

| Group | Links | Purpose |
|---|---|---|
| Learning | Kaggle, fast.ai, HuggingFace, Papers With Code | Learning platforms and research discovery |
| References | scikit-learn, PyTorch, pandas, Python docs | Core library documentation |
| Tools | Colab, W&B, Streamlit | Development and experimentation tools |

### GitHub Trends Tabs

| Tab | Topics | What it tracks |
|---|---|---|
| ML / Deep Learning | machine-learning, deep-learning, pytorch, transformers | Core ML/DL frameworks and models |
| Data Visualization | data-visualization, dashboard, streamlit, plotly | Visualization tools and dashboards |
| EDA / Statistics | exploratory-data-analysis, statistics, pandas, data-analysis | Analysis libraries and statistical tools |

### Hacker News Widgets

| Widget | Config | Purpose |
|---|---|---|
| Top ML stories | sort: top, query: "machine learning" | Curated ML discussions from HN |
| Show HN DS | sort: show, query: "data science" | New DS tools and projects |
