"use server";

import { RedditWidgetConfig } from "../infrastructure/config.schemas";
import {
	RedditWidgetInnerProps,
	RedditWidgetInnerPropsSchema,
} from "../presentation/RedditWidgetInner";
import { HttpRedditPostRepository } from "../infrastructure/repositories/http.reddit-post-respository";
import { LRUCache } from "lru-cache";
import { serverActionDuration, cacheHits, cacheMisses } from "@/lib/metrics";

const repository = new HttpRedditPostRepository();

const dataCache = new LRUCache<string, RedditWidgetInnerProps>({
	max: 20,
	ttl: 1000 * 60 * 5, // 5 minutes
});

export async function fetchRedditWidgetProps(
	config: RedditWidgetConfig
): Promise<RedditWidgetInnerProps> {
	const end = serverActionDuration.startTimer({ action: "reddit" });
	try {
		const key = JSON.stringify(config);
		const cached = dataCache.get(key);
		if (cached) {
			cacheHits.inc({ cache: "reddit" });
			end({ status: "hit" });
			return cached;
		}
		cacheMisses.inc({ cache: "reddit" });

		const posts = await repository.fetchMany(config);
		const data = RedditWidgetInnerPropsSchema.parse({ config, posts });
		dataCache.set(key, data);
		end({ status: "success" });
		return data;
	} catch (e) {
		end({ status: "error" });
		throw e;
	}
}
