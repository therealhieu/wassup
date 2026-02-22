import { describe, it, expect } from "vitest";
import { HttpHackerNewsStoryRepository } from "../../http.hackernews-story-repository";

describe("HttpHackerNewsStoryRepository", () => {
	const repository = new HttpHackerNewsStoryRepository();

	describe("fetchFromFirebase (no query)", () => {
		it("should fetch top stories", async () => {
			const stories = await repository.fetchMany({
				type: "hackernews",
				sort: "top",
				limit: 3,
				hideTitle: false,
			});

			expect(stories.length).toBeGreaterThan(0);
			expect(stories.length).toBeLessThanOrEqual(3);
			expect(stories[0]).toHaveProperty("id");
			expect(stories[0]).toHaveProperty("title");
			expect(stories[0]).toHaveProperty("score");
			expect(stories[0]).toHaveProperty("by");
		});

		it("should fetch ask stories", async () => {
			const stories = await repository.fetchMany({
				type: "hackernews",
				sort: "ask",
				limit: 2,
				hideTitle: false,
			});

			expect(stories.length).toBeGreaterThan(0);
		});
	});

	describe("fetchFromAlgolia (with query)", () => {
		it("should search stories by query", async () => {
			const stories = await repository.fetchMany({
				type: "hackernews",
				sort: "top",
				limit: 5,
				query: "rust programming",
				hideTitle: false,
			});

			expect(stories.length).toBeGreaterThan(0);
			expect(stories.length).toBeLessThanOrEqual(5);
			expect(stories[0]).toHaveProperty("id");
			expect(stories[0]).toHaveProperty("title");
		});

		it("should search Ask HN by query", async () => {
			const stories = await repository.fetchMany({
				type: "hackernews",
				sort: "ask",
				limit: 3,
				query: "career",
				hideTitle: false,
			});

			expect(stories.length).toBeGreaterThan(0);
		});

		it("should support boolean OR queries", async () => {
			const stories = await repository.fetchMany({
				type: "hackernews",
				sort: "top",
				limit: 5,
				query: "rust OR golang",
				hideTitle: false,
			});

			expect(stories.length).toBeGreaterThan(0);
		});
	});
});
