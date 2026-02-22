import { z } from "zod";
import { WeatherWidgetConfigSchema } from "@/features/weather/infrastructure/config.schemas";
import { RedditWidgetConfigSchema } from "@/features/reddit/infrastructure/config.schemas";
import { YoutubeWidgetConfigSchema } from "@/features/youtube/infrastructure/config.schemas";
import { FeedWidgetConfigSchema } from "@/features/feed/infrastructure/config.schemas";
import { BookmarkWidgetConfigSchema } from "@/features/bookmark/infrastructure/config.schemas";
import { GithubWidgetConfigSchema } from "@/features/github/infrastructure/config.schemas";
import { TabsWidgetConfigSchema } from "@/features/tabs/infrastructure/config.schemas";
import { WidgetConfig } from "@/infrastructure/config.schemas";

// ── Field Definitions ────────────────────────────────────────────────

export type WidgetFieldType =
	| "text"
	| "number"
	| "boolean"
	| "select"
	| "string-array"
	| "nested-widget"
	| "nested-object";

export interface WidgetFieldDefinition {
	name: string;
	label: string;
	type: WidgetFieldType;
	required?: boolean;
	defaultValue?: unknown;
	options?: string[];
	min?: number;
	max?: number;
	placeholder?: string;
	helpText?: string;
	nestedFields?: WidgetFieldDefinition[];
}

// ── Registry Entry ───────────────────────────────────────────────────

export interface WidgetTypeRegistryEntry {
	type: string;
	label: string;
	schema: z.ZodType;
	fields: WidgetFieldDefinition[];
}

// ── Build defaults from field definitions ────────────────────────────

export function buildDefaults(
	fields: WidgetFieldDefinition[],
): Record<string, unknown> {
	const result: Record<string, unknown> = {};
	for (const field of fields) {
		if (field.defaultValue !== undefined) {
			result[field.name] = field.defaultValue;
		} else if (field.type === "boolean") {
			result[field.name] = false;
		} else if (field.type === "string-array") {
			result[field.name] = [""];
		} else if (field.type === "number") {
			result[field.name] = field.min ?? 1;
		} else if (field.type === "nested-object" && field.nestedFields) {
			result[field.name] = buildDefaults(field.nestedFields);
		} else {
			result[field.name] = "";
		}
	}
	return result;
}

// ── Widget summary text (for WidgetCard) ─────────────────────────────

export function getWidgetSummary(config: WidgetConfig): string {
	switch (config.type) {
		case "weather":
			return config.location;
		case "reddit":
			return `r/${config.subreddit}`;
		case "youtube":
			return `${config.channels.length} channel${config.channels.length !== 1 ? "s" : ""}`;
		case "feed":
			return `${config.urls.length} feed${config.urls.length !== 1 ? "s" : ""}`;
		case "bookmark":
			return config.title;
		case "github":
			return config.language ?? "All languages";
		case "tabs":
			return `${config.labels.length} tab${config.labels.length !== 1 ? "s" : ""}`;
	}
}

// ── Registry ─────────────────────────────────────────────────────────

export const WIDGET_REGISTRY: Record<string, WidgetTypeRegistryEntry> = {
	weather: {
		type: "weather",
		label: "Weather",
		schema: WeatherWidgetConfigSchema,
		fields: [
			{
				name: "location",
				label: "Location",
				type: "text",
				required: true,
				placeholder: "Ho Chi Minh City",
			},
			{
				name: "forecastDays",
				label: "Forecast Days",
				type: "number",
				min: 1,
				max: 14,
				defaultValue: 5,
			},
			{
				name: "temperatureUnit",
				label: "Temperature Unit",
				type: "select",
				options: ["C", "F"],
				defaultValue: "C",
			},
		],
	},
	reddit: {
		type: "reddit",
		label: "Reddit",
		schema: RedditWidgetConfigSchema,
		fields: [
			{
				name: "subreddit",
				label: "Subreddit",
				type: "text",
				required: true,
				placeholder: "compsci",
			},
			{
				name: "sort",
				label: "Sort",
				type: "select",
				options: ["hot", "new", "top", "rising"],
				defaultValue: "hot",
			},
			{
				name: "limit",
				label: "Limit",
				type: "number",
				min: 1,
				max: 20,
				defaultValue: 5,
			},
			{
				name: "hideTitle",
				label: "Hide Title",
				type: "boolean",
				defaultValue: false,
			},
		],
	},
	youtube: {
		type: "youtube",
		label: "YouTube",
		schema: YoutubeWidgetConfigSchema,
		fields: [
			{
				name: "channels",
				label: "Channels",
				type: "string-array",
				required: true,
				placeholder: "@Fireship",
				helpText: "Channel handles (@name) or IDs (UC...)",
			},
			{
				name: "limit",
				label: "Limit",
				type: "number",
				min: 1,
				max: 50,
				defaultValue: 16,
			},
			{
				name: "scrollAfterRow",
				label: "Scroll After Row",
				type: "number",
				min: 1,
				defaultValue: 3,
			},
			{
				name: "showTitle",
				label: "Show Title",
				type: "boolean",
				defaultValue: true,
			},
		],
	},
	feed: {
		type: "feed",
		label: "RSS Feed",
		schema: FeedWidgetConfigSchema,
		fields: [
			{
				name: "urls",
				label: "Feed URLs",
				type: "string-array",
				required: true,
				placeholder: "https://blog.cloudflare.com/rss/",
			},
			{
				name: "limit",
				label: "Limit",
				type: "number",
				min: 1,
				defaultValue: 15,
			},
			{
				name: "scrollAfterRow",
				label: "Scroll After Row",
				type: "number",
				min: 1,
				defaultValue: 6,
			},
			{
				name: "showTitle",
				label: "Show Title",
				type: "boolean",
				defaultValue: true,
			},
		],
	},
	bookmark: {
		type: "bookmark",
		label: "Bookmarks",
		schema: BookmarkWidgetConfigSchema,
		fields: [
			{
				name: "title",
				label: "Title",
				type: "text",
				required: true,
				placeholder: "Dev Tools",
			},
			{
				name: "bookmarks",
				label: "Bookmarks",
				type: "string-array",
				required: true,
				placeholder: "https://example.com",
				helpText: "URL-only bookmarks for now",
			},
		],
	},
	github: {
		type: "github",
		label: "GitHub Trending",
		schema: GithubWidgetConfigSchema,
		fields: [
			{
				name: "language",
				label: "Language",
				type: "text",
				placeholder: "typescript",
			},
			{
				name: "dateRange",
				label: "Date Range",
				type: "select",
				options: ["7d", "30d", "90d"],
				defaultValue: "90d",
			},
			{
				name: "limit",
				label: "Limit",
				type: "number",
				min: 1,
				max: 50,
				defaultValue: 25,
			},
			{
				name: "minStars",
				label: "Min Stars",
				type: "number",
				min: 0,
			},
			{
				name: "sort",
				label: "Sort",
				type: "nested-object",
				nestedFields: [
					{
						name: "field",
						label: "Sort Field",
						type: "select",
						options: ["stars", "velocity", "forks", "createdAt"],
						defaultValue: "velocity",
					},
					{
						name: "direction",
						label: "Direction",
						type: "select",
						options: ["asc", "desc"],
						defaultValue: "desc",
					},
				],
			},
		],
	},
	tabs: {
		type: "tabs",
		label: "Tabs Container",
		schema: TabsWidgetConfigSchema,
		fields: [
			{
				name: "labels",
				label: "Tab Labels",
				type: "string-array",
				required: true,
				placeholder: "Tab 1",
			},
			{
				name: "tabs",
				label: "Tab Widgets",
				type: "nested-widget",
			},
		],
	},
};

export const WIDGET_TYPES = Object.keys(WIDGET_REGISTRY);
