// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from "vitest";
import {
	storageKey,
	loadFromStorage,
	saveToStorage,
} from "@/providers/AppConfigProvider";
import { DEFAULT_APP_STATE } from "@/lib/constants";
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
		expect(state.presets).toHaveLength(1);
		expect(state.presets[0].name).toBe("My Dashboard");
		expect(state.presets[0].config.ui.pages[0].title).toBe("Legacy");

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
