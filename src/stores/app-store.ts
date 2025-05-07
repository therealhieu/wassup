import { create } from "zustand";
import { createAppConfigSlice } from "./slices/app-config-slice";
import { createWidgetCacheSlice } from "./slices/widget-cache-slice";
import { AppStore, AppStoreInitialState } from "./app-store.schemas";

export const createAppStore = (initialState: AppStoreInitialState) => {
	const { appConfig, widgetCache } = initialState;

	return create<AppStore>((...a) => ({
		...createAppConfigSlice(appConfig)(...a),
		...createWidgetCacheSlice(widgetCache)(...a),
	}));
};
