import { GeonamesConfigSchema } from '@/features/geocoding/infrastructure/geonames.schemas';
import { z } from 'zod';

export const WeatherWidgetConfigSchema = z.object({
    type: z.literal('weather'),
    geonames: GeonamesConfigSchema.default(GeonamesConfigSchema.parse({})),
    location: z.string(),
    forecastDays: z.number().default(5),
    temperatureUnit: z.enum(['C', 'F']).default('C'),
}).strict();

export type WeatherWidgetConfig = z.infer<typeof WeatherWidgetConfigSchema>;