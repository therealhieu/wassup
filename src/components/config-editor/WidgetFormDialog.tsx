"use client";

import { useState, useEffect } from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Box,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Alert,
} from "@mui/material";
import type { ZodIssue } from "zod";
import type { WidgetConfig } from "@/infrastructure/config.schemas";
import {
    WIDGET_REGISTRY,
    WIDGET_TYPES,
    buildDefaults,
} from "@/lib/widget-registry";
import { SchemaForm } from "./SchemaForm";
import { WidgetPreviewPane } from "./WidgetPreviewPane";

interface WidgetFormDialogProps {
    open: boolean;
    initialValue?: WidgetConfig;
    onSubmit: (config: WidgetConfig) => void;
    onClose: () => void;
}

export function WidgetFormDialog({
    open,
    initialValue,
    onSubmit,
    onClose,
}: WidgetFormDialogProps) {
    const [selectedType, setSelectedType] = useState(
        initialValue?.type ?? "reddit",
    );

    const [formValues, setFormValues] = useState<Record<string, unknown>>(
        () => {
            if (initialValue) {
                const { type: _, ...rest } = initialValue;
                return rest as Record<string, unknown>;
            }
            return buildDefaults(WIDGET_REGISTRY[selectedType].fields);
        },
    );

    const [errors, setErrors] = useState<ZodIssue[]>([]);

    // Reset when dialog opens/closes
    useEffect(() => {
        if (open) {
            const type = initialValue?.type ?? "reddit";
            setSelectedType(type);
            if (initialValue) {
                const { type: _, ...rest } = initialValue;
                setFormValues(rest as Record<string, unknown>);
            } else {
                setFormValues(buildDefaults(WIDGET_REGISTRY[type].fields));
            }
            setErrors([]);
        }
    }, [open, initialValue]);

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

    // Build preview config
    const previewConfig = {
        type: selectedType,
        ...formValues,
    } as WidgetConfig;

    return (
        <Dialog open={open} maxWidth="lg" fullWidth onClose={onClose}>
            <DialogTitle>
                {initialValue ? "Edit Widget" : "Add Widget"}
            </DialogTitle>
            <DialogContent sx={{ display: "flex", gap: 2, minHeight: 400 }}>
                {/* Left: Configure */}
                <Box sx={{ width: "50%", display: "flex", flexDirection: "column" }}>
                    <FormControl size="small" fullWidth sx={{ mt: 5, mb: 2 }}>
                        <InputLabel shrink>Widget Type</InputLabel>
                        <Select
                            value={selectedType}
                            onChange={(e) => setSelectedType(e.target.value)}
                            label="Widget Type"
                            disabled={!!initialValue}
                        >
                            {WIDGET_TYPES.map((type) => (
                                <MenuItem key={type} value={type}>
                                    {WIDGET_REGISTRY[type].label}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <SchemaForm
                        fields={registryEntry.fields}
                        values={formValues}
                        onChange={setFormValues}
                        errors={errors}
                    />
                    {errors.length > 0 && (
                        <Alert severity="error" sx={{ mt: 2 }}>
                            {errors.map((e) => e.message).join("; ")}
                        </Alert>
                    )}
                </Box>

                <Box
                    sx={{
                        width: "50%",
                        borderLeft: 1,
                        borderColor: "divider",
                        pl: 2,
                        overflow: "auto",
                    }}
                >
                    <WidgetPreviewPane config={previewConfig} />
                </Box>
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
                <Button onClick={onClose}>Cancel</Button>
                <Button variant="contained" onClick={handleSubmit}>
                    {initialValue ? "Save" : "Add Widget"}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
