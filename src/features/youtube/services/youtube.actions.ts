"use server";

import { LRUCache } from "lru-cache";
import { YoutubeWidgetConfig } from "../infrastructure/config.schemas";
import { YoutubeWidgetInnerProps } from "../presentation/YoutubeWidgetInner";
import { YoutubeService, YoutubeWidgetData } from "./youtube";

// Cache the fetched data (channels + videos), not the service instance
const dataCache = new LRUCache<string, YoutubeWidgetData>({
	max: 20,
	ttl: 1000 * 60 * 5, // 5 minutes
});

export async function fetchYoutubeWidgetProps(
	config: YoutubeWidgetConfig
): Promise<YoutubeWidgetInnerProps> {
	const key = JSON.stringify(config);
	let data = dataCache.get(key);

	if (!data) {
		data = await YoutubeService.create(config).fetch();
		dataCache.set(key, data);
	}

	return { config, ...data };
}