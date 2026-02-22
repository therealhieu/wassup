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
