import { describe, expect, it } from "vitest";
import { PageSourceYoutubeChannelRepository } from "./page-source.youtube-channel-repository";

describe("PageSourceYoutubeChannelRepository", () => {
	it("should find a channel by username", async () => {
		const repository = new PageSourceYoutubeChannelRepository();
		const channel = await repository.findByUsername("hello_interview");

		if (channel.isErr()) {
			throw new Error("Failed to find channel", { cause: channel.error });
		}

		expect(channel.value).toEqual(
			expect.objectContaining({
				id: expect.any(String),
				username: expect.any(String),
				rssUrl: expect.any(String),
			})
		);
	});
});
