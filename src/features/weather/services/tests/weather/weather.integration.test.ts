import { describe, expect, it } from "vitest";
import { WeatherService } from "../../weather";
import { WeatherWidgetConfigSchema } from "../../../infrastructure/config.schemas";

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
        const props = await service.fetchWeatherWidgetProps(config);

        if (props.isErr()) {
            throw props.error;
        }

        expect(props.value).toBeDefined();
    });
});