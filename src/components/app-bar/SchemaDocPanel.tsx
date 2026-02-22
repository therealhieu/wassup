"use client";

import { useState } from "react";
import {
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Box,
    IconButton,
    Chip,
    Snackbar,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";

// ── Data ──────────────────────────────────────────────────────────────────────

interface FieldDoc {
    name: string;
    type: string;
    defaultValue?: string;
    note?: string;
}

interface WidgetDoc {
    title: string;
    example: string;
    fields: FieldDoc[];
}

const WIDGET_DOCS: WidgetDoc[] = [
    {
        title: "Page Structure",
        example: `ui:
  theme: light
  pages:
    - title: Home
      path: /
      columns:
        - size: 4
          widgets:
            - type: weather
              location: London`,
        fields: [
            { name: "ui.theme", type: '"light" | "dark"' },
            { name: "ui.pages[].title", type: "string" },
            { name: "ui.pages[].path", type: "string", note: "URL path, e.g. / or /sports" },
            { name: "ui.pages[].columns[].size", type: "number", note: "1–12 (grid columns)" },
            { name: "ui.pages[].columns[].widgets[]", type: "widget", note: "see widget types below" },
        ],
    },
    {
        title: "Weather",
        example: `- type: weather
  location: Ho Chi Minh City
  forecastDays: 5
  temperatureUnit: C`,
        fields: [
            { name: "location", type: "string" },
            { name: "forecastDays", type: "number", defaultValue: "5" },
            { name: "temperatureUnit", type: '"C" | "F"', defaultValue: "C" },
        ],
    },
    {
        title: "Reddit",
        example: `- type: reddit
  subreddit: compsci
  sort: new
  limit: 5
  hideTitle: true`,
        fields: [
            { name: "subreddit", type: "string" },
            { name: "sort", type: '"hot" | "new" | "top" | "rising"' },
            { name: "limit", type: "number", defaultValue: "5", note: "max 20" },
            { name: "hideTitle", type: "boolean", defaultValue: "false" },
        ],
    },
    {
        title: "YouTube",
        example: `- type: youtube
  channels:
    - "@Fireship"
    - "@ThePrimeTimeagen"
    - UCsXVk37bltHxD1rDPwtNM8Q
  limit: 16
  scrollAfterRow: 3
  showTitle: true`,
        fields: [
            { name: "channels", type: "string[]", note: 'start with "@" or "UC"' },
            { name: "limit", type: "number", defaultValue: "16", note: "1–50" },
            { name: "scrollAfterRow", type: "number", defaultValue: "3" },
            { name: "showTitle", type: "boolean", defaultValue: "true" },
        ],
    },
    {
        title: "Feed (RSS)",
        example: `- type: feed
  urls:
    - https://blog.cloudflare.com/rss/
    - https://eng.uber.com/rss/
  limit: 10
  scrollAfterRow: 7`,
        fields: [
            { name: "urls", type: "string[]", note: "RSS/Atom feed URLs" },
            { name: "limit", type: "number", defaultValue: "15" },
            { name: "showTitle", type: "boolean", defaultValue: "true" },
            { name: "scrollAfterRow", type: "number", defaultValue: "6" },
        ],
    },
    {
        title: "GitHub Trending",
        example: `- type: github
  language: python
  topics:
    - llm
    - ai-agents
  createdAfter: "2024-01-01"
  dateRange: 90d
  minStars: 1000
  maxStars: 50000
  limit: 30`,
        fields: [
            { name: "language", type: "string", note: "filter by language" },
            { name: "topics", type: "string[]", note: "OR-matched topics" },
            { name: "createdAfter", type: "string", defaultValue: "2024-01-01", note: "YYYY-MM-DD" },
            { name: "dateRange", type: '"7d" | "30d" | "90d"', defaultValue: "90d", note: "velocity window" },
            { name: "limit", type: "number", defaultValue: "25", note: "max 50" },
            { name: "minStars", type: "number", note: "min star count filter" },
            { name: "maxStars", type: "number", note: "max star count filter" },
            { name: "sort.field", type: '"stars" | "velocity" | "forks" | "createdAt"', defaultValue: "velocity" },
            { name: "sort.direction", type: '"asc" | "desc"', defaultValue: "desc" },
        ],
    },
    {
        title: "Bookmark",
        example: `- type: bookmark
  title: Bookmarks
  bookmarks: []
  groups:
    - title: DSA
      bookmarks:
        - https://www.neetcode.io
    - title: Tools
      bookmarks:
        - title: GitHub
          url: https://github.com`,
        fields: [
            { name: "title", type: "string" },
            { name: "bookmarks", type: "string[] | {title, url}[]", defaultValue: "[]" },
            { name: "groups", type: "BookmarkGroup[]", defaultValue: "[]", note: "nested groups" },
        ],
    },
    {
        title: "Tabs",
        example: `- type: tabs
  labels:
    - r/compsci
    - r/rust
  tabs:
    - type: reddit
      subreddit: compsci
      sort: new
    - type: reddit
      subreddit: rust
      sort: new`,
        fields: [
            { name: "labels", type: "string[]", note: "tab header labels" },
            { name: "tabs", type: "widget[]", note: "must match labels length" },
        ],
    },
];

// ── YAML Syntax Highlighting ──────────────────────────────────────────────────

const YAML_COLORS = {
    key: "#82aaff",       // blue — keys
    string: "#c3e88d",    // green — string values
    number: "#f78c6c",    // orange — numbers
    boolean: "#c792ea",   // purple — true/false
    dash: "#89ddff",      // cyan — list dashes
    colon: "#89ddff",     // cyan — colons
    comment: "#546e7a",   // gray — comments
    url: "#80cbc4",       // teal — URLs
    text: "#bfc7d5",      // light gray — default
};

function highlightYaml(yaml: string): React.ReactNode[] {
    const lines = yaml.split("\n");
    return lines.map((line, i) => {
        const spans: React.ReactNode[] = [];

        // Leading whitespace
        const indent = line.match(/^(\s*)/)?.[0] ?? "";
        const trimmed = line.slice(indent.length);

        if (indent) {
            spans.push(indent);
        }

        // Comment line
        if (trimmed.startsWith("#")) {
            spans.push(<span key={`${i}-comment`} style={{ color: YAML_COLORS.comment }}>{trimmed}</span>);
        }
        // List item: - value
        else if (trimmed.startsWith("- ")) {
            spans.push(<span key={`${i}-dash`} style={{ color: YAML_COLORS.dash }}>- </span>);
            const rest = trimmed.slice(2);
            // - key: value
            if (rest.includes(": ")) {
                const colonIdx = rest.indexOf(": ");
                spans.push(<span key={`${i}-key`} style={{ color: YAML_COLORS.key }}>{rest.slice(0, colonIdx)}</span>);
                spans.push(<span key={`${i}-colon`} style={{ color: YAML_COLORS.colon }}>: </span>);
                spans.push(colorizeValue(rest.slice(colonIdx + 2), `${i}-val`));
            } else {
                // - plain value
                spans.push(colorizeValue(rest, `${i}-val`));
            }
        }
        // key: value
        else if (trimmed.includes(": ") || trimmed.endsWith(":")) {
            const colonIdx = trimmed.indexOf(":");
            spans.push(<span key={`${i}-key`} style={{ color: YAML_COLORS.key }}>{trimmed.slice(0, colonIdx)}</span>);
            spans.push(<span key={`${i}-colon`} style={{ color: YAML_COLORS.colon }}>:</span>);
            const afterColon = trimmed.slice(colonIdx + 1);
            if (afterColon.length > 0) {
                spans.push(<span key={`${i}-sp`} style={{ color: YAML_COLORS.text }}> </span>);
                spans.push(colorizeValue(afterColon.trimStart(), `${i}-val`));
            }
        }
        // Bare value
        else {
            spans.push(colorizeValue(trimmed, `${i}-val`));
        }

        return (
            <span key={i}>
                {spans}
                {i < lines.length - 1 ? "\n" : ""}
            </span>
        );
    });
}

function colorizeValue(value: string, key: string): React.ReactNode {
    if (/^\d+$/.test(value)) {
        return <span key={key} style={{ color: YAML_COLORS.number }}>{value}</span>;
    }
    if (value === "true" || value === "false") {
        return <span key={key} style={{ color: YAML_COLORS.boolean }}>{value}</span>;
    }
    if (value === "[]" || value === "{}") {
        return <span key={key} style={{ color: YAML_COLORS.dash }}>{value}</span>;
    }
    if (value.startsWith('"') || value.startsWith("'")) {
        return <span key={key} style={{ color: YAML_COLORS.string }}>{value}</span>;
    }
    if (value.startsWith("http")) {
        return <span key={key} style={{ color: YAML_COLORS.url }}>{value}</span>;
    }
    return <span key={key} style={{ color: YAML_COLORS.string }}>{value}</span>;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function SchemaDocPanel() {
    const [copiedSnack, setCopiedSnack] = useState(false);

    const handleCopy = async (text: string) => {
        await navigator.clipboard.writeText(text);
        setCopiedSnack(true);
    };

    return (
        <Box sx={{ overflow: "auto", maxHeight: "700px" }}>
            {WIDGET_DOCS.map((doc) => (
                <Accordion
                    key={doc.title}
                    disableGutters
                    defaultExpanded={doc.title === "Page Structure"}
                    sx={{
                        "&:before": { display: "none" },
                        boxShadow: "none",
                        borderBottom: "1px solid",
                        borderColor: "divider",
                    }}
                >
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography fontWeight={600} fontSize={14}>
                            {doc.title}
                        </Typography>
                    </AccordionSummary>
                    <AccordionDetails sx={{ pt: 0 }}>
                        {/* YAML example */}
                        <Box
                            sx={{
                                position: "relative",
                                bgcolor: "grey.900",
                                borderRadius: 1,
                                p: 1.5,
                                mb: 2,
                            }}
                        >
                            <IconButton
                                size="small"
                                onClick={() => handleCopy(doc.example)}
                                sx={{
                                    position: "absolute",
                                    top: 4,
                                    right: 4,
                                    color: "grey.400",
                                    "&:hover": { color: "grey.100" },
                                }}
                            >
                                <ContentCopyIcon fontSize="small" />
                            </IconButton>
                            <pre
                                style={{
                                    margin: 0,
                                    fontSize: 12,
                                    lineHeight: 1.5,
                                    overflowX: "auto",
                                    fontFamily: "var(--font-geist-mono), monospace",
                                }}
                            >
                                {highlightYaml(doc.example)}
                            </pre>
                        </Box>

                        {/* Field table */}
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 600, fontSize: 12, py: 0.5 }}>
                                        Field
                                    </TableCell>
                                    <TableCell sx={{ fontWeight: 600, fontSize: 12, py: 0.5 }}>
                                        Type
                                    </TableCell>
                                    <TableCell sx={{ fontWeight: 600, fontSize: 12, py: 0.5 }}>
                                        Default
                                    </TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {doc.fields.map((field) => (
                                    <TableRow key={field.name}>
                                        <TableCell sx={{ py: 0.5 }}>
                                            <code style={{ fontSize: 12 }}>{field.name}</code>
                                        </TableCell>
                                        <TableCell sx={{ py: 0.5 }}>
                                            <Typography
                                                variant="caption"
                                                sx={{ fontFamily: "monospace" }}
                                            >
                                                {field.type}
                                            </Typography>
                                        </TableCell>
                                        <TableCell sx={{ py: 0.5 }}>
                                            {field.defaultValue ? (
                                                <code style={{ fontSize: 12 }}>
                                                    {field.defaultValue}
                                                </code>
                                            ) : (
                                                <Chip
                                                    label="required"
                                                    size="small"
                                                    color="warning"
                                                    variant="outlined"
                                                    sx={{ height: 20, fontSize: 10 }}
                                                />
                                            )}
                                            {field.note && (
                                                <Typography
                                                    variant="caption"
                                                    color="text.secondary"
                                                    sx={{ ml: 0.5, fontSize: 10 }}
                                                >
                                                    ({field.note})
                                                </Typography>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </AccordionDetails>
                </Accordion>
            ))}
            <Snackbar
                open={copiedSnack}
                autoHideDuration={1500}
                onClose={() => setCopiedSnack(false)}
                message="Copied to clipboard"
                anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
            />
        </Box>
    );
}
