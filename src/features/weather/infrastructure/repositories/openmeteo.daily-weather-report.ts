import {
	DailyWeatherReportList,
	DailyWeatherReportListSchema,
	DailyWeatherReportSchema,
} from "@/features/weather/domain/entities/daily-weather-report";
import { DailyWeatherReportRepository } from "@/features/weather/domain/repositories/daily-weather-report";
import { baseLogger } from "@/lib/logger";
import { fetchWeatherApi } from "openmeteo";
import { z } from "zod";

export const DailyForecastCacheKeySchema = z.object({
	latitude: z.number(),
	longitude: z.number(),
	forecastDays: z.number(),
});

export const DailyForecastCacheValueSchema = z.object({
	createdAt: z.date(),
	value: DailyWeatherReportListSchema,
});
export type DailyForecastCacheValue = z.infer<
	typeof DailyForecastCacheValueSchema
>;

const logger = baseLogger.getSubLogger({
	name: "OpenmeteoDailyWeatherReportRepository",
});

export class OpenmeteoDailyWeatherReportRepository
	implements DailyWeatherReportRepository
{
	private url = "https://api.open-meteo.com/v1/forecast";
	private cache = new Map<string, DailyForecastCacheValue>();

	public async fetchMany(
		latitude: number,
		longitude: number,
		forecastDays: number
	): Promise<DailyWeatherReportList> {
		const cacheKey = JSON.stringify({ latitude, longitude, forecastDays });

		if (this.cache.has(cacheKey)) {
			const currentDate = new Date();
			const cachedValue = this.cache.get(cacheKey)!;

			if (currentDate.getDate() > cachedValue.createdAt.getDate()) {
				logger.info(`Cache expired for lat=${latitude} lon=${longitude}`);
				this.cache.delete(cacheKey);
			} else {
				logger.info(`Cache hit for lat=${latitude} lon=${longitude}`);
				return cachedValue.value;
			}
		}

		const params = {
			latitude,
			longitude,
			daily: [
				"weather_code",
				"temperature_2m_max",
				"precipitation_hours",
				"uv_index_max",
				"rain_sum",
				"precipitation_probability_max",
				"cloud_cover_mean",
				"temperature_2m_min",
			],
			forecast_days: forecastDays,
		};

		const responses = await fetchWeatherApi(this.url, params);
		const response = responses[0];
		const utcOffsetSeconds = response.utcOffsetSeconds();
		const daily = response.daily()!;

		const weatherData = {
			daily: {
				time: [
					...Array(
						(Number(daily.timeEnd()) - Number(daily.time())) / daily.interval()
					),
				].map(
					(_, i) =>
						new Date(
							(Number(daily.time()) +
								i * daily.interval() +
								utcOffsetSeconds) *
								1000
						)
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
			});
			dailyReports.push(report);
		}

		this.cache.set(cacheKey, {
			createdAt: new Date(),
			value: dailyReports,
		});
		logger.info(`Cache set for lat=${latitude} lon=${longitude} days=${forecastDays}`);

		return dailyReports;
	}
}
