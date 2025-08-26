import { test, expect } from 'vitest';
import { STORAGE_NAME } from '../index';

test('Simple localStorage test', async () => {
  // Clear localStorage
  localStorage.clear();
  
  // Test basic localStorage operations
  expect(localStorage.getItem(STORAGE_NAME)).toBeNull();
  
  // Set a test config
  const testConfig = '{"appConfig": {"columns": 12, "widgets": []}}';
  localStorage.setItem(STORAGE_NAME, testConfig);
  
  // Verify it was set
  expect(localStorage.getItem(STORAGE_NAME)).toBe(testConfig);
  
  // Clear it
  localStorage.removeItem(STORAGE_NAME);
  expect(localStorage.getItem(STORAGE_NAME)).toBeNull();
});