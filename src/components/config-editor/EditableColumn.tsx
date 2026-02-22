"use client";

import {
    DndContext,
    closestCenter,
    type DragEndEvent,
} from "@dnd-kit/core";
import {
    SortableContext,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Box, Button } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import type { ColumnConfig, WidgetConfig } from "@/infrastructure/config.schemas";
import { WidgetCard } from "./WidgetCard";

interface EditableColumnProps {
    columnConfig: ColumnConfig;
    onAddWidget: () => void;
    onEditWidget: (index: number) => void;
    onRemoveWidget: (index: number) => void;
    onReorderWidget: (fromIndex: number, toIndex: number) => void;
}

export function EditableColumn({
    columnConfig,
    onAddWidget,
    onEditWidget,
    onRemoveWidget,
    onReorderWidget,
}: EditableColumnProps) {
    const widgetIds = columnConfig.widgets.map(
        (w: WidgetConfig, i: number) => `${w.type}-${i}`,
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;
        const from = widgetIds.indexOf(active.id as string);
        const to = widgetIds.indexOf(over.id as string);
        if (from !== -1 && to !== -1) {
            onReorderWidget(from, to);
        }
    };

    return (
        <Box sx={{ minHeight: 100 }}>
            <DndContext onDragEnd={handleDragEnd} collisionDetection={closestCenter}>
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
            </DndContext>
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
