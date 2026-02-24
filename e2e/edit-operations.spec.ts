import { test, expect } from "./fixtures/auth";

test.describe("Edit Operations", () => {
	test("enter edit mode shows save and cancel", async ({
		authenticatedPage: page,
	}) => {
		await page.getByTestId("edit-mode-toggle").click();
		await expect(page.getByTestId("edit-save")).toBeVisible();
		await expect(page.getByTestId("edit-cancel")).toBeVisible();
		await expect(page.getByTestId("edit-mode-toggle")).not.toBeVisible();
	});

	test("exit via save restores edit button", async ({
		authenticatedPage: page,
	}) => {
		await page.getByTestId("edit-mode-toggle").click();
		await page.getByTestId("edit-save").click();
		await expect(page.getByTestId("edit-mode-toggle")).toBeVisible();
		await expect(page.getByTestId("edit-save")).not.toBeVisible();
	});

	test("exit via cancel restores edit button", async ({
		authenticatedPage: page,
	}) => {
		await page.getByTestId("edit-mode-toggle").click();
		await page.getByTestId("edit-cancel").click();
		await expect(page.getByTestId("edit-mode-toggle")).toBeVisible();
		await expect(page.getByTestId("edit-cancel")).not.toBeVisible();
	});

	test("cancel discards changes", async ({ authenticatedPage: page }) => {
		// Enter edit mode
		await page.getByTestId("edit-mode-toggle").click();
		const tabsBefore = await page
			.locator("[data-testid^='page-tab-']")
			.count();

		// Add a page
		await page.getByTestId("add-page").click();
		await expect(page.locator("[data-testid^='page-tab-']")).toHaveCount(
			tabsBefore + 1,
		);

		// Cancel
		await page.getByTestId("edit-cancel").click();

		// Re-enter edit mode — change should be gone
		await page.getByTestId("edit-mode-toggle").click();
		await expect(page.locator("[data-testid^='page-tab-']")).toHaveCount(
			tabsBefore,
		);
	});

	// TODO: Test credentials auth doesn't create DB users, so server sync overwrites client state
	test.fixme("save persists changes", async ({ authenticatedPage: page }) => {
		// Enter edit mode
		await page.getByTestId("edit-mode-toggle").click();
		const tabsBefore = await page
			.locator("[data-testid^='page-tab-']")
			.count();

		// Add a page
		await page.getByTestId("add-page").click();
		await expect(page.locator("[data-testid^='page-tab-']")).toHaveCount(
			tabsBefore + 1,
		);

		// Save and wait for the edit button to reappear (confirms save completed)
		await page.getByTestId("edit-save").click();
		await expect(page.getByTestId("edit-mode-toggle")).toBeVisible();

		// Re-enter edit mode — change should persist
		await page.getByTestId("edit-mode-toggle").click();
		await expect(page.getByTestId("edit-save")).toBeVisible();
		await expect(page.locator("[data-testid^='page-tab-']")).toHaveCount(
			tabsBefore + 1,
		);
	});

	test("edit mode shows column layout editor", async ({
		authenticatedPage: page,
	}) => {
		await page.getByTestId("edit-mode-toggle").click();
		await expect(page.getByTestId("column-layout-editor")).toBeVisible();
	});
});
