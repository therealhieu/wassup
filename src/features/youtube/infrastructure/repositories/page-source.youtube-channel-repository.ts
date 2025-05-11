import { YoutubeChannel } from "../../domain/entities/channel";
import { Result, ok, err } from "neverthrow";
import { YoutubeChannelSchema } from "../../domain/entities/channel";
import { YoutubeChannelRepository } from "../../domain/repositories/channel";
import { baseLogger } from "@/lib/logger";

const logger = baseLogger.getSubLogger({
	name: "PageSourceYoutubeChannelRepository",
});

export class PageSourceYoutubeChannelRepository
	implements YoutubeChannelRepository {
	private BASE_URL = "https://www.youtube.com";
	private USERNAME_PATTERNS = [
		{
			regex: /<link\s+rel="alternate"\s+media="handheld"\s+href="https:\/\/m\.youtube\.com\/(@[^"]+)"/,
			name: "alternate handheld"
		},
		{
			regex: /<link\s+rel="alternate"\s+media="only screen and \(max-width: \d+px\)"\s+href="https:\/\/m\.youtube\.com\/(@[^"]+)"/,
			name: "alternate max-width screen"
		},
		{
			regex: /"vanityChannelUrl"\s*:\s*"https?:\/\/www\.youtube\.com\/(@[^"]+)"/,
			name: "vanityChannelUrl"
		},
		{
			regex: /"originalUrl"\s*:\s*"https?:\/\/www\.youtube\.com\/(@[^"]+)"/,
			name: "originalUrl"
		},
		{
			regex: /<link\s+rel="canonical"\s+href="https?:\/\/www\.youtube\.com\/(@[^"]+)"/,
			name: "canonical"
		}
	];

	async findByName(
		name: string
	): Promise<Result<YoutubeChannel, Error>> {
		if (!name.startsWith('@')) {
			return err(new Error('Name must start with @'));
		}

		const url = `${this.BASE_URL}/${name}`;
		logger.info(`Fetching channel from ${url}`);
		const response = await fetch(url);
		logger.info(`Response status: ${response.status}`);

		if (response.status === 404) {
			return err(new Error("Channel not found"));
		}

		const html = await response.text();

		const rssUrlMatch = html.match(
			/rssUrl"?\s*:\s*"(https:\/\/www\.youtube\.com\/feeds\/videos\.xml\?channel_id=([^"]+))"/
		);
		if (!rssUrlMatch) {
			return err(new Error("Could not find RSS URL and channel ID"));
		}
		const rssUrl = rssUrlMatch[1];
		const channelId = rssUrlMatch[2];
		logger.info(
			`Found RSS URL ${rssUrl} with channel ID ${channelId} for name ${name}`
		);
		const channelUrl = `${this.BASE_URL}/channel/${channelId}`;

		return ok(
			YoutubeChannelSchema.parse({
				id: channelId,
				name,
				rssUrl,
				channelUrl
			})
		);
	}

	async findById(channelId: string): Promise<Result<YoutubeChannel, Error>> {
		const url = `${this.BASE_URL}/channel/${channelId}`;
		logger.info(`Fetching channel from ${url}`);
		const response = await fetch(url);
		logger.info(`Response status: ${response.status}`);

		if (response.status === 404) {
			return err(new Error("Channel not found"));
		}

		const html = await response.text();
		let name: string | undefined;

		// Try each pattern until we find a match
		for (const pattern of this.USERNAME_PATTERNS) {
			const match = html.match(pattern.regex);
			if (match && match[1]) {
				name = match[1];
				logger.info(`Found name using '${pattern.name}' pattern.`);
				break;
			}
		}

		if (!name) {
			return err(new Error("Could not extract name using any known patterns from the channel page."));
		}

		const rssUrl = `${this.BASE_URL}/feeds/videos.xml?channel_id=${channelId}`;
		const channelUrl = `${this.BASE_URL}/channel/${channelId}`;

		return ok(
			YoutubeChannelSchema.parse({
				id: channelId,
				name,
				rssUrl,
				channelUrl,
			})
		);
	}
}