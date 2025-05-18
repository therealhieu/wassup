import { create } from "zustand";
import { createAppConfigSlice } from "./slices/app-config-slice";
import { AppStore, AppStoreInitialState } from "./app-store.schemas";
import { persist, createJSONStorage, StateStorage } from "zustand/middleware";
import { Session } from "next-auth";

export const remoteStorage: StateStorage = {
	getItem: async (name: string): Promise<string | null> => {
		console.log(name, "has been retrieved");
		throw new Error("Not implemented");
	},
	setItem: async (name: string, value: string): Promise<void> => {
		console.log(name, "with value", value, "has been saved");
		throw new Error("Not implemented");
	},
	removeItem: async (name: string): Promise<void> => {
		console.log(name, "has been deleted");
		throw new Error("Not implemented");
	},
};

export const STORAGE_NAME = "app-store-storage";

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
				storage: createJSONStorage(() =>
					session ? remoteStorage : localStorage
				),
				onRehydrateStorage: () => (state) => {
					console.log("rehydrated", state);
				},
			}
		)
	);
};
