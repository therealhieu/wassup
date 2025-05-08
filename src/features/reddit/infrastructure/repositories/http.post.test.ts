import { describe, expect, it } from "vitest";
import { RedditClient } from "../client";

describe("RedditClient", () => {
	describe("fetchPosts", () => {
		it("should fetch posts from a subreddit", async () => {
			const client = new RedditClient();
			const posts = await client.fetchPosts({
				subreddit: "typescript",
				sort: "hot",
				limit: 5,
				hideTitle: false,
			});

			if (posts.isErr()) {
				throw new Error("Failed to fetch posts");
			}

			expect(posts.value).toBeInstanceOf(Array);
		}, 10000);
	});
});
