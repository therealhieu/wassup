import { z } from 'zod';

import { AirQualityConfigSchema } from '../features/air-quality/infrastructure/config';
import { WeatherWidgetConfigSchema } from '../features/weather/infrastructure/config';

export const WidgetConfigSchema = z.discriminatedUnion('type', [
    WeatherWidgetConfigSchema,
    AirQualityConfigSchema,
]);

export type WidgetConfig = z.infer<typeof WidgetConfigSchema>;

export const ColumnConfigSchema = z.object({
    size: z.number().min(1).max(12),
    widgets: z.array(WidgetConfigSchema),
}).strict();

export type ColumnConfig = z.infer<typeof ColumnConfigSchema>;

export const PageConfigSchema = z.object({
    title: z.string(),
    path: z.string(),
    columns: z.array(ColumnConfigSchema),
}).strict();

export type PageConfig = z.infer<typeof PageConfigSchema>;

export const ServerConfigSchema = z.object({
    port: z.number().min(1).max(65535),
});

export type ServerConfig = z.infer<typeof ServerConfigSchema>;

export const UiConfigSchema = z.object({
    theme: z.enum(['light', 'dark']),
    pages: z.array(PageConfigSchema),
}).strict();

export type UiConfig = z.infer<typeof UiConfigSchema>;

export const AppConfigSchema = z.object({
    server: ServerConfigSchema,
    ui: UiConfigSchema,
}).strict();

export type AppConfig = z.infer<typeof AppConfigSchema>;
