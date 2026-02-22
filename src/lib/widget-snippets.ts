export interface WidgetSnippet {
	label: string;
	description: string;
	insertText: string;
}

/**
 * YAML snippet templates for each widget type.
 * Uses Monaco snippet syntax: ${N:default} for tab stops, ${N|a,b,c|} for choices.
 * Indented with 2 spaces to match YAML convention inside a widgets array.
 */
export const WIDGET_SNIPPETS: WidgetSnippet[] = [
	{
		label: "widget:weather",
		description: "Weather forecast widget",
		insertText: [
			"- type: weather",
			"  location: ${1:Ho Chi Minh City}",
			"  forecastDays: ${2:5}",
			"  temperatureUnit: ${3|C,F|}",
		].join("\n"),
	},
	{
		label: "widget:reddit",
		description: "Reddit subreddit feed widget",
		insertText: [
			"- type: reddit",
			"  subreddit: ${1:compsci}",
			"  sort: ${2|hot,new,top,rising|}",
			"  limit: ${3:5}",
		].join("\n"),
	},
	{
		label: "widget:youtube",
		description: "YouTube channel videos widget",
		insertText: [
			"- type: youtube",
			"  channels:",
			'    - "${1:@Fireship}"',
			"  limit: ${2:16}",
			"  scrollAfterRow: ${3:3}",
		].join("\n"),
	},
	{
		label: "widget:feed",
		description: "RSS/Atom feed aggregator widget",
		insertText: [
			"- type: feed",
			"  urls:",
			"    - ${1:https://blog.cloudflare.com/rss/}",
			"  limit: ${2:15}",
			"  scrollAfterRow: ${3:6}",
		].join("\n"),
	},
	{
		label: "widget:bookmark",
		description: "Static bookmark list widget",
		insertText: [
			"- type: bookmark",
			"  title: ${1:Bookmarks}",
			"  bookmarks:",
			"    - ${2:https://example.com}",
		].join("\n"),
	},
	{
		label: "widget:github",
		description: "GitHub trending repositories widget",
		insertText: [
			"- type: github",
			"  language: ${1:typescript}",
			"  dateRange: ${2|90d,30d,7d|}",
			"  limit: ${3:25}",
		].join("\n"),
	},
	{
		label: "widget:tabs",
		description: "Tabbed container for other widgets",
		insertText: [
			"- type: tabs",
			"  labels:",
			"    - ${1:Tab 1}",
			"    - ${2:Tab 2}",
			"  tabs:",
			"    - type: ${3:reddit}",
			"      subreddit: ${4:compsci}",
			"      sort: hot",
			"    - type: ${5:reddit}",
			"      subreddit: ${6:rust}",
			"      sort: new",
		].join("\n"),
	},
];
