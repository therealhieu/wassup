import { RedditPostRepository } from "../domain/repositories/post";
import { RedditConfig } from "../infrastructure/config.schemas";
import { HttpRedditPostRepository } from "../infrastructure/repositories/http.post";

export class RedditService {
	private readonly config: RedditConfig;
	private readonly redditPostRepository: RedditPostRepository;

	constructor(
		config: RedditConfig,
		redditPostRepository: RedditPostRepository
	) {
		this.config = config;
		this.redditPostRepository = redditPostRepository;
	}

	static async fromConfig(config: RedditConfig) {
		const redditPostRepository = new HttpRedditPostRepository();
		return new RedditService(config, redditPostRepository);
	}

	public async fetchPosts() {
		return this.redditPostRepository.fetchPosts(this.config);
	}
}
