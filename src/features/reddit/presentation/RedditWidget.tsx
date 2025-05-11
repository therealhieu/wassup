import { useQuery } from "@tanstack/react-query";
import { RedditWidgetConfig } from "../infrastructure/config.schemas";
import { fetchRedditWidgetProps } from "../services/reddit.actions";
import { RedditWidgetInner } from "./RedditWidgetInner";
import { RedditWidgetSkeleton } from "./RedditWidgetSkeleton";
import { ErrorWidget } from "@/components/ErrorWidget";

export interface RedditWidgetProps {
	config: RedditWidgetConfig;
}

export const RedditWidget = ({ config }: RedditWidgetProps) => {
	const {
		data: props,
		isLoading,
		error,
	} = useQuery({
		queryKey: ["reddit", config.subreddit, config.sort, config.limit],
		queryFn: () => fetchRedditWidgetProps(config),
	});

	if (isLoading) {
		return <RedditWidgetSkeleton />;
	}

	if (error) {
		return <ErrorWidget error={error} />;
	}

	if (!props) {
		return <ErrorWidget error={new Error("No data")} />;
	}

	return <RedditWidgetInner {...props} />;
};
