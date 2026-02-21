"use server";

import { RedditWidgetConfig } from "../infrastructure/config.schemas";
import {
	RedditWidgetInnerProps,
	RedditWidgetInnerPropsSchema,
} from "../presentation/RedditWidgetInner";
import { HttpRedditPostRepository } from "../infrastructure/repositories/http.reddit-post-respository";
import { LRUCache } from "lru-cache";

const repository = new HttpRedditPostRepository();

const dataCache = new LRUCache<string, RedditWidgetInnerProps>({
	max: 20,
	ttl: 1000 * 60 * 5, // 5 minutes
});

export async function fetchRedditWidgetProps(
	config: RedditWidgetConfig
): Promise<RedditWidgetInnerProps> {
	const key = JSON.stringify(config);
	const cached = dataCache.get(key);
	if (cached) return cached;

	const posts = await repository.fetchMany(config);
	const data = RedditWidgetInnerPropsSchema.parse({ config, posts });
	dataCache.set(key, data);
	return data;
}
