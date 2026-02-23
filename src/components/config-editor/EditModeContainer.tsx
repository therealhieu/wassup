"use client";

import { useState, useCallback, useRef, useMemo } from "react";
import {
    Box,
    Button,
    Alert,
    Grid,
} from "@mui/material";
import {
    DndContext,
    DragOverlay,
    closestCenter,
    type DragStartEvent,
    type DragOverEvent,
    type DragEndEvent,
} from "@dnd-kit/core";
import type {
    AppConfig,
    PageConfig,
    ColumnConfig,
    WidgetConfig,
} from "@/infrastructure/config.schemas";
import { AppConfigSchema } from "@/infrastructure/config.schemas";
import { useAppConfig } from "@/providers/AppConfigProvider";
import { EditablePageTabBar } from "./EditablePageTabBar";
import { ColumnLayoutEditor } from "./ColumnLayoutEditor";
import { EditableColumn } from "./EditableColumn";
import { WidgetFormDialog } from "./WidgetFormDialog";
import { WidgetCard } from "./WidgetCard";

interface EditModeContainerProps {
    onExitEditMode: () => void;
    initialPath?: string;
}

// ── Helpers ──────────────────────────────────────────────────────────

function arrayMove<T>(arr: T[], from: number, to: number): T[] {
    const result = [...arr];
    const [removed] = result.splice(from, 1);
    result.splice(to, 0, removed);
    return result;
}

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

function parseColumnId(id: string): number | null {
    const match = String(id).match(/^column-(\d+)$/);
    return match ? Number(match[1]) : null;
}

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

function slugifyPath(title: string, existingPaths: string[]): string {
    const base =
        "/" +
        title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, "");
    let path = base || "/untitled";
    let suffix = 2;
    while (existingPaths.includes(path)) {
        path = `${base}-${suffix++}`;
    }
    return path;
}

function reconcileColumns(
    oldColumns: ColumnConfig[],
    newSizes: number[],
): ColumnConfig[] {
    return newSizes.map((size, i) => ({
        size,
        widgets: oldColumns[i]?.widgets ?? [],
    }));
}

// ── Component ────────────────────────────────────────────────────────

export function EditModeContainer({ onExitEditMode, initialPath }: EditModeContainerProps) {
    const { config, updatePreset, activePresetId } = useAppConfig();
    const [draftPages, setDraftPages] = useState<PageConfig[]>(
        config.ui.pages,
    );
    const [activePageIndex, setActivePageIndex] = useState(() => {
        if (!initialPath) return 0;
        const idx = config.ui.pages.findIndex((p) => p.path === initialPath);
        return idx >= 0 ? idx : 0;
    });
    const [error, setError] = useState<string | null>(null);

    // Sync draft when preset changes mid-edit
    // Uses React's "adjust state during render" pattern (state, not ref or effect)
    const [prevPresetId, setPrevPresetId] = useState(activePresetId);
    if (prevPresetId !== activePresetId) {
        setPrevPresetId(activePresetId);
        setDraftPages(config.ui.pages);
        setActivePageIndex(0);
        setError(null);
    }

    // Widget form dialog state
    const [widgetDialogOpen, setWidgetDialogOpen] = useState(false);
    const [editingWidgetTarget, setEditingWidgetTarget] = useState<{
        colIdx: number;
        widgetIdx: number;
    } | null>(null);
    const [addWidgetColIdx, setAddWidgetColIdx] = useState<number | null>(
        null,
    );

    const currentPage = draftPages[activePageIndex];

    // ── Drag state ───────────────────────────────────────────────────

    const getWidgetId = useStableWidgetIds();
    const widgetIds = currentPage.columns.map((col) =>
        col.widgets.map((w) => getWidgetId(w))
    );

    const [activeId, setActiveId] = useState<string | null>(null);
    const lastOverRef = useRef<string | null>(null);
    const columnsSnapshotRef = useRef<ColumnConfig[] | null>(null);

    const activeWidget = useMemo(() => {
        if (!activeId) return undefined;
        for (const col of currentPage.columns) {
            const widget = col.widgets.find((w) => getWidgetId(w) === activeId);
            if (widget) return widget;
        }
        return undefined;
    }, [activeId, currentPage.columns, getWidgetId]);

    // ── Page handlers ────────────────────────────────────────────────

    const updateCurrentPage = useCallback((updated: PageConfig) => {
        setDraftPages((pages) =>
            pages.map((p, i) => (i === activePageIndex ? updated : p)),
        );
    }, [activePageIndex]);

    const handleAddPage = () => {
        const existingPaths = draftPages.map((p) => p.path);
        const newPage: PageConfig = {
            title: `Page ${draftPages.length + 1}`,
            path: slugifyPath(
                `Page ${draftPages.length + 1}`,
                existingPaths,
            ),
            columns: [{ size: 12, widgets: [] }],
        };
        setDraftPages([...draftPages, newPage]);
        setActivePageIndex(draftPages.length);
    };

    const handleRenamePage = (index: number, newTitle: string) => {
        setDraftPages((pages) =>
            pages.map((p, i) => {
                if (i !== index) return p;
                const existingPaths = pages
                    .filter((_, j) => j !== index)
                    .map((pg) => pg.path);
                return {
                    ...p,
                    title: newTitle,
                    path: slugifyPath(newTitle, existingPaths),
                };
            }),
        );
    };

    const handleDeletePage = (index: number) => {
        if (draftPages.length <= 1) return;
        const newLength = draftPages.length - 1;
        setDraftPages((pages) => pages.filter((_, i) => i !== index));
        // If we deleted the active page or a page before it, adjust the index
        if (activePageIndex >= newLength) {
            setActivePageIndex(newLength - 1);
        } else if (activePageIndex > index) {
            setActivePageIndex(activePageIndex - 1);
        }
    };

    const handleReorderPage = (from: number, to: number) => {
        setDraftPages((pages) => arrayMove(pages, from, to));
        // Keep active page focused
        if (activePageIndex === from) {
            setActivePageIndex(to);
        } else if (
            activePageIndex > from &&
            activePageIndex <= to
        ) {
            setActivePageIndex(activePageIndex - 1);
        } else if (
            activePageIndex < from &&
            activePageIndex >= to
        ) {
            setActivePageIndex(activePageIndex + 1);
        }
    };

    // ── Column layout handler ────────────────────────────────────────

    const handleLayoutChange = (newSizes: number[]) => {
        const oldColumns = currentPage.columns;
        const removedColumns = oldColumns.slice(newSizes.length);
        const hasWidgetsInRemoved = removedColumns.some(
            (col) => col.widgets.length > 0,
        );

        if (hasWidgetsInRemoved) {
            const widgetCount = removedColumns.reduce(
                (sum, col) => sum + col.widgets.length,
                0,
            );
            if (
                !window.confirm(
                    `${widgetCount} widget(s) in removed columns will be lost. Continue?`,
                )
            ) {
                return;
            }
        }

        updateCurrentPage({
            ...currentPage,
            columns: reconcileColumns(oldColumns, newSizes),
        });
    };

    // ── Widget handlers ──────────────────────────────────────────────

    const handleAddWidget = (colIdx: number) => {
        setAddWidgetColIdx(colIdx);
        setEditingWidgetTarget(null);
        setWidgetDialogOpen(true);
    };

    const handleEditWidget = (colIdx: number, widgetIdx: number) => {
        setEditingWidgetTarget({ colIdx, widgetIdx });
        setAddWidgetColIdx(null);
        setWidgetDialogOpen(true);
    };

    const handleRemoveWidget = (colIdx: number, widgetIdx: number) => {
        updateCurrentPage({
            ...currentPage,
            columns: currentPage.columns.map((col, ci) =>
                ci === colIdx
                    ? {
                        ...col,
                        widgets: col.widgets.filter(
                            (_, wi) => wi !== widgetIdx,
                        ),
                    }
                    : col,
            ),
        });
    };

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
                    return { ...col, widgets: arrayMove(col.widgets, fromIdx, toIdx) };
                }
                if (ci === fromCol) {
                    return {
                        ...col,
                        widgets: col.widgets.filter((_, i) => i !== fromIdx),
                    };
                }
                if (ci === toCol) {
                    const movedWidget = currentPage.columns[fromCol].widgets[fromIdx];
                    const newWidgets = [...col.widgets];
                    newWidgets.splice(toIdx, 0, movedWidget);
                    return { ...col, widgets: newWidgets };
                }
                return col;
            }),
        });
    }, [currentPage, updateCurrentPage]);

    // ── Drag event handlers ──────────────────────────────────────────

    const handleDragStart = useCallback((event: DragStartEvent) => {
        setActiveId(event.active.id as string);
        lastOverRef.current = null;
        columnsSnapshotRef.current = currentPage.columns;
    }, [currentPage.columns]);

    const handleDragOver = useCallback((event: DragOverEvent) => {
        const { active, over } = event;
        if (!over) return;

        const overId = over.id as string;
        if (overId === lastOverRef.current) return;
        lastOverRef.current = overId;

        const from = findContainer(widgetIds, active.id as string);
        if (!from) return;

        // Over a widget in a different column
        const to = findContainer(widgetIds, overId);
        if (to && from.colIdx !== to.colIdx) {
            handleMoveWidget(from.colIdx, from.widgetIdx, to.colIdx, to.widgetIdx);
            return;
        }

        // Over an empty column droppable
        const targetColIdx = parseColumnId(overId);
        if (targetColIdx !== null && targetColIdx !== from.colIdx) {
            handleMoveWidget(from.colIdx, from.widgetIdx, targetColIdx, 0);
        }
    }, [widgetIds, handleMoveWidget]);

    const handleDragEnd = useCallback((event: DragEndEvent) => {
        setActiveId(null);
        lastOverRef.current = null;
        columnsSnapshotRef.current = null;

        const { active, over } = event;
        if (!over || active.id === over.id) return;

        const from = findContainer(widgetIds, active.id as string);
        const to = findContainer(widgetIds, over.id as string);
        if (!from || !to) return;

        if (from.colIdx === to.colIdx) {
            handleMoveWidget(from.colIdx, from.widgetIdx, to.colIdx, to.widgetIdx);
        }
    }, [widgetIds, handleMoveWidget]);

    const handleDragCancel = useCallback(() => {
        setActiveId(null);
        lastOverRef.current = null;
        if (columnsSnapshotRef.current) {
            updateCurrentPage({
                ...currentPage,
                columns: columnsSnapshotRef.current,
            });
            columnsSnapshotRef.current = null;
        }
    }, [currentPage, updateCurrentPage]);

    const handleWidgetFormSubmit = (widgetConfig: WidgetConfig) => {
        if (editingWidgetTarget) {
            // Edit mode
            const { colIdx, widgetIdx } = editingWidgetTarget;
            updateCurrentPage({
                ...currentPage,
                columns: currentPage.columns.map((col, ci) =>
                    ci === colIdx
                        ? {
                            ...col,
                            widgets: col.widgets.map((w, wi) =>
                                wi === widgetIdx ? widgetConfig : w,
                            ),
                        }
                        : col,
                ),
            });
        } else if (addWidgetColIdx !== null) {
            // Add mode
            updateCurrentPage({
                ...currentPage,
                columns: currentPage.columns.map((col, ci) =>
                    ci === addWidgetColIdx
                        ? { ...col, widgets: [...col.widgets, widgetConfig] }
                        : col,
                ),
            });
        }
        setWidgetDialogOpen(false);
    };

    // ── Save / Cancel ────────────────────────────────────────────────

    const handleSave = () => {
        const newConfig: AppConfig = {
            ui: { ...config.ui, pages: draftPages },
        };
        const result = AppConfigSchema.safeParse(newConfig);
        if (!result.success) {
            setError(
                result.error.issues.map((i) => i.message).join("; "),
            );
            return;
        }
        setError(null);
        updatePreset(activePresetId, { config: result.data });
        onExitEditMode();
    };

    const handleCancel = () => {
        onExitEditMode();
    };

    // ── Get initialValue for edit dialog ─────────────────────────────

    const editingWidget = editingWidgetTarget
        ? currentPage.columns[editingWidgetTarget.colIdx]?.widgets[
        editingWidgetTarget.widgetIdx
        ]
        : undefined;

    return (
        <Box sx={{ p: 1 }}>
            {/* Top bar */}
            <Box
                sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 2,
                }}
            >
                <EditablePageTabBar
                    pages={draftPages}
                    activePageIndex={activePageIndex}
                    onSelectPage={setActivePageIndex}
                    onAddPage={handleAddPage}
                    onRenamePage={handleRenamePage}
                    onDeletePage={handleDeletePage}
                    onReorderPage={handleReorderPage}
                />
                <Box sx={{ display: "flex", gap: 1, flexShrink: 0 }}>
                    <Button onClick={handleCancel}>Cancel</Button>
                    <Button variant="contained" onClick={handleSave}>
                        Save
                    </Button>
                </Box>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            {/* Column layout editor */}
            <ColumnLayoutEditor
                sizes={currentPage.columns.map((c) => c.size)}
                onChange={handleLayoutChange}
            />

            {/* Editable columns grid */}
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
                            onEdit={() => { }}
                            onDelete={() => { }}
                        />
                    ) : null}
                </DragOverlay>
            </DndContext>

            {/* Widget form dialog */}
            <WidgetFormDialog
                open={widgetDialogOpen}
                initialValue={editingWidget}
                onSubmit={handleWidgetFormSubmit}
                onClose={() => setWidgetDialogOpen(false)}
            />
        </Box>
    );
}
