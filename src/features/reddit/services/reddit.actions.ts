"use server";

import { RedditWidgetConfig } from "../infrastructure/config.schemas";
import {
	RedditWidgetInnerProps,
	RedditWidgetInnerPropsSchema,
} from "../presentation/RedditWidget.components";
import { RedditService } from "./reddit";
import { LRUCache } from "lru-cache";

const serviceCache = new LRUCache<string, RedditService>({ max: 20 });

export async function fetchRedditWidgetProps(
	config: RedditWidgetConfig
): Promise<RedditWidgetInnerProps> {
	const key = JSON.stringify(config);
	let service = serviceCache.get(key);

	if (!service) {
		const redditService = await RedditService.fromConfig(config);
		service = redditService;
		serviceCache.set(key, service);
	}

	const posts = await service.fetchPosts();

	if (posts.isErr()) {
		throw posts.error;
	}

	return RedditWidgetInnerPropsSchema.parse({
		config,
		posts: posts.value,
	});
}
