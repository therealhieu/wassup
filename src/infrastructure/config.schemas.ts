import { z } from "zod";

import {
	WeatherWidgetConfig,
	WeatherWidgetConfigSchema,
} from "../features/weather/infrastructure/config.schemas";
import {
	TabsWidgetConfig,
	TabsWidgetConfigSchema,
} from "../features/tabs/infrastructure/config.schemas";
import {
	RedditWidgetConfig,
	RedditWidgetConfigSchema,
} from "../features/reddit/infrastructure/config.schemas";
import {
	YoutubeWidgetConfig,
	YoutubeWidgetConfigSchema,
} from "@/features/youtube/infrastructure/config.schemas";
import {
	BookmarkWidgetConfig,
	BookmarkWidgetConfigSchema,
} from "@/features/bookmark/infrastructure/config.schemas";
import {
	FeedWidgetConfig,
	FeedWidgetConfigSchema,
} from "@/features/feed/infrastructure/config.schemas";
import {
	GithubWidgetConfig,
	GithubWidgetConfigSchema,
} from "@/features/github/infrastructure/config.schemas";

export const WidgetConfigSchema = z.lazy(() =>
	z.union([
		WeatherWidgetConfigSchema,
		TabsWidgetConfigSchema,
		RedditWidgetConfigSchema,
		YoutubeWidgetConfigSchema,
		BookmarkWidgetConfigSchema,
		FeedWidgetConfigSchema,
		GithubWidgetConfigSchema,
	])
);

export type WidgetConfig =
	| WeatherWidgetConfig
	| TabsWidgetConfig
	| RedditWidgetConfig
	| YoutubeWidgetConfig
	| BookmarkWidgetConfig
	| FeedWidgetConfig
	| GithubWidgetConfig;

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

export const UiConfigSchema = z
	.object({
		theme: z.enum(["light", "dark"]),
		pages: z.array(PageConfigSchema),
	})
	.strict();

export type UiConfig = z.infer<typeof UiConfigSchema>;

export const AppConfigSchema = z
	.object({
		ui: UiConfigSchema,
	})
	.strict();

export type AppConfig = z.infer<typeof AppConfigSchema>;
