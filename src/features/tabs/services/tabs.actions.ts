"use server";

import { WidgetProps } from "@/lib/schemas";
import { TabsWidgetConfig } from "../infrastructure/config.schemas";
import { fetchWeatherWidgetProps } from "@/features/weather/services/weather.actions";
import { getDataKey } from "@/lib/utils";
import { fetchRedditWidgetProps } from "@/features/reddit/services/reddit.actions";
import { fetchYoutubeWidgetProps } from "@/features/youtube/services/youtube.actions";

export async function fetchTabsWidgetProps(
	tabsWidgetConfig: TabsWidgetConfig
): Promise<Record<string, WidgetProps>> {
	let record: Record<string, WidgetProps> = {};

	for (const tab of tabsWidgetConfig.tabs) {
		let innerRecord = {};

		switch (tab.type) {
			case "weather":
				innerRecord = await fetchWeatherWidgetProps(tab);
				break;
			case "reddit":
				innerRecord = await fetchRedditWidgetProps(tab);
				break;
			case "youtube":
				innerRecord = await fetchYoutubeWidgetProps(tab);
				break;
			case "tabs":
				innerRecord = await fetchTabsWidgetProps(
					tab as TabsWidgetConfig
				);
				break;
			default:
				throw new Error(`Unknown tab type: ${tab.type}`);
		}

		const key = getDataKey(tab);
		record = {
			...record,
			[key]: innerRecord,
		};
	}

	return record;
}
