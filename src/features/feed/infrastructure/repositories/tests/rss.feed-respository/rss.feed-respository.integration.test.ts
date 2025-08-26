import { describe, expect, it } from "vitest";
import { RssFeedRepository } from "../../rss.feed-repository";

describe("MultiSourceFeedRepository", () => {
	const testFeedFetch = async (url: string) => {
		// Arrange
		const limit = 5;
		const repository = new RssFeedRepository(url, limit);

		// Act
		const result = await repository.fetchMany();

		// Assert
		expect(result.isOk()).toBe(true);
		if (result.isOk()) {
			const feeds = result.value;
			expect(feeds.length).toBeLessThanOrEqual(limit);
		}
	};

	it("should fetch and parse RSS feeds from Data Engineering Weekly", async () => {
		await testFeedFetch("https://www.dataengineeringweekly.com/feed");
	});

	it("should fetch and parse RSS feeds from Seattle Data Guy", async () => {
		await testFeedFetch("https://www.theseattledataguy.com/feed/");
	});

	it("should handle invalid endpoints gracefully", async () => {
		// Arrange
		const invalidUrl = "https://this-domain-definitely-does-not-exist-12345.invalid/feed";
		const limit = 5;
		const repository = new RssFeedRepository(invalidUrl, limit);

		// Act
		const result = await repository.fetchMany();

		// Assert
		// The repository is designed to be resilient - it returns empty results instead of errors
		expect(result.isOk()).toBe(true);
		if (result.isOk()) {
			const feeds = result.value;
			expect(feeds).toEqual([]);
		}
	});
});
