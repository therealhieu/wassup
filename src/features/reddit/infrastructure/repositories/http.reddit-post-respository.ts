import { RedditPost } from "../../domain/entities/post";
import { FetchPostParams, RedditPostRepository } from "../../domain/repositories/post";
import { SubredditResponse } from "./http.dtos";
import camelcaseKeys from "camelcase-keys";

export class HttpRedditPostRepository implements RedditPostRepository {
	private readonly BASE_URL = "https://www.reddit.com/r";

	public async fetchMany(params: FetchPostParams): Promise<RedditPost[]> {
		const { subreddit, sort, limit } = params;
		const url = `${this.BASE_URL}/${subreddit}/${sort}.json?limit=${limit}`;

		const response = await fetch(url, {
			headers: { "User-Agent": "wassup-dashboard/1.0" },
		});
		if (!response.ok) {
			throw new Error(`Reddit fetch failed: ${response.status} ${response.statusText}`);
		}

		const json = camelcaseKeys(await response.json(), { deep: true });
		const subredditResponse = SubredditResponse.parse(json);
		return subredditResponse.getPosts();
	}
}
