import { z } from "zod";
import { AppConfigSliceSchema } from "./slices/app-config-slice.schemas";
import { AppConfig } from "@/infrastructure/config.schemas";

export const ThemeOptionSchema = z.enum(["light", "dark"]);
export type ThemeOption = z.infer<typeof ThemeOptionSchema>;

export const AppStoreSchema = AppConfigSliceSchema;

export type AppStore = z.infer<typeof AppStoreSchema>;

export type AppStoreInitialState = {
	appConfig: AppConfig;
};
