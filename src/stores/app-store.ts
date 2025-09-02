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
	session: Session | null | undefined
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
				partialize: (state) => ({ appConfig: state.appConfig }), // Only persist appConfig
				onRehydrateStorage: () => (state, error) => {
					if (error) {
						logger.error("❌ Failed to rehydrate store from storage:", error);
					} else if (state) {
						logger.info("✅ Store rehydrated successfully from storage", { 
							hasConfig: !!state.appConfig,
							isAuthenticated: !!session?.user?.id
						});
					} else {
						logger.info("ℹ️ No stored state found, using initial config", {
							isAuthenticated: !!session?.user?.id
						});
					}
				},
			}
		)
	);
};
