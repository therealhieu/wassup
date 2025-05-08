"use client";

import { WidgetConfig } from "@/infrastructure/config.schemas";
import { ErrorWidget } from "./ErrorWidget";
import { WeatherWidget } from "@/features/weather/presentation/WeatherWidget";
import { TabsWidget } from "@/features/tabs/presentation/TabWidget";
import { RedditWidget } from "@/features/reddit/presentation/RedditWidget";

interface WidgetComponentProps {
	widgetConfig: WidgetConfig;
}

export function Widget({ widgetConfig }: WidgetComponentProps) {
	switch (widgetConfig.type) {
		case "weather":
			return <WeatherWidget config={widgetConfig} />;
		case "tabs":
			return <TabsWidget config={widgetConfig} />;
		case "reddit":
			return <RedditWidget config={widgetConfig} />;
		default:
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
