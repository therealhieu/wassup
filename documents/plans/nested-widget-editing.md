# Nested Widget Editing (Tabs Container)

## Problem

When editing a Tabs Container widget, the `WidgetFormDialog` only allows editing tab labels. The child widgets (e.g. GitHub, Reddit) inside each tab cannot be configured — the form shows a placeholder text instead. Users must manually edit JSON or recreate tabs from scratch.

## Goal

Enable inline editing of child widgets within the Tabs Container edit dialog. Each tab entry shows its label, a widget type selector, and the child widget's configuration fields — all within the same dialog.

## UI Design

```
┌──────────────────────────────────────────────────────┐
│ Edit Widget                                     ✕    │
├──────────────────────────┬───────────────────────────┤
│ Widget Type              │                           │
│ [Tabs Container ▾]       │       Preview             │
│ (disabled)               │                           │
│                          │  ┌─AI/LLM─DevTools─Rust─┐ │
│ Label: [AI / LLM   ] 🗑  │  │                       │ │
│ Widget: [GitHub    ▾ ]   │  │  GitHub Trending      │ │
│ Topics: [llm] [rag]     │  │  ...repos...          │ │
│ Date Range: [90d ▾]     │  │                       │ │
│ Limit: [20      ]       │  └───────────────────────┘ │
│ ─────────────────────    │                           │
│ Label: [DevTools   ] 🗑  │                           │
│ Widget: [GitHub    ▾ ]   │                           │
│ Topics: [cli] [devops]  │                           │
│ Date Range: [90d ▾]     │                           │
│ Limit: [20      ]       │                           │
│ ─────────────────────    │                           │
│ Label: [Rust       ] 🗑  │                           │
│ Widget: [GitHub    ▾ ]   │                           │
│ Topics: [rust] [wasm]   │                           │
│ Date Range: [90d ▾]     │                           │
│ Limit: [20      ]       │                           │
│                          │                           │
│ [+ Add Tab]              │                           │
├──────────────────────────┴───────────────────────────┤
│                           [Cancel]  [Save]           │
└──────────────────────────────────────────────────────┘
```

- No section titles like "Tab 1", "Tab 2"
- No collapsible "Configure" toggle — all fields always visible
- Each tab section: **Label** input + delete icon → **Widget Type** dropdown → config fields (at the same level)
- Sections separated by thin dividers
- "+ Add Tab" appends a new tab with default label and widget type
- Delete icon removes both the label and its child widget
- Changing widget type resets that tab's config to the new type's defaults

## Files to Change

### 1. `src/lib/widget-registry.ts`

**No changes needed.** The `labels` (string-array) and `tabs` (nested-widget) fields remain as-is. The special rendering is handled entirely in `SchemaForm.tsx`.

One addition: update `buildDefaults` to handle `nested-widget` fields with a sensible default so that "Add Widget → Tabs Container" creates a valid initial state:

```tsx
// In buildDefaults, add:
case "nested-widget":
    result[field.name] = [{ type: "reddit", ...buildDefaults(WIDGET_REGISTRY["reddit"].fields) }];
```

### 2. `src/components/config-editor/SchemaForm.tsx` (main change)

**Current**: The `nested-widget` case renders a placeholder:
```tsx
case "nested-widget":
    return (
        <Typography variant="body2" color="text.secondary" sx={{ fontStyle: "italic" }}>
            Tab widgets are configured after adding — edit each tab individually.
        </Typography>
    );
```

**Change**: Replace with a `TabsEditorField` component.

**Wiring**: In `SchemaForm`, before the `fields.map(...)`, check if the fields contain a `nested-widget` type. If so, render the full `TabsEditorField` instead of individual `FieldRenderer` calls. This avoids rendering `labels` and `tabs` as separate fields.

```tsx
// In SchemaForm, before fields.map:
const hasNestedWidget = fields.some((f) => f.type === "nested-widget");
if (hasNestedWidget) {
    return (
        <TabsEditorField
            labels={(values.labels as string[]) ?? []}
            tabs={(values.tabs as WidgetConfig[]) ?? []}
            onChange={(labels, tabs) => onChange({ ...values, labels, tabs })}
        />
    );
}
```

**`TabsEditorField` component**:

```tsx
// Helper to strip `type` from a widget config for SchemaForm values
function stripType(config: WidgetConfig): Record<string, unknown> {
    const { type: _, ...rest } = config;
    return rest as Record<string, unknown>;
}

function TabsEditorField({ labels, tabs, onChange }: {
    labels: string[];
    tabs: WidgetConfig[];
    onChange: (labels: string[], tabs: WidgetConfig[]) => void;
}) {
    const updateLabel = (idx: number, value: string) => { ... };
    const updateTabType = (idx: number, newType: string) => { ... };
    const updateTabConfig = (idx: number, values: Record<string, unknown>) => { ... };
    const addTab = () => { ... };
    const deleteTab = (idx: number) => { ... };

    return (
        <Box>
            {labels.map((label, i) => (
                <Box key={i}>
                    <Divider />
                    {/* Label input + delete */}
                    <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                        <TextField label="Label" value={label} onChange={...} />
                        <IconButton onClick={() => deleteTab(i)}><DeleteIcon /></IconButton>
                    </Box>

                    {/* Widget type dropdown */}
                    <FormControl>
                        <Select value={tabs[i].type} onChange={(e) => updateTabType(i, e.target.value)}>
                            {WIDGET_TYPES.filter(t => t !== "tabs").map(...)}
                        </Select>
                    </FormControl>

                    {/* Child widget config fields — always visible, same level */}
                    <SchemaForm
                        fields={WIDGET_REGISTRY[tabs[i].type].fields}
                        values={stripType(tabs[i])}
                        onChange={(updated) => updateTabConfig(i, updated)}
                        errors={[]}
                    />
                </Box>
            ))}
            <Button startIcon={<AddIcon />} onClick={addTab}>Add Tab</Button>
        </Box>
    );
}
```

### 3. `src/components/config-editor/WidgetFormDialog.tsx`

**No changes needed.** `handleSubmit` already collects `{ type: selectedType, ...formValues }` which includes both `labels` and `tabs`. The `TabsEditorField` updates `formValues.tabs` with full `WidgetConfig` objects (including `type`), so validation via `TabsWidgetConfigSchema` works as-is.

## Implementation Steps

1. **Create `TabsEditorField` component** in `SchemaForm.tsx` (or as separate file)
   - Renders paired label + widget type + config for each tab
   - Config fields always visible at the same level as widget type (no collapsible toggle)
   - Handles add/delete tabs
   - Changing widget type resets that tab's config to defaults

2. **Update `SchemaForm` rendering logic**
   - When rendering fields for a `tabs` widget, detect the `labels` + `tabs` pair
   - Replace individual field renderers with `TabsEditorField`
   - Pass combined `labels` and `tabs` values and change handlers

3. **Handle form values in `WidgetFormDialog`**
   - Ensure `tabs` array items include the `type` field (e.g. `{ type: "github", topics: [...], ... }`)
   - Validation: `TabsWidgetConfigSchema` already validates `labels.length === tabs.length`

4. **Edge cases**
   - Adding a tab: append to both `labels` and `tabs` arrays
   - Deleting a tab: remove from both arrays at the same index
   - Changing widget type: replace tab config with `{ type: newType, ...buildDefaults(newTypeFields) }`
   - Filter out `tabs` from the widget type dropdown (prevent recursive nesting)
   - Minimum 1 tab required

5. **Build & verify**
   - `npx tsc --noEmit`
   - Visual test: edit a Tabs Container, modify child widget config, save, verify changes persist
