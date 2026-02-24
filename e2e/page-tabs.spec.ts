import { test, expect } from "./fixtures/auth";
import type { Page } from "@playwright/test";

async function enterEditMode(page: Page) {
	await page.getByTestId("edit-mode-toggle").click();
	await expect(page.getByTestId("edit-save")).toBeVisible();
}

test.describe("Page Tab Navigation", () => {
	test("shows page tabs in edit mode", async ({
		authenticatedPage: page,
	}) => {
		await enterEditMode(page);
		const tabs = page.locator("[data-testid^='page-tab-']");
		await expect(tabs.first()).toBeVisible();
	});

	test("clicking a tab switches active page", async ({
		authenticatedPage: page,
	}) => {
		await enterEditMode(page);
		const tabs = page.locator("[data-testid^='page-tab-']");
		const count = await tabs.count();
		expect(count).toBeGreaterThan(1);

		// Click second tab
		await tabs.nth(1).click();
		// Verify it's visually active via the data-active attribute
		await expect(tabs.nth(1)).toHaveAttribute("data-active", "true");
		await expect(tabs.nth(0)).toHaveAttribute("data-active", "false");
	});

	test("can add a new page tab", async ({ authenticatedPage: page }) => {
		await enterEditMode(page);
		const tabsBefore = page.locator("[data-testid^='page-tab-']");
		const countBefore = await tabsBefore.count();

		await page.getByTestId("add-page").click();

		const tabsAfter = page.locator("[data-testid^='page-tab-']");
		await expect(tabsAfter).toHaveCount(countBefore + 1);
	});

	test("can delete a page tab", async ({ authenticatedPage: page }) => {
		await enterEditMode(page);

		// First add a page so we have > 1
		await page.getByTestId("add-page").click();
		const tabsAfterAdd = page.locator("[data-testid^='page-tab-']");
		const countAfterAdd = await tabsAfterAdd.count();
		expect(countAfterAdd).toBeGreaterThan(1);

		// Click the close/delete button on the last tab
		const lastTab = tabsAfterAdd.last();
		const closeButton = lastTab.locator("button");
		await closeButton.click();

		await expect(page.locator("[data-testid^='page-tab-']")).toHaveCount(
			countAfterAdd - 1,
		);
	});

	test("rename tab via double-click", async ({
		authenticatedPage: page,
	}) => {
		await enterEditMode(page);
		// Target the Typography text inside the tab, not the sortable wrapper
		const tabText = page.locator("[data-testid^='page-tab-'] .MuiTypography-root").first();
		await tabText.dblclick();

		// Wait for the rename TextField to appear
		const input = page.getByRole("textbox").first();
		await expect(input).toBeVisible({ timeout: 3000 });
		await input.clear();
		await input.fill("Renamed Tab");
		await input.press("Enter");

		await expect(
			page.locator("[data-testid^='page-tab-']").first(),
		).toContainText("Renamed Tab");
	});

	test("tab state resets on cancel", async ({ authenticatedPage: page }) => {
		await enterEditMode(page);
		const countBefore = await page
			.locator("[data-testid^='page-tab-']")
			.count();

		await page.getByTestId("add-page").click();
		await expect(page.locator("[data-testid^='page-tab-']")).toHaveCount(
			countBefore + 1,
		);

		// Cancel should revert
		await page.getByTestId("edit-cancel").click();

		// Re-enter edit mode to check tabs
		await page.getByTestId("edit-mode-toggle").click();
		await expect(page.locator("[data-testid^='page-tab-']")).toHaveCount(
			countBefore,
		);
	});
});
