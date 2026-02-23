import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import storybook from "eslint-plugin-storybook";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...storybook.configs["flat/recommended"],
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "storybook-static/**",
    ".storybook/out/**",
    "dist/**",
    "coverage/**",
    ".turbo/**",
    "**/*.d.ts",
    "bun.lock",
    ".playwright/**",
    "public/**/*.worker.js",
    "src/generated/**",
  ]),
]);

export default eslintConfig;
