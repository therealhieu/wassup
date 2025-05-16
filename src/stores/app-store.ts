import { create } from "zustand";
import { createAppConfigSlice } from "./slices/app-config-slice";
import { AppStore, AppStoreInitialState } from "./app-store.schemas";

export const createAppStore = (initialState: AppStoreInitialState) => {
	const { appConfig } = initialState;

	return create<AppStore>((...a) => ({
		...createAppConfigSlice(appConfig)(...a),
	}));
};
