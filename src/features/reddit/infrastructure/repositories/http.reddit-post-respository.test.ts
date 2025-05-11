import { describe, expect, it } from "vitest";
import { HttpRedditPostRepository } from "./http.reddit-post-respository";

describe("HttpRedditPostRepository", () => {
	describe("fetchMany", () => {
		it("should fetch posts from a subreddit", async () => {
			const client = new HttpRedditPostRepository();
			const posts = await client.fetchMany({
				type: "reddit",
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
