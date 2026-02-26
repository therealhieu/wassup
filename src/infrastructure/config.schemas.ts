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
import {
	HackerNewsWidgetConfig,
	HackerNewsWidgetConfigSchema,
} from "@/features/hackernews/infrastructure/config.schemas";
import {
	LobstersWidgetConfig,
	LobstersWidgetConfigSchema,
} from "@/features/lobsters/infrastructure/config.schemas";
import {
	MultiSourceNewsWidgetConfig,
	MultiSourceNewsWidgetConfigSchema,
} from "@/features/multisourcenews/infrastructure/config.schemas";
import {
	DevtoWidgetConfig,
	DevtoWidgetConfigSchema,
} from "@/features/devto/infrastructure/config.schemas";

export const WidgetConfigSchema = z.lazy(() =>
	z.union([
		WeatherWidgetConfigSchema,
		TabsWidgetConfigSchema,
		RedditWidgetConfigSchema,
		YoutubeWidgetConfigSchema,
		BookmarkWidgetConfigSchema,
		FeedWidgetConfigSchema,
		GithubWidgetConfigSchema,
		HackerNewsWidgetConfigSchema,
		LobstersWidgetConfigSchema,
		MultiSourceNewsWidgetConfigSchema,
		DevtoWidgetConfigSchema,
	])
);

export type WidgetConfig =
	| WeatherWidgetConfig
	| TabsWidgetConfig
	| RedditWidgetConfig
	| YoutubeWidgetConfig
	| BookmarkWidgetConfig
	| FeedWidgetConfig
	| GithubWidgetConfig
	| HackerNewsWidgetConfig
	| LobstersWidgetConfig
	| MultiSourceNewsWidgetConfig
	| DevtoWidgetConfig;

export const ColumnConfigSchema = z
	.object({
		size: z.number().min(1).max(12),
		widgets: z.array(WidgetConfigSchema).max(20),
	})
	.strict();

export type ColumnConfig = z.infer<typeof ColumnConfigSchema>;

export const PageConfigSchema = z
	.object({
		title: z.string().max(100),
		path: z.string().max(256),
		columns: z.array(ColumnConfigSchema).max(12),
	})
	.strict();

export type PageConfig = z.infer<typeof PageConfigSchema>;

export const UiConfigSchema = z
	.object({
		theme: z.enum(["light", "dark"]),
		pages: z.array(PageConfigSchema).max(50),
	})
	.strict();

export type UiConfig = z.infer<typeof UiConfigSchema>;

export const AppConfigSchema = z
	.object({
		ui: UiConfigSchema,
	})
	.strict();

export type AppConfig = z.infer<typeof AppConfigSchema>;

export const PresetSchema = z.object({
	id: z.string(),
	name: z.string().min(1).max(100),
	config: AppConfigSchema,
});

export type Preset = z.infer<typeof PresetSchema>;

export const AppStateSchema = z.object({
	activePresetId: z.string(),
	presets: z.array(PresetSchema).min(1).max(50),
});

export type AppState = z.infer<typeof AppStateSchema>;
