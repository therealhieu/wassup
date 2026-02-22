"use server";

import { HackerNewsWidgetConfig } from "../infrastructure/config.schemas";
import {
	HackerNewsWidgetInnerProps,
	HackerNewsWidgetInnerPropsSchema,
} from "../presentation/HackerNewsWidgetInner";
import { HttpHackerNewsStoryRepository } from "../infrastructure/repositories/http.hackernews-story-repository";
import { LRUCache } from "lru-cache";

const repository = new HttpHackerNewsStoryRepository();

const dataCache = new LRUCache<string, HackerNewsWidgetInnerProps>({
	max: 20,
	ttl: 1000 * 60 * 5, // 5 minutes
});

export async function fetchHackerNewsWidgetProps(
	config: HackerNewsWidgetConfig
): Promise<HackerNewsWidgetInnerProps> {
	const key = JSON.stringify(config);
	const cached = dataCache.get(key);
	if (cached) return cached;

	const stories = await repository.fetchMany(config);
	const data = HackerNewsWidgetInnerPropsSchema.parse({ config, stories });
	dataCache.set(key, data);
	return data;
}
