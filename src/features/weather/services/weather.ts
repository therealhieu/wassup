import { GeocodeRepository } from "@/features/geocoding/domain/repositories/geocode";
import { GeonamesGeocodeRepository } from "@/features/geocoding/infrastructure/geonames";
import { baseLogger } from "@/lib/logger";
import { DailyWeatherReportRepository } from "../domain/repositories/daily-weather-report";
import { WeatherWidgetConfig } from "../infrastructure/config.schemas";
import { OpenmeteoDailyWeatherReportRepository } from "../infrastructure/repositories/openmeteo.daily-weather-report";
import { WeatherWidgetInnerProps } from "../presentation/WeatherWidget.components";

const logger = baseLogger.getSubLogger({ name: "WeatherService" });

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

	static async fromConfig(config: WeatherWidgetConfig): Promise<WeatherService> {
		const geocodeRepository = new GeonamesGeocodeRepository(config.geonames);
		await geocodeRepository.fetchData();
		const dailyWeatherRepository = new OpenmeteoDailyWeatherReportRepository();
		return new WeatherService(dailyWeatherRepository, geocodeRepository);
	}

	public async fetchWeatherWidgetProps(
		config: WeatherWidgetConfig
	): Promise<WeatherWidgetInnerProps> {
		const geocode = await this.geocodeRepository.find(config.location);
		if (!geocode) {
			throw new Error(`Location not found: ${config.location}`);
		}

		const { forecastDays } = config;
		const { name, latitude, longitude } = geocode;

		const reports = await this.dailyWeatherRepository.fetchMany(
			latitude,
			longitude,
			forecastDays
		);

		logger.info(`Fetched ${reports.length} weather reports for ${name}`);
		return { location: name, reports };
	}
}
