import { useQuery } from "@tanstack/react-query";
import { RedditWidgetConfig } from "../infrastructure/config.schemas";
import { fetchRedditWidgetProps } from "../services/reddit.actions";
import { RedditWidgetInner, RedditWidgetInnerProps } from "./RedditWidgetInner";
import { RedditWidgetSkeleton } from "./RedditWidgetSkeleton";
import { ErrorWidget } from "@/components/ErrorWidget";
import { getDataKey } from "@/lib/utils";
import { useAppStore } from "@/providers/AppStoreContextProvider";

export interface RedditWidgetProps {
	config: RedditWidgetConfig;
}

export const RedditWidget = ({ config }: RedditWidgetProps) => {
	const dataKey = getDataKey(config);
	const initialData = useAppStore(
		(s) => s.widgetData[dataKey] as RedditWidgetInnerProps | undefined
	);

	const {
		data: props,
		isLoading,
		error,
	} = useQuery({
		queryKey: ["reddit", config.subreddit, config.sort, config.limit],
		queryFn: () => fetchRedditWidgetProps(config),
		initialData: initialData, // ← hydrate from your server cache
		staleTime: 1000 * 60 * 5, // 5 minutes
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
