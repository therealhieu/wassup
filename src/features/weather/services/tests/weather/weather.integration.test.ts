import { describe, expect, it } from "vitest";
import { WeatherService } from "../../weather";
import { WeatherWidgetConfigSchema } from "../../../infrastructure/config.schemas";

describe("WeatherService", () => {
	it("should return the weather widget props", async () => {
		const config = WeatherWidgetConfigSchema.parse({
			type: "weather",
			location: "Ho Chi Minh City",
		});

		const service = await WeatherService.fromConfig(config);
		const props = await service.fetchWeatherWidgetProps(config);

		expect(props).toBeDefined();
		expect(props.location).toBeDefined();
		expect(props.reports).toBeInstanceOf(Array);
	});
});