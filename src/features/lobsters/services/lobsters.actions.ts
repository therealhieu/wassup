"use server";

import { LobstersWidgetConfig } from "../infrastructure/config.schemas";
import {
	LobstersWidgetInnerProps,
	LobstersWidgetInnerPropsSchema,
} from "../presentation/LobstersWidgetInner";
import { HttpLobstersStoryRepository } from "../infrastructure/repositories/http.lobsters-story-repository";
import { LRUCache } from "lru-cache";
import { serverActionDuration, cacheHits, cacheMisses } from "@/lib/metrics";

const repository = new HttpLobstersStoryRepository();

const dataCache = new LRUCache<string, LobstersWidgetInnerProps>({
	max: 20,
	ttl: 1000 * 60 * 5, // 5 minutes
});

export async function fetchLobstersWidgetProps(
	config: LobstersWidgetConfig
): Promise<LobstersWidgetInnerProps> {
	const end = serverActionDuration.startTimer({ action: "lobsters" });
	try {
		const key = JSON.stringify(config);
		const cached = dataCache.get(key);
		if (cached) {
			cacheHits.inc({ cache: "lobsters" });
			end({ status: "hit" });
			return cached;
		}
		cacheMisses.inc({ cache: "lobsters" });

		const stories = await repository.fetchMany(config);
		const data = LobstersWidgetInnerPropsSchema.parse({
			config,
			stories,
		});
		dataCache.set(key, data);
		end({ status: "success" });
		return data;
	} catch (e) {
		end({ status: "error" });
		throw e;
	}
}
