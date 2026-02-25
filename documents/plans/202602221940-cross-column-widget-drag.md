# Cross-Column Widget Drag & Drop — Implementation Plan

## Overview

Enable dragging widgets between columns in edit mode. Currently each column has its own isolated `DndContext`, so widgets can only be reordered within a single column. This plan lifts the `DndContext` to the parent `EditModeContainer` so all columns share a single drag context, enabling cross-column movement.

### Decisions

| Decision              | Choice                                                       |
| --------------------- | ------------------------------------------------------------ |
| DndContext location   | `EditModeContainer` (single shared context)                  |
| State update timing   | `onDragOver` for live preview, `onDragEnd` for commit        |
| ID scheme             | `WeakMap<WidgetConfig, string>` via `useRef` — truly stable  |
| Container lookup      | `findContainer()` scans all columns for a given widget ID    |
| Collision detection   | `closestCenter` (existing, works for vertical lists)         |
| Drag overlay          | `DragOverlay` with `WidgetCard` clone                        |
| Cancel behavior       | Snapshot columns on drag start, restore on cancel            |
| New dependencies      | None — uses existing `@dnd-kit/core` + `@dnd-kit/sortable`  |

### Execution Order

```
Step 1 (ID scheme) → Step 2 (handlers) → Step 3 (lift DndContext) → Step 4 (simplify EditableColumn) → Step 5 (verify)
```

---

## Files Changed

| File                    | Change                                                      |
| ----------------------- | ----------------------------------------------------------- |
| `EditModeContainer.tsx` | Lift `DndContext`, add `DragOverlay`, add drag handlers      |
| `EditableColumn.tsx`    | Remove `DndContext`, add `useDroppable`, accept new props    |
| `WidgetCard.tsx`        | No changes                                                  |

**Zero new files, zero new dependencies.**

---

## Step 1: Stable ID Scheme + Helpers

**File**: `EditModeContainer.tsx` (modify)

### Why WeakMap?

Position-based IDs (e.g., `col-0-widget-2`) and counter-based IDs (e.g., `widget-${counter++}` with `useMemo`) both break when `onDragOver` mutates state mid-drag — either the active item's ID no longer points to the correct position, or `useMemo` regenerates all IDs because the `columns` reference changed.

A `WeakMap` keyed on widget **object references** solves this because:
- `handleMoveWidget` uses `.filter()` and `.splice()` which **preserve** the original widget object reference — they move it, not clone it
- `arrayMove` also preserves references
- So the same widget object keeps the same ID regardless of which column it's in

```typescript
// ── Stable widget ID via WeakMap ────────────────────────────────────

/**
 * Returns a function that assigns a stable, unique ID to each widget
 * object. The same object always gets the same ID, even after being
 * moved between columns. Uses WeakMap so IDs follow object identity,
 * not position.
 */
function useStableWidgetIds() {
    const idMapRef = useRef(new WeakMap<WidgetConfig, string>());
    const counterRef = useRef(0);

    const getWidgetId = useCallback((widget: WidgetConfig): string => {
        if (!idMapRef.current.has(widget)) {
            idMapRef.current.set(widget, `widget-${counterRef.current++}`);
        }
        return idMapRef.current.get(widget)!;
    }, []);

    return getWidgetId;
}
```

Usage in component:

```typescript
const getWidgetId = useStableWidgetIds();

// Build per-column ID arrays for SortableContext
const widgetIds = currentPage.columns.map((col) =>
    col.widgets.map((w) => getWidgetId(w))
);
```

### Helpers

```typescript
/**
 * Find which column currently contains a given widget ID.
 */
function findContainer(
    widgetIds: string[][],
    id: string,
): { colIdx: number; widgetIdx: number } | null {
    for (let colIdx = 0; colIdx < widgetIds.length; colIdx++) {
        const widgetIdx = widgetIds[colIdx].indexOf(id);
        if (widgetIdx !== -1) return { colIdx, widgetIdx };
    }
    return null;
}

/**
 * Check if an ID is a column droppable (for empty column drops).
 */
function parseColumnId(id: string): number | null {
    const match = String(id).match(/^column-(\d+)$/);
    return match ? Number(match[1]) : null;
}
```

### ✅ Step 1 Checkpoint

- `useStableWidgetIds` hook compiles
- Same widget object always returns same ID across re-renders
- `findContainer` correctly locates items across columns
- `parseColumnId` handles empty column drops

---

## Step 2: Drag State + Handlers

**File**: `EditModeContainer.tsx` (modify)

### 2.1 — Drag state

```typescript
const [activeId, setActiveId] = useState<string | null>(null);
const lastOverRef = useRef<string | null>(null);
const columnsSnapshotRef = useRef<ColumnConfig[] | null>(null);

// Look up the widget being dragged (for DragOverlay)
const activeWidget = useMemo(() => {
    if (!activeId) return undefined;
    for (const col of currentPage.columns) {
        const widget = col.widgets.find((w) => getWidgetId(w) === activeId);
        if (widget) return widget;
    }
    return undefined;
}, [activeId, currentPage.columns, getWidgetId]);
```

Note: `activeWidget` is derived by scanning columns directly with `getWidgetId`, not through positional `widgetIds` arrays. This avoids any coupling to the ID array lifecycle.

### 2.2 — `handleMoveWidget` (cross-column or same-column)

```typescript
const handleMoveWidget = useCallback((
    fromCol: number,
    fromIdx: number,
    toCol: number,
    toIdx: number,
) => {
    if (fromCol === toCol && fromIdx === toIdx) return;

    updateCurrentPage({
        ...currentPage,
        columns: currentPage.columns.map((col, ci) => {
            if (fromCol === toCol && ci === fromCol) {
                // Same column reorder
                return { ...col, widgets: arrayMove(col.widgets, fromIdx, toIdx) };
            }
            if (ci === fromCol) {
                // Remove from source
                return {
                    ...col,
                    widgets: col.widgets.filter((_, i) => i !== fromIdx),
                };
            }
            if (ci === toCol) {
                // Insert into target — uses the ORIGINAL widget reference
                const movedWidget = currentPage.columns[fromCol].widgets[fromIdx];
                const newWidgets = [...col.widgets];
                newWidgets.splice(toIdx, 0, movedWidget);
                return { ...col, widgets: newWidgets };
            }
            return col;
        }),
    });
}, [currentPage, updateCurrentPage]);
```

**Important**: The moved widget is the same object reference (`currentPage.columns[fromCol].widgets[fromIdx]`), not a clone. This is what makes the WeakMap ID stable across moves.

### 2.3 — `onDragStart` (with snapshot)

```typescript
const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
    lastOverRef.current = null;
    columnsSnapshotRef.current = currentPage.columns; // snapshot for cancel
}, [currentPage.columns]);
```

### 2.4 — `onDragOver` (cross-column live preview)

```typescript
const handleDragOver = useCallback((event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const overId = over.id as string;

    // Guard: skip duplicate events for same target
    if (overId === lastOverRef.current) return;
    lastOverRef.current = overId;

    const from = findContainer(widgetIds, active.id as string);
    if (!from) return;

    // Case 1: over a widget in a different column
    const to = findContainer(widgetIds, overId);
    if (to && from.colIdx !== to.colIdx) {
        handleMoveWidget(from.colIdx, from.widgetIdx, to.colIdx, to.widgetIdx);
        return;
    }

    // Case 2: over an empty column droppable
    const targetColIdx = parseColumnId(overId);
    if (targetColIdx !== null && targetColIdx !== from.colIdx) {
        handleMoveWidget(from.colIdx, from.widgetIdx, targetColIdx, 0);
    }
}, [widgetIds, handleMoveWidget]);
```

### 2.5 — `onDragEnd` (commit final position)

```typescript
const handleDragEnd = useCallback((event: DragEndEvent) => {
    setActiveId(null);
    lastOverRef.current = null;
    columnsSnapshotRef.current = null; // clear snapshot — commit accepted

    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const from = findContainer(widgetIds, active.id as string);
    const to = findContainer(widgetIds, over.id as string);
    if (!from || !to) return;

    // Same-column reorder (cross-column already handled in onDragOver)
    if (from.colIdx === to.colIdx) {
        handleMoveWidget(from.colIdx, from.widgetIdx, to.colIdx, to.widgetIdx);
    }
}, [widgetIds, handleMoveWidget]);
```

### 2.6 — `onDragCancel` (revert to snapshot)

```typescript
const handleDragCancel = useCallback(() => {
    setActiveId(null);
    lastOverRef.current = null;

    // Revert any cross-column moves made during onDragOver
    if (columnsSnapshotRef.current) {
        updateCurrentPage({
            ...currentPage,
            columns: columnsSnapshotRef.current,
        });
        columnsSnapshotRef.current = null;
    }
}, [currentPage, updateCurrentPage]);
```

### ✅ Step 2 Checkpoint

- All handlers compile
- `lastOverRef` guard prevents duplicate `onDragOver` calls
- Empty column drops handled via `parseColumnId`
- Same-column reorder preserved in `onDragEnd`
- Cancel reverts to pre-drag state via snapshot

---

## Step 3: Lift DndContext + Add DragOverlay

**File**: `EditModeContainer.tsx` (modify — render section)

Replace the `<Grid>` section with a wrapping `DndContext`:

```tsx
import {
    DndContext,
    DragOverlay,
    closestCenter,
    type DragStartEvent,
    type DragOverEvent,
    type DragEndEvent,
} from "@dnd-kit/core";

// In render:
<DndContext
    collisionDetection={closestCenter}
    onDragStart={handleDragStart}
    onDragOver={handleDragOver}
    onDragEnd={handleDragEnd}
    onDragCancel={handleDragCancel}
>
    <Grid container spacing={2}>
        {currentPage.columns.map((col, colIdx) => (
            <Grid key={colIdx} size={col.size}>
                <EditableColumn
                    columnId={`column-${colIdx}`}
                    widgetIds={widgetIds[colIdx]}
                    columnConfig={col}
                    onAddWidget={() => handleAddWidget(colIdx)}
                    onEditWidget={(widgetIdx) =>
                        handleEditWidget(colIdx, widgetIdx)
                    }
                    onRemoveWidget={(widgetIdx) =>
                        handleRemoveWidget(colIdx, widgetIdx)
                    }
                />
            </Grid>
        ))}
    </Grid>

    <DragOverlay dropAnimation={null}>
        {activeId && activeWidget ? (
            <WidgetCard
                id={activeId}
                config={activeWidget}
                onEdit={() => {}}
                onDelete={() => {}}
            />
        ) : null}
    </DragOverlay>
</DndContext>
```

Notes:
- `dropAnimation={null}` prevents a jarring snap-back since `onDragOver` already placed the item visually
- `WidgetCard` in overlay uses no-op handlers — it's a visual ghost only

### ✅ Step 3 Checkpoint

- Single `DndContext` wraps all columns
- `DragOverlay` renders the dragged widget's appearance
- No `DndContext` duplication

---

## Step 4: Simplify EditableColumn

**File**: `EditableColumn.tsx` (modify)

Remove `DndContext` (now in parent). Add `useDroppable` so empty columns can receive drops. Accept `widgetIds` and `columnId` as props instead of deriving them internally.

```tsx
"use client";

import { useDroppable } from "@dnd-kit/core";
import {
    SortableContext,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Box, Button } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import type { ColumnConfig, WidgetConfig } from "@/infrastructure/config.schemas";
import { WidgetCard } from "./WidgetCard";

interface EditableColumnProps {
    columnId: string;
    widgetIds: string[];
    columnConfig: ColumnConfig;
    onAddWidget: () => void;
    onEditWidget: (index: number) => void;
    onRemoveWidget: (index: number) => void;
    // REMOVED: onReorderWidget — handled by parent DndContext
}

export function EditableColumn({
    columnId,
    widgetIds,
    columnConfig,
    onAddWidget,
    onEditWidget,
    onRemoveWidget,
}: EditableColumnProps) {
    const { setNodeRef } = useDroppable({ id: columnId });

    return (
        <Box ref={setNodeRef} sx={{ minHeight: 100 }}>
            <SortableContext
                items={widgetIds}
                strategy={verticalListSortingStrategy}
            >
                {columnConfig.widgets.map((widget: WidgetConfig, idx: number) => (
                    <WidgetCard
                        key={widgetIds[idx]}
                        id={widgetIds[idx]}
                        config={widget}
                        onEdit={() => onEditWidget(idx)}
                        onDelete={() => onRemoveWidget(idx)}
                    />
                ))}
            </SortableContext>
            <Button
                fullWidth
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={onAddWidget}
                sx={{
                    mt: 1,
                    borderStyle: "dashed",
                    borderColor: "divider",
                    color: "text.secondary",
                    "&:hover": {
                        borderColor: "primary.main",
                        color: "primary.main",
                        borderStyle: "dashed",
                    },
                }}
            >
                Add Widget
            </Button>
        </Box>
    );
}
```

Key changes from current code:
- **Removed**: `DndContext`, `closestCenter`, `DragEndEvent` imports
- **Removed**: `handleDragEnd` local handler
- **Removed**: `onReorderWidget` prop
- **Added**: `useDroppable` with `columnId` — receives drops when column is empty
- **Added**: `columnId` + `widgetIds` props (computed by parent)

### ✅ Step 4 Checkpoint

- `EditableColumn` no longer owns a `DndContext`
- Compiles with updated props
- `useDroppable` enables empty column as a valid drop target

---

## Step 5: Cleanup + Verification

### 5.1 — Remove unused handler

In `EditModeContainer.tsx`, remove the old `handleReorderWidget` function. It's superseded by `handleMoveWidget` which handles both same-column and cross-column cases.

### 5.2 — Type check

```bash
npx tsc --noEmit
```

### 5.3 — Build check

```bash
bun run build
```

### 5.4 — Manual smoke test

| # | Test case                              | Expected                                         |
|---|----------------------------------------|--------------------------------------------------|
| 1 | Drag widget within same column         | Reorders correctly, same as before                |
| 2 | Drag widget from column 1 to column 2  | Widget moves to column 2, column 1 updates        |
| 3 | Drag widget to empty column            | Widget appears in the empty column                 |
| 4 | Drag widget across 3+ columns          | Each crossing shows live preview, final drop works |
| 5 | Cancel drag (press Escape)             | Widget reverts to original column and position     |
| 6 | Add widget after cross-column drag     | Widget form dialog opens correctly                 |
| 7 | Edit/delete after cross-column drag    | Buttons target the correct widget                  |
| 8 | Save after cross-column moves          | Config persists correctly                          |
| 9 | Single column layout (no cross-column) | Reorder still works as before                      |

### ✅ Step 5 Checkpoint

- Zero type errors
- Build passes
- All 9 smoke test cases pass
- No regressions in existing edit mode features

---

## Issues Addressed

| # | Issue (from review)                                    | Solution                                          |
|---|--------------------------------------------------------|---------------------------------------------------|
| 1 | Counter-based IDs regenerate on every state change     | `WeakMap<WidgetConfig, string>` via `useRef` — ID follows object identity, not position or render cycle |
| 2 | `handleDragCancel` doesn't revert cross-column moves   | `columnsSnapshotRef` captures state on drag start, restores on cancel |
| 3 | `lastOverRef` alone may not prevent position bounce     | Largely mitigated by stable IDs — same widget keeps same ID regardless of column, so dnd-kit's internal tracking stays consistent |
| 4 | `activeWidget` derivation coupled to broken ID scheme   | Derived by scanning columns with `getWidgetId()` directly, not through positional `widgetIds` arrays |

---

## Edge Cases & Mitigations

| Edge Case                        | Handling                                                    |
| -------------------------------- | ----------------------------------------------------------- |
| Drop on empty column             | `useDroppable` on column box + `parseColumnId` in handlers  |
| Duplicate `onDragOver` events    | `lastOverRef` guard skips repeat events for same target     |
| ID invalidation mid-drag         | `WeakMap` IDs follow object identity — immune to positional changes |
| Cancel mid-drag                  | `columnsSnapshotRef` restores pre-drag column state         |
| Rapid cross-column movement      | Each `onDragOver` does clean remove+insert from latest state|
| Drop on "Add Widget" button      | Outside `SortableContext` — ignored by dnd-kit              |
| Widget form dialog during drag   | Dialog state is independent — no conflict                   |
| Widget edited after drag         | Object reference preserved → `getWidgetId` still works. Editing creates a new object via form submit, which gets a new ID — correct behavior since the user is in a new edit cycle |

---

## Estimated Effort

| Step                              | Time     |
| --------------------------------- | -------- |
| Step 1: ID scheme + helpers       | 15 min   |
| Step 2: Drag state + handlers     | 25 min   |
| Step 3: Lift DndContext + overlay  | 15 min   |
| Step 4: Simplify EditableColumn   | 10 min   |
| Step 5: Cleanup + verification    | 15 min   |
| Buffer for edge cases             | 10 min   |
| **Total**                         | **~1.5h** |
