// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { ErrorWidget } from "./ErrorWidget";
import { WeatherWidget } from "@/features/weather/presentation/WeatherWidget";
import { TabsWidget } from "@/features/tabs/presentation/TabWidget";
import { RedditWidget } from "@/features/reddit/presentation/RedditWidget";
import { YoutubeWidget } from "@/features/youtube/presentation/YoutubeWidget";
import { WidgetConfig } from "@/infrastructure/config.schemas";

interface WidgetComponentProps {
	widgetConfig: WidgetConfig;
}

export function Widget({ widgetConfig }: WidgetComponentProps) {
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
			default: {
				return (
					<ErrorWidget
						error={
							new Error(
								`Unsupported widget type: ${widgetConfig.type}`
							)
						}
					/>
				);
			}
		}
	})();

	return <div style={{ marginBottom: 10 }}>{widgetElement}</div>;
}
