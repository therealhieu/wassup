"use server";

import { TabsWidgetConfig } from "../infrastructure/config.schemas";
import { WidgetConfig } from "@/infrastructure/config.schemas";
import { fetchWeatherWidgetProps } from "@/features/weather/services/weather.actions";
import { getDataKey } from "@/lib/utils";
import { fetchRedditWidgetProps } from "@/features/reddit/services/reddit.actions";
import { fetchYoutubeWidgetProps } from "@/features/youtube/services/youtube.actions";
import { fetchFeedWidgetProps } from "@/features/feed/services/rss.actions";

// Record keyed by getDataKey(widgetConfig) → fetched widget props
type WidgetDataRecord = Record<string, unknown>;

export async function fetchTabsWidgetProps(
	tabsWidgetConfig: TabsWidgetConfig
): Promise<WidgetDataRecord> {
	const record: WidgetDataRecord = {};

	for (const tab of tabsWidgetConfig.tabs as WidgetConfig[]) {
		const key = getDataKey(tab);
		switch (tab.type) {
			case "weather":
				record[key] = await fetchWeatherWidgetProps(tab);
				break;
			case "reddit":
				record[key] = await fetchRedditWidgetProps(tab);
				break;
			case "youtube":
				record[key] = await fetchYoutubeWidgetProps(tab);
				break;
			case "feed":
				record[key] = await fetchFeedWidgetProps(tab);
				break;
			case "tabs":
				Object.assign(record, await fetchTabsWidgetProps(tab));
				break;
			case "bookmark":
				// Static — no data to fetch
				break;
		}
	}

	return record;
}
