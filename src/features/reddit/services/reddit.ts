import { Result } from "neverthrow";
import { RedditPostRepository } from "../domain/repositories/post";
import { RedditWidgetConfig } from "../infrastructure/config.schemas";
import { HttpRedditPostRepository } from "../infrastructure/repositories/http.reddit-post-respository";
import { RedditPost } from "../domain/entities/post";

export class RedditService {
	private readonly config: RedditWidgetConfig;
	private readonly redditPostRepository: RedditPostRepository;

	constructor(
		config: RedditWidgetConfig,
		redditPostRepository: RedditPostRepository
	) {
		this.config = config;
		this.redditPostRepository = redditPostRepository;
	}

	static async fromConfig(config: RedditWidgetConfig): Promise<RedditService> {
		const redditPostRepository = new HttpRedditPostRepository();
		return new RedditService(config, redditPostRepository);
	}

	public async fetchMany(): Promise<Result<RedditPost[], Error>> {
		return this.redditPostRepository.fetchMany(this.config);
	}
}
