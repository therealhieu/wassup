import {
    DailyWeatherReportList,
    DailyWeatherReportListSchema,
    DailyWeatherReportSchema,
} from '@/features/weather/domain/entities/daily-weather-report';
import { DailyWeatherReportRepository } from '@/features/weather/domain/repositories/daily-weather-report';
import { logger } from '@/lib/logger';
import { err, ok, Result, ResultAsync } from 'neverthrow';
import { fetchWeatherApi } from 'openmeteo';
import { z } from 'zod';


export const DailyForecastCacheKeySchema = z.object({
    latitude: z.number(),
    longitude: z.number(),
    forecastDays: z.number(),
});

export const DailyForecastCacheValueSchema = z.object({
    createdAt: z.date(),
    value: DailyWeatherReportListSchema,
});
export type DailyForecastCacheValue = z.infer<typeof DailyForecastCacheValueSchema>;


export class OpenmeteoDailyWeatherReportRepository implements DailyWeatherReportRepository {
    private url = 'https://api.open-meteo.com/v1/forecast';
    private cache = new Map<string, DailyForecastCacheValue>();

    public async forecastDaily(latitude: number, longitude: number, forecastDays: number): Promise<Result<DailyWeatherReportList, Error>> {
        const cacheKey = JSON.stringify({
            latitude,
            longitude,
            forecastDays,
        })

        if (this.cache.has(cacheKey)) {
            const currentDate = new Date();
            const cachedValue = this.cache.get(cacheKey)!;
            const cachedDate = cachedValue.createdAt;

            if (currentDate.getDate() > cachedDate.getDate()) {
                logger.info(`Cache expired for daily forecast for ${latitude}, ${longitude} with forecast_days ${forecastDays}`);
                this.cache.delete(cacheKey);
            } else {
                logger.info(`Cache hit for daily forecast for ${latitude}, ${longitude} with forecast_days ${forecastDays}`);
                return ok(cachedValue.value);
            }
        }

        const params = {
            "latitude": latitude,
            "longitude": longitude,
            "daily": ["weather_code", "temperature_2m_max", "precipitation_hours", "uv_index_max", "rain_sum", "precipitation_probability_max", "cloud_cover_mean", "temperature_2m_min"],
            "forecast_days": forecastDays
        }

        const fetchResult = await ResultAsync.fromPromise(fetchWeatherApi(this.url, params), (err: unknown) => new Error("Failed to fetch weather data", { cause: err }));

        if (fetchResult.isErr()) {
            return err(fetchResult.error);
        }

        const responses = fetchResult.value;
        const response = responses[0];

        // Attributes for timezone and location
        const utcOffsetSeconds = response.utcOffsetSeconds();
        const timezone = response.timezone();

        const daily = response.daily()!;

        // Note: The order of weather variables in the URL query and the indices below need to match!
        const weatherData = {
            daily: {
                time: [...Array((Number(daily.timeEnd()) - Number(daily.time())) / daily.interval())].map(
                    (_, i) => new Date((Number(daily.time()) + i * daily.interval() + utcOffsetSeconds) * 1000)
                ),
                weatherCode: daily.variables(0)!.valuesArray()!,
                temperature2mMax: daily.variables(1)!.valuesArray()!,
                precipitationHours: daily.variables(2)!.valuesArray()!,
                uvIndexMax: daily.variables(3)!.valuesArray()!,
                rainSum: daily.variables(4)!.valuesArray()!,
                precipitationProbabilityMax: daily.variables(5)!.valuesArray()!,
                cloudCoverMean: daily.variables(6)!.valuesArray()!,
                temperature2mMin: daily.variables(7)!.valuesArray()!,
            },
        };

        const dailyReports: DailyWeatherReportList = [];

        for (let i = 0; i < weatherData.daily.time.length; i++) {
            const report = DailyWeatherReportSchema.parse({
                date: weatherData.daily.time[i],
                temperatureMax: weatherData.daily.temperature2mMax[i],
                temperatureMin: weatherData.daily.temperature2mMin[i],
                precipitationProbability: weatherData.daily.precipitationProbabilityMax[i],
                precipitationHours: weatherData.daily.precipitationHours[i],
                windSpeed: 0,
                uvIndex: weatherData.daily.uvIndexMax[i],
                cloudCover: weatherData.daily.cloudCoverMean[i],
                weatherCode: weatherData.daily.weatherCode[i],
            })
            dailyReports.push(report);
        }

        const cacheValue: DailyForecastCacheValue = {
            createdAt: z.date().parse(new Date()),
            value: dailyReports,
        }

        this.cache.set(cacheKey, cacheValue);
        logger.info(`Cache set for daily forecast for ${latitude}, ${longitude} with forecast_days ${forecastDays}`);

        return ok(dailyReports);
    }
}