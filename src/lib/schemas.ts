import { TabsWidgetPropsSchema } from "@/features/tabs/presentation/TabWidget";
import { WeatherWidgetPropsSchema } from "@/features/weather/presentation/WeatherWidget";
import { z } from "zod";

export const WidgetPropsSchema = z.union([
    WeatherWidgetPropsSchema,
    TabsWidgetPropsSchema
]);

export type WidgetProps = z.infer<typeof WidgetPropsSchema>;

