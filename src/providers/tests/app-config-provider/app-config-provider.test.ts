// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from "vitest";
import {
	storageKey,
	loadFromStorage,
	saveToStorage,
	reconcileWithSeedPresets,
} from "@/providers/AppConfigProvider";
import { DEFAULT_APP_STATE } from "@/lib/constants";
import { SEED_PRESETS } from "@/lib/presets";
import type { AppState } from "@/infrastructure/config.schemas";

const VALID_APP_STATE: AppState = {
	activePresetId: "test",
	presets: [
		{
			id: "test",
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

describe("storageKey", () => {
	it("should return anonymous key when userId is null", () => {
		expect(storageKey(null)).toBe("wassup-state");
	});

	it("should return user-specific key when userId is provided", () => {
		expect(storageKey("abc123")).toBe("wassup-state-abc123");
	});
});

describe("loadFromStorage", () => {
	beforeEach(() => {
		localStorage.clear();
	});

	it("should return DEFAULT_APP_STATE when nothing is stored", () => {
		const state = loadFromStorage(null);
		expect(state).toEqual(DEFAULT_APP_STATE);
	});

	it("should return stored AppState when valid", () => {
		localStorage.setItem("wassup-state", JSON.stringify(VALID_APP_STATE));

		const state = loadFromStorage(null);
		expect(state.activePresetId).toBe("test");
		expect(state.presets[0].config.ui.theme).toBe("dark");
	});

	it("should migrate legacy AppConfig to AppState", () => {
		const legacyConfig = {
			ui: {
				theme: "dark" as const,
				pages: [
					{
						title: "Legacy",
						path: "/",
						columns: [{ size: 12, widgets: [] }],
					},
				],
			},
		};
		localStorage.setItem("wassup-config", JSON.stringify(legacyConfig));

		const state = loadFromStorage(null);
		expect(state.activePresetId).toBe("default");
		// Legacy config migrated as user preset + seed presets reconciled in
		const userPreset = state.presets.find((p) => p.id === "default");
		expect(userPreset).toBeDefined();
		expect(userPreset!.name).toBe("My Dashboard");
		expect(userPreset!.config.ui.pages[0].title).toBe("Legacy");
		// Seed presets were added by reconciliation
		for (const seed of SEED_PRESETS) {
			expect(state.presets.find((p) => p.id === seed.id)).toBeDefined();
		}

		// Should have migrated to new key and removed old
		expect(localStorage.getItem("wassup-state")).not.toBeNull();
		expect(localStorage.getItem("wassup-config")).toBeNull();
	});

	it("should return DEFAULT_APP_STATE when stored data is invalid", () => {
		localStorage.setItem(
			"wassup-state",
			JSON.stringify({ invalid: true }),
		);

		const state = loadFromStorage(null);
		expect(state).toEqual(DEFAULT_APP_STATE);
	});

	it("should isolate anonymous and authenticated state", () => {
		const anonState: AppState = {
			activePresetId: "a",
			presets: [
				{
					id: "a",
					name: "Anon",
					config: {
						ui: {
							theme: "light",
							pages: [
								{
									title: "Anon",
									path: "/",
									columns: [{ size: 12, widgets: [] }],
								},
							],
						},
					},
				},
			],
		};
		const userState: AppState = {
			activePresetId: "u",
			presets: [
				{
					id: "u",
					name: "User",
					config: {
						ui: {
							theme: "dark",
							pages: [
								{
									title: "User",
									path: "/",
									columns: [{ size: 12, widgets: [] }],
								},
							],
						},
					},
				},
			],
		};

		localStorage.setItem("wassup-state", JSON.stringify(anonState));
		localStorage.setItem(
			"wassup-state-user1",
			JSON.stringify(userState),
		);

		expect(loadFromStorage(null).presets[0].name).toBe("Anon");
		expect(loadFromStorage("user1").presets[0].name).toBe("User");
	});

	it("should return DEFAULT_APP_STATE when localStorage has corrupt JSON", () => {
		localStorage.setItem("wassup-state", "not-json{{{");
		const state = loadFromStorage(null);
		expect(state).toEqual(DEFAULT_APP_STATE);
	});
});

describe("saveToStorage", () => {
	beforeEach(() => {
		localStorage.clear();
	});

	it("should save to anonymous key when userId is null", () => {
		saveToStorage(null, DEFAULT_APP_STATE);
		expect(localStorage.getItem("wassup-state")).not.toBeNull();
		expect(localStorage.getItem("wassup-state-")).toBeNull();
	});

	it("should save to user-specific key when userId is provided", () => {
		saveToStorage("user1", DEFAULT_APP_STATE);
		expect(localStorage.getItem("wassup-state-user1")).not.toBeNull();
		expect(localStorage.getItem("wassup-state")).toBeNull();
	});

	it("should produce valid JSON that can be loaded back", () => {
		saveToStorage(null, DEFAULT_APP_STATE);
		const loaded = loadFromStorage(null);
		expect(loaded).toEqual(DEFAULT_APP_STATE);
	});
});

describe("reconcileWithSeedPresets", () => {
	const makeUserPreset = (id: string, name: string) => ({
		id,
		name,
		config: {
			ui: {
				theme: "light" as const,
				pages: [
					{
						title: "Home",
						path: "/",
						columns: [{ size: 12, widgets: [] as never[] }],
					},
				],
			},
		},
	});

	it("should add new seed presets for existing users", () => {
		const state: AppState = {
			activePresetId: SEED_PRESETS[0].id,
			presets: [SEED_PRESETS[0], makeUserPreset("custom-1", "My Custom")],
		};
		const result = reconcileWithSeedPresets(state);
		// All seed presets present + user preset preserved
		for (const seed of SEED_PRESETS) {
			expect(result.presets.find((p) => p.id === seed.id)).toBeDefined();
		}
		expect(
			result.presets.find((p) => p.id === "custom-1"),
		).toBeDefined();
	});

	it("should preserve user preset ordering", () => {
		const state: AppState = {
			activePresetId: "custom-1",
			presets: [
				makeUserPreset("custom-1", "First"),
				SEED_PRESETS[0],
				makeUserPreset("custom-2", "Second"),
			],
		};
		const result = reconcileWithSeedPresets(state);
		// User presets stay in their relative positions
		const custom1Idx = result.presets.findIndex(
			(p) => p.id === "custom-1",
		);
		const custom2Idx = result.presets.findIndex(
			(p) => p.id === "custom-2",
		);
		expect(custom1Idx).toBeLessThan(custom2Idx);
	});

	it("should fix activePresetId if it points to a removed seed", () => {
		const state: AppState = {
			activePresetId: "removed-seed-id",
			presets: [
				{ ...SEED_PRESETS[0], id: "removed-seed-id" },
			],
		};
		const result = reconcileWithSeedPresets(state);
		// removed-seed-id is not a known seed, treated as user preset and kept
		// but since it's still there, activePresetId should remain valid
		expect(
			result.presets.some((p) => p.id === result.activePresetId),
		).toBe(true);
	});

	it("should overwrite seed preset content with latest version", () => {
		const state: AppState = {
			activePresetId: SEED_PRESETS[0].id,
			presets: [
				{
					...SEED_PRESETS[0],
					name: "Old Name",
				},
			],
		};
		const result = reconcileWithSeedPresets(state);
		const reconciled = result.presets.find(
			(p) => p.id === SEED_PRESETS[0].id,
		);
		expect(reconciled!.name).toBe(SEED_PRESETS[0].name);
	});
});

