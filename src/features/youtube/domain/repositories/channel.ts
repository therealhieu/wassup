import { Result } from "neverthrow";
import { YoutubeChannel } from "../entities/channel";

export interface YoutubeChannelRepository {
	findByName(name: string): Promise<Result<YoutubeChannel, Error>>;
	findById(channelId: string): Promise<Result<YoutubeChannel, Error>>;
	findByUsername(username: string): Promise<Result<YoutubeChannel, Error>>;
}
