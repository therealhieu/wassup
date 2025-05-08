import { useQuery } from "@tanstack/react-query";
import { RedditWidgetConfig } from "../infrastructure/config.schemas";
import { fetchRedditWidgetProps } from "../services/reddit.actions";
import { RedditWidgetInner } from "./RedditWidget.components";

export interface RedditWidgetProps {
	config: RedditWidgetConfig;
}

export const RedditWidget = ({ config }: RedditWidgetProps) => {
	const { data: props } = useQuery({
		queryKey: ["reddit", config.subreddit, config.sort, config.limit],
		queryFn: () => fetchRedditWidgetProps(config),
	});

	if (!props) {
		return null;
	}

	return <RedditWidgetInner {...props} />;
};
