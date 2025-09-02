import { feedLogger } from "@/lib/logger";
import { err, ok, Result } from "neverthrow";
import { Feed } from "../../domain/entities/feed";
import { xmlParser } from "../../lib/xml-parser";
import { RssFeed } from "./rss.feed-repository.dtos";
import { USER_AGENTS, TIMEOUTS, createRssFetchOptions, createTimeoutController, RETRY_CONFIG } from "@/lib/http/constants";


export class RssFeedRepository {
	private url: string;
	private limit: number;

	constructor(url: string, limit: number) {
		this.url = url;
		this.limit = limit;
	}

	public async fetchMany(): Promise<Result<Feed[], Error>> {
		const maxRetries = RETRY_CONFIG.MAX_ATTEMPTS;
		let attempt = 0;

		while (attempt < maxRetries) {
			try {
				// Add random delay to mimic human browsing
				if (attempt > 0) {
					const base = RETRY_CONFIG.EXPONENTIAL_BACKOFF
						? RETRY_CONFIG.BASE_DELAY * Math.pow(2, attempt)
						: RETRY_CONFIG.BASE_DELAY;
					const jitter = Math.random() * 100;
					const delay = Math.min(base + jitter, RETRY_CONFIG.MAX_DELAY);
					await new Promise(resolve => setTimeout(resolve, delay));
				}

				const controller = createTimeoutController(TIMEOUTS.RSS_FEED);
				const userAgent = USER_AGENTS[attempt % USER_AGENTS.length];
				const fetchOptions = createRssFetchOptions(userAgent, controller.signal);

				const response = await fetch(this.url, fetchOptions);
				
				if (!response.ok) {
					if (attempt === maxRetries - 1) {
						feedLogger.warn(`HTTP ${response.status} error for RSS feed after ${maxRetries} attempts: ${this.url} - ${response.statusText}`);
						return ok([]);
					}
					attempt++;
					continue;
				}
				
				// Check if response is actually RSS/XML
				const contentType = response.headers.get('content-type') || '';
				if (!contentType.includes('xml') && !contentType.includes('rss') && !contentType.includes('atom')) {
					feedLogger.warn(`Invalid content-type for RSS feed: ${this.url} - ${contentType}`);
					return ok([]);
				}

				const xml = await response.text();
				
				// Basic check for XML structure
				if (!xml.includes('<rss') && !xml.includes('<feed') && !xml.includes('<?xml')) {
					feedLogger.warn(`Invalid XML structure for RSS feed: ${this.url}`);
					return ok([]);
				}

				const json = xmlParser.parse(xml);

				// Check if parsed JSON has expected RSS structure
				if (!json.rss && !json.feed) {
					feedLogger.warn(`No RSS or Atom structure found in feed: ${this.url}`);
					return ok([]);
				}

				const rssFeeds = RssFeed.parseExt(json, this.url, this.limit);
				const feeds = await rssFeeds.toFeeds();

				feedLogger.info(`Successfully fetched RSS feed: ${this.url} (attempt ${attempt + 1})`);
				return ok(feeds);

			} catch (e) {
				const error = e as Error;
				
				if (error.name === 'AbortError') {
					feedLogger.warn(`RSS feed fetch timeout: ${this.url} (attempt ${attempt + 1})`);
				} else {
					feedLogger.warn(`Failed to fetch RSS feed ${this.url}: ${error.message} (attempt ${attempt + 1})`);
				}
				
				// If this was the last attempt, return empty
				if (attempt === maxRetries - 1) {
					return ok([]);
				}
				
				attempt++;
			}
		}

		// Fallback (shouldn't reach here)
		return ok([]);
	}
}
