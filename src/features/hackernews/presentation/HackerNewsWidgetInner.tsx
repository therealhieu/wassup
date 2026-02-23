import { memo } from "react";
import { z } from "zod";
import { HackerNewsWidgetConfigSchema } from "../infrastructure/config.schemas";
import { HackerNewsStoryListSchema } from "../domain/entities/story";
import { CardContent, Typography, Card, Divider, Link } from "@mui/material";

export const HackerNewsWidgetInnerPropsSchema = z.object({
    config: HackerNewsWidgetConfigSchema,
    stories: HackerNewsStoryListSchema,
});

export type HackerNewsWidgetInnerProps = z.infer<
    typeof HackerNewsWidgetInnerPropsSchema
>;

function extractDomain(url: string): string {
    try {
        return new URL(url).hostname.replace("www.", "");
    } catch {
        return "";
    }
}

function timeAgo(unixSeconds: number): string {
    const seconds = Math.floor(Date.now() / 1000 - unixSeconds);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
}

export const HackerNewsWidgetInner = memo(
    function HackerNewsWidgetInner({ config, stories }: HackerNewsWidgetInnerProps) {
        return (
            <Card>
                {!config.hideTitle && (
                    <Typography variant="h6" sx={{ px: 1, pt: 1 }}>
                        Hacker News
                    </Typography>
                )}
                {stories.map((story) => (
                    <div key={story.id}>
                        <Link
                            href={
                                story.url ??
                                `https://news.ycombinator.com/item?id=${story.id}`
                            }
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
                                    {story.score} points • by {story.by} •{" "}
                                    {timeAgo(story.time)} •{" "}
                                    {story.descendants} comments
                                    {story.url &&
                                        ` (${extractDomain(story.url)})`}
                                </Typography>
                            </CardContent>
                        </Link>
                        <Divider />
                    </div>
                ))}
            </Card>
        );
    }
);
