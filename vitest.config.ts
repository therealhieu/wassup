import path from "node:path";
import { fileURLToPath } from "node:url";
import { configDefaults, defineConfig } from "vitest/config";
import { playwright } from "@vitest/browser-playwright";
import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";

const dirname =
	typeof __dirname !== "undefined"
		? __dirname
		: path.dirname(fileURLToPath(import.meta.url));

// More info at: https://storybook.js.org/docs/writing-tests/test-addon
export default defineConfig(() => {
	return {
		resolve: {
			alias: {
				"@": path.resolve(dirname, "./src"),
			},
		},
		test: {
			silent: false,
			projects: [
				{
					test: {
						name: "unit",
						include: ["**/*.{test,spec}.ts", "**/*.unit.test.ts"],
						exclude: [
							...configDefaults.exclude,
							"**/*.integration.test.ts",
							"**/*.e2e.test.ts",
						],
					},
				},
				{
					test: {
						name: "integration",
						include: ["**/*.integration.test.ts"],
					},
				},
				{
					test: {
						name: "e2e",
						include: ["**/*.e2e.test.ts"],
						browser: {
							enabled: true,
							headless: true,
							provider: playwright(),
							instances: [
								{
									browser: "firefox" as const,
								},
							],
						},
					},
				},
				{
					extends: true as const,
					plugins: [
						// The plugin will run tests for the stories defined in your Storybook config
						// See options at: https://storybook.js.org/docs/writing-tests/test-addon#storybooktest
						storybookTest({
							configDir: path.join(dirname, ".storybook"),
						}),
					],
					test: {
						name: "storybook",
						browser: {
							enabled: true,
							headless: true,
							provider: playwright(),
							instances: [
								{
									browser: "chromium" as const,
								},
							],
						},
						setupFiles: [".storybook/vitest.setup.ts"],
					},
				},
			],
		},
	};
});
