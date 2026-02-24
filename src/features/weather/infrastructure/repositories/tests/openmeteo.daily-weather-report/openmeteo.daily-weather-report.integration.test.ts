import { describe, expect, it } from "vitest";
import { OpenmeteoDailyWeatherReportRepository } from "../../openmeteo.daily-weather-report";

const HCMC_COORDINATES = {
	latitude: 10.875,
	longitude: 106.625,
};

describe("OpenmeteoDailyWeatherReportRepository", () => {
	it("should return the daily weather report", async () => {
		const repository = new OpenmeteoDailyWeatherReportRepository();
		const reports = await repository.fetchMany(
			HCMC_COORDINATES.latitude,
			HCMC_COORDINATES.longitude,
			5,
		);

		expect(reports).toBeDefined();
		expect(reports.length).toBe(5);
	});
});
