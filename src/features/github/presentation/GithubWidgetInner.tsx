import { useState, useMemo } from "react";
import {
    Autocomplete,
    Box,
    Chip,
    CircularProgress,
    Slider,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TableSortLabel,
    TextField,
    Typography,
    Avatar,
    Stack,
    ToggleButton,
    ToggleButtonGroup,
} from "@mui/material";
import WhatshotIcon from "@mui/icons-material/Whatshot";
import { GithubRepository } from "../domain/entities/github-repository";
import {
    GithubWidgetInnerProps,
    GithubWidgetInnerPropsSchema,
} from "./github-widget.schemas";

export type { GithubWidgetInnerProps };
export { GithubWidgetInnerPropsSchema };

type SortField = "stars" | "velocity" | "forks" | "createdAt";
type SortDirection = "asc" | "desc";
type DateRange = "7d" | "30d" | "90d";

const LANGUAGE_COLORS: Record<string, string> = {
    TypeScript: "#3178c6",
    JavaScript: "#f1e05a",
    Python: "#3572A5",
    Rust: "#dea584",
    Go: "#00ADD8",
    Java: "#b07219",
    "C++": "#f34b7d",
    C: "#555555",
    Ruby: "#701516",
    Swift: "#F05138",
    Kotlin: "#A97BFF",
    Dart: "#00B4AB",
    Zig: "#ec915c",
    Elixir: "#6e4a7e",
};

const STAR_MARKS = [
    { value: 0, label: "0" },
    { value: 1, label: "100" },
    { value: 2, label: "500" },
    { value: 3, label: "1K" },
    { value: 4, label: "5K" },
    { value: 5, label: "10K" },
    { value: 6, label: "50K" },
    { value: 7, label: "∞" },
];

const STAR_VALUES = [0, 100, 500, 1000, 5000, 10000, 50000, undefined] as const;

function starsToIndex(value: number | undefined): number {
    if (value === undefined) return 7;
    const values = [0, 100, 500, 1000, 5000, 10000, 50000];
    for (let i = values.length - 1; i >= 0; i--) {
        if (value >= values[i]) return i;
    }
    return 0;
}

export function generateDateMarks(startDate: string): {
    marks: { value: number; label: string }[];
    values: string[];
} {
    const startYear = new Date(startDate).getFullYear();
    const currentYear = new Date().getFullYear();
    const span = currentYear - startYear;

    const marks: { value: number; label: string }[] = [];
    const values: string[] = [];
    let i = 0;

    for (let y = startYear; y <= currentYear; y++) {
        const suffix = String(y).slice(2);
        if (span <= 3 && y < currentYear) {
            const h1Label = y === startYear ? String(y) : `H1'${suffix}`;
            marks.push({ value: i, label: h1Label });
            values.push(`${y}-01-01`);
            i++;
            marks.push({ value: i, label: `H2'${suffix}` });
            values.push(`${y}-07-01`);
            i++;
        } else {
            marks.push({ value: i, label: String(y) });
            values.push(`${y}-01-01`);
            i++;
        }
    }

    return { marks, values };
}

export const GithubWidgetInner = ({
    config,
    repositories,
    dateRange,
    onDateRangeChange,
    starRange,
    onStarRangeChange,
    createdAfterStart,
    createdAfterRange,
    onCreatedAfterRangeChange,
    isRefreshing,
}: GithubWidgetInnerProps & {
    dateRange: DateRange;
    onDateRangeChange: (range: DateRange) => void;
    starRange: [number?, number?];
    onStarRangeChange: (range: [number?, number?]) => void;
    createdAfterStart: string;
    createdAfterRange: [string, string];
    onCreatedAfterRangeChange: (range: [string, string]) => void;
    isRefreshing: boolean;
}) => {
    const { marks: dateMarks, values: dateValues } = useMemo(
        () => generateDateMarks(createdAfterStart),
        [createdAfterStart]
    );

    const [selectedLanguage, setSelectedLanguage] = useState<string | null>(
        null
    );
    const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
    const [searchRepo, setSearchRepo] = useState<string | null>(null);
    const [sortField, setSortField] = useState<SortField>(
        config.sort.field
    );
    const [sortDirection, setSortDirection] = useState<SortDirection>(
        config.sort.direction
    );

    const languages = useMemo(
        () =>
            [
                ...new Set(
                    repositories
                        .map((r) => r.language)
                        .filter((l): l is string => l !== null)
                ),
            ],
        [repositories]
    );

    const topics = useMemo(
        () =>
            [...new Set(repositories.flatMap((r) => r.topics))].slice(0, 12),
        [repositories]
    );

    const getVelocity = (repo: GithubRepository): number =>
        repo.recentStars ?? repo.starsPerDay;

    const filtered = useMemo(() => {
        let result = repositories;

        if (selectedLanguage) {
            result = result.filter((r) => r.language === selectedLanguage);
        }
        if (selectedTopic) {
            result = result.filter((r) => r.topics.includes(selectedTopic));
        }
        if (searchRepo) {
            result = result.filter((r) => r.fullName === searchRepo);
        }

        result = [...result].sort((a, b) => {
            const mul = sortDirection === "desc" ? -1 : 1;
            switch (sortField) {
                case "stars":
                    return (a.stars - b.stars) * mul;
                case "velocity":
                    return (getVelocity(a) - getVelocity(b)) * mul;
                case "forks":
                    return (a.forks - b.forks) * mul;
                case "createdAt":
                    return (
                        (new Date(a.createdAt).getTime() -
                            new Date(b.createdAt).getTime()) *
                        mul
                    );
            }
        });

        return result;
    }, [
        repositories,
        selectedLanguage,
        selectedTopic,
        searchRepo,
        sortField,
        sortDirection,
    ]);

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDirection((d) => (d === "desc" ? "asc" : "desc"));
        } else {
            setSortField(field);
            setSortDirection("desc");
        }
    };

    const velocityLabel = `last ${dateRange}`;

    return (
        <Stack spacing={1} sx={{ boxShadow: 1, padding: 1 }}>
            <Typography variant="h6">
                <WhatshotIcon
                    sx={{ verticalAlign: "middle", mr: 0.5 }}
                />
                GitHub Trending
            </Typography>

            <Stack direction="row" spacing={1} alignItems="center">
                <Typography variant="caption" color="text.secondary">
                    Velocity:
                </Typography>
                <ToggleButtonGroup
                    value={dateRange}
                    size="small"
                    exclusive
                    onChange={(_, value) => {
                        if (value) onDateRangeChange(value as DateRange);
                    }}
                >
                    <ToggleButton value="7d">Last 7d</ToggleButton>
                    <ToggleButton value="30d">Last 30d</ToggleButton>
                    <ToggleButton value="90d">Last 90d</ToggleButton>
                </ToggleButtonGroup>
                <Autocomplete
                    size="small"
                    options={repositories.map((r) => r.fullName)}
                    value={searchRepo}
                    onChange={(_, value) => setSearchRepo(value)}
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            placeholder="Search repo…"
                            variant="outlined"
                            size="small"
                        />
                    )}
                    sx={{ minWidth: 250 }}
                    clearOnEscape
                />
            </Stack>

            <Stack direction="row" spacing={2} alignItems="center" sx={{ px: 1 }}>
                <Typography variant="body2" color="text.secondary" noWrap>
                    ⭐ Stars:
                </Typography>
                <Slider
                    value={[
                        starsToIndex(starRange[0]),
                        starsToIndex(starRange[1]),
                    ]}
                    onChange={(_, value) => {
                        const [minIdx, maxIdx] = value as number[];
                        onStarRangeChange([
                            STAR_VALUES[minIdx],
                            STAR_VALUES[maxIdx],
                        ]);
                    }}
                    min={0}
                    max={7}
                    step={null}
                    marks={STAR_MARKS}
                    valueLabelDisplay="auto"
                    valueLabelFormat={(v) => STAR_MARKS[v]?.label ?? ""}
                    size="small"
                    disableSwap
                    sx={{
                        maxWidth: 350,
                        pb: 4,
                        "& .MuiSlider-markLabel": {
                            fontSize: "0.75rem",
                        },
                    }}
                />
            </Stack>

            <Stack direction="row" spacing={2} alignItems="center" sx={{ px: 1 }}>
                <Typography variant="body2" color="text.secondary" noWrap>
                    📅 Created:
                </Typography>
                <Slider
                    value={[
                        dateValues.indexOf(createdAfterRange[0]),
                        dateValues.indexOf(createdAfterRange[1]),
                    ]}
                    onChange={(_, value) => {
                        const [startIdx, endIdx] = value as number[];
                        onCreatedAfterRangeChange([
                            dateValues[startIdx],
                            dateValues[endIdx],
                        ]);
                    }}
                    min={0}
                    max={dateMarks.length - 1}
                    step={null}
                    marks={dateMarks}
                    valueLabelDisplay="auto"
                    valueLabelFormat={(v) =>
                        dateMarks[v]?.label ?? ""
                    }
                    size="small"
                    disableSwap
                    sx={{
                        maxWidth: 350,
                        pb: 4,
                        "& .MuiSlider-markLabel": {
                            fontSize: "0.75rem",
                        },
                    }}
                />
            </Stack>

            {languages.length > 0 && (
                <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
                    {languages.map((lang) => (
                        <Chip
                            key={lang}
                            label={lang}
                            size="small"
                            variant={
                                selectedLanguage === lang
                                    ? "filled"
                                    : "outlined"
                            }
                            onClick={() =>
                                setSelectedLanguage(
                                    selectedLanguage === lang ? null : lang
                                )
                            }
                            sx={{
                                borderColor:
                                    LANGUAGE_COLORS[lang] ?? "grey.400",
                                ...(selectedLanguage === lang && {
                                    backgroundColor:
                                        LANGUAGE_COLORS[lang] ?? "grey.600",
                                    color: "white",
                                }),
                            }}
                        />
                    ))}
                </Box>
            )}

            {topics.length > 0 && (
                <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
                    {topics.map((topic) => (
                        <Chip
                            key={topic}
                            label={topic}
                            size="small"
                            variant={
                                selectedTopic === topic
                                    ? "filled"
                                    : "outlined"
                            }
                            color="info"
                            onClick={() =>
                                setSelectedTopic(
                                    selectedTopic === topic ? null : topic
                                )
                            }
                        />
                    ))}
                </Box>
            )}

            <Box sx={{ position: "relative" }}>
                <TableContainer
                    sx={{
                        maxHeight: 800,
                        overflowY: "auto",
                        opacity: isRefreshing ? 0.4 : 1,
                        transition: "opacity 0.2s",
                        pointerEvents: isRefreshing ? "none" : "auto",
                    }}
                >
                    <Table size="medium" stickyHeader>
                        <TableHead>
                            <TableRow>
                                <TableCell>Repository</TableCell>
                                <TableCell>Description</TableCell>
                                <TableCell
                                    align="right"
                                    sx={{ minWidth: 80 }}
                                >
                                    <TableSortLabel
                                        active={sortField === "stars"}
                                        direction={
                                            sortField === "stars"
                                                ? sortDirection
                                                : "desc"
                                        }
                                        onClick={() => handleSort("stars")}
                                    >
                                        ⭐ Stars
                                    </TableSortLabel>
                                </TableCell>
                                <TableCell
                                    align="right"
                                    sx={{ minWidth: 100 }}
                                >
                                    <TableSortLabel
                                        active={sortField === "velocity"}
                                        direction={
                                            sortField === "velocity"
                                                ? sortDirection
                                                : "desc"
                                        }
                                        onClick={() =>
                                            handleSort("velocity")
                                        }
                                    >
                                        📈 Velocity
                                    </TableSortLabel>
                                </TableCell>
                                <TableCell
                                    align="right"
                                    sx={{ minWidth: 70 }}
                                >
                                    <TableSortLabel
                                        active={sortField === "forks"}
                                        direction={
                                            sortField === "forks"
                                                ? sortDirection
                                                : "desc"
                                        }
                                        onClick={() => handleSort("forks")}
                                    >
                                        Forks
                                    </TableSortLabel>
                                </TableCell>
                                <TableCell>Language</TableCell>
                                <TableCell>Topics</TableCell>
                                <TableCell sx={{ minWidth: 80 }}>
                                    <TableSortLabel
                                        active={sortField === "createdAt"}
                                        direction={
                                            sortField === "createdAt"
                                                ? sortDirection
                                                : "desc"
                                        }
                                        onClick={() =>
                                            handleSort("createdAt")
                                        }
                                    >
                                        Created
                                    </TableSortLabel>
                                </TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filtered.map((repo) => (
                                <GithubRepositoryRow
                                    key={repo.id}
                                    repo={repo}
                                    velocityLabel={velocityLabel}
                                    onTopicClick={(topic) =>
                                        setSelectedTopic(
                                            selectedTopic === topic
                                                ? null
                                                : topic
                                        )
                                    }
                                />
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>

                {isRefreshing && (
                    <Box
                        sx={{
                            position: "absolute",
                            inset: 0,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                    >
                        <CircularProgress size={40} />
                    </Box>
                )}
            </Box>
        </Stack>
    );
};

function GithubRepositoryRow({
    repo,
    velocityLabel,
    onTopicClick,
}: {
    repo: GithubRepository;
    velocityLabel: string;
    onTopicClick: (topic: string) => void;
}) {
    const velocity = repo.recentStars ?? repo.starsPerDay;

    return (
        <TableRow
            hover
        >
            <TableCell>
                <Stack direction="row" spacing={1} alignItems="center">
                    <Avatar
                        src={repo.owner.avatarUrl}
                        alt={repo.owner.login}
                        sx={{ width: 24, height: 24 }}
                    />
                    <Typography
                        variant="body2"
                        fontWeight={600}
                        component="a"
                        href={repo.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{
                            color: "primary.main",
                            textDecoration: "none",
                            "&:hover": {
                                textDecoration: "underline",
                            },
                        }}
                    >
                        {repo.fullName}
                    </Typography>
                </Stack>
            </TableCell>

            <TableCell>
                {repo.description && (
                    <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                            maxWidth: 300,
                            display: "block",
                        }}
                    >
                        {repo.description.length > 100
                            ? repo.description.substring(0, 100) + "…"
                            : repo.description}
                    </Typography>
                )}
            </TableCell>

            <TableCell align="right">
                <Typography variant="body2">
                    {repo.stars.toLocaleString()}
                </Typography>
            </TableCell>

            <TableCell align="right">
                <Stack alignItems="flex-end">
                    <Typography
                        variant="body2"
                        fontWeight={600}
                        color={
                            velocity >= 100
                                ? "success.main"
                                : "text.primary"
                        }
                    >
                        {repo.recentStars !== undefined
                            ? `+${repo.recentStars.toLocaleString()}`
                            : `~${repo.starsPerDay.toLocaleString()}`}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                        {repo.recentStars !== undefined
                            ? velocityLabel
                            : "⭐/day"}
                    </Typography>
                </Stack>
            </TableCell>

            <TableCell align="right">
                <Typography variant="body2">
                    {repo.forks.toLocaleString()}
                </Typography>
            </TableCell>

            <TableCell>
                {repo.language && (
                    <Chip
                        label={repo.language}
                        size="small"
                        sx={{
                            backgroundColor:
                                LANGUAGE_COLORS[repo.language] ??
                                "grey.600",
                            color: "white",
                            fontWeight: 500,
                            height: 20,
                            fontSize: "0.7rem",
                        }}
                    />
                )}
            </TableCell>

            <TableCell>
                <Box
                    sx={{
                        display: "flex",
                        gap: 0.5,
                        flexWrap: "wrap",
                        maxWidth: 300,
                    }}
                >
                    {repo.topics.slice(0, 6).map((topic) => (
                        <Chip
                            key={topic}
                            label={topic}
                            size="small"
                            variant="outlined"
                            color="info"
                            onClick={() => onTopicClick(topic)}
                            sx={{
                                height: 20,
                                fontSize: "0.65rem",
                                cursor: "pointer",
                            }}
                        />
                    ))}
                    {repo.topics.length > 6 && (
                        <Typography
                            variant="caption"
                            color="text.secondary"
                        >
                            +{repo.topics.length - 6}
                        </Typography>
                    )}
                </Box>
            </TableCell>

            <TableCell>
                <Typography variant="caption" color="text.secondary">
                    {new Date(repo.createdAt).toLocaleDateString(
                        "en-US",
                        {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                        }
                    )}
                </Typography>
            </TableCell>
        </TableRow>
    );
}
