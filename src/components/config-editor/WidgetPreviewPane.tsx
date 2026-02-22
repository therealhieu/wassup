"use client";

import { useState, useMemo, type ReactElement } from "react";
import { Box, ToggleButton, ToggleButtonGroup, Typography, Alert } from "@mui/material";
import type { WidgetConfig } from "@/infrastructure/config.schemas";
import { Widget } from "@/components/Widget";
import { ErrorBoundary } from "./ErrorBoundary";

// ── Inner component imports ─────────────────────────────────────────

import { RedditWidgetInner } from "@/features/reddit/presentation/RedditWidgetInner";
import { FeedWidgetInner } from "@/features/feed/presentation/FeedWidgetInner";
import { BookmarkWidgetInner } from "@/features/bookmark/presentation/BookmarkWidgetInner";
import { WeatherWidgetInner } from "@/features/weather/presentation/WeatherWidget.components";
import { YoutubeWidgetInner } from "@/features/youtube/presentation/YoutubeWidgetInner";

// ── Mock data factories ─────────────────────────────────────────────

function mockWeatherReports(days: number) {
    const now = new Date();
    return Array.from({ length: days }, (_, i) => ({
        date: new Date(now.getTime() + i * 86400000),
        temperatureMax: 30 + Math.round(Math.random() * 5),
        temperatureMin: 22 + Math.round(Math.random() * 3),
        precipitationProbability: Math.round(Math.random() * 50),
        precipitationHours: Math.round(Math.random() * 3),
        windSpeed: 5 + Math.round(Math.random() * 15),
        uvIndex: 5 + Math.round(Math.random() * 5),
        cloudCover: Math.round(Math.random() * 80),
        weatherCode: [0, 1, 2, 3, 61, 80][Math.floor(Math.random() * 6)],
    }));
}

function mockRedditPosts(subreddit: string, limit: number) {
    return Array.from({ length: limit }, (_, i) => ({
        id: `mock-${i}`,
        title: `Sample post #${i + 1} from r/${subreddit}`,
        url: `https://reddit.com/r/${subreddit}/${i}`,
        permalink: `/r/${subreddit}/comments/mock${i}`,
        author: "mock_user",
        subreddit,
        score: Math.floor(Math.random() * 500),
        upvoteRatio: 0.95,
        numComments: Math.floor(Math.random() * 100),
        created: Date.now() / 1000 - i * 3600,
        selftext: i === 0 ? "This is a preview with mock data." : "",
        isVideo: false,
        isNSFW: false,
        isSpoiler: false,
        isLocked: false,
        isPinned: false,
    }));
}

function mockYoutubeData(channels: string[], limit: number) {
    const mockChannels = channels.map((ch, i) => ({
        id: `ch-${i}`,
        name: ch.replace("@", ""),
        rssUrl: `https://youtube.com/feeds/${ch}`,
        channelUrl: `https://youtube.com/${ch}`,
    }));
    const mockVideos = Array.from({ length: limit }, (_, i) => ({
        id: `vid-${i}`,
        title: `Sample Video #${i + 1}`,
        url: `https://youtube.com/watch?v=mock${i}`,
        authorName: mockChannels[i % mockChannels.length].name,
        authorUrl: mockChannels[i % mockChannels.length].channelUrl,
        thumbnailUrl: "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
        views: Math.floor(Math.random() * 100000),
        publishedAt: new Date(Date.now() - i * 86400000),
    }));
    return { channels: mockChannels, videos: mockVideos };
}

function mockFeedItems(urls: string[]) {
    return urls.flatMap((url, i) => {
        let hostname: string;
        try {
            hostname = new URL(url).hostname;
        } catch {
            hostname = "example.com";
        }
        return [{
            title: `Sample feed article from ${hostname}`,
            feedUrl: `${url}#mock-${i}`,
            source: hostname,
            publishedAt: new Date(Date.now() - i * 86400000).toISOString(),
            categories: [] as string[],
            thumbnailUrl: undefined,
        }];
    });
}


// ── Mock renderer ───────────────────────────────────────────────────

function renderMockPreview(config: WidgetConfig): ReactElement | null {
    switch (config.type) {
        case "weather":
            return (
                <WeatherWidgetInner
                    location={config.location}
                    reports={mockWeatherReports(config.forecastDays ?? 5)}
                />
            );
        case "reddit":
            return (
                <RedditWidgetInner
                    config={config}
                    posts={mockRedditPosts(config.subreddit, config.limit ?? 5)}
                />
            );
        case "youtube": {
            const yt = mockYoutubeData(config.channels, config.limit ?? 16);
            return (
                <YoutubeWidgetInner
                    config={config}
                    channels={yt.channels}
                    videos={yt.videos}
                />
            );
        }
        case "feed":
            return (
                <FeedWidgetInner
                    config={config}
                    feeds={mockFeedItems(config.urls)}
                />
            );
        case "bookmark":
            return <BookmarkWidgetInner config={config} />;
        case "github":
        case "hackernews":
        case "tabs":
            return (
                <Alert severity="info" sx={{ mt: 1 }}>
                    Mock preview not available for this widget type. Switch to
                    &quot;Real&quot; to see a live preview.
                </Alert>
            );
    }
}

// ── Component ────────────────────────────────────────────────────────

interface WidgetPreviewPaneProps {
    config: WidgetConfig;
}

export function WidgetPreviewPane({ config }: WidgetPreviewPaneProps) {
    const [mode, setMode] = useState<"mock" | "real">("mock");

    const mockPreview = useMemo(() => renderMockPreview(config), [config]);

    return (
        <Box>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                <Typography variant="subtitle2" color="text.secondary">
                    Preview
                </Typography>
                <ToggleButtonGroup
                    value={mode}
                    exclusive
                    onChange={(_, val) => val && setMode(val)}
                    size="small"
                >
                    <ToggleButton value="mock">Mock</ToggleButton>
                    <ToggleButton value="real">Real</ToggleButton>
                </ToggleButtonGroup>
            </Box>
            <ErrorBoundary
                key={`${config.type}-${mode}`}
                fallback={
                    <Alert severity="warning" sx={{ mt: 1 }}>
                        Preview crashed. Try adjusting the form values.
                    </Alert>
                }
            >
                {mode === "mock" ? (
                    mockPreview
                ) : (
                    <Widget widgetConfig={config} />
                )}
            </ErrorBoundary>
        </Box>
    );
}
