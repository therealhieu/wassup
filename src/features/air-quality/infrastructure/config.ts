import { z } from 'zod';

export const AirQualityConfigSchema = z.object({
    type: z.literal('air-quality'),
    location: z.string(),
}).strict();

export type AirQualityConfig = z.infer<typeof AirQualityConfigSchema>;
