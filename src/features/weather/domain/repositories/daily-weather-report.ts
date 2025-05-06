import { DailyWeatherReportList } from "@/features/weather/domain/entities/daily-weather-report";
import { Result } from "neverthrow";

export interface DailyWeatherReportRepository {
    forecastDaily(latitude: number, longitude: number, forecastDays: number): Promise<Result<DailyWeatherReportList, Error>>;
}