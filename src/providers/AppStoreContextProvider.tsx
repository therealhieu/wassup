"use client";

import { createAppStore } from "@/stores/app-store";
import { AppStore, AppStoreInitialState } from "@/stores/app-store.schemas";
import { Session } from "next-auth";
import {
	createContext,
	useContext,
	useRef,
	useEffect,
	useState,
	useMemo,
} from "react";
import { useStore } from "zustand";
import { migrateUserData } from "@/lib/storage";

export type AppStoreApi = ReturnType<typeof createAppStore>;
export const AppStoreContext = createContext<AppStoreApi | null>(null);

export interface AppStoreProviderProps {
	children: React.ReactNode;
	initialState: AppStoreInitialState;
	session: Session | null;
}

export const AppStoreContextProvider = ({
	children,
	initialState,
	session,
}: AppStoreProviderProps) => {
	const sessionRef = useRef<Session | null>(session);
	const [migrationComplete, setMigrationComplete] = useState(false);

	// Create store using useMemo to avoid hooks rule violation
	// Only recreate store when user ID changes, not on every session object change
	const store = useMemo(() => {
		console.log("🏗️ Creating store with session:", !!session);
		// When creating the store, the persist middleware will attempt to rehydrate
		// from the appropriate storage (Supabase for logged-in users)
		return createAppStore(initialState, session);
	}, [initialState, session?.user?.id]); // Only recreate when user ID changes

	// Handle user data migration in a separate effect
	useEffect(() => {
		const handleMigration = async () => {
			const hadUserId = !!sessionRef.current?.user?.id;
			const hasUserId = !!session?.user?.id;

			console.log("🔍 Migration check:", {
				hadUserId,
				hasUserId,
				userId: session?.user?.id,
			});

			// If user just logged in (didn't have userId, now has one)
			if (!hadUserId && hasUserId && session?.user?.id) {
				console.log("🔄 User logged in, migrating data...");
				try {
					await migrateUserData(session.user.id);
					console.log("✅ Migration completed");
				} catch (error) {
					console.error("❌ Migration failed:", error);
				}
			}

			sessionRef.current = session;
			setMigrationComplete(true);
		};

		handleMigration();
	}, [session?.user?.id]); // Only run migration when user ID changes

	// Show loading state while migration is in progress
	if (!migrationComplete) {
		return (
			<AppStoreContext.Provider value={null}>
				<div>Loading store...</div>
			</AppStoreContext.Provider>
		);
	}

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
