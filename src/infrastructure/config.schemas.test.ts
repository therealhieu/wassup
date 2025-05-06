import { describe, expect, it } from 'vitest';

import { AirQualityConfig } from '../features/air-quality/infrastructure/config';
import { WeatherWidgetConfig } from '../features/weather/infrastructure/config';
import {
    ColumnConfig,
    ColumnConfigSchema,
    WidgetConfigSchema,
    PageConfig,
    PageConfigSchema,
} from './config.schemas';

describe('Config', () => {
    it('should be able to parse widget config object', () => {
        const WeatherWidgetConfig = WidgetConfigSchema.parse({
            type: 'weather',
            location: 'Ho Chi Minh',
            temperature_unit: 'C',
        }) as WeatherWidgetConfig;

        expect(WeatherWidgetConfig).toBeDefined();
        expect(WeatherWidgetConfig.type).toBe('weather');
        expect(WeatherWidgetConfig.location).toBe('Ho Chi Minh');
        expect(WeatherWidgetConfig.temperatureUnit).toBe('C');

        const airQualityConfig = WidgetConfigSchema.parse({
            type: 'air-quality',
            location: 'Ho Chi Minh',
        }) as AirQualityConfig;

        expect(airQualityConfig).toBeDefined();
        expect(airQualityConfig.type).toBe('air-quality');
        expect(airQualityConfig.location).toBe('Ho Chi Minh');
    });

    it('should be able to parse column config object', () => {
        const columnConfig = ColumnConfigSchema.parse({
            size: '1/5',
            widgets: [
                {
                    type: 'weather',
                    location: 'Ho Chi Minh',
                    temperature_unit: 'C',
                },
            ],
        }) as ColumnConfig;

        expect(columnConfig).toBeDefined();
        expect(columnConfig.size).toBe('1/5');
        expect(columnConfig.widgets.length).toBe(1);

        const WeatherWidget = columnConfig.widgets[0] as WeatherWidgetConfig;
        expect(WeatherWidget.type).toBe('weather');
        expect(WeatherWidget.location).toBe('Ho Chi Minh');
        expect(WeatherWidget.temperatureUnit).toBe('C');
    });

    it('should be able to parse page config object', () => {
        const pageConfig = PageConfigSchema.parse({
            title: 'Home',
            path: '/',
            columns: [
                {
                    size: '1/5',
                    widgets: [
                        {
                            type: 'weather',
                            location: 'Ho Chi Minh',
                            temperature_unit: 'C',
                        },
                    ],
                },
            ],
        }) as PageConfig;

        expect(pageConfig).toBeDefined();
        expect(pageConfig.title).toBe('Home');
        expect(pageConfig.path).toBe('/');
        expect(pageConfig.columns.length).toBe(1);

        const columnConfig = pageConfig.columns[0] as ColumnConfig;
        expect(columnConfig.size).toBe('1/5');
        expect(columnConfig.widgets.length).toBe(1);

        const weatherWidget = columnConfig.widgets[0] as WeatherWidgetConfig;
        expect(weatherWidget.type).toBe('weather');
        expect(weatherWidget.location).toBe('Ho Chi Minh');
        expect(weatherWidget.temperatureUnit).toBe('C');
    });
})