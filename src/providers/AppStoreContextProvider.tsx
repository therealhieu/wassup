"use client";

import { createAppStore } from "@/stores/app-store";
import { AppStore, AppStoreInitialState } from "@/stores/app-store.schemas";
import { createContext, useContext, useMemo } from "react";
import { useStore } from "zustand";

export type AppStoreApi = ReturnType<typeof createAppStore>;
export const AppStoreContext = createContext<AppStoreApi | null>(null);

export interface AppStoreProviderProps {
	children: React.ReactNode;
	initialState: AppStoreInitialState;
}

export const AppStoreContextProvider = ({
	children,
	initialState,
}: AppStoreProviderProps) => {
	// Create the store once; keep storage local-only regardless of session
	const store = useMemo(() => {
    return createAppStore(initialState, undefined);
	}, [initialState]);

	return (
		<AppStoreContext.Provider value={store}>
			{children}
		</AppStoreContext.Provider>
	);
};

export const useAppStore = <T,>(selector: (store: AppStore) => T) => {
	const ctx = useContext(AppStoreContext);

	if (!ctx) {
		throw new Error(
			"useAppStore must be used within a AppStoreContextProvider",
		);
	}

	return useStore(ctx, selector);
};
