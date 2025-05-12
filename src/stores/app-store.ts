import { create } from "zustand";
import { createAppConfigSlice } from "./slices/app-config-slice";
import { createwidgetDataSlice } from "./slices/widget-cache-slice";
import { AppStore, AppStoreInitialState } from "./app-store.schemas";

export const createAppStore = (initialState: AppStoreInitialState) => {
	const { appConfig, widgetData } = initialState;

	return create<AppStore>((...a) => ({
		...createAppConfigSlice(appConfig)(...a),
		...createwidgetDataSlice(widgetData)(...a),
	}));
};
