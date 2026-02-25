"use server";

import { LRUCache } from "lru-cache";
import { serverActionDuration, cacheHits, cacheMisses } from "@/lib/metrics";
import { YoutubeWidgetConfig } from "../infrastructure/config.schemas";
import { YoutubeWidgetInnerProps } from "../presentation/YoutubeWidgetInner";
import { YoutubeService, YoutubeWidgetData } from "./youtube";

// Cache the fetched data (channels + videos), not the service instance
const dataCache = new LRUCache<string, YoutubeWidgetData>({
	max: 20,
	ttl: 1000 * 60 * 60 * 12, // 12 hours
});

export async function fetchYoutubeWidgetProps(
	config: YoutubeWidgetConfig
): Promise<YoutubeWidgetInnerProps> {
	const end = serverActionDuration.startTimer({ action: "youtube" });
	try {
		const key = JSON.stringify(config);
		let data = dataCache.get(key);

		if (data) {
			cacheHits.inc({ cache: "youtube" });
			end({ status: "hit" });
			return { config, ...data };
		}
		cacheMisses.inc({ cache: "youtube" });

		data = await YoutubeService.create(config).fetch();
		dataCache.set(key, data);
		end({ status: "success" });
		return { config, ...data };
	} catch (e) {
		end({ status: "error" });
		throw e;
	}
}