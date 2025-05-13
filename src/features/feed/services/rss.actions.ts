"use server";

import { FeedWidgetConfig } from "../infrastructure/config.schemas";
import { FeedWidgetInnerProps } from "../presentation/FeedWidgetInner";
import { RssFeedService } from "./rss";
import { LRUCache } from "lru-cache";

const serviceCache = new LRUCache<string, RssFeedService>({ max: 20 });

export async function fetchFeedWidgetProps(
	config: FeedWidgetConfig
): Promise<FeedWidgetInnerProps> {
	const key = JSON.stringify(config);
	let service = serviceCache.get(key);

	if (!service) {
		service = RssFeedService.fromConfig(config);
		serviceCache.set(key, service);
	}

	const feeds = await service.fetchMany();

	if (feeds.isErr()) {
		throw feeds.error;
	}

	return {
		config,
		feeds: feeds.value,
	};
}
