import { Stack, Chip, Box, Typography } from "@mui/material";
import { Feed } from "../domain/entities/feed";
import { FeedItem } from "./FeedItem";
import { FeedWidgetConfig } from "../infrastructure/config.schemas";
import { getSourceFromUrl } from "../lib/utils";
import { useState, useRef, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchThumbnailUrls } from "../services/thumbnail.actions";

const CHIP_COLORS = [
	"primary",
	"secondary",
	"error",
	"warning",
	"info",
	"success",
] as const;

export interface FeedWidgetInnerProps {
	config: FeedWidgetConfig;
	feeds: Feed[];
}

export const FeedWidgetInner = ({ config, feeds }: FeedWidgetInnerProps) => {
	const sources = config.urls.map((url) => getSourceFromUrl(url));
	const [selectedSource, setSelectedSource] = useState<string | null>(null);
	const feedsContainerRef = useRef<HTMLDivElement>(null);

	// Collect URLs missing thumbnails for a single batched fetch
	const missingThumbnailUrls = useMemo(
		() => feeds.filter((f) => !f.thumbnailUrl).map((f) => f.feedUrl),
		[feeds]
	);

	const { data: resolvedThumbnails } = useQuery({
		queryKey: ["thumbnails", ...missingThumbnailUrls],
		queryFn: () => fetchThumbnailUrls(missingThumbnailUrls),
		enabled: missingThumbnailUrls.length > 0,
		staleTime: 1000 * 60 * 60, // 1 hour — matches server-side thumbnail cache
	});

	// Merge embedded + lazily resolved thumbnails
	const enrichedFeeds: Feed[] = useMemo(
		() =>
			feeds.map((feed) => ({
				...feed,
				thumbnailUrl:
					feed.thumbnailUrl ?? resolvedThumbnails?.[feed.feedUrl] ?? undefined,
			})),
		[feeds, resolvedThumbnails]
	);

	const filteredFeeds = selectedSource
		? enrichedFeeds.filter((feed) => feed.source === selectedSource)
		: enrichedFeeds;

	useEffect(() => {
		if (
			feedsContainerRef.current &&
			filteredFeeds.length > config.scrollAfterRow
		) {
			const rowHeight =
				feedsContainerRef.current.children[
					config.scrollAfterRow
				]?.getBoundingClientRect().top || 0;
			const containerTop =
				feedsContainerRef.current.getBoundingClientRect().top;
			const scrollPosition = rowHeight - containerTop;

			feedsContainerRef.current.style.maxHeight = `${scrollPosition}px`;
			feedsContainerRef.current.style.overflowY = "auto";
		} else if (feedsContainerRef.current) {
			feedsContainerRef.current.style.maxHeight = "none";
			feedsContainerRef.current.style.overflowY = "visible";
		}
	}, [filteredFeeds.length, config.scrollAfterRow]);

	return (
		<Stack spacing={1} sx={{ boxShadow: 1, padding: 1 }}>
			{config.showTitle && (
				<Typography variant="h5" gutterBottom>
					Feeds
				</Typography>
			)}
			<Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
				{sources.map((source, index) => (
					<Chip
						key={source}
						label={source}
						color={CHIP_COLORS[index % CHIP_COLORS.length]}
						onClick={() =>
							setSelectedSource(
								source === selectedSource ? null : source
							)
						}
						variant={
							selectedSource === source ? "filled" : "outlined"
						}
					/>
				))}
			</Box>
			<Box ref={feedsContainerRef}>
				{filteredFeeds.map((feed) => (
					<FeedItem key={feed.feedUrl} {...feed} />
				))}
			</Box>
		</Stack>
	);
};
