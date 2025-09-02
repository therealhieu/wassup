import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";
import { storybookTest } from "@storybook/experimental-addon-test/vitest-plugin";
const dirname =
	typeof __dirname !== "undefined"
		? __dirname
		: path.dirname(fileURLToPath(import.meta.url));

// More info at: https://storybook.js.org/docs/writing-tests/test-addon
export default defineConfig(({ mode }) => {
    return {
  resolve: {
    alias: {
      "@": path.resolve(dirname, "./src"),
    },
    },
    define: {},
	test: {
		silent: false,
		projects: [
			{
				test: {
					name: "unit",
					include: ["**/*.{test,spec}.ts", "**/*.unit.test.ts"],
					exclude: ["**/*.integration.test.ts", "**/*.e2e.test.ts"],
				},
        define: {},
			},
			{
				test: {
					name: "integration",
					include: ["**/*.integration.test.ts"],
				},
        define: {},
			},
			{
				test: {
					name: "e2e",
					include: ["**/*.e2e.test.ts"],
					browser: {
						enabled: true,
						headless: true,
						provider: "playwright",
						instances: [
							{
								browser: "firefox",
							},
						],
					},
				},
        define: {},
			},
			{
				extends: true,
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
						provider: "playwright",
						instances: [
							{
								browser: "chromium",
							},
						],
					},
					setupFiles: [".storybook/vitest.setup.ts"],
				},
        define: {},
			},
		],
	},
	};
});
