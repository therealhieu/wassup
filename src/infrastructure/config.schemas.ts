import { z } from "zod";

import { AirQualityConfig, AirQualityConfigSchema } from "../features/air-quality/infrastructure/config";
import { WeatherWidgetConfig, WeatherWidgetConfigSchema } from "../features/weather/infrastructure/config.schemas";
import { TabsWidgetConfig, TabsWidgetConfigSchema } from "../features/tabs/infrastructure/config.schemas";
import { RedditWidgetConfig, RedditWidgetConfigSchema } from "../features/reddit/infrastructure/config.schemas";
import { YoutubeWidgetConfig, YoutubeWidgetConfigSchema } from "@/features/youtube/infrastructure/config.schemas";
import { BookmarkWidgetConfig, BookmarkWidgetConfigSchema } from "@/features/bookmark/infrastructure/config.schemas";


export const WidgetConfigSchema = z.lazy(() => z.union([
	WeatherWidgetConfigSchema,
	AirQualityConfigSchema,
	TabsWidgetConfigSchema,
	RedditWidgetConfigSchema,
	YoutubeWidgetConfigSchema,
	BookmarkWidgetConfigSchema,
]));

export type WidgetConfig = WeatherWidgetConfig | AirQualityConfig | TabsWidgetConfig | RedditWidgetConfig | YoutubeWidgetConfig | BookmarkWidgetConfig;

export const ColumnConfigSchema = z
	.object({
		size: z.number().min(1).max(12),
		widgets: z.array(WidgetConfigSchema),
	})
	.strict();

export type ColumnConfig = z.infer<typeof ColumnConfigSchema>;

export const PageConfigSchema = z
	.object({
		title: z.string(),
		path: z.string(),
		columns: z.array(ColumnConfigSchema),
	})
	.strict();

export type PageConfig = z.infer<typeof PageConfigSchema>;

export const ServerConfigSchema = z.object({
	port: z.number().min(1).max(65535),
});

export type ServerConfig = z.infer<typeof ServerConfigSchema>;

export const UiConfigSchema = z
	.object({
		theme: z.enum(["light", "dark"]),
		pages: z.array(PageConfigSchema),
	})
	.strict();

export type UiConfig = z.infer<typeof UiConfigSchema>;

export const AppConfigSchema = z
	.object({
		server: ServerConfigSchema,
		ui: UiConfigSchema,
	})
	.strict();

export type AppConfig = z.infer<typeof AppConfigSchema>;
