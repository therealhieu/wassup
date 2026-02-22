"use server";

import { TabsWidgetConfig } from "../infrastructure/config.schemas";
import { WidgetConfig } from "@/infrastructure/config.schemas";
import { fetchWeatherWidgetProps } from "@/features/weather/services/weather.actions";
import { getDataKey } from "@/lib/utils";
import { fetchRedditWidgetProps } from "@/features/reddit/services/reddit.actions";
import { fetchYoutubeWidgetProps } from "@/features/youtube/services/youtube.actions";
import { fetchFeedWidgetProps } from "@/features/feed/services/rss.actions";
import { fetchGithubWidgetProps } from "@/features/github/services/github.actions";

// Record keyed by getDataKey(widgetConfig) → fetched widget props
type WidgetDataRecord = Record<string, unknown>;

export async function fetchTabsWidgetProps(
	tabsWidgetConfig: TabsWidgetConfig
): Promise<WidgetDataRecord> {
	const tabs = tabsWidgetConfig.tabs as WidgetConfig[];

	const fetchTab = async (
		tab: WidgetConfig
	): Promise<[string, unknown] | null> => {
		const key = getDataKey(tab);
		switch (tab.type) {
			case "weather":
				return [key, await fetchWeatherWidgetProps(tab)];
			case "reddit":
				return [key, await fetchRedditWidgetProps(tab)];
			case "youtube":
				return [key, await fetchYoutubeWidgetProps(tab)];
			case "feed":
				return [key, await fetchFeedWidgetProps(tab)];
			case "tabs": {
				const nested = await fetchTabsWidgetProps(tab);
				return [key, nested];
			}
			case "bookmark":
				// Static — no data to fetch
				return null;
			case "github":
				return [key, await fetchGithubWidgetProps(tab)];
			default:
				return null;
		}
	};

	const results = await Promise.allSettled(tabs.map(fetchTab));

	const record: WidgetDataRecord = {};
	for (const result of results) {
		if (result.status === "fulfilled" && result.value) {
			const [key, value] = result.value;
			// Nested tabs return a WidgetDataRecord — merge it in
			if (
				typeof value === "object" &&
				value !== null &&
				!Array.isArray(value) &&
				tabs.find((t) => getDataKey(t) === key)?.type === "tabs"
			) {
				Object.assign(record, value);
			} else {
				record[key] = value;
			}
		}
	}

	return record;
}
