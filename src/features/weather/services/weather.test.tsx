import { describe, expect, it } from "vitest";
import { WeatherService } from "./weather";
import { GeonamesGeocodeRepository } from "@/features/geocoding/infrastructure/geonames";
import { WeatherWidgetConfigSchema } from "../infrastructure/config";

describe('WeatherService', () => {
    it('should return the weather widget props', async () => {
        const config = WeatherWidgetConfigSchema.parse({
            type: 'weather',
            location: 'Ho Chi Minh City',
        })

        const initServiceResult = await WeatherService.fromConfig(config);

        if (initServiceResult.isErr()) {
            throw initServiceResult.error;
        }

        const service = initServiceResult.value;
        const props = await service.getWeatherWidgetProps(config);

        if (props.isErr()) {
            throw props.error;
        }

        expect(props.value).toBeDefined();
    });
});