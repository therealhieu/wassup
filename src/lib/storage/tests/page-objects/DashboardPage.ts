import { expect } from 'vitest';
import type { Page } from 'playwright';

export class DashboardPage {
  constructor(private page: Page) {}

  async navigateTo() {
    await this.page.goto('/');
  }

  async waitForLoad() {
    // Wait for the main page to load
    await this.page.waitForLoadState('networkidle');
  }

  // Weather Widget Interactions
  async getWeatherWidget() {
    return this.page.locator('[data-testid="weather-widget"]');
  }

  async waitForWeatherWidget() {
    await expect(this.getWeatherWidget()).toBeVisible({ timeout: 10000 });
  }

  // Configuration Management
  async openConfigEditor() {
    // Look for config editor button/link - implementation depends on UI
    const configButton = this.page.locator('[data-testid="config-editor-button"]');
    if (await configButton.isVisible()) {
      await configButton.click();
    }
  }

  async getConfigEditor() {
    return this.page.locator('[data-testid="config-editor"]');
  }

  async waitForConfigEditor() {
    await expect(this.getConfigEditor()).toBeVisible({ timeout: 10000 });
  }

  // Storage State Verification
  async getLocalStorageValue(key: string): Promise<string | null> {
    return await this.page.evaluate((storageKey) => {
      return localStorage.getItem(storageKey);
    }, key);
  }

  async setLocalStorageValue(key: string, value: string): Promise<void> {
    await this.page.evaluate(([storageKey, storageValue]) => {
      localStorage.setItem(storageKey, storageValue);
    }, [key, value]);
  }

  async clearLocalStorage(): Promise<void> {
    await this.page.evaluate(() => {
      localStorage.clear();
    });
  }

  // Page reload for testing persistence
  async reload() {
    await this.page.reload();
    await this.waitForLoad();
  }

  // Check if user is authenticated (presence of user profile)
  async isAuthenticated(): Promise<boolean> {
    const userProfile = this.page.locator('[data-testid="user-profile-button"]');
    return await userProfile.isVisible();
  }

  // Check if sign-in button is visible (user not authenticated)
  async hasSignInButton(): Promise<boolean> {
    const signInButton = this.page.locator('[data-testid="sign-in-button"]');
    return await signInButton.isVisible();
  }

  // Utility for waiting for storage operations to complete
  async waitForStorageOperation(timeout: number = 5000): Promise<void> {
    await this.page.waitForTimeout(timeout);
  }
}