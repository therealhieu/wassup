import { DailyWeatherReportList } from "@/features/weather/domain/entities/daily-weather-report";
import { Result } from "neverthrow";

export interface DailyWeatherReportRepository {
	fetchMany(
		latitude: number,
		longitude: number,
		forecastDays: number
	): Promise<Result<DailyWeatherReportList, Error>>;
}
