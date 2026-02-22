"use client";

import { useState } from "react";
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
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import { useAppConfig } from "@/providers/AppConfigProvider";

export function PresetSelector() {
    const {
        presets,
        activePresetId,
        setActivePresetId,
        createPreset,
        deletePreset,
    } = useAppConfig();

    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

    const activePreset = presets.find((p) => p.id === activePresetId);
    const deleteTarget = presets.find((p) => p.id === deleteTargetId);

    const handleOpen = (e: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(e.currentTarget);
    };

    const handleClose = () => {
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

    return (
        <>
            <Button
                onClick={handleOpen}
                endIcon={<ArrowDropDownIcon />}
                sx={{
                    color: "text.primary",
                    textTransform: "none",
                    fontSize: "0.875rem",
                }}
                size="small"
            >
                {activePreset?.name ?? "Select Preset"}
            </Button>
            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleClose}
            >
                {presets.map((p) => (
                    <MenuItem
                        key={p.id}
                        selected={p.id === activePresetId}
                        onClick={() => handleSelect(p.id)}
                        sx={{ justifyContent: "space-between", gap: 2 }}
                    >
                        <ListItemText primary={p.name} />
                        {presets.length > 1 && (
                            <IconButton
                                size="small"
                                onClick={(e) => handleDeleteClick(e, p.id)}
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
                ))}
                <Divider />
                <MenuItem onClick={handleCreate}>
                    <ListItemIcon>
                        <AddIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary="New Preset" />
                </MenuItem>
            </Menu>

            <Dialog open={deleteTargetId !== null} onClose={handleDeleteCancel}>
                <DialogTitle>Delete Preset</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Delete &ldquo;{deleteTarget?.name}&rdquo;? This cannot be undone.
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
        </>
    );
}
