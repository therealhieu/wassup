import { z } from "zod";

export const DailyWeatherReportSchema = z.object({
    date: z.date(),
    temperatureMax: z.number(),
    temperatureMin: z.number(),
    precipitationProbability: z.number(),
    precipitationHours: z.number(),
    windSpeed: z.number(),
    uvIndex: z.number(),
    cloudCover: z.number(),
    weatherCode: z.number(),
});

export const DailyWeatherReportListSchema = z.array(DailyWeatherReportSchema);

export type DailyWeatherReport = z.infer<typeof DailyWeatherReportSchema>;
export type DailyWeatherReportList = z.infer<typeof DailyWeatherReportListSchema>;
