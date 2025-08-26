import type { Page } from 'playwright';
import { STORAGE_NAME } from '../../index';

export class StorageHelpers {
  constructor(private page: Page) {}

  // LocalStorage Helpers
  async clearLocalStorage(): Promise<void> {
    localStorage.clear();
  }

  async getLocalStorageItem(key: string): Promise<string | null> {
    return localStorage.getItem(key);
  }

  async setLocalStorageItem(key: string, value: string): Promise<void> {
    localStorage.setItem(key, value);
  }

  async removeLocalStorageItem(key: string): Promise<void> {
    localStorage.removeItem(key);
  }

  // App Storage Specific Helpers
  async getAppStorageConfig(): Promise<string | null> {
    return await this.getLocalStorageItem(STORAGE_NAME);
  }

  async setAppStorageConfig(configJson: string): Promise<void> {
    await this.setLocalStorageItem(STORAGE_NAME, configJson);
  }

  async clearAppStorage(): Promise<void> {
    await this.removeLocalStorageItem(STORAGE_NAME);
  }

  // Storage State Verification
  async hasLocalStorageConfig(): Promise<boolean> {
    const config = await this.getAppStorageConfig();
    return config !== null && config.trim().length > 0;
  }

  async waitForStorageChange(originalValue: string | null, timeout: number = 5000): Promise<void> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      const currentValue = await this.getAppStorageConfig();
      if (currentValue !== originalValue) {
        return;
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    throw new Error(`Storage did not change within ${timeout}ms`);
  }

  // Compare configurations 
  async compareStorageConfig(expectedConfig: string): Promise<boolean> {
    const actualConfig = await this.getAppStorageConfig();
    if (!actualConfig) return false;
    
    try {
      const actual = JSON.parse(actualConfig);
      const expected = JSON.parse(expectedConfig);
      return JSON.stringify(actual) === JSON.stringify(expected);
    } catch {
      return false;
    }
  }

  // Session Storage Helpers (for test auth state)
  async setTestAuthSession(sessionData: any): Promise<void> {
    sessionStorage.setItem('test-auth-session', JSON.stringify(sessionData));
  }

  async getTestAuthSession(): Promise<any> {
    const data = sessionStorage.getItem('test-auth-session');
    return data ? JSON.parse(data) : null;
  }

  async clearTestAuthSession(): Promise<void> {
    sessionStorage.removeItem('test-auth-session');
  }
}