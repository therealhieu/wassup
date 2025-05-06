import { WeatherWidgetPropsSchema } from "@/features/weather/presentation/WeatherWidget";
import { z } from "zod";

export const WidgetPropsSchema = z.union([
    WeatherWidgetPropsSchema,
    WeatherWidgetPropsSchema
]);

export type WidgetProps = z.infer<typeof WidgetPropsSchema>;

