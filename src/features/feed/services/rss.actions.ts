"use server";

import { Feed } from "../domain/entities/feed";
import { FeedWidgetConfig } from "../infrastructure/config.schemas";
import { RssFeedRepository } from "../infrastructure/repositories/rss.feed-repository";
import { FeedWidgetInnerProps } from "../presentation/FeedWidgetInner";
import { RssFeedService } from "./rss";

/**
 * Fetch feeds from a single RSS URL.
 * Used by FeedWidget's `useQueries` for gradual/progressive loading.
 */
export async function fetchSingleFeed(
	url: string,
	limit: number
): Promise<Feed[]> {
	const repo = new RssFeedRepository(url, limit);
	return repo.fetchMany();
}

/**
 * Fetch feeds from all configured URLs at once.
 * Used by TabsWidget for prefetching all tab data in parallel.
 */
export async function fetchFeedWidgetProps(
	config: FeedWidgetConfig
): Promise<FeedWidgetInnerProps> {
	const service = RssFeedService.fromConfig(config);
	const feeds = await service.fetchMany();
	return { config, feeds };
}
