"use client";

import { useState, useRef, useEffect } from "react";
import {
    DndContext,
    closestCenter,
    PointerSensor,
    useSensor,
    useSensors,
    type DragEndEvent,
} from "@dnd-kit/core";
import {
    SortableContext,
    horizontalListSortingStrategy,
    useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
    Box,
    Button,
    IconButton,
    TextField,
    Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import type { PageConfig } from "@/infrastructure/config.schemas";

interface EditablePageTabBarProps {
    pages: PageConfig[];
    activePageIndex: number;
    onSelectPage: (index: number) => void;
    onAddPage: () => void;
    onRenamePage: (index: number, newTitle: string) => void;
    onDeletePage: (index: number) => void;
    onReorderPage: (fromIndex: number, toIndex: number) => void;
}

export function EditablePageTabBar({
    pages,
    activePageIndex,
    onSelectPage,
    onAddPage,
    onRenamePage,
    onDeletePage,
    onReorderPage,
}: EditablePageTabBarProps) {
    const pageIds = pages.map((_, i) => `page-${i}`);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: { distance: 5 },
        }),
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;
        const from = pageIds.indexOf(active.id as string);
        const to = pageIds.indexOf(over.id as string);
        if (from !== -1 && to !== -1) {
            onReorderPage(from, to);
        }
    };

    return (
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 2 }}>
            <DndContext
                sensors={sensors}
                onDragEnd={handleDragEnd}
                collisionDetection={closestCenter}
            >
                <SortableContext
                    items={pageIds}
                    strategy={horizontalListSortingStrategy}
                >
                    {pages.map((page, idx) => (
                        <SortablePageTab
                            key={pageIds[idx]}
                            id={pageIds[idx]}
                            page={page}
                            isActive={idx === activePageIndex}
                            canDelete={pages.length > 1}
                            onClick={() => onSelectPage(idx)}
                            onRename={(title) => onRenamePage(idx, title)}
                            onDelete={() => onDeletePage(idx)}
                        />
                    ))}
                </SortableContext>
            </DndContext>
            <IconButton size="small" onClick={onAddPage} color="primary">
                <AddIcon />
            </IconButton>
        </Box>
    );
}

// ── Sortable Page Tab ────────────────────────────────────────────────

interface SortablePageTabProps {
    id: string;
    page: PageConfig;
    isActive: boolean;
    canDelete: boolean;
    onClick: () => void;
    onRename: (title: string) => void;
    onDelete: () => void;
}

function SortablePageTab({
    id,
    page,
    isActive,
    canDelete,
    onClick,
    onRename,
    onDelete,
}: SortablePageTabProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState(page.title);
    const inputRef = useRef<HTMLInputElement>(null);

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

    useEffect(() => {
        if (isEditing) {
            inputRef.current?.focus();
            inputRef.current?.select();
        }
    }, [isEditing]);

    const handleCommitRename = () => {
        const trimmed = editValue.trim();
        if (trimmed && trimmed !== page.title) {
            onRename(trimmed);
        }
        setIsEditing(false);
    };

    if (isEditing) {
        return (
            <TextField
                inputRef={inputRef}
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={handleCommitRename}
                onKeyDown={(e) => {
                    if (e.key === "Enter") handleCommitRename();
                    if (e.key === "Escape") setIsEditing(false);
                }}
                size="small"
                sx={{ width: 120 }}
            />
        );
    }

    return (
        <Box
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            onClick={onClick}
            onDoubleClick={() => {
                setEditValue(page.title);
                setIsEditing(true);
            }}
            sx={{
                display: "flex",
                alignItems: "center",
                gap: 0.5,
                px: 1.5,
                py: 0.5,
                borderRadius: 1,
                cursor: "pointer",
                border: 1,
                borderColor: isActive ? "primary.main" : "divider",
                bgcolor: isActive ? "primary.main" : "transparent",
                color: isActive ? "primary.contrastText" : "text.primary",
                "&:hover": {
                    borderColor: "primary.main",
                },
                userSelect: "none",
            }}
        >
            <Typography variant="body2" noWrap>
                {page.title}
            </Typography>
            {canDelete && (
                <IconButton
                    size="small"
                    onClick={(e) => {
                        e.stopPropagation();
                        onDelete();
                    }}
                    sx={{
                        p: 0,
                        ml: 0.5,
                        color: "inherit",
                        opacity: 0.6,
                        "&:hover": { opacity: 1, color: "error.main" },
                    }}
                >
                    <CloseIcon sx={{ fontSize: 14 }} />
                </IconButton>
            )}
        </Box>
    );
}
