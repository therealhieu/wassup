import { useQuery } from "@tanstack/react-query";
import { RedditWidgetConfig } from "../infrastructure/config.schemas";
import { fetchRedditWidgetProps } from "../services/reddit.actions";
import { RedditWidgetInner } from "./RedditWidgetInner";
import { RedditWidgetSkeleton } from "./RedditWidgetSkeleton";
import { ErrorWidget } from "@/components/ErrorWidget";
// import { getDataKey } from "@/lib/utils";
// import { useAppStore } from "@/providers/AppStoreContextProvider";

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
		staleTime: 1000 * 60 * 5, // 5 minutes
	});

	if (isLoading || !props) {
		return <RedditWidgetSkeleton />;
	}

	if (error) {
		return <ErrorWidget error={error} />;
	}

	return <RedditWidgetInner {...props} />;
};
