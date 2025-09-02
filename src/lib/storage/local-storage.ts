import { StateStorage } from './types';
import { storageLogger } from '@/lib/logger';

export const createLocalStorage = (): StateStorage => {
  return {
    getItem: async (name: string): Promise<string | null> => {
      // Check if we're in browser environment
      if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
        storageLogger.debug('LocalStorage getItem (SSR):', { name, serverSide: true });
        return null;
      }
      
      const value = localStorage.getItem(name);
      storageLogger.debug('LocalStorage getItem:', { name, hasValue: !!value });
      return value;
    },
    setItem: async (name: string, value: string): Promise<void> => {
      // Check if we're in browser environment
      if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
        storageLogger.debug('LocalStorage setItem (SSR):', { name, serverSide: true });
        return;
      }
      
      storageLogger.info('LocalStorage setItem:', { name, valueLength: value.length });
      localStorage.setItem(name, value);
    },
    removeItem: async (name: string): Promise<void> => {
      // Check if we're in browser environment
      if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
        storageLogger.debug('LocalStorage removeItem (SSR):', { name, serverSide: true });
        return;
      }
      
      storageLogger.info('LocalStorage removeItem:', { name });
      localStorage.removeItem(name);
    },
  };
};