import { err, ok, Result } from "neverthrow";
import { YoutubeWidgetConfig } from "../infrastructure/config.schemas";
import { YoutubeVideo } from "../domain/entities/video";
import { YoutubeVideoRepository } from '../domain/repositories/video';
import { YoutubeChannelRepository } from "../domain/repositories/channel";
import { RssYoutubeVideoRepository } from '../infrastructure/repositories/rss.youtube-video-repository';
import { PageSourceYoutubeChannelRepository } from "../infrastructure/repositories/page-source.youtube-channel-repository";
import { YoutubeChannel } from "../domain/entities/channel";
import { baseLogger } from "@/lib/logger";

const logger = baseLogger.getSubLogger({
    name: "YoutubeService",
});

export class YoutubeService {
    private config: YoutubeWidgetConfig;
    private videoRepository: YoutubeVideoRepository;
    private channelRepository: YoutubeChannelRepository;
    public channels: YoutubeChannel[] = [];

    private constructor(config: YoutubeWidgetConfig) {
        this.config = config;
        this.videoRepository = new RssYoutubeVideoRepository();
        this.channelRepository = new PageSourceYoutubeChannelRepository();
    }


    static async fromConfig(config: YoutubeWidgetConfig) {
        const service = new YoutubeService(config);
        await service.fetchChannels();
        return service;
    }

    private async fetchChannels(): Promise<Result<void, Error>> {
        if (this.config.channels.length === 0) {
            return err(new Error("No channels provided"));
        }

        const channelPromises = this.config.channels.map(async channel => {
            let channelResult;

            if (channel.startsWith('@')) {
                channelResult = await this.channelRepository.findByName(channel);
            } else if (channel.startsWith('UC')) {
                channelResult = await this.channelRepository.findById(channel);
            } else {
                return err(new Error(`Invalid channel format: ${channel}. Expected to start with '@' or 'UC'`));
            }

            return channelResult;
        });

        const results = await Promise.all(channelPromises);

        const channels: YoutubeChannel[] = [];
        for (const result of results) {
            if (result.isErr()) {
                return err(result.error);
            }
            channels.push(result.value);
        }

        this.channels = channels;
        logger.info(`Fetched ${channels.length} channels: ${channels.map(c => c.name).join(', ')}`);
        logger.info(`Fetched channels: ${JSON.stringify(channels)}`);

        return ok(undefined);
    }


    async fetchVideos(): Promise<Result<YoutubeVideo[], Error>> {
        if (this.channels.length === 0) {
            return err(new Error("No channels available. Please ensure channels are properly configured."));
        }

        try {
            // Fetch videos from all channels
            const videoResultsPromises = this.channels.map(channel =>
                this.videoRepository.fetchMany(channel.id)
            );

            const videoResults = await Promise.all(videoResultsPromises);

            // Check for errors
            for (const result of videoResults) {
                if (result.isErr()) {
                    return err(result.error);
                }
            }

            // Combine all videos
            const allVideos = videoResults.flatMap(result => result._unsafeUnwrap());

            // Sort by date (newest first)
            const sortedVideos = allVideos.sort((a, b) =>
                new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
            );

            // Apply limit if specified in config
            const limit = this.config.limit || sortedVideos.length;
            const limitedVideos = sortedVideos.slice(0, limit);
            logger.info(`Fetched ${limitedVideos.length} videos from ${this.channels.length} channels.`);

            return ok(limitedVideos);
        } catch (error) {
            logger.error("Error fetching videos:", error);
            return err(error instanceof Error ? error : new Error(String(error)));
        }
    }
}
