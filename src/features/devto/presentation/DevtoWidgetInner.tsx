import { memo } from "react";
import { z } from "zod";
import { DevtoWidgetConfigSchema } from "../infrastructure/config.schemas";
import { DevtoArticleListSchema } from "../domain/entities/article";
import {
    Card,
    CardContent,
    Typography,
    Divider,
    Link,
    Chip,
    Box,
} from "@mui/material";

export const DevtoWidgetInnerPropsSchema = z.object({
    config: DevtoWidgetConfigSchema,
    articles: DevtoArticleListSchema,
});

export type DevtoWidgetInnerProps = z.infer<typeof DevtoWidgetInnerPropsSchema>;

function timeAgo(isoString: string): string {
    const seconds = Math.floor(
        (Date.now() - new Date(isoString).getTime()) / 1000,
    );
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
}

export const DevtoWidgetInner = memo(function DevtoWidgetInner({
    config,
    articles,
}: DevtoWidgetInnerProps) {
    return (
        <Card>
            {!config.hideTitle && (
                <Typography variant="h6" sx={{ px: 1, pt: 1 }}>
                    DEV Community
                </Typography>
            )}
            {articles.map((article) => (
                <div key={article.id}>
                    <Link
                        href={article.url}
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
                                    backgroundColor: "rgba(0, 0, 0, 0.04)",
                                },
                            }}
                        >
                            <Typography
                                variant="subtitle1"
                                sx={{ color: "text.primary", fontWeight: 500 }}
                            >
                                {article.title}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                {article.positive_reactions_count} reactions • by{" "}
                                {article.user_name} •{" "}
                                {timeAgo(article.published_timestamp)} •{" "}
                                {article.reading_time_minutes} min read •{" "}
                                {article.comments_count} comments
                            </Typography>
                            {article.tag_list.length > 0 && (
                                <Box
                                    sx={{
                                        mt: 0.5,
                                        display: "flex",
                                        gap: 0.5,
                                        flexWrap: "wrap",
                                    }}
                                >
                                    {article.tag_list.map((tag) => (
                                        <Chip
                                            key={tag}
                                            label={tag}
                                            size="small"
                                            variant="outlined"
                                            sx={{ height: 18, fontSize: "0.65rem" }}
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
