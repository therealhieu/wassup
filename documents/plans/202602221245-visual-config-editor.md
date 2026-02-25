# Visual Config Editor

## Overview

Replace the Monaco-based YAML editor with a **structured, form-based visual config editor**. The dashboard operates in two modes:

- **View mode** (default): The current `DashboardPage` — clean, no editing affordances.
- **Edit mode**: A visual editor with editable page tabs, column layout controls, widget CRUD, and a form-based "Add/Edit Widget" dialog with live preview.

Monaco is unreliable for catching YAML validation errors. A form-based approach gives us typed inputs, enums as dropdowns, Zod validation for free, and a much better UX.

---

## Design Decisions

| Decision | Choice | Rationale |
|---|---|---|
| 2 modes vs 1 mode | **2 modes** | Dashboard is consumption-first (viewed 99%, edited 1%). No editing chrome polluting the view. Matches Grafana, iOS home screen patterns. |
| Form generation strategy | **Widget registry** (not Zod introspection) | Zod's `_def` API is unstable, can't express UX hints (labels, placeholders), breaks on `.refine()`, `.lazy()`. Registry gives full control with only 7 widget types. |
| Validation | **Existing Zod schemas** on form submit | Zero extra work — schemas already exist. |
| Preview | Reuse existing `*WidgetInner` components | They already accept data as props. |
| State management | Local `useState`/`useReducer` in edit mode, commit on "Save" | No partial saves, clean undo via "Cancel". |

---

## UI Layout

### View Mode (current — no changes)

```
┌────────────────────────────────────────────────────────────────────┐
│ Wassup  [Home] [Work]    [Preset ▼] [🌙] [✏️ Edit] [👤]          │
├────────────────────────────────────────────────────────────────────┤
│ [Weather]     [Feed            ]     [Reddit         ]            │
│ [Bookmarks]   [GitHub          ]                                  │
└────────────────────────────────────────────────────────────────────┘
```

### Edit Mode

```
┌────────────────────────────────────────────────────────────────────┐
│ Wassup  [Home] [Work] [+]                       [Cancel] [Save]   │
│ Column Layout: [3-6-3]  [====25%====|=====50%=====|====25%====]   │
├────────────────────────────────────────────────────────────────────┤
│ ⠿ 🌤 Weather ✏️✕   │ ⠿ 📰 Feed ✏️✕         │ ⠿ 🔴 Reddit ✏️✕  │
│ ⠿ 📌 Bookmarks ✏️✕ │ ⠿ 💻 GitHub ✏️✕       │                    │
│ ┌╌╌╌╌╌╌╌╌╌╌╌╌╌╌┐   │ ┌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌┐ │ ┌╌╌╌╌╌╌╌╌╌╌╌╌╌╌┐ │
│ │ + Add Widget  │   │ │  + Add Widget      │ │ │ + Add Widget  │ │
│ └╌╌╌╌╌╌╌╌╌╌╌╌╌╌┘   │ └╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌┘ │ └╌╌╌╌╌╌╌╌╌╌╌╌╌╌┘ │
└────────────────────────────────────────────────────────────────────┘
```

### Add/Edit Widget Dialog

```
┌─────────────────────────────────────────────────────────────────────┐
│ Add Widget                                                     ✕   │
├─────────────────────────────┬───────────────────────────────────────┤
│ Configure Widget            │ Preview                               │
│                             │                                       │
│ Widget Type: [Reddit ▼]     │ [Fake Data ●] [Real Data ○]          │
│                             │                                       │
│ Subreddit: [programming  ]  │ ┌─────────────────────────────────┐  │
│ Sort:      [hot ▼]          │ │ r/programming                   │  │
│ Limit:     [5           ]   │ │ ▲ 142  The state of web dev...  │  │
│ Hide Title: [○ off]         │ │ ▲  89  Why I switched to Rust   │  │
│                             │ │ ▲  56  Understanding RSC        │  │
│                             │ └─────────────────────────────────┘  │
├─────────────────────────────┴───────────────────────────────────────┤
│                                              [Cancel] [Add Widget]  │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Widget Registry — `src/lib/widget-registry.ts` (new)

Each widget type declares form metadata alongside its Zod schema. This is the **core engine** of the form-based editor.

```ts
import { ReactNode } from "react";
import { z } from "zod";

// ── Field Definitions ────────────────────────────────────────────────
export type WidgetFieldType =
  | "text"
  | "number"
  | "boolean"
  | "select"
  | "string-array"
  | "nested-widget"   // for TabsWidget recursive tabs
  | "nested-object";  // for GithubWidget sort config

export interface WidgetFieldDefinition {
  name: string;
  label: string;
  type: WidgetFieldType;
  required?: boolean;
  defaultValue?: unknown;
  options?: string[];           // for "select"
  min?: number;                 // for "number"
  max?: number;
  placeholder?: string;
  helpText?: string;
  nestedFields?: WidgetFieldDefinition[];  // for "nested-object"
}

// ── Registry Entry ───────────────────────────────────────────────────
export interface WidgetTypeRegistryEntry {
  type: string;
  label: string;
  icon: ReactNode;
  schema: z.ZodType;
  fields: WidgetFieldDefinition[];
  fakeData: () => unknown;       // static data for preview pane
}

// ── Registry ─────────────────────────────────────────────────────────
export const WIDGET_REGISTRY: Record<string, WidgetTypeRegistryEntry> = { ... };
```

### Example Entries

```ts
// Reddit
{
  type: "reddit",
  label: "Reddit",
  icon: <RedditIcon />,
  schema: RedditWidgetConfigSchema,
  fields: [
    { name: "subreddit", label: "Subreddit", type: "text", required: true, placeholder: "compsci" },
    { name: "sort", label: "Sort", type: "select", options: ["hot", "new", "top", "rising"] },
    { name: "limit", label: "Limit", type: "number", min: 1, max: 20, defaultValue: 5 },
    { name: "hideTitle", label: "Hide Title", type: "boolean", defaultValue: false },
  ],
  fakeData: () => [
    { title: "Sample Post 1", score: 142, url: "#", author: "user1", numComments: 89 },
    { title: "Sample Post 2", score: 56, url: "#", author: "user2", numComments: 34 },
  ],
}

// Weather
{
  type: "weather",
  label: "Weather",
  icon: <WbSunnyIcon />,
  schema: WeatherWidgetConfigSchema,
  fields: [
    { name: "location", label: "Location", type: "text", required: true, placeholder: "Ho Chi Minh City" },
    { name: "forecastDays", label: "Forecast Days", type: "number", min: 1, max: 14, defaultValue: 5 },
    { name: "temperatureUnit", label: "Temperature Unit", type: "select", options: ["C", "F"] },
  ],
  fakeData: () => ({ ... }),
}

// YouTube
{
  type: "youtube",
  label: "YouTube",
  icon: <YouTubeIcon />,
  schema: YoutubeWidgetConfigSchema,
  fields: [
    { name: "channels", label: "Channels", type: "string-array", required: true, placeholder: "@Fireship" },
    { name: "limit", label: "Limit", type: "number", min: 1, max: 50, defaultValue: 16 },
    { name: "scrollAfterRow", label: "Scroll After Row", type: "number", min: 1, defaultValue: 3 },
    { name: "showTitle", label: "Show Title", type: "boolean", defaultValue: true },
  ],
  fakeData: () => ([...]),
}

// GitHub
{
  type: "github",
  label: "GitHub Trending",
  icon: <GitHubIcon />,
  schema: GithubWidgetConfigSchema,
  fields: [
    { name: "language", label: "Language", type: "text", placeholder: "typescript" },
    { name: "dateRange", label: "Date Range", type: "select", options: ["7d", "30d", "90d"] },
    { name: "limit", label: "Limit", type: "number", min: 1, max: 50, defaultValue: 25 },
    { name: "minStars", label: "Min Stars", type: "number", min: 0 },
    { name: "sort", label: "Sort", type: "nested-object", nestedFields: [
      { name: "field", label: "Sort Field", type: "select", options: ["stars", "velocity", "forks", "createdAt"] },
      { name: "direction", label: "Direction", type: "select", options: ["asc", "desc"] },
    ]},
  ],
  fakeData: () => ([...]),
}

// Feed
{
  type: "feed",
  label: "RSS Feed",
  icon: <RssFeedIcon />,
  schema: FeedWidgetConfigSchema,
  fields: [
    { name: "urls", label: "Feed URLs", type: "string-array", required: true, placeholder: "https://blog.cloudflare.com/rss/" },
    { name: "limit", label: "Limit", type: "number", min: 1, defaultValue: 15 },
    { name: "scrollAfterRow", label: "Scroll After Row", type: "number", min: 1, defaultValue: 6 },
    { name: "showTitle", label: "Show Title", type: "boolean", defaultValue: true },
  ],
  fakeData: () => ([...]),
}

// Bookmark
{
  type: "bookmark",
  label: "Bookmarks",
  icon: <BookmarkIcon />,
  schema: BookmarkWidgetConfigSchema,
  fields: [
    { name: "title", label: "Title", type: "text", required: true, placeholder: "Dev Tools" },
    { name: "bookmarks", label: "Bookmarks", type: "string-array", required: true, placeholder: "https://example.com" },
  ],
  fakeData: () => ([...]),
}

// Tabs (recursive — special case)
{
  type: "tabs",
  label: "Tabs Container",
  icon: <TabIcon />,
  schema: TabsWidgetConfigSchema,
  fields: [
    { name: "labels", label: "Tab Labels", type: "string-array", required: true, placeholder: "Tab 1" },
    { name: "tabs", label: "Tab Widgets", type: "nested-widget" },
  ],
  fakeData: () => ({ ... }),
}
```

---

## New Components

### File Structure

```
src/components/config-editor/
  EditModeContainer.tsx         # Top-level: manages pages array + edit/view toggle
  EditablePageTabBar.tsx        # Page tabs with add/rename/delete
  ColumnLayoutEditor.tsx        # "3-6-3" input + visual preview strip
  EditableColumn.tsx            # Widget cards + "+" button per column
  WidgetCard.tsx                # Compact summary card with drag/edit/delete
  WidgetFormDialog.tsx          # Add/Edit dialog (split pane)
  SchemaForm.tsx                # Renders form fields from WidgetFieldDefinition[]
  WidgetPreviewPane.tsx         # Right-side live preview with fake/real toggle
```

### `EditModeContainer` — Top-Level Edit Orchestrator

```tsx
interface EditModeContainerProps {
  onExitEditMode: () => void;
}

function EditModeContainer({ onExitEditMode }: EditModeContainerProps) {
  const { config, updatePreset, activePresetId } = useAppConfig();
  const [draftPages, setDraftPages] = useState<PageConfig[]>(config.ui.pages);
  const [activePageIndex, setActivePageIndex] = useState(0);

  const handleAddPage = () => { ... };
  const handleRenamePage = (index: number, newTitle: string) => { ... };
  const handleDeletePage = (index: number) => { ... };
  const handleUpdatePage = (index: number, updated: PageConfig) => { ... };

  const handleSave = () => {
    const newConfig: AppConfig = {
      ui: { ...config.ui, pages: draftPages },
    };
    // Validate entire config with Zod before committing
    const result = AppConfigSchema.safeParse(newConfig);
    if (!result.success) { /* show error */ return; }
    updatePreset(activePresetId, { config: result.data });
    onExitEditMode();
  };

  const handleCancel = () => {
    setDraftPages(config.ui.pages); // discard draft
    onExitEditMode();
  };

  return (
    <>
      <EditModeAppBar onCancel={handleCancel} onSave={handleSave} />
      <EditablePageTabBar
        pages={draftPages}
        activePageIndex={activePageIndex}
        onSelectPage={setActivePageIndex}
        onAddPage={handleAddPage}
        onRenamePage={handleRenamePage}
        onDeletePage={handleDeletePage}
        onReorderPage={handleReorderPage}
      />
      <ColumnLayoutEditor
        sizes={draftPages[activePageIndex].columns.map(c => c.size)}
        onChange={(sizes) => { ... }}
      />
      <EditableColumnsGrid
        columns={draftPages[activePageIndex].columns}
        onAddWidget={(colIdx) => { ... }}
        onEditWidget={(colIdx, widgetIdx) => { ... }}
        onRemoveWidget={(colIdx, widgetIdx) => { ... }}
        onReorderWidget={(colIdx, fromIdx, toIdx) => { ... }}
      />
    </>
  );
}
```

### `EditablePageTabBar` — Page Tab Management

```tsx
interface EditablePageTabBarProps {
  pages: PageConfig[];
  activePageIndex: number;
  onSelectPage: (index: number) => void;
  onAddPage: () => void;
  onRenamePage: (index: number, newTitle: string) => void;
  onDeletePage: (index: number) => void;
  onReorderPage: (fromIndex: number, toIndex: number) => void;
}

function EditablePageTabBar({ pages, activePageIndex, onAddPage, onReorderPage, ... }: EditablePageTabBarProps) {
  // Each tab: click to select, double-click to rename (inline TextField)
  // Delete icon on hover (disabled if last page)
  // Drag to reorder tabs (horizontal @dnd-kit SortableContext)
  // "+" button at end → adds page with defaults:
  //   { title: "New Page", path: "/new-page-{n}", columns: [{ size: 12, widgets: [] }] }
}
```

**Path handling**: Auto-generate `path` from title via slugify (e.g. `"My Work"` → `"/my-work"`). Validate uniqueness across `draftPages` — if a conflict exists, append a numeric suffix (e.g. `"/my-work-2"`). Path is also editable via a small popover on the tab (nice-to-have for v1, auto-generated is sufficient).

```ts
function slugifyPath(title: string, existingPaths: string[]): string {
  const base = "/" + title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  let path = base;
  let suffix = 2;
  while (existingPaths.includes(path)) {
    path = `${base}-${suffix++}`;
  }
  return path;
}
```

### `ColumnLayoutEditor` — Column Width Control

The layout is **fully freeform**: user can choose any number of columns (1–12) with any widths that sum to 12. Quick preset buttons provide shortcuts for common layouts.

```
Quick layouts: [12] [6-6] [4-4-4] [3-6-3] [2-8-2]     ← pill/chip buttons
Custom:        [________3-6-3________]                  ← freeform text input
               [====25%====|======50%======|====25%====] ← visual strip
```

Examples of valid inputs:
- `12` → 1 full-width column
- `6-6` → 2 equal columns
- `4-8` → 2 columns (33/67)
- `3-6-3` → 3 columns with sidebars
- `3-3-3-3` → 4 equal quarters
- `2-2-2-2-2-2` → 6 equal columns
- `1-10-1` → wide center with thin sidebars

```tsx
const LAYOUT_PRESETS = ["12", "6-6", "4-4-4", "3-6-3", "2-8-2"];

interface ColumnLayoutEditorProps {
  sizes: number[];
  onChange: (sizes: number[]) => void;
}

function ColumnLayoutEditor({ sizes, onChange }: ColumnLayoutEditorProps) {
  const [inputValue, setInputValue] = useState(sizes.join("-")); // e.g. "3-6-3"
  const [error, setError] = useState<string | null>(null);

  // Presets are hardcoded and known-valid, so we skip validation for snappier UX.
  // If LAYOUT_PRESETS is ever made dynamic, route through handleApply instead.
  const applyLayout = (layout: string) => {
    setInputValue(layout);
    const parsed = layout.split("-").map(Number);
    setError(null);
    onChange(parsed);
  };

  const handleApply = () => {
    const parsed = inputValue.split("-").map(Number);
    if (parsed.length < 1 || parsed.length > 12) {
      setError("Must have 1–12 columns");
      return;
    }
    if (parsed.some(isNaN) || parsed.some(n => n < 1 || n > 12)) {
      setError("Each column must be 1-12");
      return;
    }
    if (parsed.reduce((a, b) => a + b, 0) !== 12) {
      setError("Column sizes must sum to 12");
      return;
    }
    setError(null);
    onChange(parsed);
  };

  return (
    <Box>
      {/* Quick preset buttons */}
      <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
        {LAYOUT_PRESETS.map(preset => (
          <Chip
            key={preset}
            label={preset}
            onClick={() => applyLayout(preset)}
            variant={inputValue === preset ? "filled" : "outlined"}
            color={inputValue === preset ? "primary" : "default"}
          />
        ))}
      </Stack>

      {/* Custom input */}
      <TextField
        label="Custom"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onBlur={handleApply}
        onKeyDown={(e) => e.key === "Enter" && handleApply()}
        error={!!error}
        helperText={error ?? "Dash-separated column widths that sum to 12"}
        size="small"
        fullWidth
      />

      {/* Visual proportion strip */}
      <ColumnProportionStrip sizes={sizes} />
    </Box>
  );
}
```

### `EditableColumn` — Per-Column Widget List

```tsx
interface EditableColumnProps {
  columnConfig: ColumnConfig;
  onAddWidget: () => void;
  onEditWidget: (index: number) => void;
  onRemoveWidget: (index: number) => void;
  onReorderWidget: (fromIndex: number, toIndex: number) => void;
}

function EditableColumn({ columnConfig, onAddWidget, onEditWidget, onRemoveWidget, onReorderWidget }: EditableColumnProps) {
  // Wraps widget list in @dnd-kit SortableContext (vertical)
  // Each WidgetCard is a useSortable item
  // On drag end: calls onReorderWidget(oldIndex, newIndex)
  // Renders WidgetCard for each widget + dashed "+ Add Widget" button at bottom
}
```

### `WidgetCard` — Compact Widget Summary

```tsx
interface WidgetCardProps {
  id: string;             // unique ID for @dnd-kit sortable
  config: WidgetConfig;
  onEdit: () => void;
  onDelete: () => void;
}

function WidgetCard({ id, config, onEdit, onDelete }: WidgetCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });

  // Shows: drag handle (⠿, via {...listeners}) | icon + type label + summary text | edit ✏️ | delete ✕
  // The drag handle (⠿) is the only draggable area — prevents accidental drags from clicks
  // Summary text derived from config, e.g.:
  //   Reddit → "r/{subreddit}"
  //   Weather → "{location}"
  //   YouTube → "{channels.length} channels"
  //   Feed → "{urls.length} feeds"
}
```

### `WidgetFormDialog` — Add/Edit Dialog (Split Pane)

```tsx
interface WidgetFormDialogProps {
  open: boolean;
  initialValue?: WidgetConfig;     // undefined = add mode, defined = edit mode
  onSubmit: (config: WidgetConfig) => void;
  onClose: () => void;
}

function WidgetFormDialog({ open, initialValue, onSubmit, onClose }: WidgetFormDialogProps) {
  const [selectedType, setSelectedType] = useState(initialValue?.type ?? "reddit");

  // Initialize form values from initialValue (edit mode) or registry defaults (add mode)
  const [formValues, setFormValues] = useState<Record<string, unknown>>(() => {
    if (initialValue) {
      const { type, ...rest } = initialValue;
      return rest;
    }
    return buildDefaults(WIDGET_REGISTRY[selectedType].fields);
  });

  const [useFakeData, setUseFakeData] = useState(true);
  const [errors, setErrors] = useState<z.ZodIssue[]>([]);

  // Reset form values when widget type changes (add mode only)
  useEffect(() => {
    if (!initialValue) {
      setFormValues(buildDefaults(WIDGET_REGISTRY[selectedType].fields));
      setErrors([]);
    }
  }, [selectedType, initialValue]);

  const registryEntry = WIDGET_REGISTRY[selectedType];

  const handleSubmit = () => {
    const configCandidate = { type: selectedType, ...formValues };
    const result = registryEntry.schema.safeParse(configCandidate);
    if (!result.success) {
      setErrors(result.error.issues);
      return;
    }
    onSubmit(result.data as WidgetConfig);
  };

  return (
    <Dialog open={open} maxWidth="lg" fullWidth>
      <DialogTitle>{initialValue ? "Edit Widget" : "Add Widget"}</DialogTitle>
      <DialogContent sx={{ display: "flex", gap: 2 }}>
        {/* Left: Configure */}
        <Box sx={{ width: "50%" }}>
          <WidgetTypeSelector value={selectedType} onChange={setSelectedType} disabled={!!initialValue} />
          <SchemaForm
            fields={registryEntry.fields}
            values={formValues}
            onChange={setFormValues}
            errors={errors}
          />
        </Box>
        {/* Right: Preview */}
        <Box sx={{ width: "50%" }}>
          <WidgetPreviewPane
            config={{ type: selectedType, ...formValues } as WidgetConfig}
            fakeData={registryEntry.fakeData()}
            useFakeData={useFakeData}
            onToggleFakeData={setUseFakeData}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSubmit}>
          {initialValue ? "Save" : "Add Widget"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
```

### `SchemaForm` — Generic Form Renderer

```tsx
interface SchemaFormProps {
  fields: WidgetFieldDefinition[];
  values: Record<string, unknown>;
  onChange: (values: Record<string, unknown>) => void;
  errors: z.ZodIssue[];
}

function SchemaForm({ fields, values, onChange, errors }: SchemaFormProps) {
  // Maps each WidgetFieldDefinition to an MUI form control:
  //   "text"         → TextField
  //   "number"       → TextField type="number" with inputProps min/max
  //   "boolean"      → FormControlLabel + Switch
  //   "select"       → Select + MenuItems from options[]
  //   "string-array" → Dynamic list: rows of TextField + remove button + "Add" button
  //   "nested-object"→ nested <SchemaForm fields={field.nestedFields} /> in a fieldset
  //   "nested-widget"→ list of mini WidgetFormDialogs (for TabsWidget — limited to 1 level)
  //
  // Error display: match z.ZodIssue.path to field.name, show helperText on the field
  //
  // NOTE: BookmarkWidget has a union type for bookmarks (string | { title, url }).
  // For v1, "string-array" covers the URL-only case which is the common path.
  // Supporting DetailedBookmark ({ title, url }) would need a custom field type
  // or a toggle per bookmark row. Defer to v2 if needed.
}
```

### `WidgetPreviewPane` — Live Widget Preview

```tsx
interface WidgetPreviewPaneProps {
  config: WidgetConfig;
  fakeData: unknown;
  useFakeData: boolean;
  onToggleFakeData: (useFake: boolean) => void;
}

function WidgetPreviewPane({ config, fakeData, useFakeData, onToggleFakeData }: WidgetPreviewPaneProps) {
  // Toggle: [Fake Data ●] [Real Data ○]
  //
  // When useFakeData=true:  render *WidgetInner with static fakeData props
  // When useFakeData=false: render <Widget widgetConfig={config} /> (live fetch)
  //
  // IMPORTANT: Wrap in ErrorBoundary — the preview renders user-controlled config
  // that may be partially invalid. A render crash must not kill the dialog.
  return (
    <Box>
      <ToggleButtonGroup value={useFakeData} exclusive onChange={(_, v) => onToggleFakeData(v)}>
        <ToggleButton value={true}>Fake Data</ToggleButton>
        <ToggleButton value={false}>Real Data</ToggleButton>
      </ToggleButtonGroup>
      <ErrorBoundary fallback={<Alert severity="info">Fill in the form to see a preview</Alert>}>
        {useFakeData
          ? <WidgetInnerByType type={config.type} data={fakeData} />
          : <Widget widgetConfig={config} />
        }
      </ErrorBoundary>
    </Box>
  );
}
```

---

## Edit Mode Toggle — Integration in App Bar

**State ownership**: `isEditMode` lives in the **page-level component** (`src/app/[...path]/page.tsx`), not in the app bar. The app bar can't render `DashboardPage` / `EditModeContainer` — those are sibling content. The app bar receives an `onEditClick` callback.

### Page component (`src/app/[...path]/page.tsx`)

```tsx
const [isEditMode, setIsEditMode] = useState(false);

return (
  <>
    <DashboardAppBar onEditClick={() => setIsEditMode(true)} isEditMode={isEditMode} />
    {isEditMode
      ? <EditModeContainer onExitEditMode={() => setIsEditMode(false)} />
      : <DashboardPage pageConfig={currentPage} />
    }
  </>
);
```

### `DashboardAppBar.tsx` changes

```tsx
// Receives callback from parent — does NOT own isEditMode state
interface DashboardAppBarProps {
  onEditClick: () => void;
  isEditMode: boolean;
}

// In toolbar — replace OpenConfigEditorButton with Edit button:
// OpenConfigEditorButton is removed (it opened the Monaco EditorPanel).
// The new Edit button triggers the visual edit mode instead.
{!isEditMode && (
  <IconButton onClick={onEditClick}>
    <EditIcon />
  </IconButton>
)}
```

### `EditorPanel.tsx` — Transition Plan

During development (Phases 1–4), keep `EditorPanel` functional as a fallback — accessible via a hidden "Advanced" menu item or keyboard shortcut (e.g. `Ctrl+Shift+E`). This allows power users to fall back to raw YAML if the visual editor has gaps. Remove in Phase 5 cleanup along with Monaco.

---

## Handling Column Width Changes

When the user changes column layout (e.g. `"3-6-3"` → `"4-4-4"`), the number of columns may change:

```ts
function reconcileColumns(
  oldColumns: ColumnConfig[],
  newSizes: number[],
): ColumnConfig[] {
  return newSizes.map((size, i) => ({
    size,
    widgets: oldColumns[i]?.widgets ?? [],  // preserve existing widgets, empty for new columns
  }));
}
```

- **Adding columns**: New columns start empty.
- **Removing columns**: Widgets in removed columns are **lost**. Must show a confirmation dialog if any removed column has widgets.
- **Resizing existing columns**: Widgets are preserved, only `size` changes.

```ts
// In ColumnLayoutEditor or EditModeContainer, before calling reconcileColumns:
const removedColumns = oldColumns.slice(newSizes.length);
const hasWidgetsInRemoved = removedColumns.some(col => col.widgets.length > 0);

if (hasWidgetsInRemoved) {
  // Show confirmation: "X widgets in removed columns will be lost. Continue?"
  const confirmed = await showConfirmDialog(...);
  if (!confirmed) return;
}

const reconciled = reconcileColumns(oldColumns, newSizes);
```

---

## The `tabs` Widget — Special Handling

`TabsWidgetConfig` is recursive (tabs contain other widgets). In the form:

1. "Tab Labels" → `string-array` field (dynamic list of text inputs)
2. "Tab Widgets" → For each tab, a button that opens a **nested** `WidgetFormDialog`
3. **Limit nesting to 1 level** in the UI — don't allow tabs-within-tabs

```tsx
// Inside SchemaForm, when field.type === "nested-widget":
function NestedWidgetListField({ ... }) {
  // Renders a list: Label1 → [widgetType summary] [Edit]
  //                 Label2 → [widgetType summary] [Edit]
  // "Edit" opens WidgetFormDialog for that tab's widget (excluding "tabs" from type selector)
}
```

---

## Drag-and-Drop — `@dnd-kit`

Use [`@dnd-kit/core`](https://dndkit.com/) + `@dnd-kit/sortable` for both widget reordering and page tab reordering. It's the modern standard for React DnD — lightweight, accessible, and works well with MUI.

```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

### Widget Reorder (vertical, within same column)

```tsx
// Inside EditableColumn:
<DndContext onDragEnd={handleDragEnd} collisionDetection={closestCenter}>
  <SortableContext items={widgetIds} strategy={verticalListSortingStrategy}>
    {columnConfig.widgets.map((widget, idx) => (
      <WidgetCard key={widgetIds[idx]} id={widgetIds[idx]} config={widget} ... />
    ))}
  </SortableContext>
</DndContext>
```

### Page Tab Reorder (horizontal)

```tsx
// Inside EditablePageTabBar:
<DndContext onDragEnd={handleDragEnd} collisionDetection={closestCenter}>
  <SortableContext items={pageIds} strategy={horizontalListSortingStrategy}>
    {pages.map((page, idx) => (
      <SortableTab key={pageIds[idx]} id={pageIds[idx]} page={page} ... />
    ))}
  </SortableContext>
</DndContext>
```

### Shared array reorder helper

```ts
function arrayMove<T>(arr: T[], from: number, to: number): T[] {
  const result = [...arr];
  const [removed] = result.splice(from, 1);
  result.splice(to, 0, removed);
  return result;
}
```

> **Scope**: v1 supports reorder **within the same column** only. Cross-column drag is out of scope.

---

## Data Flow

```
Enter edit mode:
  User clicks "Edit" → isEditMode=true
  → DashboardPage hidden, EditModeContainer rendered
  → draft state initialized from config.ui.pages

Edit pages:
  [+] button → handleAddPage → adds { title, path, columns: [{ size: 12, widgets: [] }] }
  Double-click tab → inline rename
  Delete icon → confirmation → handleDeletePage (blocked if last page)
  Drag tab → onReorderPage(from, to) → arrayMove(draftPages, from, to)

Edit column layout:
  Input "3-6-3" → ColumnLayoutEditor validates sum=12
  → reconcileColumns preserves widgets, creates empty new columns

Add widget:
  "+" button in column → WidgetFormDialog opens
  → Select type → fill form → preview pane shows result
  → "Add Widget" → Zod validates → widget appended to column

Edit widget:
  ✏️ on widget card → WidgetFormDialog opens with initialValue
  → Edit form → "Save" → Zod validates → widget replaced in column

Delete widget:
  ✕ on widget card → confirmation → widget removed from column

Reorder widgets:
  Drag widget card within column → onReorderWidget(colIdx, from, to)
  → arrayMove(column.widgets, from, to) → draft updated

Save:
  "Save" button → AppConfigSchema.safeParse(fullConfig)
  → updatePreset(activePresetId, { config }) → exits edit mode
  → write-through: localStorage + server (existing sync)

Cancel:
  "Cancel" button → discard draft → exit edit mode
```

---

## What to Remove

After edit mode is fully working, the following become removable:

| File | Reason |
|---|---|
| `src/providers/MonacoProvider.tsx` | No longer needed — no Monaco editor |
| `src/components/app-bar/ConfigEditor.tsx` | Replaced by `WidgetFormDialog` + `SchemaForm` |
| `src/components/app-bar/SchemaDocPanel.tsx` | No longer needed — form IS the schema |
| `src/components/app-bar/OpenConfigEditorButton.tsx` | Replaced by Edit button in app bar |
| `src/components/app-bar/EditorPanel.tsx` | Replaced by `EditModeContainer` |
| `src/lib/widget-snippets.ts` | YAML snippets no longer needed |
| `monaco-yaml` + `monaco-editor` deps | Can be removed from `package.json` |

> **Note**: Keep these until edit mode is fully tested and stable. Remove in a follow-up cleanup PR.

---

## File Change Summary

| File | Action | Description |
|---|---|---|
| `src/lib/widget-registry.ts` | **Create** | Widget registry with field definitions, fake data, schemas |
| `src/components/config-editor/EditModeContainer.tsx` | **Create** | Top-level edit mode orchestrator |
| `src/components/config-editor/EditablePageTabBar.tsx` | **Create** | Editable page tabs with add/rename/delete |
| `src/components/config-editor/ColumnLayoutEditor.tsx` | **Create** | Column width input + visual preview strip |
| `src/components/config-editor/EditableColumn.tsx` | **Create** | Widget list per column + "+" button |
| `src/components/config-editor/WidgetCard.tsx` | **Create** | Compact widget summary card |
| `src/components/config-editor/WidgetFormDialog.tsx` | **Create** | Add/Edit dialog with split pane |
| `src/components/config-editor/SchemaForm.tsx` | **Create** | Generic form renderer from field definitions |
| `src/components/config-editor/WidgetPreviewPane.tsx` | **Create** | Live preview with fake/real data toggle |
| `src/components/app-bar/DashboardAppBar.tsx` | **Modify** | Add "Edit" toggle button |
| `src/components/app-bar/EditorPanel.tsx` | **Modify** | Replace Monaco editor invocation with edit mode toggle (or keep as fallback initially) |
| `src/app/[...path]/page.tsx` (or equivalent) | **Modify** | Conditional render: view mode vs edit mode |

---

## Implementation Order

### Phase 1 — Widget Registry + SchemaForm

1. Create `src/lib/widget-registry.ts` with all 7 widget entries
2. Create `src/components/config-editor/SchemaForm.tsx` — generic form renderer
3. Test: render `SchemaForm` for each widget type in Storybook

### Phase 2 — WidgetFormDialog

4. Create `WidgetFormDialog.tsx` — split-pane dialog
5. Create `WidgetPreviewPane.tsx` — reuse `*WidgetInner` with fake data
6. Test: add/edit widgets through the dialog, verify Zod validation

### Phase 3 — Edit Mode Layout

7. Create `WidgetCard.tsx` — compact widget summary
8. Create `EditableColumn.tsx` — widget list + "+" button
9. Create `ColumnLayoutEditor.tsx` — width input + visual strip
10. Create `EditablePageTabBar.tsx` — page tabs with CRUD

### Phase 4 — Integration

11. Create `EditModeContainer.tsx` — wire all components together
12. Modify `DashboardAppBar.tsx` — add "Edit" button
13. Modify page component — conditional view/edit rendering
14. End-to-end test: full edit → save → verify config persisted

### Phase 5 — Cleanup (separate PR)

15. Remove `MonacoProvider`, `ConfigEditor`, `SchemaDocPanel`, `widget-snippets`
16. Remove `monaco-editor`, `monaco-yaml` from `package.json`

---

## Error Handling

| Scenario | Behavior |
|---|---|
| **Save with invalid config** | `AppConfigSchema.safeParse()` fails → show `Alert` banner at the top of `EditModeContainer` with Zod error messages. Do NOT exit edit mode. |
| **Widget form validation errors** | `registryEntry.schema.safeParse()` fails → map `ZodIssue.path` to field names → show inline `helperText` errors on the corresponding form fields. |
| **Column layout invalid input** | Inline error on the `TextField` via `helperText`. Visual strip stays on the last valid layout. |
| **Preview render crash** | `ErrorBoundary` catches → show fallback `Alert`: "Fill in the form to see a preview". |
| **Empty preset name on save** | Validate `presetName.trim()` is non-empty before committing. Show error on the name field. |
| **Path conflict on page add/rename** | Auto-suffix with number. No user-visible error — handled silently. |

---

## Test Plan

### `src/lib/tests/widget-registry/widget-registry.test.ts`

| Test | Description |
|---|---|
| Each registry entry has a valid schema | `WIDGET_REGISTRY[type].schema` parses successfully with defaults |
| Each registry entry has non-empty fields | `fields.length > 0` for all entries |
| `buildDefaults` produces valid output | For each widget type, `buildDefaults(entry.fields)` + `{ type }` passes `entry.schema.safeParse()` |
| `fakeData()` returns non-null | Smoke test for all entries |

### `src/components/config-editor/tests/schema-form.test.tsx`

| Test | Description |
|---|---|
| Renders text field | `type: "text"` → renders `TextField` with correct label |
| Renders number field with min/max | `type: "number"` → `inputProps` has correct min/max |
| Renders select with options | `type: "select"` → renders `Select` with correct `MenuItem`s |
| Renders boolean as switch | `type: "boolean"` → renders `Switch` |
| Renders string-array with add/remove | `type: "string-array"` → can add rows, remove rows |
| Displays validation errors | Pass `errors` with matching path → field shows `helperText` in error state |

### `src/components/config-editor/tests/column-layout-editor.test.tsx`

| Test | Description |
|---|---|
| Valid input `"3-6-3"` | Calls `onChange([3, 6, 3])`, no error |
| Invalid sum `"3-6-4"` | Shows error "Column sizes must sum to 12", `onChange` NOT called |
| Invalid value `"0-6-6"` | Shows error "Each column must be 1-12" |
| Non-numeric `"a-b-c"` | Shows error |
| Preset button click | Calls `onChange` with correct sizes, updates input value |
| Empty input | Shows error |

### `src/components/config-editor/tests/widget-form-dialog.test.tsx`

| Test | Description |
|---|---|
| Add mode — renders empty form | Opens with no `initialValue`, form fields show defaults |
| Edit mode — populates from `initialValue` | Opens with `initialValue`, form fields match existing config |
| Type change resets form | Switch type in add mode → form values reset to new type's defaults |
| Submit validates with Zod | Submit with invalid values → shows field errors, `onSubmit` NOT called |
| Submit with valid values | `onSubmit` called with Zod-parsed config |

### `src/components/config-editor/tests/reconcile-columns.test.ts`

| Test | Description |
|---|---|
| Same column count, different sizes | Widgets preserved, sizes updated |
| Adding columns | New columns have empty widgets array |
| Removing columns | Removed columns' widgets are dropped |
| Empty old columns | All new columns empty |

### `src/components/config-editor/tests/editable-page-tab-bar.test.tsx`

| Test | Description |
|---|---|
| Add page | Calls `onAddPage`, new page appears |
| Rename page | Double-click → inline edit → calls `onRenamePage` |
| Delete page | Click delete → confirmation → calls `onDeletePage` |
| Cannot delete last page | Delete button disabled when `pages.length === 1` |
| Path uniqueness | Adding two pages with same title produces unique paths |

### Integration test (`EditModeContainer`)

| Test | Description |
|---|---|
| Full flow: add widget → save | Enter edit mode → add widget via dialog → save → config updated in provider |
| Cancel discards changes | Enter edit mode → make changes → cancel → config unchanged |
| Column layout change preserves widgets | Change layout → existing widgets still present |
| Save with invalid config shows error | Corrupt draft → save → error banner shown, does NOT exit edit mode |

---

## Out of Scope

- ❌ Undo/redo within edit mode
- ❌ Copy/paste widgets between columns
- ❌ Drag-and-drop widgets **across columns** (only within same column for v1)
- ❌ Widget templates / presets within edit mode
- ❌ Responsive / mobile edit mode
- ❌ DetailedBookmark ({ title, url }) support in SchemaForm — URL-only bookmarks for v1
- ❌ Accessibility / keyboard navigation in edit mode (defer to follow-up)
