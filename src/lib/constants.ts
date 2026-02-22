import {
	type AppConfig,
	type AppState,
	AppConfigSchema,
} from "@/infrastructure/config.schemas";
import { SEED_PRESETS } from "./presets";
import zodToJsonSchema from "zod-to-json-schema";

export const THEME_OPTIONS = ["light", "dark"] as const;

export const DEFAULT_APP_STATE: AppState = {
	activePresetId: "general-swe",
	presets: SEED_PRESETS,
};

// Backward compat — consumers that only need the active config
export const DEFAULT_CONFIG: AppConfig =
	DEFAULT_APP_STATE.presets[0].config;

export const APP_CONFIG_JSONSCHEMA = zodToJsonSchema(AppConfigSchema);

