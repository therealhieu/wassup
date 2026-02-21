"use server";

import { FeedWidgetConfig } from "../infrastructure/config.schemas";
import { FeedWidgetInnerProps } from "../presentation/FeedWidgetInner";
import { RssFeedService } from "./rss";
import { LRUCache } from "lru-cache";

const dataCache = new LRUCache<string, FeedWidgetInnerProps>({
	max: 20,
	ttl: 1000 * 60 * 5, // 5 minutes
});

export async function fetchFeedWidgetProps(
	config: FeedWidgetConfig
): Promise<FeedWidgetInnerProps> {
	const key = JSON.stringify(config);
	const cached = dataCache.get(key);
	if (cached) return cached;

	const service = RssFeedService.fromConfig(config);
	const feeds = await service.fetchMany();
	const data: FeedWidgetInnerProps = { config, feeds };
	dataCache.set(key, data);
	return data;
}
