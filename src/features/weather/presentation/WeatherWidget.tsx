import {
	WeatherWidgetInner,
	WeatherWidgetInnerProps,
} from "./WeatherWidget.components";

import { WeatherWidgetConfig } from "../infrastructure/config.schemas";
import { fetchWeatherWidgetProps } from "../services/weather.actions";
import { useQuery } from "@tanstack/react-query";
import { ErrorWidget } from "@/components/ErrorWidget";
import { WeatherWidgetSkeleton } from "./WeatherWidgetSkeleton";

export interface WeatherWidgetProps {
	config: WeatherWidgetConfig;
}

export const WeatherWidget = ({ config }: WeatherWidgetProps) => {
	const {
		data: props,
		isLoading,
		error,
	} = useQuery<WeatherWidgetInnerProps, Error>({
		queryKey: ["weather", config],
		queryFn: () => fetchWeatherWidgetProps(config),
		staleTime: 1000 * 60 * 5, // 5 minutes
	});

	if (isLoading || !props) return <WeatherWidgetSkeleton />;
	if (error) return <ErrorWidget error={error} />;

	return <WeatherWidgetInner {...props} />;
};
