"use client";

import {
    TextField,
    Select,
    MenuItem,
    FormControlLabel,
    Switch,
    FormControl,
    InputLabel,
    IconButton,
    Button,
    Box,
    Typography,
    FormHelperText,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import type { WidgetFieldDefinition } from "@/lib/widget-registry";
import type { ZodIssue } from "zod";
import { buildDefaults } from "@/lib/widget-registry";

interface SchemaFormProps {
    fields: WidgetFieldDefinition[];
    values: Record<string, unknown>;
    onChange: (values: Record<string, unknown>) => void;
    errors: ZodIssue[];
}

export function SchemaForm({ fields, values, onChange, errors }: SchemaFormProps) {
    const getFieldError = (fieldName: string): string | undefined => {
        const issue = errors.find(
            (e) => e.path.length > 0 && String(e.path[0]) === fieldName,
        );
        return issue?.message;
    };

    const updateField = (name: string, value: unknown) => {
        onChange({ ...values, [name]: value });
    };

    return (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
            {fields.map((field) => (
                <FieldRenderer
                    key={field.name}
                    field={field}
                    value={values[field.name]}
                    error={getFieldError(field.name)}
                    onChange={(val) => updateField(field.name, val)}
                />
            ))}
        </Box>
    );
}

interface FieldRendererProps {
    field: WidgetFieldDefinition;
    value: unknown;
    error?: string;
    onChange: (value: unknown) => void;
}

function FieldRenderer({ field, value, error, onChange }: FieldRendererProps) {
    switch (field.type) {
        case "text":
            return (
                <TextField
                    label={field.label}
                    value={(value as string) ?? ""}
                    onChange={(e) => onChange(e.target.value)}
                    required={field.required}
                    placeholder={field.placeholder}
                    helperText={error ?? field.helpText}
                    error={!!error}
                    size="small"
                    fullWidth
                />
            );

        case "number":
            return (
                <TextField
                    label={field.label}
                    type="number"
                    value={value ?? ""}
                    onChange={(e) => {
                        const num = Number(e.target.value);
                        onChange(isNaN(num) ? "" : num);
                    }}
                    required={field.required}
                    slotProps={{
                        htmlInput: {
                            min: field.min,
                            max: field.max,
                        },
                    }}
                    helperText={error ?? field.helpText}
                    error={!!error}
                    size="small"
                    fullWidth
                />
            );

        case "boolean":
            return (
                <FormControlLabel
                    control={
                        <Switch
                            checked={!!value}
                            onChange={(e) => onChange(e.target.checked)}
                        />
                    }
                    label={field.label}
                />
            );

        case "select":
            return (
                <FormControl size="small" fullWidth error={!!error}>
                    <InputLabel>{field.label}</InputLabel>
                    <Select
                        value={(value as string) ?? ""}
                        onChange={(e) => onChange(e.target.value)}
                        label={field.label}
                    >
                        {field.options?.map((option) => (
                            <MenuItem key={option} value={option}>
                                {option}
                            </MenuItem>
                        ))}
                    </Select>
                    {(error || field.helpText) && (
                        <FormHelperText>{error ?? field.helpText}</FormHelperText>
                    )}
                </FormControl>
            );

        case "string-array":
            return (
                <StringArrayField
                    field={field}
                    value={value as string[] | undefined}
                    error={error}
                    onChange={onChange}
                />
            );

        case "nested-object":
            return (
                <NestedObjectField
                    field={field}
                    value={value as Record<string, unknown> | undefined}
                    error={error}
                    onChange={onChange}
                />
            );

        case "nested-widget":
            return (
                <Typography variant="body2" color="text.secondary" sx={{ fontStyle: "italic" }}>
                    Tab widgets are configured after adding — edit each tab individually.
                </Typography>
            );

        default:
            return null;
    }
}

// ── String Array Field ───────────────────────────────────────────────

function StringArrayField({
    field,
    value,
    error,
    onChange,
}: {
    field: WidgetFieldDefinition;
    value: string[] | undefined;
    error?: string;
    onChange: (value: unknown) => void;
}) {
    const items = value ?? [""];

    const updateItem = (index: number, val: string) => {
        const next = [...items];
        next[index] = val;
        onChange(next);
    };

    const addItem = () => onChange([...items, ""]);

    const removeItem = (index: number) => {
        if (items.length <= 1) return;
        onChange(items.filter((_, i) => i !== index));
    };

    return (
        <Box>
            <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 500 }}>
                {field.label}
                {field.required && " *"}
            </Typography>
            {items.map((item, idx) => (
                <Box key={idx} sx={{ display: "flex", gap: 0.5, mb: 0.5 }}>
                    <TextField
                        value={item}
                        onChange={(e) => updateItem(idx, e.target.value)}
                        placeholder={field.placeholder}
                        size="small"
                        fullWidth
                    />
                    <IconButton
                        size="small"
                        onClick={() => removeItem(idx)}
                        disabled={items.length <= 1}
                    >
                        <DeleteIcon fontSize="small" />
                    </IconButton>
                </Box>
            ))}
            <Button
                size="small"
                startIcon={<AddIcon />}
                onClick={addItem}
            >
                Add
            </Button>
            {(error || field.helpText) && (
                <FormHelperText error={!!error}>
                    {error ?? field.helpText}
                </FormHelperText>
            )}
        </Box>
    );
}

// ── Nested Object Field ──────────────────────────────────────────────

function NestedObjectField({
    field,
    value,
    error,
    onChange,
}: {
    field: WidgetFieldDefinition;
    value: Record<string, unknown> | undefined;
    error?: string;
    onChange: (value: unknown) => void;
}) {
    const nested = value ?? buildDefaults(field.nestedFields ?? []);

    return (
        <Box sx={{ pl: 2, borderLeft: 2, borderColor: "divider" }}>
            <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                {field.label}
            </Typography>
            <SchemaForm
                fields={field.nestedFields ?? []}
                values={nested}
                onChange={(updated) => onChange(updated)}
                errors={[]}
            />
            {error && <FormHelperText error>{error}</FormHelperText>}
        </Box>
    );
}
