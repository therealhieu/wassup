import { Result, ok, err } from "neverthrow";
import { RedditPost } from "../../domain/entities/post";
import { FetchPostParams } from "../../domain/repositories/post";
import { RedditPostRepository } from "../../domain/repositories/post";
import { SubredditResponse } from "./http.dtos";
import camelcaseKeys from "camelcase-keys";

export class HttpRedditPostRepository implements RedditPostRepository {
	private readonly BASE_URL = "https://www.reddit.com/r";

	public async fetchMany(
		params: FetchPostParams
	): Promise<Result<RedditPost[], Error>> {
		const { subreddit, sort, limit } = params;
		const url = `${this.BASE_URL}/${subreddit}/${sort}.json?limit=${limit}`;

		try {
			const response = await fetch(url);

			if (!response.ok) {
				return err(new Error("Failed to fetch posts"));
			}

			const json = await response.json().then((json) => {
				const camelCaseJson = camelcaseKeys(json, { deep: true });
				return camelCaseJson;
			});
			const subredditResponse = SubredditResponse.parse(json);

			return ok(subredditResponse.getPosts());
		} catch (error) {
			return err(
				error instanceof Error
					? error
					: new Error("Unknown error occurred")
			);
		}
	}
}
