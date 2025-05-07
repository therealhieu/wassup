import { z } from "zod";
import { AppConfigSliceSchema } from "./slices/app-config-slice.schemas";
import { WidgetCacheSliceSchema } from "./slices/widget-cache-slice.schemas";
import { AppConfigSchema } from "@/infrastructure/config.schemas";
import { WidgetPropsSchema } from "@/lib/schemas";

export const ThemeOptionSchema = z.enum(["light", "dark"]);
export type ThemeOption = z.infer<typeof ThemeOptionSchema>;

export const AppStoreSchema = z.intersection(
	AppConfigSliceSchema,
	WidgetCacheSliceSchema
);

export type AppStore = z.infer<typeof AppStoreSchema>;

export const AppStoreInitialStateSchema = z.object({
	appConfig: AppConfigSchema,
	widgetCache: z.record(z.string(), WidgetPropsSchema.nullable()),
});

export type AppStoreInitialState = z.infer<typeof AppStoreInitialStateSchema>;
