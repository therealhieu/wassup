import { YoutubeWidgetConfig } from "../infrastructure/config.schemas";
import { YoutubeVideo } from "../domain/entities/video";
import { YoutubeVideoRepository } from "../domain/repositories/video";
import { YoutubeChannelRepository } from "../domain/repositories/channel";
import { RssYoutubeVideoRepository } from "../infrastructure/repositories/rss.youtube-video-repository";
import { PageSourceYoutubeChannelRepository } from "../infrastructure/repositories/page-source.youtube-channel-repository";
import { YoutubeChannel } from "../domain/entities/channel";
import { baseLogger } from "@/lib/logger";

const logger = baseLogger.getSubLogger({ name: "YoutubeService" });

export interface YoutubeWidgetData {
	channels: YoutubeChannel[];
	videos: YoutubeVideo[];
}

export class YoutubeService {
	private readonly config: YoutubeWidgetConfig;
	private readonly videoRepository: YoutubeVideoRepository;
	private readonly channelRepository: YoutubeChannelRepository;

	private constructor(config: YoutubeWidgetConfig) {
		this.config = config;
		this.videoRepository = new RssYoutubeVideoRepository();
		this.channelRepository = new PageSourceYoutubeChannelRepository();
	}

	static create(config: YoutubeWidgetConfig): YoutubeService {
		return new YoutubeService(config);
	}

	private async resolveChannels(): Promise<YoutubeChannel[]> {
		return Promise.all(
			this.config.channels.map((channel) => {
				if (channel.startsWith("@")) {
					return this.channelRepository.findByName(channel);
				}
				if (channel.startsWith("UC")) {
					return this.channelRepository.findById(channel);
				}
				throw new Error(
					`Invalid channel format: ${channel}. Must start with '@' or 'UC'`
				);
			})
		);
	}

	async fetch(): Promise<YoutubeWidgetData> {
		const channels = await this.resolveChannels();
		logger.info(
			`Resolved ${channels.length} channels: ${channels.map((c) => c.name).join(", ")}`
		);

		const videoArrays = await Promise.all(
			channels.map((c) => this.videoRepository.fetchMany(c.id))
		);

		const sorted = videoArrays
			.flat()
			.sort(
				(a, b) =>
					new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
			);

		const limit = this.config.limit ?? sorted.length;
		const videos = sorted.slice(0, limit);
		logger.info(`Fetched ${videos.length} videos from ${channels.length} channels`);

		return { channels, videos };
	}
}
