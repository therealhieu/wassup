import {
	WeatherWidgetInner,
	WeatherWidgetInnerProps,
} from "./WeatherWidget.components";

import { WeatherWidgetConfig } from "../infrastructure/config.schemas";
import { fetchWeatherWidgetProps } from "../services/weather.actions";
import { useQuery } from "@tanstack/react-query";
import { ErrorWidget } from "@/components/ErrorWidget";
import { WeatherWidgetSkeleton } from "./WeatherWidgetSkeleton";
import { useAppStore } from "@/providers/AppStoreContextProvider";
import { getDataKey } from "@/lib/utils";

export interface WeatherWidgetProps {
	config: WeatherWidgetConfig;
}

export const WeatherWidget = ({ config }: WeatherWidgetProps) => {
	const dataKey = getDataKey(config);
	const initialData = useAppStore(
		(s) => s.widgetData[dataKey] as WeatherWidgetInnerProps | undefined
	);

	const {
		data: props,
		isLoading,
		error,
	} = useQuery<WeatherWidgetInnerProps, Error>({
		queryKey: ["weather", config],
		queryFn: () => fetchWeatherWidgetProps(config),
		initialData, // ← hydrate from your server cache
		staleTime: 1000 * 60 * 5, // 5 minutes
	});

	if (isLoading) return <WeatherWidgetSkeleton />;
	if (error) return <ErrorWidget error={error} />;
	if (!props) return <ErrorWidget error={new Error("No data")} />;

	return <WeatherWidgetInner {...props} />;
};
