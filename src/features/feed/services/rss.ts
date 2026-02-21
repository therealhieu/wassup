import { RssFeedRepository } from "../infrastructure/repositories/rss.feed-repository";
import { Feed } from "../domain/entities/feed";
import { FeedWidgetConfig } from "../infrastructure/config.schemas";
import { baseLogger } from "@/lib/logger";

const logger = baseLogger.getSubLogger({ name: "RssFeedService" });

export class RssFeedService {
	private repositories: RssFeedRepository[];
	private config: FeedWidgetConfig;

	constructor(config: FeedWidgetConfig, repositories: RssFeedRepository[]) {
		this.config = config;
		this.repositories = repositories;
	}

	public static fromConfig(config: FeedWidgetConfig): RssFeedService {
		const repositories = config.urls.map(
			(url) => new RssFeedRepository(url, config.limit)
		);
		return new RssFeedService(config, repositories);
	}

	public async fetchMany(): Promise<Feed[]> {
		const results = await Promise.all(
			this.repositories.map((repo) => repo.fetchMany())
		);

		// Filter out empty results and sort each feed group by date (newest first)
		const sortedFeedGroups = results
			.filter((feeds) => feeds.length > 0)
			.map((feeds) =>
				feeds.sort(
					(a, b) =>
						new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
				)
			);

		if (sortedFeedGroups.length === 0) {
			logger.warn("No RSS feeds loaded successfully");
			return [];
		}

		// Round-robin selection to ensure balanced representation
		const roundRobinFeeds: Feed[] = [];
		const feedIndexes = sortedFeedGroups.map(() => 0);
		let currentFeedIndex = 0;

		while (roundRobinFeeds.length < this.config.limit) {
			let attempts = 0;
			while (attempts < sortedFeedGroups.length) {
				const feedGroup = sortedFeedGroups[currentFeedIndex];
				const feedPosition = feedIndexes[currentFeedIndex];

				if (feedPosition < feedGroup.length) {
					roundRobinFeeds.push(feedGroup[feedPosition]);
					feedIndexes[currentFeedIndex]++;
					break;
				}

				currentFeedIndex = (currentFeedIndex + 1) % sortedFeedGroups.length;
				attempts++;
			}

			if (attempts >= sortedFeedGroups.length) break;
			currentFeedIndex = (currentFeedIndex + 1) % sortedFeedGroups.length;
		}

		logger.info(`RSS feeds loaded: ${roundRobinFeeds.length} items from ${sortedFeedGroups.length} working feeds`);
		return roundRobinFeeds;
	}
}
