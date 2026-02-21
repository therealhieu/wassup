"use client";

import {
	createContext,
	useContext,
	useReducer,
	useEffect,
	ReactNode,
} from "react";
import { AppConfig, AppConfigSchema } from "@/infrastructure/config.schemas";
import { DEFAULT_CONFIG } from "@/lib/constants";
import { baseLogger } from "@/lib/logger";

const STORAGE_KEY = "wassup-config";
const logger = baseLogger.getSubLogger({ name: "AppConfigProvider" });

// ── Actions ───────────────────────────────────────────────────────────────────

type Action =
	| { type: "SET_CONFIG"; payload: AppConfig }
	| { type: "SET_THEME"; payload: "light" | "dark" };

function reducer(state: AppConfig, action: Action): AppConfig {
	switch (action.type) {
		case "SET_CONFIG":
			return action.payload;
		case "SET_THEME":
			return { ...state, ui: { ...state.ui, theme: action.payload } };
	}
}

// ── localStorage helpers ──────────────────────────────────────────────────────

function loadFromStorage(): AppConfig {
	if (typeof window === "undefined") return DEFAULT_CONFIG;
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) return DEFAULT_CONFIG;
		const parsed = AppConfigSchema.safeParse(JSON.parse(raw));
		if (parsed.success) {
			logger.info("Config loaded from localStorage");
			return parsed.data;
		}
		logger.warn("Stored config failed validation — using default", parsed.error);
		return DEFAULT_CONFIG;
	} catch {
		logger.warn("Failed to read config from localStorage — using default");
		return DEFAULT_CONFIG;
	}
}

function saveToStorage(config: AppConfig): void {
	if (typeof window === "undefined") return;
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
	} catch {
		logger.warn("Failed to save config to localStorage");
	}
}

// ── Context ───────────────────────────────────────────────────────────────────

interface AppConfigContextValue {
	config: AppConfig;
	setConfig: (config: AppConfig) => void;
	setTheme: (theme: "light" | "dark") => void;
}

const AppConfigContext = createContext<AppConfigContextValue | null>(null);

export function AppConfigProvider({ children }: { children: ReactNode }) {
	const [config, dispatch] = useReducer(reducer, DEFAULT_CONFIG);

	// Hydrate from localStorage after mount (avoids SSR/client mismatch)
	useEffect(() => {
		dispatch({ type: "SET_CONFIG", payload: loadFromStorage() });
	}, []);

	useEffect(() => {
		saveToStorage(config);
	}, [config]);

	const value: AppConfigContextValue = {
		config,
		setConfig: (payload) => dispatch({ type: "SET_CONFIG", payload }),
		setTheme: (payload) => dispatch({ type: "SET_THEME", payload }),
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
