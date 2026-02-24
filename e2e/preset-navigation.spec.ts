import { test, expect } from "./fixtures/auth";
import type { Locator } from "@playwright/test";

/** Extract preset name from a sortable menu item via the dedicated test id. */
async function getPresetName(item: Locator): Promise<string> {
	return (await item.getByTestId("preset-name").innerText()).trim();
}

test.describe("Preset Navigation", () => {
	test("shows active preset name in selector", async ({
		authenticatedPage: page,
	}) => {
		const selector = page.getByTestId("preset-selector");
		await expect(selector).toBeVisible();
		// Selector should display a preset name (not "Select Preset")
		await expect(selector).not.toHaveText("Select Preset");
	});

	test("opens preset menu on click", async ({ authenticatedPage: page }) => {
		await page.getByTestId("preset-selector").click();
		await expect(page.getByRole("menu")).toBeVisible();
	});

	test("switches preset and updates selector label", async ({
		authenticatedPage: page,
	}) => {
		await page.getByTestId("preset-selector").click();
		const menu = page.getByRole("menu");
		const items = menu.getByRole("menuitem");
		const count = await items.count();
		expect(count).toBeGreaterThan(1);

		const secondName = await getPresetName(items.nth(1));
		await items.nth(1).click();
		await expect(page.getByTestId("preset-selector")).toContainText(
			secondName,
		);
	});

	test("menu closes after selecting a preset", async ({
		authenticatedPage: page,
	}) => {
		await page.getByTestId("preset-selector").click();
		const menu = page.getByRole("menu");
		await expect(menu).toBeVisible();
		await menu.getByRole("menuitem").first().click();
		await expect(menu).not.toBeVisible();
	});

	test("can create a new preset", async ({ authenticatedPage: page }) => {
		await page.getByTestId("preset-selector").click();
		await page.getByRole("menuitem", { name: /new preset/i }).click();
		await expect(page.getByTestId("preset-selector")).toContainText(
			"New Preset",
		);
	});

	test("preset switch persists across reload", async ({
		authenticatedPage: page,
	}) => {
		await page.getByTestId("preset-selector").click();
		const items = page.getByRole("menu").getByRole("menuitem");
		const count = await items.count();
		expect(count).toBeGreaterThan(1);

		const secondName = await getPresetName(items.nth(1));
		await items.nth(1).click();

		await expect(page.getByTestId("preset-selector")).toContainText(
			secondName,
		);

		// Reload to verify persistence
		await page.reload();
		await page.getByTestId("preset-selector").waitFor({ state: "visible" });
		await expect(page.getByTestId("preset-selector")).toContainText(
			secondName,
		);
	});

	// TODO: force-clicking delete icon inside sortable menu item is unreliable in Playwright
	test.fixme("can delete a preset with confirmation", async ({
		authenticatedPage: page,
	}) => {
		// First create a preset to delete
		await page.getByTestId("preset-selector").click();
		await page.getByRole("menuitem", { name: /new preset/i }).click();
		await expect(page.getByTestId("preset-selector")).toContainText(
			"New Preset",
		);

		// Open menu and find the delete button for "New Preset"
		await page.getByTestId("preset-selector").click();
		const menu = page.getByRole("menu");

		// Use force:true to bypass sortable element stability checks
		const deleteButtons = menu.locator("button:has(svg[data-testid='DeleteOutlineIcon'])");
		if ((await deleteButtons.count()) > 0) {
			await deleteButtons.last().click({ force: true });
			// Confirm the delete dialog
			const dialog = page.getByRole("dialog");
			await expect(dialog).toBeVisible();
			await dialog.getByRole("button", { name: /delete/i }).click();
			// Preset should be gone
			await expect(page.getByTestId("preset-selector")).not.toContainText(
				"New Preset",
			);
		}
	});
});
