"use server";

import { LRUCache } from "lru-cache";
import { YoutubeWidgetConfig } from "../infrastructure/config.schemas";
import { YoutubeWidgetInnerProps } from "../presentation/YoutubeWidgetInner";
import { YoutubeService } from "./youtube";

const serviceCache = new LRUCache<string, YoutubeService>({ max: 20 });

export async function fetchYoutubeWidgetProps(
    config: YoutubeWidgetConfig
): Promise<YoutubeWidgetInnerProps> {
    const key = JSON.stringify(config);
    let service = serviceCache.get(key);

    if (!service) {
        const youtubeService = await YoutubeService.fromConfig(config);
        service = youtubeService;
        serviceCache.set(key, service);
    }

    const videos = await service.fetchVideos();

    if (videos.isErr()) {
        throw videos.error;
    }

    return {
        config: config,
        channels: service.channels,
        videos: videos.value,
    } as YoutubeWidgetInnerProps;
}