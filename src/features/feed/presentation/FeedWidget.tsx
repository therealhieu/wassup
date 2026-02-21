import { useQueries } from "@tanstack/react-query";
import { useMemo } from "react";
import { FeedWidgetConfig } from "../infrastructure/config.schemas";
import { fetchSingleFeed } from "../services/rss.actions";
import { FeedWidgetInner } from "./FeedWidgetInner";
import { ErrorWidget } from "@/components/ErrorWidget";
import { FeedWidgetSkeleton } from "./FeedWidgetSkeleton";
import { LinearProgress } from "@mui/material";

interface FeedWidgetProps {
	config: FeedWidgetConfig;
}

export function FeedWidget({ config }: FeedWidgetProps) {
	const feedQueries = useQueries({
		queries: config.urls.map((url) => ({
			queryKey: ["feed", url, config.limit],
			queryFn: () => fetchSingleFeed(url, config.limit),
			staleTime: 1000 * 60 * 5, // 5 minutes
		})),
	});

	const isAllLoading = feedQueries.every((q) => q.isLoading);
	const isFetchingMore = !isAllLoading && feedQueries.some((q) => q.isLoading);

	// Merge available feeds chronologically, apply limit
	const feeds = useMemo(
		() =>
			feedQueries
				.flatMap((q) => q.data ?? [])
				.sort(
					(a, b) =>
						new Date(b.publishedAt).getTime() -
						new Date(a.publishedAt).getTime()
				)
				.slice(0, config.limit),
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[feedQueries.map((q) => q.dataUpdatedAt).join(","), config.limit]
	);

	if (isAllLoading) {
		return <FeedWidgetSkeleton />;
	}

	const firstError = feedQueries.find((q) => q.error)?.error;
	if (firstError && feeds.length === 0) {
		return <ErrorWidget error={firstError} />;
	}

	return (
		<>
			<FeedWidgetInner config={config} feeds={feeds} />
			{isFetchingMore && (
				<LinearProgress
					sx={{ borderRadius: 1, height: 2, opacity: 0.6 }}
				/>
			)}
		</>
	);
}
