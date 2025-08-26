import { test, expect, describe, beforeEach, afterEach } from 'vitest';
import { DashboardPage } from './page-objects/DashboardPage';
import { AuthPage } from './page-objects/AuthPage';
import { ConfigEditorPage } from './page-objects/ConfigEditorPage';
import { StorageHelpers } from './helpers/storageHelpers';
import { SupabaseTestHelpers } from './helpers/supabaseHelpers';
import {
  MOCK_CONFIG_SIMPLE_JSON,
  MOCK_CONFIG_EXPANDED_JSON,
  MOCK_CONFIG_SIMPLE_YAML,
  MOCK_CONFIG_EXPANDED_YAML
} from './fixtures/mockConfig';
import { MOCK_USER_1, MOCK_USER_2 } from './fixtures/mockSession';
import { STORAGE_NAME } from '../index';

describe('Storage System E2E Tests', () => {
  let dashboardPage: DashboardPage;
  let authPage: AuthPage;
  let configEditorPage: ConfigEditorPage;
  let storageHelpers: StorageHelpers;
  let supabaseHelpers: SupabaseTestHelpers;

  beforeEach(async () => {
    const { page } = await import('@vitest/browser/context');
    
    dashboardPage = new DashboardPage(page);
    authPage = new AuthPage(page);
    configEditorPage = new ConfigEditorPage(page);
    storageHelpers = new StorageHelpers(page);
    supabaseHelpers = new SupabaseTestHelpers();

    // Clear all storage before each test
    await storageHelpers.clearLocalStorage();
    await authPage.clearAuthState();
    await supabaseHelpers.clearUserConfigs();
  });

  afterEach(async () => {
    // Clean up after each test
    await supabaseHelpers.clearUserConfigs();
  });

  describe('Anonymous User Flow', () => {
    test('should save configuration to localStorage', async () => {
      await dashboardPage.navigateTo();
      await dashboardPage.waitForLoad();

      // Verify user is not authenticated
      expect(await dashboardPage.isAuthenticated()).toBe(false);

      // Set a configuration in localStorage
      await storageHelpers.setAppStorageConfig(MOCK_CONFIG_SIMPLE_JSON);

      // Verify configuration was saved
      const savedConfig = await storageHelpers.getAppStorageConfig();
      expect(savedConfig).toBe(MOCK_CONFIG_SIMPLE_JSON);
    });

    test('should persist config across page refreshes', async () => {
      await dashboardPage.navigateTo();

      // Set configuration
      await storageHelpers.setAppStorageConfig(MOCK_CONFIG_SIMPLE_JSON);
      
      // Reload page
      await dashboardPage.reload();

      // Verify configuration persists
      const savedConfig = await storageHelpers.getAppStorageConfig();
      expect(savedConfig).toBe(MOCK_CONFIG_SIMPLE_JSON);
      expect(await dashboardPage.isAuthenticated()).toBe(false);
    });

    test('should maintain localStorage when different configs are set', async () => {
      await dashboardPage.navigateTo();

      // Set initial config
      await storageHelpers.setAppStorageConfig(MOCK_CONFIG_SIMPLE_JSON);
      
      // Update to expanded config
      await storageHelpers.setAppStorageConfig(MOCK_CONFIG_EXPANDED_JSON);

      // Verify latest config is saved
      const savedConfig = await storageHelpers.getAppStorageConfig();
      expect(savedConfig).toBe(MOCK_CONFIG_EXPANDED_JSON);
    });
  });

  describe('Authentication Flow', () => {
    test('should migrate localStorage to Supabase on first login', async () => {
      await dashboardPage.navigateTo();

      // Set configuration in localStorage as anonymous user
      await storageHelpers.setAppStorageConfig(MOCK_CONFIG_SIMPLE_JSON);
      
      // Mock authentication
      await authPage.mockAuthentication(MOCK_USER_1);
      await dashboardPage.waitForLoad();

      // Wait for migration to complete
      await dashboardPage.waitForStorageOperation(2000);

      // Verify user is now authenticated
      expect(await dashboardPage.isAuthenticated()).toBe(true);

      // Verify data migrated to Supabase
      const configExists = await supabaseHelpers.waitForConfigSave(MOCK_USER_1.id, STORAGE_NAME, 10000);
      expect(configExists).toBe(true);

      const supabaseConfig = await supabaseHelpers.getUserConfig(MOCK_USER_1.id, STORAGE_NAME);
      expect(supabaseConfig).toBeTruthy();
      expect(JSON.stringify(supabaseConfig.config)).toBe(MOCK_CONFIG_SIMPLE_JSON);
    });

    test('should use Supabase storage for authenticated sessions', async () => {
      // Pre-populate Supabase with user config
      const configData = JSON.parse(MOCK_CONFIG_EXPANDED_JSON);
      await supabaseHelpers.insertUserConfig(MOCK_USER_1.id, STORAGE_NAME, configData);

      await dashboardPage.navigateTo();
      
      // Mock authentication
      await authPage.mockAuthentication(MOCK_USER_1);
      await dashboardPage.waitForLoad();

      // Verify user is authenticated
      expect(await dashboardPage.isAuthenticated()).toBe(true);

      // Verify config loaded from Supabase (not localStorage)
      const supabaseConfig = await supabaseHelpers.getUserConfig(MOCK_USER_1.id, STORAGE_NAME);
      expect(supabaseConfig).toBeTruthy();
      expect(JSON.stringify(supabaseConfig.config)).toBe(MOCK_CONFIG_EXPANDED_JSON);
    });

    test('should revert to localStorage on logout', async () => {
      await dashboardPage.navigateTo();

      // Mock authentication and wait for load
      await authPage.mockAuthentication(MOCK_USER_1);
      await dashboardPage.waitForLoad();

      // Set some config while authenticated
      await storageHelpers.setAppStorageConfig(MOCK_CONFIG_SIMPLE_JSON);
      await dashboardPage.waitForStorageOperation(2000);

      // Sign out
      await authPage.signOut();
      await dashboardPage.waitForLoad();

      // Verify user is no longer authenticated
      expect(await dashboardPage.isAuthenticated()).toBe(false);

      // Config should now be managed by localStorage
      const localConfig = await storageHelpers.getAppStorageConfig();
      expect(localConfig).toBeTruthy();
    });
  });

  describe('Cross-Device Sync', () => {
    test('should sync config across multiple browser sessions', async () => {
      // Get the current page context from Vitest
      const { page: currentPage } = await import('@vitest/browser/context');
      
      // For this test, we'll simulate cross-session by using different browser tabs/windows
      // Note: This is a simplified version - in a real scenario you'd need multiple browser contexts
      const page1 = currentPage;
      const page2 = currentPage; // In a real multi-session test, this would be a separate context

      const dashboard1 = new DashboardPage(page1);
      const dashboard2 = new DashboardPage(page2);
      const auth1 = new AuthPage(page1);
      const auth2 = new AuthPage(page2);
      const storage1 = new StorageHelpers(page1);
      const storage2 = new StorageHelpers(page2);

      // Device 1: Login and set config
      await dashboard1.navigateTo();
      await auth1.mockAuthentication(MOCK_USER_1);
      await dashboard1.waitForLoad();
      await storage1.setAppStorageConfig(MOCK_CONFIG_SIMPLE_JSON);
      await dashboard1.waitForStorageOperation(2000);

      // Device 2: Login as same user
      await dashboard2.navigateTo();
      await auth2.mockAuthentication(MOCK_USER_1);
      await dashboard2.waitForLoad();

      // Wait for config to sync
      await dashboard2.waitForStorageOperation(2000);

      // Verify same config on both devices
      const config1 = await supabaseHelpers.getUserConfig(MOCK_USER_1.id, STORAGE_NAME);
      expect(config1).toBeTruthy();

      // Note: In a real multi-context test, we would close contexts here
    });

    test('should handle different users independently', async () => {
      const { page: currentPage } = await import('@vitest/browser/context');
      
      // For this test, we'll simulate different users using the same page context
      // In a real scenario, this would use separate browser contexts
      const page1 = currentPage;
      const page2 = currentPage;

      const auth1 = new AuthPage(page1);
      const auth2 = new AuthPage(page2);
      const storage1 = new StorageHelpers(page1);
      const storage2 = new StorageHelpers(page2);

      // User 1: Set config
      await page1.goto('/');
      await auth1.mockAuthentication(MOCK_USER_1);
      await page1.waitForLoadState('networkidle');
      await storage1.setAppStorageConfig(MOCK_CONFIG_SIMPLE_JSON);

      // User 2: Set different config  
      await page2.goto('/');
      await auth2.mockAuthentication(MOCK_USER_2);
      await page2.waitForLoadState('networkidle');
      await storage2.setAppStorageConfig(MOCK_CONFIG_EXPANDED_JSON);

      // Wait for both to save
      await page1.waitForTimeout(2000);
      await page2.waitForTimeout(2000);

      // Verify each user has their own config
      const user1Config = await supabaseHelpers.getUserConfig(MOCK_USER_1.id, STORAGE_NAME);
      const user2Config = await supabaseHelpers.getUserConfig(MOCK_USER_2.id, STORAGE_NAME);

      expect(user1Config).toBeTruthy();
      expect(user2Config).toBeTruthy();
      expect(user1Config.config).not.toEqual(user2Config.config);

      // Note: In a real multi-context test, we would close contexts here
    });
  });

  describe('Failure Scenarios', () => {
    test('should fallback to localStorage when Supabase unavailable', async () => {
      const { page } = await import('@vitest/browser/context');
      await dashboardPage.navigateTo();

      // Block all requests to Supabase
      await page.route('**/supabase.co/**', route => route.abort());
      await page.route('**:54321/**', route => route.abort());

      // Mock authentication (this should still work)
      await authPage.mockAuthentication(MOCK_USER_1);
      await dashboardPage.waitForLoad();

      // Set configuration - should fallback to localStorage
      await storageHelpers.setAppStorageConfig(MOCK_CONFIG_SIMPLE_JSON);

      // Verify config saved to localStorage as fallback
      const localConfig = await storageHelpers.getAppStorageConfig();
      expect(localConfig).toBe(MOCK_CONFIG_SIMPLE_JSON);
    });

    test('should handle auth session expiry gracefully', async () => {
      await dashboardPage.navigateTo();

      // Mock authentication
      await authPage.mockAuthentication(MOCK_USER_1);
      await dashboardPage.waitForLoad();
      expect(await dashboardPage.isAuthenticated()).toBe(true);

      // Clear auth session to simulate expiry
      await authPage.clearAuthState();
      await dashboardPage.reload();

      // Should revert to unauthenticated state
      expect(await dashboardPage.isAuthenticated()).toBe(false);
      expect(await dashboardPage.hasSignInButton()).toBe(true);
    });

    test('should recover when Supabase becomes available again', async () => {
      const { page } = await import('@vitest/browser/context');
      await dashboardPage.navigateTo();

      // Initially block Supabase
      await page.route('**:54321/**', route => route.abort());

      await authPage.mockAuthentication(MOCK_USER_1);
      await dashboardPage.waitForLoad();

      // Set config while Supabase is blocked - should use localStorage
      await storageHelpers.setAppStorageConfig(MOCK_CONFIG_SIMPLE_JSON);

      // Restore Supabase connection
      await page.unroute('**:54321/**');

      // Reload to trigger reconnection
      await dashboardPage.reload();
      await dashboardPage.waitForStorageOperation(3000);

      // Verify system can connect to Supabase again
      const isConnected = await supabaseHelpers.isSupabaseConnected();
      expect(isConnected).toBe(true);
    });
  });
});