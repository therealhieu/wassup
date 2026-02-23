import { test as base, expect, type Page } from "@playwright/test";

/**
 * Sign in via the test-only Credentials provider.
 * Only works when NODE_ENV=test (set by playwright.config.ts webServer command).
 */
async function signInAsTestUser(page: Page) {
	const response = await page.request.post(
		"/api/auth/callback/test-credentials",
		{
			form: {
				userId: "test-user-id",
				email: "test@example.com",
				name: "Test User",
				csrfToken: await getCsrfToken(page),
			},
		}
	);

	if (!response.ok()) {
		throw new Error(
			`Failed to sign in: ${response.status()} ${await response.text()}`
		);
	}
}

async function getCsrfToken(page: Page): Promise<string> {
	const res = await page.request.get("/api/auth/csrf");
	const json = await res.json();
	return json.csrfToken as string;
}

// Extended test fixture with pre-authenticated page
export const test = base.extend<{ authenticatedPage: Page }>({
	authenticatedPage: async ({ page }, use) => {
		await page.goto("/");
		await signInAsTestUser(page);
		await page.goto("/");
		await use(page);
	},
});

export { expect };
