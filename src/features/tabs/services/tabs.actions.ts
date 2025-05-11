"use server";

import { WidgetProps } from "@/lib/schemas";
import { TabsWidgetConfig } from "../infrastructure/config.schemas";
import { fetchWeatherWidgetProps } from "@/features/weather/services/weather.actions";
import { TabsWidgetProps } from "../presentation/TabWidget";

export async function fetchTabsWidgetProps(
	widgetConfig: TabsWidgetConfig
): Promise<TabsWidgetProps> {
	return {
		config: widgetConfig,
	};
}

export async function getTabsWidgetRecord(
	tabsWidgetConfig: TabsWidgetConfig
): Promise<Record<string, WidgetProps | null>> {
	const record: Record<string, WidgetProps | null> = {};
	record[JSON.stringify(tabsWidgetConfig)] = await fetchTabsWidgetProps(
		tabsWidgetConfig
	);

	for (const tab of tabsWidgetConfig.tabs) {
		const key = JSON.stringify(tab);
		switch (tab.type) {
			case "weather":
				record[key] = await fetchWeatherWidgetProps(tab);
				break;
			case "tabs":
				const nestedRecord = await getTabsWidgetRecord(
					tab as TabsWidgetConfig
				);
				record[key] = nestedRecord[JSON.stringify(tab)];
				break;
			default:
				record[key] = null;
		}
	}

	return record;
}
