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

		const errors = results.filter((result) => result.isErr());
		if (errors.length > 0) {
			const error = errors[0].error as Error;
			logger.error("Failed to fetch feeds", {
				message: error.message,
				stack: error.stack,
			});
			return err(error);
		}

		const feeds = results.flatMap((result) => result._unsafeUnwrap());
		const sortedFeeds = feeds.sort(
			(a, b) =>
				new Date(b.publishedAt).getTime() -
				new Date(a.publishedAt).getTime()
		);
		const limitedFeeds = sortedFeeds.slice(0, this.config.limit);

		return ok(limitedFeeds);
	}
}
