import { z } from "zod";

export const GeocodeSchema = z.object({
    name: z.string(),
    latitude: z.number(),
    longitude: z.number(),
});

export type Geocode = z.infer<typeof GeocodeSchema>;