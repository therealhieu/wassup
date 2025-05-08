import { GeocodeRepository } from "@/features/geocoding/domain/repositories/geocode";
import { GeonamesGeocodeRepository } from "@/features/geocoding/infrastructure/geonames";
import { logger } from "@/lib/logger";
import { err, ok, Result } from "neverthrow";

import { DailyWeatherReportRepository } from "../domain/repositories/daily-weather-report";
import { WeatherWidgetConfig } from "../infrastructure/config.schemas";
import { OpenmeteoDailyWeatherReportRepository } from "../infrastructure/repositories/openmeteo.daily-weather-report";
import { WeatherWidgetInnerProps } from "../presentation/WeatherWidget.components";

export class WeatherService {
	private dailyWeatherRepository: DailyWeatherReportRepository;
	private geocodeRepository: GeocodeRepository;

	constructor(
		dailyWeatherReportRepository: DailyWeatherReportRepository,
		geocodeRepository: GeocodeRepository
	) {
		this.dailyWeatherRepository = dailyWeatherReportRepository;
		this.geocodeRepository = geocodeRepository;
	}

	static async fromConfig(
		config: WeatherWidgetConfig
	): Promise<Result<WeatherService, Error>> {
		const { granularity, provider, geonames } = config;

		if (granularity !== "daily") {
			const errorMessage = `Unsupported granularity: ${granularity}`;
			logger.error(errorMessage);
			return err(new Error(errorMessage));
		}

		if (provider !== "openmeteo") {
			const errorMessage = `Unsupported provider: ${provider}`;
			logger.error(errorMessage);
			return err(new Error(errorMessage));
		}

		const geocodeRepository = new GeonamesGeocodeRepository(geonames);
		await geocodeRepository.fetchData();

		const dailyWeatherRepository =
			new OpenmeteoDailyWeatherReportRepository();

		return ok(
			new WeatherService(dailyWeatherRepository, geocodeRepository)
		);
	}

	public async getWeatherWidgetProps(
		config: WeatherWidgetConfig
	): Promise<Result<WeatherWidgetInnerProps, Error>> {
		const getGeocodeResult = await this.geocodeRepository.getGeocode(
			config.location
		);

		if (getGeocodeResult.isErr()) {
			return err(getGeocodeResult.error);
		}

		if (getGeocodeResult.value == null) {
			return err(new Error("Geocode not found"));
		}

		const { forecastDays } = config;
		const { name, latitude, longitude } = getGeocodeResult.value;

		const forecastResult = await this.dailyWeatherRepository.forecastDaily(
			latitude,
			longitude,
			forecastDays
		);

		if (forecastResult.isErr()) {
			return err(forecastResult.error);
		}

		const reports = forecastResult.value;

		return ok({
			location: name,
			reports: reports,
		});
	}
}
