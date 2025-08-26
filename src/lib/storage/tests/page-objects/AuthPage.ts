import { expect } from 'vitest';
import type { Page } from 'playwright';

export class AuthPage {
  constructor(private page: Page) {}

  // Sign In Flow
  async openSignInMenu() {
    const signInButton = this.page.locator('[data-testid="sign-in-button"]');
    await expect(signInButton).toBeVisible();
    await signInButton.click();
  }

  async signInWithGoogle() {
    await this.openSignInMenu();
    const googleOption = this.page.locator('[data-testid="sign-in-google"]');
    await expect(googleOption).toBeVisible();
    await googleOption.click();
  }

  async signInWithGitHub() {
    await this.openSignInMenu();
    const githubOption = this.page.locator('[data-testid="sign-in-github"]');
    await expect(githubOption).toBeVisible();
    await githubOption.click();
  }

  // Mock authentication for testing - creates a test session
  async mockAuthentication(userData = { 
    id: 'test-user-1',
    name: 'Test User',
    email: 'test@example.com'
  }) {
    // This will be used in E2E tests to simulate authentication
    // without requiring actual OAuth flow
    await this.page.evaluate((user) => {
      // Store mock session data for testing
      window.localStorage.setItem('test-auth-session', JSON.stringify(user));
    }, userData);

    // Navigate to trigger session check
    await this.page.reload();
  }

  // Sign Out Flow  
  async openUserMenu() {
    const userProfileButton = this.page.locator('[data-testid="user-profile-button"]');
    await expect(userProfileButton).toBeVisible();
    await userProfileButton.click();
  }

  async signOut() {
    await this.openUserMenu();
    const logoutButton = this.page.locator('[data-testid="logout-button"]');
    await expect(logoutButton).toBeVisible();
    await logoutButton.click();
    
    // Wait for redirect/reload after logout
    await this.page.waitForLoadState('networkidle');
  }

  // Authentication State Checks
  async isSignedIn(): Promise<boolean> {
    const userProfileButton = this.page.locator('[data-testid="user-profile-button"]');
    return await userProfileButton.isVisible();
  }

  async isSignedOut(): Promise<boolean> {
    const signInButton = this.page.locator('[data-testid="sign-in-button"]');
    return await signInButton.isVisible();
  }

  async waitForAuthenticationChange(timeout: number = 10000): Promise<void> {
    // Wait for either sign-in or user profile to be visible
    await this.page.waitForFunction(() => {
      const signIn = document.querySelector('[data-testid="sign-in-button"]') as HTMLElement;
      const userProfile = document.querySelector('[data-testid="user-profile-button"]') as HTMLElement;
      return (signIn && signIn.offsetParent !== null) || 
             (userProfile && userProfile.offsetParent !== null);
    }, { timeout });
  }

  // Clear authentication state for testing
  async clearAuthState(): Promise<void> {
    await this.page.evaluate(() => {
      // Clear any test auth data
      localStorage.removeItem('test-auth-session');
      // Clear any NextAuth session data
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('next-auth') || key.startsWith('__Secure-next-auth')) {
          localStorage.removeItem(key);
        }
      });
    });
  }
}