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
import Divider from "@mui/material/Divider";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import type { WidgetFieldDefinition } from "@/lib/widget-registry";
import type { WidgetConfig } from "@/infrastructure/config.schemas";
import type { ZodIssue } from "zod";
import { buildDefaults, WIDGET_REGISTRY, WIDGET_TYPES } from "@/lib/widget-registry";

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

    // Tabs widget: render unified TabsEditorField instead of individual fields
    const hasNestedWidget = fields.some((f) => f.type === "nested-widget");
    if (hasNestedWidget) {
        return (
            <TabsEditorField
                labels={(values.labels as string[]) ?? []}
                tabs={(values.tabs as WidgetConfig[]) ?? []}
                onChange={(labels, tabs) => onChange({ ...values, labels, tabs })}
            />
        );
    }

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
            // Handled by TabsEditorField in SchemaForm — should not reach here
            return null;

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

// ── Tabs Editor Field ────────────────────────────────────────────────

function stripType(config: WidgetConfig): Record<string, unknown> {
    const { type: _, ...rest } = config;
    return rest as Record<string, unknown>;
}

function TabsEditorField({
    labels,
    tabs,
    onChange,
}: {
    labels: string[];
    tabs: WidgetConfig[];
    onChange: (labels: string[], tabs: WidgetConfig[]) => void;
}) {
    const updateLabel = (idx: number, value: string) => {
        const next = [...labels];
        next[idx] = value;
        onChange(next, tabs);
    };

    const updateTabType = (idx: number, newType: string) => {
        const entry = WIDGET_REGISTRY[newType];
        if (!entry) return;
        const next = [...tabs];
        next[idx] = { type: newType, ...buildDefaults(entry.fields) } as WidgetConfig;
        onChange(labels, next);
    };

    const updateTabConfig = (idx: number, values: Record<string, unknown>) => {
        const next = [...tabs];
        next[idx] = { type: tabs[idx].type, ...values } as WidgetConfig;
        onChange(labels, next);
    };

    const addTab = () => {
        const defaultType = "reddit";
        const entry = WIDGET_REGISTRY[defaultType];
        onChange(
            [...labels, "New Tab"],
            [...tabs, { type: defaultType, ...buildDefaults(entry.fields) } as WidgetConfig],
        );
    };

    const deleteTab = (idx: number) => {
        if (labels.length <= 1) return;
        onChange(
            labels.filter((_, i) => i !== idx),
            tabs.filter((_, i) => i !== idx),
        );
    };

    return (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1, mt: 1 }}>
            {labels.map((label, i) => (
                <Box key={i}>
                    {i > 0 && <Divider sx={{ my: 1 }} />}

                    {/* Label + delete */}
                    <Box sx={{ display: "flex", gap: 1, alignItems: "center", mb: 1 }}>
                        <TextField
                            label="Label"
                            value={label}
                            onChange={(e) => updateLabel(i, e.target.value)}
                            size="small"
                            fullWidth
                        />
                        <IconButton
                            size="small"
                            onClick={() => deleteTab(i)}
                            disabled={labels.length <= 1}
                            sx={{ "&:hover": { color: "error.main" } }}
                        >
                            <DeleteIcon fontSize="small" />
                        </IconButton>
                    </Box>

                    {/* Widget type */}
                    <FormControl size="small" fullWidth sx={{ mb: 1 }}>
                        <InputLabel>Widget Type</InputLabel>
                        <Select
                            value={tabs[i]?.type ?? "reddit"}
                            onChange={(e) => updateTabType(i, e.target.value)}
                            label="Widget Type"
                        >
                            {WIDGET_TYPES.filter((t) => t !== "tabs").map((type) => (
                                <MenuItem key={type} value={type}>
                                    {WIDGET_REGISTRY[type].label}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    {/* Child widget config fields */}
                    {tabs[i] && WIDGET_REGISTRY[tabs[i].type] && (
                        <Box sx={{ pl: 2, borderLeft: 2, borderColor: "divider" }}>
                            <SchemaForm
                                fields={WIDGET_REGISTRY[tabs[i].type].fields}
                                values={stripType(tabs[i])}
                                onChange={(updated) => updateTabConfig(i, updated)}
                                errors={[]}
                            />
                        </Box>
                    )}
                </Box>
            ))}
            <Button
                size="small"
                startIcon={<AddIcon />}
                onClick={addTab}
                sx={{ alignSelf: "flex-start", mt: 1 }}
            >
                Add Tab
            </Button>
        </Box>
    );
}
