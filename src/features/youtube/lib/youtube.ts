import { baseLogger } from "@/lib/logger";

const logger = baseLogger.getSubLogger({
	name: "lib/youtube",
});

// In-memory cache to store results
const shortsCache: Record<string, boolean> = {};

export async function isYoutubeShort(videoId: string): Promise<boolean> {
	// Check cache first
	if (shortsCache[videoId] !== undefined) {
		return shortsCache[videoId];
	}

	try {
		const response = await fetch(
			`https://www.youtube.com/shorts/${videoId}`,
			{
				method: "HEAD", // We only need headers
				redirect: "follow", // Follow redirects to check final destination
			}
		);

		// If it's a successful response and URL includes /shorts/, it's a Short
		const result = response.ok && response.url.includes("/shorts/");

		// Cache the result
		shortsCache[videoId] = result;
		return result;
	} catch (error) {
		logger.error("Error checking Short URL:", error);
		return false;
	}
}
