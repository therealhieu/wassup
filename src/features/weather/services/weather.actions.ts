"use server";

import { WeatherWidgetConfig } from "../infrastructure/config.schemas";
import { WeatherService } from "./weather";
import { WeatherWidgetInnerProps } from "../presentation/WeatherWidget.components";
import { LRUCache } from "lru-cache";
import { serverActionDuration, cacheHits, cacheMisses } from "@/lib/metrics";

const dataCache = new LRUCache<string, WeatherWidgetInnerProps>({
	max: 5,
	ttl: 1000 * 60 * 5, // 5 minutes
});

export async function fetchWeatherWidgetProps(
	config: WeatherWidgetConfig
): Promise<WeatherWidgetInnerProps> {
	const end = serverActionDuration.startTimer({ action: "weather" });
	try {
		const key = JSON.stringify(config);
		const cached = dataCache.get(key);
		if (cached) {
			cacheHits.inc({ cache: "weather" });
			end({ status: "hit" });
			return cached;
		}
		cacheMisses.inc({ cache: "weather" });

		const service = await WeatherService.fromConfig(config);
		const data = await service.fetchWeatherWidgetProps(config);
		dataCache.set(key, data);
		end({ status: "success" });
		return data;
	} catch (e) {
		end({ status: "error" });
		throw e;
	}
}
