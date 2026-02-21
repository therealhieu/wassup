import { YoutubeVideo } from "../../domain/entities/video";
import { YoutubeVideoRepository } from "../../domain/repositories/video";
import { baseLogger } from "@/lib/logger";
import { XMLParser } from "fast-xml-parser";
import { YoutubeFeedSchema } from "./rss.youtube-video-repository.dtos";

const logger = baseLogger.getSubLogger({
	name: "RssYoutubeVideoRepository",
});

export class RssYoutubeVideoRepository implements YoutubeVideoRepository {
	async fetchMany(channelId: string): Promise<YoutubeVideo[]> {
		const response = await fetch(
			`https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`
		);

		if (!response.ok) {
			throw new Error(`YouTube RSS fetch failed: ${response.status} for channel ${channelId}`);
		}

		const xml = await response.text();
		const xmlParser = new XMLParser({
			ignoreAttributes: false,
			removeNSPrefix: true,
			attributeNamePrefix: "",
		});
		const json = xmlParser.parse(xml);
		const feed = YoutubeFeedSchema.parse(json);

		const videos = feed.feed.entry.map((entry) => entry.toYoutubeVideo());
		logger.info(`Found ${videos.length} videos for channel ${channelId}`);
		return videos;
	}
}
