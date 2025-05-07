"use client";

import { WidgetConfig } from "@/infrastructure/config.schemas";
import { ErrorWidget } from "./ErrorWidget";
import { useEffect, useState } from "react";
import {
	WeatherWidget,
	WeatherWidgetProps,
} from "@/features/weather/presentation/WeatherWidget";
import { WeatherWidgetSkeleton } from "@/features/weather/presentation/WeatherWidgetSkeleton";
import { getWeatherWidgetProps } from "@/features/weather/services/weather.actions";
import {
	TabsWidget,
	TabsWidgetProps,
} from "@/features/tabs/presentation/TabWidget";
import { TabsWidgetSkeleton } from "@/features/tabs/presentation/TabsWidgetSkeleton";
import { useAppStore } from "@/providers/AppStoreContextProvider";

interface WidgetComponentProps {
	widgetConfig: WidgetConfig;
}

export function Widget({ widgetConfig }: WidgetComponentProps) {
	const widgetKey = JSON.stringify(widgetConfig);
	const data = useAppStore((state) => state.widgetCache[widgetKey] ?? null);
	const setData = useAppStore((state) => state.setWidgetCache);

	const [loading, setLoading] = useState(data ? false : true);
	const [error, setError] = useState<Error | null>(null);

	useEffect(() => {
		// Skip if we have data from initialWidgetData
		if (data) {
			return;
		}

		async function fetchData() {
			setLoading(true);
			setError(null);

			try {
				switch (widgetConfig.type) {
					case "weather":
						const widgetProps = (await getWeatherWidgetProps(
							widgetConfig
						)) as WeatherWidgetProps;
						setData(widgetKey, widgetProps);
						break;
					case "tabs":
						setData(widgetKey, { config: widgetConfig });
						break;
				}
			} catch (e) {
				setError(e instanceof Error ? e : new Error("Unknown error"));
			} finally {
				setLoading(false);
			}
		}

		fetchData();
	}, [widgetConfig, widgetKey, data, setData]);

	if (loading) {
		switch (widgetConfig.type) {
			case "weather":
				return <WeatherWidgetSkeleton />;
			case "tabs":
				return <TabsWidgetSkeleton />;
			default:
				return null;
		}
	}

	if (error) {
		return <ErrorWidget error={error} />;
	}

	if (data) {
		switch (widgetConfig.type) {
			case "weather":
				return <WeatherWidget {...(data as WeatherWidgetProps)} />;
			case "tabs":
				return <TabsWidget {...(data as TabsWidgetProps)} />;
			default:
				return (
					<ErrorWidget
						error={
							new Error(
								`Unsupported widget type: ${widgetConfig.type}`
							)
						}
					/>
				);
		}
	}

	return null;
}
