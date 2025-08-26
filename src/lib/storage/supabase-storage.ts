import { StateStorage } from './types';
import { storageLogger } from '@/lib/logger';
import { API_ROUTES, createFetchOptions } from '@/lib/http/constants';

/**
 * Fallback to localStorage when cloud storage is unavailable
 */
const useLocalStorageFallback = (name: string, operation: 'get' | 'set' | 'remove', value?: string): string | null => {
  if (typeof localStorage === 'undefined') {
    storageLogger.warn('localStorage not available');
    return null;
  }

  try {
    switch (operation) {
      case 'get':
        const data = localStorage.getItem(name);
        if (data) storageLogger.debug('Using localStorage as fallback');
        return data;
      case 'set':
        if (value) {
          localStorage.setItem(name, value);
          storageLogger.debug('Saved to localStorage as fallback');
        }
        return null;
      case 'remove':
        localStorage.removeItem(name);
        storageLogger.debug('Removed from localStorage');
        return null;
    }
  } catch (error) {
    storageLogger.error('localStorage operation failed:', error);
    return null;
  }
};

/**
 * Sync data to localStorage for offline access
 */
const syncToLocalStorage = (name: string, data: string): void => {
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(name, data);
      storageLogger.debug('Synced to localStorage for offline access');
    } catch (error) {
      storageLogger.warn('Failed to sync to localStorage:', error);
    }
  }
};

/**
 * Make API request with error handling
 */
const apiRequest = async (url: string, options?: RequestInit) => {
  try {
    const response = await fetch(url, { ...createFetchOptions(), cache: 'no-store', ...options });
    
    if (!response.ok) {
      if (response.status === 401) {
        storageLogger.warn('Authentication required, falling back to localStorage');
        return { success: false, status: 401 };
      }
      
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      storageLogger.error('API request failed:', { status: response.status, ...errorData });
      return { success: false, status: response.status, error: errorData };
    }
    
    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    storageLogger.error('API request error:', error);
    return { success: false, error };
  }
};

/**
 * Validate JSON string
 */
const validateJson = (value: string): boolean => {
  try {
    JSON.parse(value);
    return true;
  } catch {
    storageLogger.error('Invalid JSON format');
    return false;
  }
};

export const createSupabaseStorage = (userId: string): StateStorage => {
  return {
    getItem: async (name: string): Promise<string | null> => {
      storageLogger.info(`Fetching config for user ${userId} with key ${name}`);
      
      const result = await apiRequest(`${API_ROUTES.USER_CONFIG}?key=${encodeURIComponent(name)}`);
      
      if (!result.success) {
        return useLocalStorageFallback(name, 'get');
      }
      
      if (!result.data?.data) {
        storageLogger.info(`No config found in cloud for user: ${userId}`);
        return null;
      }
      
      storageLogger.info(`Successfully loaded config from cloud for user: ${userId}`);
      syncToLocalStorage(name, result.data.data);
      return result.data.data;
    },

    setItem: async (name: string, value: string): Promise<void> => {
      storageLogger.info(`Saving config for user ${userId} with key ${name}`);
      
      if (!validateJson(value)) {
        throw new Error('Invalid JSON format');
      }
      
      const result = await apiRequest(API_ROUTES.USER_CONFIG, {
        method: 'POST',
        body: JSON.stringify({ key: name, value }),
      });
      
      if (!result.success) {
        useLocalStorageFallback(name, 'set', value);
        if (!result.status || result.status !== 401) {
          throw new Error('Failed to save config');
        }
        return;
      }
      
      storageLogger.info(`Successfully saved config to cloud for user: ${userId}`);
      syncToLocalStorage(name, value);
    },

    removeItem: async (name: string): Promise<void> => {
      storageLogger.info(`Removing config for user ${userId} with key ${name}`);
      
      const result = await apiRequest(`${API_ROUTES.USER_CONFIG}?key=${encodeURIComponent(name)}`, {
        method: 'DELETE',
      });
      
      if (result.success) {
        storageLogger.info(`Successfully removed config from cloud for user: ${userId}`);
        useLocalStorageFallback(name, 'remove');
      } else {
        storageLogger.warn('Failed to remove config from cloud, but continuing');
      }
    },
  };
};