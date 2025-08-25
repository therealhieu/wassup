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
		// Retry logic with exponential backoff for anti-bot systems
		const maxRetries = 3;
		let attempt = 0;

		while (attempt < maxRetries) {
			try {
				// Add random delay between 100-2000ms to mimic human browsing
				const randomDelay = Math.floor(Math.random() * 1900) + 100;
				if (attempt > 0) {
					await new Promise(resolve => setTimeout(resolve, randomDelay));
				}

				// Create AbortController for timeout
				const controller = new AbortController();
				const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

				// Vary User-Agent slightly on retries
				const userAgents = [
					'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
					'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
					'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
				];

				const response = await fetch(this.url, {
					method: 'GET',
					headers: {
						'User-Agent': userAgents[attempt % userAgents.length],
						'Accept': 'application/rss+xml, application/xml, text/xml, application/atom+xml, text/html, */*',
						'Accept-Language': 'en-US,en;q=0.9',
						'Accept-Encoding': 'gzip, deflate, br',
						'Cache-Control': 'no-cache',
						'Pragma': 'no-cache',
						'DNT': '1',
						'Connection': 'keep-alive',
						'Upgrade-Insecure-Requests': '1',
						'Sec-Fetch-Dest': 'document',
						'Sec-Fetch-Mode': 'navigate',
						'Sec-Fetch-Site': 'none',
						'Sec-Fetch-User': '?1',
						'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
						'Sec-Ch-Ua-Mobile': '?0',
						'Sec-Ch-Ua-Platform': '"macOS"',
					},
					redirect: 'follow',
					signal: controller.signal,
				});

				// Clear timeout since request completed
				clearTimeout(timeoutId);
				
				if (!response.ok) {
					if (attempt === maxRetries - 1) {
						logger.warn(`HTTP ${response.status} error for RSS feed after ${maxRetries} attempts: ${this.url} - ${response.statusText}`);
						return ok([]);
					}
					attempt++;
					continue;
				}
				
				// Check if response is actually RSS/XML
				const contentType = response.headers.get('content-type') || '';
				if (!contentType.includes('xml') && !contentType.includes('rss') && !contentType.includes('atom')) {
					logger.warn(`Invalid content-type for RSS feed: ${this.url} - ${contentType}`);
					return ok([]); // Return empty instead of failing
				}

				const xml = await response.text();
				
				// Basic check for XML structure
				if (!xml.includes('<rss') && !xml.includes('<feed') && !xml.includes('<?xml')) {
					logger.warn(`Invalid XML structure for RSS feed: ${this.url}`);
					return ok([]); // Return empty instead of failing
				}

				const json = xmlParser.parse(xml);

				// Check if parsed JSON has expected RSS structure
				if (!json.rss && !json.feed) {
					logger.warn(`No RSS or Atom structure found in feed: ${this.url}`);
					return ok([]); // Return empty instead of failing
				}

				const rssFeeds = RssFeed.parseExt(json, this.url, this.limit);
				const feeds = await rssFeeds.toFeeds();

				logger.info(`Successfully fetched RSS feed: ${this.url} (attempt ${attempt + 1})`);
				return ok(feeds);

			} catch (e) {
				const error = e as Error;
				
				if (error.name === 'AbortError') {
					logger.warn(`RSS feed fetch timeout: ${this.url} (attempt ${attempt + 1})`);
				} else {
					logger.warn(`Failed to fetch RSS feed ${this.url}: ${error.message} (attempt ${attempt + 1})`);
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
