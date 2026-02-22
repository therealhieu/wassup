import { baseLogger } from "@/lib/logger";
import * as cheerio from "cheerio";
import { LRUCache } from "lru-cache";

const logger = baseLogger.getSubLogger({
	name: "FeedUtils",
});

// Cache OG image results to avoid re-fetching the same article pages
const THUMBNAIL_NO_RESULT = "__none__";
const thumbnailCache = new LRUCache<string, string>({
	max: 500,
	ttl: 1000 * 60 * 60, // 1 hour
});

const HEAD_MAX_BYTES = 64 * 1024; // 64KB — more than enough for <head>

/**
 * Read only the `<head>` section of an HTML response to extract meta tags.
 * Stops reading as soon as `</head>` is found, avoiding full-page downloads.
 */
async function readUntilHeadClose(response: Response): Promise<string> {
	const reader = response.body?.getReader();
	if (!reader) return response.text();

	const decoder = new TextDecoder();
	let html = "";

	try {
		while (html.length < HEAD_MAX_BYTES) {
			const { done, value } = await reader.read();
			if (done) break;
			html += decoder.decode(value, { stream: true });
			if (html.includes("</head>")) break;
		}
	} finally {
		reader.cancel();
	}

	return html;
}

export const getSourceFromUrl = (url: string): string => {
	const hostname = new URL(url).hostname;
	const parts = hostname.split(".");
	return parts[parts.length > 2 ? 1 : 0];
};

export const getPreviewImageFromUrl = async (
	url: string
): Promise<string | null> => {
	// Check cache first
	const cached = thumbnailCache.get(url);
	if (cached !== undefined) {
		return cached === THUMBNAIL_NO_RESULT ? null : cached;
	}

	const result = await fetchPreviewImage(url);
	thumbnailCache.set(url, result ?? THUMBNAIL_NO_RESULT);
	return result;
};

const fetchPreviewImage = async (
	url: string
): Promise<string | null> => {
	// Default fallback image - using a generic icon
	const DEFAULT_THUMBNAIL = "/globe.svg";
	
	try {
		logger.debug(`Fetching preview image from URL: ${url}`);
		
		const response = await fetch(url, {
			headers: {
				'User-Agent': 'Mozilla/5.0 (compatible; RSS Reader)',
				'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
			},
			// Add timeout to prevent hanging requests
			signal: AbortSignal.timeout(10000) // 10 second timeout
		});
		
		if (!response.ok) {
			logger.warn(`Failed to fetch URL: ${response.status} ${response.statusText} for ${url}`);
			return DEFAULT_THUMBNAIL;
		}
		
		const contentType = response.headers.get('content-type');
		if (!contentType || !contentType.includes('text/html')) {
			logger.warn(`URL returned non-HTML content type: ${contentType} for ${url}`);
			return DEFAULT_THUMBNAIL;
		}
		
		const html = await readUntilHeadClose(response);
		const $ = cheerio.load(html);

		// Try to find og:image first (preferred for social media previews)
		const ogImage = $('meta[property="og:image"]').attr("content");
		if (ogImage && ogImage.trim()) {
			logger.debug(`Found og:image: ${ogImage}`);
			return ogImage;
		}

		// Try twitter:image next
		const twitterImage = $('meta[name="twitter:image"]').attr("content");
		if (twitterImage && twitterImage.trim()) {
			logger.debug(`Found twitter:image: ${twitterImage}`);
			return twitterImage;
		}

		// Try article:image
		const articleImage = $('meta[property="article:image"]').attr(
			"content"
		);
		if (articleImage && articleImage.trim()) {
			logger.debug(`Found article:image: ${articleImage}`);
			return articleImage;
		}

		// Try schema.org image
		const schemaImage = $('meta[itemprop="image"]').attr("content");
		if (schemaImage && schemaImage.trim()) {
			logger.debug(`Found schema image: ${schemaImage}`);
			return schemaImage;
		}

		// Try link[rel="image_src"]
		const linkImage = $('link[rel="image_src"]').attr("href");
		if (linkImage && linkImage.trim()) {
			logger.debug(`Found link image: ${linkImage}`);
			return linkImage;
		}

		logger.info(`No preview image found for ${url}, using default thumbnail`);
		return DEFAULT_THUMBNAIL;
	} catch (error) {
		// Log the specific error but don't let it propagate
		if (error instanceof Error) {
			logger.warn(`Error fetching preview image for ${url}: ${error.message}`);
		} else {
			logger.warn(`Unknown error fetching preview image for ${url}:`, error);
		}
		
		// Always return default thumbnail instead of null to ensure consistent UX
		return DEFAULT_THUMBNAIL;
	}
};
