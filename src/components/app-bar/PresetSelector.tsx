"use client";

import { useState, useRef, useEffect } from "react";
import {
    Button,
    Menu,
    MenuItem,
    Divider,
    ListItemText,
    ListItemIcon,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
    Alert,
    Snackbar,
    InputBase,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import FileUploadIcon from "@mui/icons-material/FileUpload";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import CheckIcon from "@mui/icons-material/Check";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import { useAppConfig } from "@/providers/AppConfigProvider";
import { PresetSchema } from "@/infrastructure/config.schemas";
import { isSeedPreset } from "@/lib/presets";
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
    verticalListSortingStrategy,
    useSortable,
    arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// ── Sortable preset menu item ───────────────────────────────────────

interface SortablePresetItemProps {
    presetId: string;
    name: string;
    isActive: boolean;
    isSeed: boolean;
    canDelete: boolean;
    onSelect: () => void;
    onDelete: (e: React.MouseEvent) => void;
    onRename: (newName: string) => void;
    onDuplicate: (e: React.MouseEvent) => void;
}

function SortablePresetItem({
    presetId,
    name,
    isActive,
    isSeed,
    canDelete,
    onSelect,
    onDelete,
    onRename,
    onDuplicate,
}: SortablePresetItemProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState(name);
    const inputRef = useRef<HTMLInputElement>(null);

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: presetId });

    useEffect(() => {
        if (isEditing) {
            inputRef.current?.focus();
            inputRef.current?.select();
        }
    }, [isEditing]);

    const handleEditClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        setEditValue(name);
        setIsEditing(true);
    };

    const handleCommit = () => {
        const trimmed = editValue.trim();
        if (trimmed && trimmed !== name) {
            onRename(trimmed);
        }
        setIsEditing(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") handleCommit();
        if (e.key === "Escape") {
            setEditValue(name);
            setIsEditing(false);
        }
    };

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <MenuItem
            ref={setNodeRef}
            style={style}
            selected={isActive}
            onClick={isEditing ? undefined : onSelect}
            sx={{ gap: 1 }}
        >
            <DragIndicatorIcon
                fontSize="small"
                sx={{ cursor: "grab", color: "text.disabled", mr: -0.5 }}
                {...listeners}
                {...attributes}
            />
            {isEditing ? (
                <InputBase
                    inputRef={inputRef}
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={handleCommit}
                    onKeyDown={handleKeyDown}
                    size="small"
                    sx={{ flex: 1, fontSize: "inherit" }}
                />
            ) : (
                <ListItemText primary={name} data-testid="preset-name" />
            )}
            {isActive && (
                <CheckIcon fontSize="small" color="primary" sx={{ ml: 1 }} />
            )}
            {isSeed && (
                <LockOutlinedIcon
                    fontSize="small"
                    sx={{ color: "text.disabled", ml: 0.5 }}
                />
            )}
            {isSeed && (
                <IconButton
                    size="small"
                    onClick={onDuplicate}
                    edge="end"
                    title="Duplicate to customize"
                >
                    <ContentCopyIcon fontSize="small" />
                </IconButton>
            )}
            {!isSeed && !isEditing && (
                <IconButton
                    size="small"
                    onClick={handleEditClick}
                    edge="end"
                >
                    <EditOutlinedIcon fontSize="small" />
                </IconButton>
            )}
            {!isSeed && canDelete && (
                <IconButton
                    size="small"
                    onClick={onDelete}
                    edge="end"
                    sx={{
                        "&:hover": {
                            color: "error.main",
                        },
                    }}
                >
                    <DeleteOutlineIcon fontSize="small" />
                </IconButton>
            )}
        </MenuItem>
    );
}

// ── PresetSelector ──────────────────────────────────────────────────

export function PresetSelector() {
    const {
        presets,
        activePresetId,
        setActivePresetId,
        createPreset,
        deletePreset,
        reorderPresets,
        importPreset,
        updatePreset,
        duplicatePreset,
    } = useAppConfig();

    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [importError, setImportError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const activePreset = presets.find((p) => p.id === activePresetId);
    const deleteTarget = presets.find((p) => p.id === deleteTargetId);

    // DnD sensors — distance: 5 so clicks pass through
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: { distance: 5 },
        }),
    );

    const handleOpen = (e: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(e.currentTarget);
    };

    const handleClose = () => {
        if (isDragging) return; // prevent close during drag
        setAnchorEl(null);
    };

    const handleSelect = (id: string) => {
        setActivePresetId(id);
        handleClose();
    };

    const handleCreate = () => {
        createPreset();
        handleClose();
    };

    // ── DnD ─────────────────────────────────────────────────────────

    const handleDragStart = () => {
        setIsDragging(true);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        setIsDragging(false);
        const { active, over } = event;
        if (!over || active.id === over.id) return;
        const oldIndex = presets.findIndex((p) => p.id === active.id);
        const newIndex = presets.findIndex((p) => p.id === over.id);
        const reordered = arrayMove(presets, oldIndex, newIndex);
        reorderPresets(reordered.map((p) => p.id));
    };

    const handleDragCancel = () => {
        setIsDragging(false);
    };

    // ── Delete ───────────────────────────────────────────────────────

    const handleDeleteClick = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (presets.length <= 1) return;
        handleClose();
        setDeleteTargetId(id);
    };

    const handleDeleteConfirm = () => {
        if (deleteTargetId) {
            deletePreset(deleteTargetId);
        }
        setDeleteTargetId(null);
    };

    const handleDeleteCancel = () => {
        setDeleteTargetId(null);
    };

    // ── Export ────────────────────────────────────────────────────────

    const handleExport = () => {
        const preset = presets.find((p) => p.id === activePresetId);
        if (!preset) return;
        const { id: _id, ...exportable } = preset;
        const blob = new Blob([JSON.stringify(exportable, null, 2)], {
            type: "application/json",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${preset.name.toLowerCase().replace(/\s+/g, "-")}.json`;
        a.click();
        URL.revokeObjectURL(url);
        handleClose();
    };

    // ── Import ────────────────────────────────────────────────────────

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (
        e: React.ChangeEvent<HTMLInputElement>,
    ) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const text = await file.text();
            const json = JSON.parse(text);
            // Validate against PresetSchema (id will be overridden, so provide a dummy)
            const result = PresetSchema.safeParse({
                id: "temp",
                ...json,
            });
            if (!result.success) {
                const issues = result.error.issues
                    .map((i) => i.message)
                    .join("; ");
                setImportError(`Invalid preset file: ${issues}`);
                return;
            }
            importPreset({
                name: result.data.name,
                config: result.data.config,
            });
            setAnchorEl(null);
        } catch {
            setImportError("Failed to parse file. Ensure it is valid JSON.");
        } finally {
            // Reset file input so the same file can be re-imported
            e.target.value = "";
        }
    };

    return (
        <>
            <Button
                onClick={handleOpen}
                endIcon={<ArrowDropDownIcon />}
                sx={{
                    color: "text.primary",
                    textTransform: "none",
                    fontSize: "0.875rem",
                    "&.Mui-focusVisible": {
                        backgroundColor: "transparent",
                    },
                }}
                size="small"
                data-testid="preset-selector"
            >
                {activePreset?.name ?? "Select Preset"}
            </Button>

            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                onDragCancel={handleDragCancel}
            >
                <Menu
                    anchorEl={anchorEl}
                    open={Boolean(anchorEl)}
                    onClose={handleClose}
                >
                    <SortableContext
                        items={presets.map((p) => p.id)}
                        strategy={verticalListSortingStrategy}
                    >
                        {presets.map((p) => (
                            <SortablePresetItem
                                key={p.id}
                                presetId={p.id}
                                name={p.name}
                                isActive={p.id === activePresetId}
                                isSeed={isSeedPreset(p.id)}
                                canDelete={presets.length > 1}
                                onSelect={() => handleSelect(p.id)}
                                onDelete={(e) => handleDeleteClick(e, p.id)}
                                onRename={(newName) =>
                                    updatePreset(p.id, {
                                        name: newName,
                                    })
                                }
                                onDuplicate={(e) => {
                                    e.stopPropagation();
                                    duplicatePreset(p.id);
                                    handleClose();
                                }}
                            />
                        ))}
                    </SortableContext>

                    <Divider />

                    <MenuItem onClick={handleCreate}>
                        <ListItemIcon>
                            <AddIcon fontSize="small" />
                        </ListItemIcon>
                        <ListItemText primary="New Preset" />
                    </MenuItem>

                    <MenuItem onClick={handleImportClick}>
                        <ListItemIcon>
                            <FileUploadIcon fontSize="small" />
                        </ListItemIcon>
                        <ListItemText primary="Import Preset…" />
                    </MenuItem>

                    <MenuItem onClick={handleExport}>
                        <ListItemIcon>
                            <FileDownloadIcon fontSize="small" />
                        </ListItemIcon>
                        <ListItemText primary="Export Current" />
                    </MenuItem>
                </Menu>
            </DndContext>

            {/* Hidden file input for import */}
            <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                hidden
                onChange={handleFileChange}
            />

            {/* Delete confirmation dialog */}
            <Dialog open={deleteTargetId !== null} onClose={handleDeleteCancel}>
                <DialogTitle>Delete Preset</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Delete &ldquo;{deleteTarget?.name}&rdquo;? This cannot
                        be undone.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleDeleteCancel}>Cancel</Button>
                    <Button
                        onClick={handleDeleteConfirm}
                        color="error"
                        variant="contained"
                    >
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Import error snackbar */}
            <Snackbar
                open={importError !== null}
                autoHideDuration={6000}
                onClose={() => setImportError(null)}
                anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
            >
                <Alert
                    severity="error"
                    onClose={() => setImportError(null)}
                    variant="filled"
                >
                    {importError}
                </Alert>
            </Snackbar>
        </>
    );
}
