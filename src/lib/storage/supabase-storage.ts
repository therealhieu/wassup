import { StateStorage, StorageEntry } from './types';
import { storageLogger } from '@/lib/logger';
import { API_ROUTES, createFetchOptions, TIMEOUTS } from '@/lib/http/constants';

/**
 * Fallback to localStorage when cloud storage is unavailable
 */
const localStorageFallback = (name: string, operation: 'get' | 'set' | 'remove', value?: string): string | null => {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    storageLogger.debug('localStorage not available (SSR or unsupported browser)');
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
 * Get local storage entry with metadata
 */
const getLocalStorageEntry = (name: string): StorageEntry | null => {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return null;
  }

  try {
    const rawData = localStorage.getItem(name);
    if (!rawData) return null;

    // Try to parse as storage entry with metadata
    try {
      const parsed = JSON.parse(rawData);
      if (parsed && typeof parsed === 'object' && 'data' in parsed) {
        return parsed as StorageEntry;
      }
    } catch {
      // If parsing fails, treat as legacy data without metadata
    }

    // Legacy data format - treat as entry without metadata
    return { data: rawData };
  } catch (error) {
    storageLogger.error('Failed to get localStorage entry:', error);
    return null;
  }
};

/**
 * Sync data to localStorage for offline access with metadata
 */
const syncToLocalStorage = (name: string, data: string, version?: number, updatedAt?: string): void => {
  if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
    try {
      const entry: StorageEntry = {
        data,
        version,
        updatedAt: updatedAt || new Date().toISOString(),
      };
      localStorage.setItem(name, JSON.stringify(entry));
      storageLogger.debug('Synced to localStorage for offline access');
    } catch (error) {
      storageLogger.warn('Failed to sync to localStorage:', error);
    }
  }
};

/**
 * Make API request with error handling and timeout
 */
const apiRequest = async (url: string, options?: RequestInit) => {
  const TIMEOUT_MS = TIMEOUTS.DEFAULT;
  const controller = new AbortController();
  let timeoutId: NodeJS.Timeout | null = null;
  
  try {
    // Set up timeout
    timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);
    
    // Handle external abort signal if provided
    if (options?.signal) {
      const externalSignal = options.signal;
      if (externalSignal.aborted) {
        controller.abort();
      } else {
        // Propagate external abort to our controller
        const abortHandler = () => controller.abort();
        externalSignal.addEventListener('abort', abortHandler, { once: true });
        
        // Clean up listener when our controller aborts
        controller.signal.addEventListener('abort', () => {
          externalSignal.removeEventListener('abort', abortHandler);
        }, { once: true });
      }
    }
    
    const response = await fetch(url, { 
      ...createFetchOptions(), 
      cache: 'no-store', 
      ...options,
      signal: controller.signal 
    });
    
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
  } catch (error: unknown) {
    // Check if it's an AbortError (timeout or external abort)
    if (error instanceof Error && error.name === 'AbortError') {
      storageLogger.warn('API request aborted/timed out');
      return { success: false, status: 408, error: 'Request timeout' };
    }
    
    storageLogger.error('API request error:', error);
    return { success: false, error };
  } finally {
    // Clean up timeout
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
};

/**
 * Compare storage entries to determine if local is newer than cloud
 * Returns true if local should be kept (is newer or equal)
 */
const compareEntries = (local: StorageEntry, cloud: StorageEntry): boolean => {
  // If both have versions, compare versions
  if (local.version !== undefined && cloud.version !== undefined) {
    return local.version >= cloud.version;
  }
  
  // If both have updatedAt, compare timestamps
  if (local.updatedAt && cloud.updatedAt) {
    const localTime = new Date(local.updatedAt).getTime();
    const cloudTime = new Date(cloud.updatedAt).getTime();
    return localTime >= cloudTime;
  }
  
  // If local has version/timestamp but cloud doesn't, treat local as newer
  if ((local.version !== undefined || local.updatedAt) && 
      (cloud.version === undefined && !cloud.updatedAt)) {
    return true;
  }
  
  // If cloud has version/timestamp but local doesn't, treat cloud as newer
  if ((cloud.version !== undefined || cloud.updatedAt) && 
      (local.version === undefined && !local.updatedAt)) {
    return false;
  }
  
  // If neither has metadata, prefer cloud (existing behavior)
  return false;
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
      
      // Get local entry first for version comparison
      const localEntry = getLocalStorageEntry(name);
      
      const result = await apiRequest(`${API_ROUTES.USER_CONFIG}?key=${encodeURIComponent(name)}`);
      
      if (!result.success) {
        return localStorageFallback(name, 'get');
      }
      
      if (!result.data?.data) {
        storageLogger.info(`No config found in cloud for user: ${userId}`);
        return null;
      }
      
      const cloudData = result.data.data;
      const cloudVersion = result.data.version;
      const cloudUpdatedAt = result.data.updatedAt;
      
      // Compare versions/timestamps to avoid overwriting newer local changes
      if (localEntry) {
        const shouldSkipSync = compareEntries(localEntry, {
          data: cloudData,
          version: cloudVersion,
          updatedAt: cloudUpdatedAt,
        });
        
        if (shouldSkipSync) {
          storageLogger.info('Local data is newer, skipping cloud sync');
          return localEntry.data;
        }
      }
      
      storageLogger.info(`Successfully loaded config from cloud for user: ${userId}`);
      syncToLocalStorage(name, cloudData, cloudVersion, cloudUpdatedAt);
      return cloudData;
    },

    setItem: async (name: string, value: string): Promise<void> => {
      storageLogger.info(`🚀 SupabaseStorage setItem called for user ${userId}`, { 
        key: name, 
        valueLength: value.length,
        valuePreview: value.substring(0, 100) + (value.length > 100 ? '...' : '')
      });
      
      if (!validateJson(value)) {
        throw new Error('Invalid JSON format');
      }
      
      // Get current local entry for version information
      const localEntry = getLocalStorageEntry(name);
      const version = localEntry?.version;
      
      const result = await apiRequest(API_ROUTES.USER_CONFIG, {
        method: 'POST',
        body: JSON.stringify({ key: name, value, version }),
      });
      
      if (!result.success) {
        localStorageFallback(name, 'set', value);
        if (!result.status || result.status !== 401) {
          throw new Error('Failed to save config');
        }
        return;
      }
      
      storageLogger.info(`Successfully saved config to cloud for user: ${userId}`);
      // Sync with the version returned from the server
      const newVersion = result.data?.version;
      syncToLocalStorage(name, value, newVersion);
    },

    removeItem: async (name: string): Promise<void> => {
      storageLogger.info(`Removing config for user ${userId} with key ${name}`);
      
      const result = await apiRequest(`${API_ROUTES.USER_CONFIG}?key=${encodeURIComponent(name)}`, {
        method: 'DELETE',
      });
      
      if (result.success) {
        storageLogger.info(`Successfully removed config from cloud for user: ${userId}`);
        localStorageFallback(name, 'remove');
      } else {
        storageLogger.warn('Failed to remove config from cloud, but continuing');
      }
    },
  };
};