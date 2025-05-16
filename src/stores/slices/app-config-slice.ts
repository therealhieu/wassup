import { AppConfig } from "@/infrastructure/config.schemas";
import { AppConfigSlice } from "./app-config-slice.schemas";
import { StateCreator } from "zustand";
import { ThemeOption } from "../app-store.schemas";

export const createAppConfigSlice = (
	initalAppConfig: AppConfig | undefined
): StateCreator<AppConfigSlice> => {
	return (set) => ({
		appConfig: initalAppConfig || undefined,
		setAppConfig: (appConfig: AppConfig) => set({ appConfig }),
		setTheme: (theme: ThemeOption) =>
			set((state) => ({
				appConfig: {
					...state.appConfig!,
					ui: { ...state.appConfig!.ui, theme },
				},
			})),
	});
};
