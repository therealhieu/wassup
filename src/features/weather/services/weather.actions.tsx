'use server';

import { WeatherWidgetConfig } from "../infrastructure/config";
import { WeatherService } from "./weather";
import { WeatherWidgetProps } from "../presentation/WeatherWidget";
import { LRUCache } from 'lru-cache'

const serviceCache = new LRUCache<string, WeatherService>({ max: 5 });

export async function getWeatherWidgetProps(config: WeatherWidgetConfig): Promise<WeatherWidgetProps> {
    const key = JSON.stringify(config);
    let service = serviceCache.get(key);

    if (!service) {
        const initServiceResult = await WeatherService.fromConfig(config);
        if (initServiceResult.isErr()) {
            throw initServiceResult.error;
        }
        service = initServiceResult.value;
        serviceCache.set(key, service);
    }

    const getResult = await service.getWeatherWidgetProps(config);

    if (getResult.isErr()) {
        throw getResult.error;
    }

    return getResult.value;
}