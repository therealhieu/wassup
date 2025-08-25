import { err, ok, Result } from "neverthrow";
import { RssFeedRepository } from "../infrastructure/repositories/rss.feed-repository";
import { Feed } from "../domain/entities/feed";
import { FeedWidgetConfig } from "../infrastructure/config.schemas";
import { baseLogger } from "@/lib/logger";

const logger = baseLogger.getSubLogger({
	name: "RssFeedService",
});

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

	public async fetchMany(): Promise<Result<Feed[], Error>> {
		const results = await Promise.all(
			this.repositories.map((repository) => repository.fetchMany())
		);

		// Log any errors but don't fail the entire widget
		const errors = results.filter((result) => result.isErr());
		if (errors.length > 0) {
			logger.warn(`Some RSS feeds failed to load: ${errors.length}/${results.length}`);
			errors.forEach((error, index) => {
				logger.warn(`Feed ${index} error: ${error.error.message}`);
			});
		}

		// Get all successful results and sort each feed by date (newest first)
		const sortedFeedGroups = results
			.filter((result) => result.isOk())
			.map((result) => result.value)
			.filter((feedArray) => feedArray.length > 0) // Filter out empty results
			.map((feedArray) => 
				feedArray.sort((a, b) => 
					new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
				)
			);
		
		if (sortedFeedGroups.length === 0) {
			logger.warn("No RSS feeds loaded successfully");
			return ok([]);
		}

		// Round-robin selection to ensure balanced representation
		const roundRobinFeeds: Feed[] = [];
		const feedIndexes = sortedFeedGroups.map(() => 0); // Track position in each feed
		let currentFeedIndex = 0;

		while (roundRobinFeeds.length < this.config.limit) {
			// Skip feeds that are exhausted
			let attempts = 0;
			while (attempts < sortedFeedGroups.length) {
				const feedGroup = sortedFeedGroups[currentFeedIndex];
				const feedPosition = feedIndexes[currentFeedIndex];

				if (feedPosition < feedGroup.length) {
					// Take next item from current feed
					roundRobinFeeds.push(feedGroup[feedPosition]);
					feedIndexes[currentFeedIndex]++;
					break;
				}

				// Move to next feed
				currentFeedIndex = (currentFeedIndex + 1) % sortedFeedGroups.length;
				attempts++;
			}

			// If all feeds are exhausted, break
			if (attempts >= sortedFeedGroups.length) {
				break;
			}

			// Move to next feed for round-robin
			currentFeedIndex = (currentFeedIndex + 1) % sortedFeedGroups.length;
		}

		const feedDistribution = feedIndexes.map((count, i) => `${count} from feed ${i + 1}`).join(', ');
		logger.info(`RSS feeds loaded: ${roundRobinFeeds.length} items from ${sortedFeedGroups.length} working feeds (round-robin: ${feedDistribution})`);
		
		return ok(roundRobinFeeds);
	}
}
