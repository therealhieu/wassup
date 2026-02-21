import { feedLogger } from "@/lib/logger";
import { Feed } from "../../domain/entities/feed";
import { xmlParser } from "../../lib/xml-parser";
import { RssFeed } from "./rss.feed-repository.dtos";
import {
	USER_AGENTS,
	TIMEOUTS,
	createRssFetchOptions,
	createTimeoutController,
	RETRY_CONFIG,
} from "@/lib/http/constants";

export class RssFeedRepository {
	private url: string;
	private limit: number;

	constructor(url: string, limit: number) {
		this.url = url;
		this.limit = limit;
	}

	public async fetchMany(): Promise<Feed[]> {
		const maxRetries = RETRY_CONFIG.MAX_ATTEMPTS;

		for (let attempt = 0; attempt < maxRetries; attempt++) {
			try {
				if (attempt > 0) {
					const base = RETRY_CONFIG.EXPONENTIAL_BACKOFF
						? RETRY_CONFIG.BASE_DELAY * Math.pow(2, attempt)
						: RETRY_CONFIG.BASE_DELAY;
					const delay = Math.min(base + Math.random() * 100, RETRY_CONFIG.MAX_DELAY);
					await new Promise((resolve) => setTimeout(resolve, delay));
				}

				const controller = createTimeoutController(TIMEOUTS.RSS_FEED);
				const userAgent = USER_AGENTS[attempt % USER_AGENTS.length];
				const fetchOptions = createRssFetchOptions(userAgent, controller.signal);

				const response = await fetch(this.url, fetchOptions);

				if (!response.ok) {
					if (attempt === maxRetries - 1) {
						feedLogger.warn(
							`HTTP ${response.status} for RSS feed after ${maxRetries} attempts: ${this.url}`
						);
						return [];
					}
					continue;
				}

				const contentType = response.headers.get("content-type") || "";
				if (
					!contentType.includes("xml") &&
					!contentType.includes("rss") &&
					!contentType.includes("atom")
				) {
					feedLogger.warn(`Invalid content-type for RSS feed: ${this.url}`);
					return [];
				}

				const xml = await response.text();

				if (!xml.includes("<rss") && !xml.includes("<feed") && !xml.includes("<?xml")) {
					feedLogger.warn(`Invalid XML structure for RSS feed: ${this.url}`);
					return [];
				}

				const json = xmlParser.parse(xml);

				if (!json.rss && !json.feed) {
					feedLogger.warn(`No RSS or Atom structure found in feed: ${this.url}`);
					return [];
				}

				const rssFeeds = RssFeed.parseExt(json, this.url, this.limit);
				const feeds = await rssFeeds.toFeeds();
				feedLogger.info(`Fetched RSS feed: ${this.url} (attempt ${attempt + 1})`);
				return feeds;
			} catch (e) {
				const error = e as Error;
				if (error.name === "AbortError") {
					feedLogger.warn(`RSS feed timeout: ${this.url} (attempt ${attempt + 1})`);
				} else {
					feedLogger.warn(`RSS feed error ${this.url}: ${error.message} (attempt ${attempt + 1})`);
				}
				if (attempt === maxRetries - 1) return [];
			}
		}

		return [];
	}
}
