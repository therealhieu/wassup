import { YoutubeVideo } from "../../domain/entities/video";
import { YoutubeVideoRepository } from "../../domain/repositories/video";
import { baseLogger } from "@/lib/logger";
import { XMLParser } from "fast-xml-parser";
import { ok, Result } from "neverthrow";
import { err } from "neverthrow";
import { YoutubeFeedSchema } from "./rss.youtube-video-repository.dtos";
import { isYoutubeShort } from "../../lib/youtube";

const logger = baseLogger.getSubLogger({
	name: "RssYoutubeVideoRepository",
})

export class RssYoutubeVideoRepository implements YoutubeVideoRepository {
	constructor() {
	}

	async fetchMany(
		channelId: string,
	): Promise<Result<YoutubeVideo[], Error>> {
		try {
			const response = await fetch(`https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`);

			const xml = await response.text();
			const xmlParser = new XMLParser({
				ignoreAttributes: false,
				removeNSPrefix: true,
				attributeNamePrefix: "",
			});
			const json = xmlParser.parse(xml);
			const feed = YoutubeFeedSchema.parse(json);

			const allVideos = feed.feed.entry
				.map((entry) => entry.toYoutubeVideo());

			const videoPromises = allVideos.map(async (video) => {
				const isShort = await isYoutubeShort(video.id);
				return isShort ? null : video;
			});

			const videos = (await Promise.all(videoPromises)).filter((video): video is YoutubeVideo => video !== null);
			logger.info(`Found ${videos.length} videos (excluding shorts)`);

			return ok(videos);
		} catch (error) {
			logger.error(error);
			return err(error as Error);
		}
	}
}
