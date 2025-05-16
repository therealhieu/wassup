import { YoutubeWidgetConfig } from "../infrastructure/config.schemas";
import { fetchYoutubeWidgetProps } from "../services/youtube.actions";
import { useQuery } from "@tanstack/react-query";
import { ErrorWidget } from "@/components/ErrorWidget";
import { YoutubeWidgetInner } from "./YoutubeWidgetInner";
import { YoutubeWidgetSkeleton } from "./YoutubeWidgetSkeleton";

export interface YoutubeWidgetProps {
	config: YoutubeWidgetConfig;
}

export const YoutubeWidget = ({ config }: YoutubeWidgetProps) => {
	const {
		data: props,
		isLoading,
		error,
	} = useQuery({
		queryKey: ["youtube", config.showTitle, config.channels, config.limit],
		queryFn: () => fetchYoutubeWidgetProps(config),
		staleTime: 1000 * 60 * 5, // 5 minutes
	});

	if (isLoading || !props) {
		return <YoutubeWidgetSkeleton />;
	}
	if (error) {
		return <ErrorWidget error={error} />;
	}

	return <YoutubeWidgetInner {...props} />;
};
