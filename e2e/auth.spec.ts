import { test, expect } from "./fixtures/auth";

test.describe("Authentication & Access Control", () => {
	test("unauthenticated user sees sign-in button", async ({ page }) => {
		await page.goto("/");
		await expect(page.getByTestId("sign-in")).toBeVisible();
	});

	test("unauthenticated user sees dashboard without edit controls", async ({
		page,
	}) => {
		await page.goto("/");
		await expect(page).toHaveURL("/");
		await expect(page.getByTestId("edit-mode-toggle")).not.toBeVisible();
		await expect(page.getByTestId("preset-selector")).not.toBeVisible();
	});

	test("authenticated user sees dashboard with controls", async ({
		authenticatedPage: page,
	}) => {
		await expect(page).toHaveURL("/");
		await expect(page.getByTestId("preset-selector")).toBeVisible();
		await expect(page.getByTestId("edit-mode-toggle")).toBeVisible();
	});
});
