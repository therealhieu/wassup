import { RedditPost } from "../../domain/entities/post";
import { FetchPostParams, RedditPostRepository } from "../../domain/repositories/post";
import { SubredditResponse } from "./http.dtos";
import { redditAuth } from "../reddit-auth";
import camelcaseKeys from "camelcase-keys";

export class HttpRedditPostRepository implements RedditPostRepository {
	private static readonly OAUTH_BASE_URL = "https://oauth.reddit.com/r";
	private static readonly PUBLIC_BASE_URL = "https://www.reddit.com/r";

	public async fetchMany(params: FetchPostParams): Promise<RedditPost[]> {
		const { subreddit, sort, limit } = params;

		const token = await redditAuth.getAccessToken();
		const baseUrl = token
			? HttpRedditPostRepository.OAUTH_BASE_URL
			: HttpRedditPostRepository.PUBLIC_BASE_URL;

		const url = `${baseUrl}/${subreddit}/${sort}.json?limit=${limit}`;

		const headers: Record<string, string> = {
			"User-Agent": "wassup-dashboard/1.0",
		};

		if (token) {
			headers["Authorization"] = `Bearer ${token}`;
		}

		const response = await fetch(url, { headers });
		if (!response.ok) {
			throw new Error(`Reddit fetch failed: ${response.status} ${response.statusText}`);
		}

		const json = camelcaseKeys(await response.json(), { deep: true });
		const subredditResponse = SubredditResponse.parse(json);
		return subredditResponse.getPosts();
	}
}
