import { YoutubeChannel } from "../entities/channel";

export interface YoutubeChannelRepository {
	findByName(name: string): Promise<YoutubeChannel>;
	findById(channelId: string): Promise<YoutubeChannel>;
	findByUsername(username: string): Promise<YoutubeChannel>;
}
