import { Feed } from "../entities/feed";

export interface FeedRepository {
	fetchMany(url: string, limit: number): Promise<Feed[]>;
}
