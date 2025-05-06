'use client';

import { WidgetConfig } from "@/infrastructure/config/schemas";
import { ErrorWidget } from "./ErrorWidget";
import { useEffect, useState } from "react";
import { WeatherWidget, WeatherWidgetProps } from "@/features/weather/presentation/WeatherWidget";
import { WeatherWidgetSkeleton } from "@/features/weather/presentation/WeatherWidgetSkeleton";
import { getWeatherWidgetProps } from "@/features/weather/services/weather.actions";

interface WidgetProps {
    widgetConfig: WidgetConfig;
}

export function Widget({ widgetConfig }: WidgetProps) {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const [data, setData] = useState<WeatherWidgetProps | null>(null);

    useEffect(() => {
        async function fetchData() {
            setLoading(true);
            setError(null);
            try {
                switch (widgetConfig.type) {
                    case 'weather':
                        const getResult = await getWeatherWidgetProps(widgetConfig) as WeatherWidgetProps;
                        setData(getResult);
                        break;
                }
            } catch (e) {
                setError(e instanceof Error ? e : new Error('Unknown error'));
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [widgetConfig]);

    if (loading) {
        switch (widgetConfig.type) {
            case 'weather':
                return <WeatherWidgetSkeleton />;
            default:
                return null;
        }
    }

    if (error) {
        return <ErrorWidget error={error} />;
    }

    if (data) {
        switch (widgetConfig.type) {
            case 'weather':
                return <WeatherWidget {...data} />;
            default:
                return <ErrorWidget error={new Error(`Unsupported widget type: ${widgetConfig.type}`)} />;
        }
    }

    return null;
}
