"use server";

import { Feed } from "../domain/entities/feed";
import { FeedWidgetConfig } from "../infrastructure/config.schemas";
import { RssFeedRepository } from "../infrastructure/repositories/rss.feed-repository";
import { FeedWidgetInnerProps } from "../presentation/FeedWidgetInner";
import { RssFeedService } from "./rss";
import { LRUCache } from "lru-cache";
import { serverActionDuration, cacheHits, cacheMisses } from "@/lib/metrics";

const feedCache = new LRUCache<string, Feed[]>({
	max: 50,
	ttl: 1000 * 60 * 5, // 5 minutes
});

/**
 * Fetch feeds from a single RSS URL.
 * Used by FeedWidget's `useQueries` for gradual/progressive loading.
 */
export async function fetchSingleFeed(
	url: string,
	limit: number
): Promise<Feed[]> {
	const end = serverActionDuration.startTimer({ action: "feed" });
	try {
		const key = `${url}|${limit}`;
		const cached = feedCache.get(key);
		if (cached) {
			cacheHits.inc({ cache: "feed" });
			end({ status: "hit" });
			return cached;
		}
		cacheMisses.inc({ cache: "feed" });

		const repo = new RssFeedRepository(url, limit);
		const feeds = await repo.fetchMany();
		feedCache.set(key, feeds);
		end({ status: "success" });
		return feeds;
	} catch (e) {
		end({ status: "error" });
		throw e;
	}
}

/**
 * Fetch feeds from all configured URLs at once.
 * Used by TabsWidget for prefetching all tab data in parallel.
 */
export async function fetchFeedWidgetProps(
	config: FeedWidgetConfig
): Promise<FeedWidgetInnerProps> {
	const end = serverActionDuration.startTimer({ action: "feed_batch" });
	try {
		const service = RssFeedService.fromConfig(config);
		const feeds = await service.fetchMany();
		end({ status: "success" });
		return { config, feeds };
	} catch (e) {
		end({ status: "error" });
		throw e;
	}
}
