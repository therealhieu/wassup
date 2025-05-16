import { useQuery } from "@tanstack/react-query";
import { FeedWidgetConfig } from "../infrastructure/config.schemas";
import { fetchFeedWidgetProps } from "../services/rss.actions";
import { FeedWidgetInner } from "./FeedWidgetInner";
import { ErrorWidget } from "@/components/ErrorWidget";
import { FeedWidgetSkeleton } from "./FeedWidgetSkeleton";

interface FeedWidgetProps {
	config: FeedWidgetConfig;
}

export function FeedWidget({ config }: FeedWidgetProps) {
	const {
		data: props,
		isLoading,
		error,
	} = useQuery({
		queryKey: ["rss", ...config.urls, config.limit],
		queryFn: () => fetchFeedWidgetProps(config),
		staleTime: 1000 * 60 * 5, // 5 minutes
	});

	if (isLoading || !props) {
		return <FeedWidgetSkeleton />;
	}

	if (error) {
		return <ErrorWidget error={error} />;
	}

	return <FeedWidgetInner {...props} />;
}
