import { WeatherWidget } from "@/features/weather/presentation/WeatherWidget";
import { TabsWidget } from "@/features/tabs/presentation/TabWidget";
import { RedditWidget } from "@/features/reddit/presentation/RedditWidget";
import { YoutubeWidget } from "@/features/youtube/presentation/YoutubeWidget";
import { WidgetConfig } from "@/infrastructure/config.schemas";
import { BookmarkWidget } from "@/features/bookmark/presentation/BookmarkWidget";
import { FeedWidget } from "@/features/feed/presentation/FeedWidget";
import { GithubWidget } from "@/features/github/presentation/GithubWidget";
import { memo } from "react";

interface WidgetComponentProps {
	widgetConfig: WidgetConfig;
}

export const Widget = memo(function Widget({ widgetConfig }: WidgetComponentProps) {
	const widgetElement = (() => {
		switch (widgetConfig.type) {
			case "weather":
				return <WeatherWidget config={widgetConfig} />;
			case "tabs":
				return <TabsWidget config={widgetConfig} />;
			case "reddit":
				return <RedditWidget config={widgetConfig} />;
			case "youtube":
				return <YoutubeWidget config={widgetConfig} />;
			case "bookmark":
				return <BookmarkWidget config={widgetConfig} />;
			case "feed":
				return <FeedWidget config={widgetConfig} />;
			case "github":
				return <GithubWidget config={widgetConfig} />;
		}
	})();

	return <div style={{ marginBottom: 10 }}>{widgetElement}</div>;
});
