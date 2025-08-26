import { create } from "zustand";
import { createAppConfigSlice } from "./slices/app-config-slice";
import { AppStore, AppStoreInitialState } from "./app-store.schemas";
import { persist, createJSONStorage } from "zustand/middleware";
import { Session } from "next-auth";
import { createStorage, STORAGE_NAME } from "@/lib/storage";
import { baseLogger } from "@/lib/logger";

const logger = baseLogger.getSubLogger({
	name: "AppStore",
});

export const createAppStore = (
	initialState: AppStoreInitialState,
	session: Session | null
) => {
	const { appConfig } = initialState;

	return create<AppStore>()(
		persist(
			(...a) => ({
				...createAppConfigSlice(appConfig)(...a),
			}),
			{
				name: STORAGE_NAME,
				storage: createJSONStorage(() => createStorage(session)),
				onRehydrateStorage: () => (state) => {
					if (state) {
						logger.info("✅ Store rehydrated successfully from storage", { 
							hasConfig: !!state.appConfig,
							isAuthenticated: !!session?.user?.id
						});
					} else {
						logger.warn("⚠️ Failed to rehydrate store from storage");
					}
				},
			}
		)
	);
};
