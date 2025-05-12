// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
"use server";

import fs from "fs/promises";
import path from "path";
import yaml from "yaml";
import * as auth from "@/auth";

import { AppConfig, AppConfigSchema, WidgetConfig } from '../infrastructure/config.schemas';
import { WidgetProps } from "./schemas";
import { baseLogger } from "./logger";
import { fetchWeatherWidgetProps } from "@/features/weather/services/weather.actions";
import { fetchTabInnerProps, fetchTabsWidgetProps } from "@/features/tabs/services/tabs.actions";
import { fetchRedditWidgetProps } from "@/features/reddit/services/reddit.actions";
import { RedditWidgetConfig } from "@/features/reddit/infrastructure/config.schemas";
import { WeatherWidgetConfig } from "@/features/weather/infrastructure/config.schemas";
import { fetchYoutubeWidgetProps } from "@/features/youtube/services/youtube.actions";
import { YoutubeWidgetConfig } from "@/features/youtube/infrastructure/config.schemas";
import { getDataKey } from "./utils";

const logger = baseLogger.getSubLogger({
	name: "actions",
});

export async function getAppConfig(): Promise<AppConfig> {
	const filePath = path.resolve(process.cwd(), "configs", "wassup.yml");
	const txt = await fs.readFile(filePath, "utf8");
	const obj = yaml.parse(txt);
	return AppConfigSchema.parse(obj);
}

export async function getIntialwidgetData(
	config: AppConfig
): Promise<Record<string, WidgetProps | null>> {
	const widgets = config.ui.pages.flatMap((page) =>
		page.columns.flatMap((column) => column.widgets)
	) as WidgetConfig[];

	let widgetData: Record<string, WidgetProps | null> = {};

	for (const widgetConfig of widgets) {
		const key = getDataKey(widgetConfig);

		switch (widgetConfig.type) {
			case "weather":
				const weatherWidgetProps = await fetchWeatherWidgetProps(
					widgetConfig as WeatherWidgetConfig
				);
				widgetData[key] = weatherWidgetProps;
				break;
			case "tabs":
				const tabsWidgetProps = await fetchTabsWidgetProps(widgetConfig);
				widgetData = {
					...widgetData,
					...tabsWidgetProps
				};
				break;
			case "reddit":
				const redditWidgetProps = await fetchRedditWidgetProps(widgetConfig as RedditWidgetConfig);
				widgetData[key] = redditWidgetProps;
				break;
			case "youtube":
				const youtubeWidgetProps = await fetchYoutubeWidgetProps(widgetConfig as YoutubeWidgetConfig);
				widgetData[key] = youtubeWidgetProps;
				break;
			default:
				widgetData[key] = null;
		}
	}

	logger.info(
		`Got initial widget data for ${Object.keys(widgetData).length} widgets`
	);

	return widgetData;
}

export async function signIn(provider: string) {
	return auth.signIn(provider)
}

export async function signOut<R extends boolean>(options?: {
	/** The relative path to redirect to after signing out. By default, the user is redirected to the current page. */
	redirectTo?: string
	/** If set to `false`, the `signOut` method will return the URL to redirect to instead of redirecting automatically. */
	redirect?: R
}) {
	return auth.signOut(options)
}
