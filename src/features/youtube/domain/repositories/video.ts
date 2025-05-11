import { YoutubeVideo } from "../entities/video";
import { Result } from "neverthrow";

export interface YoutubeVideoRepository {
	fetchMany(channelId: string): Promise<Result<YoutubeVideo[], Error>>;
}
