"use server";

import { DevtoWidgetConfig } from "../infrastructure/config.schemas";
import {
	DevtoWidgetInnerProps,
	DevtoWidgetInnerPropsSchema,
} from "../presentation/DevtoWidgetInner";
import { HttpDevtoArticleRepository } from "../infrastructure/repositories/http.devto-article-repository";
import { LRUCache } from "lru-cache";
import { serverActionDuration, cacheHits, cacheMisses } from "@/lib/metrics";

const repository = new HttpDevtoArticleRepository();

const dataCache = new LRUCache<string, DevtoWidgetInnerProps>({
	max: 20,
	ttl: 1000 * 60 * 5, // 5 minutes
});

export async function fetchDevtoWidgetProps(
	config: DevtoWidgetConfig,
): Promise<DevtoWidgetInnerProps> {
	const end = serverActionDuration.startTimer({ action: "devto" });
	try {
		const key = JSON.stringify(config);
		const cached = dataCache.get(key);
		if (cached) {
			cacheHits.inc({ cache: "devto" });
			end({ status: "hit" });
			return cached;
		}
		cacheMisses.inc({ cache: "devto" });

		const articles = await repository.fetchMany(config);
		const data = DevtoWidgetInnerPropsSchema.parse({
			config,
			articles,
		});
		dataCache.set(key, data);
		end({ status: "success" });
		return data;
	} catch (e) {
		end({ status: "error" });
		throw e;
	}
}
