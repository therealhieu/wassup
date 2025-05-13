import { baseLogger } from "@/lib/logger";
import { err, ok, Result } from "neverthrow";
import { Feed } from "../../domain/entities/feed";
import { xmlParser } from "../../lib/xml-parser";
import { RssFeed } from "./rss.feed-repository.dtos";

const logger = baseLogger.getSubLogger({
	name: "FeedRepository",
});

export class RssFeedRepository {
	private url: string;
	private limit: number;

	constructor(url: string, limit: number) {
		this.url = url;
		this.limit = limit;
	}

	public async fetchMany(): Promise<Result<Feed[], Error>> {
		try {
			const response = await fetch(this.url);
			const xml = await response.text();
			const json = xmlParser.parse(xml);

			const rssFeeds = RssFeed.parseExt(json, this.url, this.limit);
			const feeds = await rssFeeds.toFeeds();

			return ok(feeds);
		} catch (e) {
			const error = e as Error;
			logger.error(error.message);
			logger.error(error.stack);
			return err(error);
		}
	}
}
