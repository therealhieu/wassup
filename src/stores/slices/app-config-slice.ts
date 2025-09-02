import { AppConfig } from "@/infrastructure/config.schemas";
import { AppConfigSlice } from "./app-config-slice.schemas";
import { StateCreator } from "zustand";
import { ThemeOption } from "../app-store.schemas";
import { baseLogger } from "@/lib/logger";

const logger = baseLogger.getSubLogger({
	name: "AppConfigSlice",
});

export const createAppConfigSlice = (
	initalAppConfig: AppConfig
): StateCreator<AppConfigSlice> => {
	return (set) => ({
		appConfig: initalAppConfig,
		setAppConfig: (appConfig: AppConfig) => {
			logger.info("🔄 AppConfigSlice: setAppConfig called", { 
				hasPages: appConfig.ui.pages.length,
				theme: appConfig.ui.theme,
				configPreview: JSON.stringify(appConfig).substring(0, 150) + '...'
			});
			set({ appConfig });
		},
		setTheme: (theme: ThemeOption) =>
			set((state) => ({
				appConfig: {
					...state.appConfig,
					ui: { ...state.appConfig.ui, theme },
				},
			})),
	});
};
