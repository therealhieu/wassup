import { YoutubeVideo } from "../entities/video";

export interface YoutubeVideoRepository {
	fetchMany(channelId: string): Promise<YoutubeVideo[]>;
}
