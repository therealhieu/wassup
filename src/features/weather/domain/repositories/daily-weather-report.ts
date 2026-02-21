import { DailyWeatherReportList } from "@/features/weather/domain/entities/daily-weather-report";

export interface DailyWeatherReportRepository {
	fetchMany(
		latitude: number,
		longitude: number,
		forecastDays: number
	): Promise<DailyWeatherReportList>;
}
