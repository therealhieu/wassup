"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Box, IconButton, Typography } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import CloseIcon from "@mui/icons-material/Close";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import type { WidgetConfig } from "@/infrastructure/config.schemas";
import { getWidgetSummary, WIDGET_REGISTRY } from "@/lib/widget-registry";

interface WidgetCardProps {
    id: string;
    config: WidgetConfig;
    onEdit: () => void;
    onDelete: () => void;
}

export function WidgetCard({ id, config, onEdit, onDelete }: WidgetCardProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    const label = WIDGET_REGISTRY[config.type]?.label ?? config.type;
    const summary = getWidgetSummary(config);

    return (
        <Box
            ref={setNodeRef}
            style={style}
            {...attributes}
            sx={{
                display: "flex",
                alignItems: "center",
                gap: 0.5,
                p: 1,
                mb: 0.5,
                border: 1,
                borderColor: "divider",
                borderRadius: 1,
                bgcolor: "background.paper",
                "&:hover": { borderColor: "primary.main" },
            }}
        >
            <Box
                {...listeners}
                sx={{ cursor: "grab", display: "flex", color: "text.secondary" }}
            >
                <DragIndicatorIcon fontSize="small" />
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="body2" fontWeight={500} noWrap>
                    {label}
                </Typography>
                <Typography variant="caption" color="text.secondary" noWrap>
                    {summary}
                </Typography>
            </Box>
            <IconButton size="small" onClick={onEdit}>
                <EditIcon fontSize="small" />
            </IconButton>
            <IconButton
                size="small"
                onClick={onDelete}
                sx={{ "&:hover": { color: "error.main" } }}
            >
                <CloseIcon fontSize="small" />
            </IconButton>
        </Box>
    );
}
