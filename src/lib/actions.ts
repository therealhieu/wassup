"use server";

import fs from "fs/promises";
import path from "path";
import yaml from "yaml";

import { AppConfig, AppConfigSchema } from "../infrastructure/config.schemas";
import { WidgetProps } from "./schemas";
import { baseLogger } from "./logger";
import { getWeatherWidgetProps } from "@/features/weather/services/weather.actions";
import { getTabsWidgetProps } from "@/features/tabs/services/tabs.actions";

const logger = baseLogger.getSubLogger({
	name: "actions",
});

export async function getAppConfig(): Promise<AppConfig> {
	const filePath = path.resolve(process.cwd(), "configs", "wassup.yml");
	const txt = await fs.readFile(filePath, "utf8");
	const obj = yaml.parse(txt);
	return AppConfigSchema.parse(obj);
}

export async function getIntialWidgetCache(
	config: AppConfig
): Promise<Record<string, WidgetProps | null>> {
	const widgets = config.ui.pages.flatMap((page) =>
		page.columns.flatMap((column) => column.widgets)
	);

	const widgetData: Record<string, WidgetProps | null> = {};

	for (const widgetConfig of widgets) {
		const key = JSON.stringify(widgetConfig);

		switch (widgetConfig.type) {
			case "weather":
				const weatherWidgetProps = await getWeatherWidgetProps(
					widgetConfig
				);
				widgetData[key] = weatherWidgetProps;
				break;
			case "tabs":
				const tabsWidgetProps = await getTabsWidgetProps(widgetConfig);
				widgetData[key] = tabsWidgetProps;
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
