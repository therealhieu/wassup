import { Stack, Chip, Box, Typography } from "@mui/material";
import { Feed } from "../domain/entities/feed";
import { FeedItem } from "./FeedItem";
import { FeedWidgetConfig } from "../infrastructure/config.schemas";
import { getSourceFromUrl } from "../lib/utils";
import { useState, useRef, useEffect } from "react";

export type FeedWidgetInnerProps = {
	config: FeedWidgetConfig;
	feeds: Feed[];
};

export const FeedWidgetInner = ({ config, feeds }: FeedWidgetInnerProps) => {
	const sources = config.urls.map((url) => getSourceFromUrl(url));
	const [selectedSource, setSelectedSource] = useState<string | null>(null);
	const feedsContainerRef = useRef<HTMLDivElement>(null);

	const colors = [
		"primary",
		"secondary",
		"error",
		"warning",
		"info",
		"success",
	] as const;

	const filteredFeeds = selectedSource
		? feeds.filter((feed) => feed.source === selectedSource)
		: feeds;

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
		<Stack spacing={0.5} sx={{ boxShadow: 1, padding: 1 }}>
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
						color={colors[index % colors.length]}
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
