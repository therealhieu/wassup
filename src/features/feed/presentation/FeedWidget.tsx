import { useQuery } from "@tanstack/react-query";
import { FeedWidgetConfig } from "../infrastructure/config.schemas";
import { fetchFeedWidgetProps } from "../services/rss.actions";
import { FeedWidgetInner, FeedWidgetInnerProps } from "./FeedWidgetInner";
import { ErrorWidget } from "@/components/ErrorWidget";
import { getDataKey } from "@/lib/utils";
import { useAppStore } from "@/providers/AppStoreContextProvider";

interface FeedWidgetProps {
	config: FeedWidgetConfig;
}

export function FeedWidget({ config }: FeedWidgetProps) {
	const dataKey = getDataKey(config);
	const initialData = useAppStore(
		(s) => s.widgetData[dataKey] as FeedWidgetInnerProps | undefined
	);

	const {
		data: props,
		isLoading,
		error,
	} = useQuery({
		queryKey: ["rss", ...config.urls, config.limit],
		queryFn: () => fetchFeedWidgetProps(config),
		initialData: initialData,
		staleTime: 1000 * 60 * 5, // 5 minutes
	});

	if (isLoading) {
		return <div>Loading...</div>; // TODO: Create FeedWidgetSkeleton
	}

	if (error) {
		return <ErrorWidget error={error} />;
	}

	if (!props) {
		return <ErrorWidget error={new Error("No data")} />;
	}

	return <FeedWidgetInner {...props} />;
}
