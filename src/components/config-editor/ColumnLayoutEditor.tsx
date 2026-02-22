"use client";

import { useState, useEffect } from "react";
import { Box, TextField, Chip, Stack, FormHelperText } from "@mui/material";

const LAYOUT_PRESETS = ["12", "6-6", "4-4-4", "3-6-3", "2-8-2"];

const STRIP_COLORS = [
    "primary.dark",
    "secondary.dark",
    "info.dark",
    "success.dark",
    "warning.dark",
    "error.dark",
];

interface ColumnLayoutEditorProps {
    sizes: number[];
    onChange: (sizes: number[]) => void;
}

export function ColumnLayoutEditor({ sizes, onChange }: ColumnLayoutEditorProps) {
    const [inputValue, setInputValue] = useState(sizes.join("-"));
    const [error, setError] = useState<string | null>(null);

    // Sync input when parent sizes change (e.g. switching pages)
    useEffect(() => {
        setInputValue(sizes.join("-"));
        setError(null);
    }, [sizes]);

    // Presets are hardcoded and known-valid, so we skip validation for snappier UX.
    const applyLayout = (layout: string) => {
        setInputValue(layout);
        const parsed = layout.split("-").map(Number);
        setError(null);
        onChange(parsed);
    };

    const handleApply = () => {
        const trimmed = inputValue.trim();
        if (!trimmed) {
            setError("Layout cannot be empty");
            return;
        }
        const parsed = trimmed.split("-").map(Number);
        if (parsed.length < 1 || parsed.length > 12) {
            setError("Must have 1–12 columns");
            return;
        }
        if (parsed.some(isNaN) || parsed.some((n) => n < 1 || n > 12)) {
            setError("Each column must be 1–12");
            return;
        }
        if (parsed.reduce((a, b) => a + b, 0) !== 12) {
            setError("Column sizes must sum to 12");
            return;
        }
        setError(null);
        onChange(parsed);
    };

    return (
        <Box sx={{ mb: 2 }}>
            {/* Quick preset buttons */}
            <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
                {LAYOUT_PRESETS.map((preset) => (
                    <Chip
                        key={preset}
                        label={preset}
                        onClick={() => applyLayout(preset)}
                        variant={inputValue === preset ? "filled" : "outlined"}
                        color={inputValue === preset ? "primary" : "default"}
                        size="small"
                    />
                ))}
            </Stack>

            {/* Custom input */}
            <TextField
                label="Column Layout"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onBlur={handleApply}
                onKeyDown={(e) => e.key === "Enter" && handleApply()}
                error={!!error}
                size="small"
                fullWidth
                sx={{ mb: 1 }}
            />
            {error && <FormHelperText error>{error}</FormHelperText>}
            {!error && (
                <FormHelperText>
                    Dash-separated column widths that sum to 12
                </FormHelperText>
            )}

            {/* Visual proportion strip */}
            <Box
                sx={{
                    display: "flex",
                    gap: 0.5,
                    mt: 1,
                    height: 28,
                    borderRadius: 1,
                    overflow: "hidden",
                }}
            >
                {sizes.map((size, idx) => (
                    <Box
                        key={idx}
                        sx={{
                            flex: size,
                            bgcolor: STRIP_COLORS[idx % STRIP_COLORS.length],
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "white",
                            fontSize: 12,
                            fontWeight: 600,
                            borderRadius: 0.5,
                        }}
                    >
                        {size}
                    </Box>
                ))}
            </Box>
        </Box>
    );
}
