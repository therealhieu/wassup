import { memo } from "react";
import { z } from "zod";
import { LobstersWidgetConfigSchema } from "../infrastructure/config.schemas";
import { LobstersStoryListSchema } from "../domain/entities/story";
import {
    Card,
    CardContent,
    Typography,
    Divider,
    Link,
    Chip,
    Box,
} from "@mui/material";

export const LobstersWidgetInnerPropsSchema = z.object({
    config: LobstersWidgetConfigSchema,
    stories: LobstersStoryListSchema,
});

export type LobstersWidgetInnerProps = z.infer<
    typeof LobstersWidgetInnerPropsSchema
>;

function timeAgo(isoString: string): string {
    const seconds = Math.floor(
        (Date.now() - new Date(isoString).getTime()) / 1000
    );
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
}

export const LobstersWidgetInner = memo(function LobstersWidgetInner({
    config,
    stories,
}: LobstersWidgetInnerProps) {
    return (
        <Card>
            {!config.hideTitle && (
                <Typography variant="h6" sx={{ px: 1, pt: 1 }}>
                    Lobste.rs
                </Typography>
            )}
            {stories.map((story) => (
                <div key={story.short_id}>
                    <Link
                        href={story.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        underline="none"
                        color="inherit"
                    >
                        <CardContent
                            sx={{
                                paddingLeft: 1,
                                paddingTop: 1,
                                paddingBottom: 1,
                                cursor: "pointer",
                                "&:hover": {
                                    backgroundColor:
                                        "rgba(0, 0, 0, 0.04)",
                                },
                            }}
                        >
                            <Typography
                                variant="subtitle1"
                                sx={{
                                    color: "text.primary",
                                    fontWeight: 500,
                                }}
                            >
                                {story.title}
                            </Typography>
                            <Typography
                                variant="caption"
                                color="text.secondary"
                            >
                                {story.score} points • by{" "}
                                {story.submitter_user} •{" "}
                                {timeAgo(story.created_at)} •{" "}
                                {story.comment_count} comments
                            </Typography>
                            {story.tags.length > 0 && (
                                <Box
                                    sx={{
                                        mt: 0.5,
                                        display: "flex",
                                        gap: 0.5,
                                        flexWrap: "wrap",
                                    }}
                                >
                                    {story.tags.map((tag) => (
                                        <Chip
                                            key={tag}
                                            label={tag}
                                            size="small"
                                            variant="outlined"
                                            sx={{
                                                height: 18,
                                                fontSize: "0.65rem",
                                            }}
                                        />
                                    ))}
                                </Box>
                            )}
                        </CardContent>
                    </Link>
                    <Divider />
                </div>
            ))}
        </Card>
    );
});
