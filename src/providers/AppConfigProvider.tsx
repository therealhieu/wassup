"use client";

import {
	createContext,
	useContext,
	useReducer,
	useEffect,
	useRef,
	useCallback,
	type ReactNode,
} from "react";
import { useSession } from "next-auth/react";
import { useDebouncedCallback } from "use-debounce";
import type { AppConfig, AppState, Preset } from "@/infrastructure/config.schemas";
import { DEFAULT_APP_STATE } from "@/lib/constants";
import { BLANK_CONFIG } from "@/lib/presets";
import { migrateToAppState } from "@/lib/migration";
import { baseLogger } from "@/lib/logger";

const STORAGE_KEY_ANONYMOUS = "wassup-state";
const STORAGE_KEY_PREFIX = "wassup-state-";
const LEGACY_STORAGE_KEY_ANONYMOUS = "wassup-config";
const LEGACY_STORAGE_KEY_PREFIX = "wassup-config-";
const logger = baseLogger.getSubLogger({ name: "AppConfigProvider" });

// ── Storage helpers ──────────────────────────────────────────────────────────

export function storageKey(userId: string | null): string {
	return userId ? `${STORAGE_KEY_PREFIX}${userId}` : STORAGE_KEY_ANONYMOUS;
}

function legacyStorageKey(userId: string | null): string {
	return userId
		? `${LEGACY_STORAGE_KEY_PREFIX}${userId}`
		: LEGACY_STORAGE_KEY_ANONYMOUS;
}

export function loadFromStorage(userId: string | null): AppState {
	if (typeof window === "undefined") return DEFAULT_APP_STATE;
	try {
		// Try new key first
		let raw = localStorage.getItem(storageKey(userId));

		// Fallback: try legacy key for migration
		if (!raw) {
			const legacy = legacyStorageKey(userId);
			raw = localStorage.getItem(legacy);
			if (raw) {
				const migrated = migrateToAppState(JSON.parse(raw));
				saveToStorage(userId, migrated);
				localStorage.removeItem(legacy);
				return migrated;
			}
			return DEFAULT_APP_STATE;
		}

		return migrateToAppState(JSON.parse(raw));
	} catch {
		logger.warn("Failed to read state from localStorage — using default");
		return DEFAULT_APP_STATE;
	}
}

export function saveToStorage(
	userId: string | null,
	state: AppState,
): void {
	if (typeof window === "undefined") return;
	try {
		localStorage.setItem(storageKey(userId), JSON.stringify(state));
	} catch {
		logger.warn("Failed to save state to localStorage");
	}
}

// ── Reducer ──────────────────────────────────────────────────────────────────

type Action =
	| { type: "SET_STATE"; payload: AppState }
	| { type: "SET_CONFIG"; payload: AppConfig }
	| { type: "SET_THEME"; payload: "light" | "dark" }
	| { type: "SET_ACTIVE_PRESET"; payload: string }
	| {
		type: "UPDATE_PRESET";
		payload: { id: string; name?: string; config?: AppConfig };
	}
	| { type: "CREATE_PRESET"; payload: Preset }
	| { type: "DELETE_PRESET"; payload: string };

function reducer(state: AppState, action: Action): AppState {
	switch (action.type) {
		case "SET_STATE":
			return action.payload;

		case "SET_CONFIG":
			return {
				...state,
				presets: state.presets.map((p) =>
					p.id === state.activePresetId
						? { ...p, config: action.payload }
						: p,
				),
			};

		case "SET_THEME":
			return {
				...state,
				presets: state.presets.map((p) =>
					p.id === state.activePresetId
						? {
							...p,
							config: {
								...p.config,
								ui: { ...p.config.ui, theme: action.payload },
							},
						}
						: p,
				),
			};

		case "SET_ACTIVE_PRESET":
			return { ...state, activePresetId: action.payload };

		case "UPDATE_PRESET":
			return {
				...state,
				presets: state.presets.map((p) =>
					p.id === action.payload.id
						? {
							...p,
							...(action.payload.name !== undefined && {
								name: action.payload.name,
							}),
							...(action.payload.config !== undefined && {
								config: action.payload.config,
							}),
						}
						: p,
				),
			};

		case "CREATE_PRESET":
			return {
				...state,
				activePresetId: action.payload.id,
				presets: [...state.presets, action.payload],
			};

		case "DELETE_PRESET": {
			const remaining = state.presets.filter(
				(p) => p.id !== action.payload,
			);
			return {
				...state,
				presets: remaining,
				activePresetId:
					state.activePresetId === action.payload
						? remaining[0].id
						: state.activePresetId,
			};
		}
	}
}

// ── Context ──────────────────────────────────────────────────────────────────

interface AppConfigContextValue {
	// Backward-compatible — derived from active preset
	config: AppConfig;
	setConfig: (config: AppConfig) => void;
	setTheme: (theme: "light" | "dark") => void;

	// Preset management
	presets: Preset[];
	activePresetId: string;
	setActivePresetId: (id: string) => void;
	updatePreset: (
		id: string,
		patch: { name?: string; config?: AppConfig },
	) => void;
	createPreset: () => void;
	deletePreset: (id: string) => void;
}

const AppConfigContext = createContext<AppConfigContextValue | null>(null);

export function AppConfigProvider({ children }: { children: ReactNode }) {
	const { data: session, status } = useSession();
	const userId = session?.user?.id ?? null;
	const isAuthenticated = status === "authenticated" && userId !== null;
	const [state, dispatch] = useReducer(reducer, DEFAULT_APP_STATE);
	const isHydrated = useRef(false);

	// Derived: active preset's config
	const activePreset = state.presets.find(
		(p) => p.id === state.activePresetId,
	);
	const config = activePreset?.config ?? state.presets[0].config;

	// Debounced server sync (authenticated only)
	const syncToServer = useDebouncedCallback(
		async (appState: AppState) => {
			try {
				await fetch("/api/config", {
					method: "PUT",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ state: appState }),
				});
			} catch (err) {
				logger.error("Failed to sync state to server", err);
			}
		},
		1000,
	);

	// Hydration: localStorage first (instant), then server reconciliation if authed
	useEffect(() => {
		if (status === "loading") return;

		const local = loadFromStorage(userId);
		dispatch({ type: "SET_STATE", payload: local });

		if (isAuthenticated) {
			fetch("/api/config")
				.then((res) => res.json())
				.then(({ state: serverState }) => {
					if (serverState) {
						const migrated = migrateToAppState(serverState);
						dispatch({ type: "SET_STATE", payload: migrated });
						saveToStorage(userId, migrated);
					}
				})
				.catch(() => {
					/* server unavailable — localStorage is fine */
				})
				.finally(() => {
					isHydrated.current = true;
				});
		} else {
			isHydrated.current = true;
		}
	}, [status, userId, isAuthenticated]);

	// Write-through: localStorage (always) + server (if authed)
	useEffect(() => {
		if (!isHydrated.current) return;
		saveToStorage(userId, state);
		if (isAuthenticated) syncToServer(state);
	}, [state, userId, isAuthenticated, syncToServer]);

	// Stable callbacks
	const setConfig = useCallback(
		(payload: AppConfig) =>
			dispatch({ type: "SET_CONFIG", payload }),
		[],
	);

	const setTheme = useCallback(
		(payload: "light" | "dark") =>
			dispatch({ type: "SET_THEME", payload }),
		[],
	);

	const setActivePresetId = useCallback(
		(id: string) =>
			dispatch({ type: "SET_ACTIVE_PRESET", payload: id }),
		[],
	);

	const updatePreset = useCallback(
		(id: string, patch: { name?: string; config?: AppConfig }) =>
			dispatch({ type: "UPDATE_PRESET", payload: { id, ...patch } }),
		[],
	);

	const createPreset = useCallback(() => {
		const newPreset: Preset = {
			id: crypto.randomUUID(),
			name: "New Preset",
			config: BLANK_CONFIG,
		};
		dispatch({ type: "CREATE_PRESET", payload: newPreset });
	}, []);

	const deletePreset = useCallback(
		(id: string) => dispatch({ type: "DELETE_PRESET", payload: id }),
		[],
	);

	const value: AppConfigContextValue = {
		config,
		setConfig,
		setTheme,
		presets: state.presets,
		activePresetId: state.activePresetId,
		setActivePresetId,
		updatePreset,
		createPreset,
		deletePreset,
	};

	return (
		<AppConfigContext.Provider value={value}>
			{children}
		</AppConfigContext.Provider>
	);
}

export function useAppConfig(): AppConfigContextValue {
	const ctx = useContext(AppConfigContext);
	if (!ctx) {
		throw new Error("useAppConfig must be used within AppConfigProvider");
	}
	return ctx;
}
