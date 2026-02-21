"use server";

import { getPreviewImageFromUrl } from "../lib/utils";

const MAX_CONCURRENCY = 3;

/**
 * Fetch thumbnail URLs for multiple articles in a single server action call.
 * Uses concurrency limiting to avoid overwhelming external servers.
 */
export async function fetchThumbnailUrls(
	articleUrls: string[]
): Promise<Record<string, string | null>> {
	const results: Record<string, string | null> = {};
	const queue = [...articleUrls];
	const executing = new Set<Promise<void>>();

	for (const url of queue) {
		const task = getPreviewImageFromUrl(url).then((result) => {
			results[url] = result;
			executing.delete(task);
		});
		executing.add(task);

		if (executing.size >= MAX_CONCURRENCY) {
			await Promise.race(executing);
		}
	}

	await Promise.all(executing);
	return results;
}
