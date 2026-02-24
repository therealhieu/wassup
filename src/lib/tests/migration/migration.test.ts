import { describe, it, expect } from "vitest";
import { migrateToAppState } from "@/lib/migration";
import { SEED_PRESETS } from "@/lib/presets";

describe("migrateToAppState", () => {
	it("should return valid AppState as-is", () => {
		const validState = {
			activePresetId: "p1",
			presets: [
				{
					id: "p1",
					name: "Test",
					config: {
						ui: {
							theme: "dark",
							pages: [
								{
									title: "Home",
									path: "/",
									columns: [{ size: 12, widgets: [] }],
								},
							],
						},
					},
				},
			],
		};

		const result = migrateToAppState(validState);
		expect(result).toEqual(validState);
	});

	it("should wrap legacy AppConfig into single-preset AppState", () => {
		const legacyConfig = {
			ui: {
				theme: "light",
				pages: [
					{
						title: "Old Dashboard",
						path: "/",
						columns: [{ size: 12, widgets: [] }],
					},
				],
			},
		};

		const result = migrateToAppState(legacyConfig);
		expect(result.activePresetId).toBe("default");
		expect(result.presets).toHaveLength(1);
		expect(result.presets[0].id).toBe("default");
		expect(result.presets[0].name).toBe("My Dashboard");
		expect(result.presets[0].config).toEqual(legacyConfig);
	});

	it("should return fallback for invalid data", () => {
		const result = migrateToAppState({ garbage: true });
		expect(result.activePresetId).toBe("general-swe");
		expect(result.presets).toEqual(SEED_PRESETS);
	});

	it("should return fallback for null", () => {
		const result = migrateToAppState(null);
		expect(result.activePresetId).toBe("general-swe");
		expect(result.presets).toEqual(SEED_PRESETS);
	});

	it("should return fallback for undefined", () => {
		const result = migrateToAppState(undefined);
		expect(result.activePresetId).toBe("general-swe");
		expect(result.presets).toEqual(SEED_PRESETS);
	});
});
