import { baseLogger } from "@/lib/logger";
import * as cheerio from "cheerio";

const logger = baseLogger.getSubLogger({
	name: "FeedUtils",
});

export const getSourceFromUrl = (url: string): string => {
	const hostname = new URL(url).hostname;
	const parts = hostname.split(".");
	return parts[parts.length > 2 ? 1 : 0];
};

export const getPreviewImageFromUrl = async (
	url: string
): Promise<string | null> => {
	try {
		const response = await fetch(url);
		if (!response.ok) {
			throw new Error(`Failed to fetch URL: ${response.statusText}`);
		}
		const html = await response.text();
		const $ = cheerio.load(html);

		// Try to find og:image first (preferred for social media previews)
		const ogImage = $('meta[property="og:image"]').attr("content");
		if (ogImage) {
			return ogImage;
		}

		// Try twitter:image next
		const twitterImage = $('meta[name="twitter:image"]').attr("content");
		if (twitterImage) {
			return twitterImage;
		}

		// Try article:image
		const articleImage = $('meta[property="article:image"]').attr(
			"content"
		);
		if (articleImage) {
			return articleImage;
		}

		// Try schema.org image
		const schemaImage = $('meta[itemprop="image"]').attr("content");
		if (schemaImage) {
			return schemaImage;
		}

		// Try link[rel="image_src"]
		const linkImage = $('link[rel="image_src"]').attr("href");
		if (linkImage) {
			return linkImage;
		}

		// Fallback to first image in content that's not tiny
		const images = $("img")
			.map((_, img) => ({
				src: $(img).attr("src"),
				width: parseInt($(img).attr("width") || "0"),
				height: parseInt($(img).attr("height") || "0"),
			}))
			.get()
			.filter(
				(img) =>
					img.src &&
					(!img.width || img.width > 100) &&
					(!img.height || img.height > 100)
			);

		return images[0]?.src || null;
	} catch (error) {
		logger.error("Error fetching preview image:", error);
		return null;
	}
};
