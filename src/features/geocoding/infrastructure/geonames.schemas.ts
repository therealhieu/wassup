import { z } from 'zod';
import path from 'path';

export const GeonamesConfigSchema = z.object({
    outputPath: z
        .string()
        .default(path.join('resources', 'geonames')),
    dataset: z.enum(['allCountries', 'cities5000', 'cities15000']).default('cities15000')
});

export type GeonamesConfig = z.infer<typeof GeonamesConfigSchema>;
