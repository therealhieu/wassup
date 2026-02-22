import {
	type AppState,
	AppStateSchema,
	AppConfigSchema,
} from "@/infrastructure/config.schemas";
import { SEED_PRESETS } from "@/lib/presets";

const FALLBACK_APP_STATE: AppState = {
	activePresetId: "hieu",
	presets: SEED_PRESETS,
};

/**
 * Migrates persisted data to the current `AppState` shape.
 * Handles three cases:
 *   1. Valid `AppState` → returned as-is
 *   2. Legacy `AppConfig` (pre-presets) → wrapped into a single-preset `AppState`
 *   3. Invalid data → falls back to seed defaults
 */
export function migrateToAppState(raw: unknown): AppState {
	const asAppState = AppStateSchema.safeParse(raw);
	if (asAppState.success) return asAppState.data;

	const asConfig = AppConfigSchema.safeParse(raw);
	if (asConfig.success) {
		return {
			activePresetId: "default",
			presets: [
				{
					id: "default",
					name: "My Dashboard",
					config: asConfig.data,
				},
			],
		};
	}

	return FALLBACK_APP_STATE;
}
