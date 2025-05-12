import { YoutubeWidgetConfig } from "../infrastructure/config.schemas";
import { fetchYoutubeWidgetProps } from "../services/youtube.actions";
import { useQuery } from "@tanstack/react-query";
import { ErrorWidget } from "@/components/ErrorWidget";
import {
	YoutubeWidgetInner,
	YoutubeWidgetInnerProps,
} from "./YoutubeWidgetInner";
import { YoutubeWidgetSkeleton } from "./YoutubeWidgetSkeleton";
import { getDataKey } from "@/lib/utils";
import { useAppStore } from "@/providers/AppStoreContextProvider";

export interface YoutubeWidgetProps {
	config: YoutubeWidgetConfig;
}

export const YoutubeWidget = ({ config }: YoutubeWidgetProps) => {
	const dataKey = getDataKey(config);
	const initialData = useAppStore(
		(s) => s.widgetData[dataKey] as YoutubeWidgetInnerProps | undefined
	);

	const {
		data: props,
		isLoading,
		error,
	} = useQuery({
		queryKey: ["youtube", config.showTitle, config.channels, config.limit],
		queryFn: () => fetchYoutubeWidgetProps(config),
		initialData,
		staleTime: 1000 * 60 * 5, // 5 minutes
	});

	if (isLoading) {
		return <YoutubeWidgetSkeleton />;
	}
	if (error) {
		return <ErrorWidget error={error} />;
	}

	if (!props) {
		return <ErrorWidget error={new Error("No data available")} />;
	}

	return <YoutubeWidgetInner {...props} />;
};
