import { Session } from 'next-auth';
import { StateStorage } from 'zustand/middleware';
import { createLocalStorage } from './local-storage';
import { createSupabaseStorage } from './supabase-storage';
import { baseLogger } from '../logger';

const logger = baseLogger.getSubLogger({
	name: "Storage Index",
});

export const STORAGE_NAME = 'app-store-storage';

// Migration function - sync local data to Supabase if needed
const migrateToSupabase = async (userId: string) => {
  try {
    const supabaseStorage = createSupabaseStorage(userId);
    
    // First check if there's a config in Supabase
    const existingConfig = await supabaseStorage.getItem(STORAGE_NAME);
    
    if (existingConfig) {
      // If Supabase has config, use it (cloud wins)
      logger.info('Existing config found in Supabase, using cloud data');
      
      // Update local storage with the cloud config
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_NAME, existingConfig);
        logger.info('Updated localStorage with Supabase config');
      }
    } else {
      // No config in Supabase, check if we have local data to sync
      const localData = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_NAME) : null;
      
      if (localData) {
        // Try to sync local data to Supabase
        logger.info('No config in Supabase but found local data, attempting to sync to cloud');
        try {
          await supabaseStorage.setItem(STORAGE_NAME, localData);
          logger.info('✓ Synced local config to Supabase');
        } catch (syncError: any) {
          if (syncError?.code === '42501') {
            logger.warn('RLS prevents syncing to Supabase, using localStorage only');
          } else {
            logger.warn('Failed to sync local data to Supabase, continuing with localStorage');
            logger.error('Sync error:', syncError);
          }
        }
      } else {
        // No config anywhere, create a default one
        logger.info('No config found anywhere, creating default configuration');
        
        const { DEFAULT_CONFIG } = await import('@/lib/constants');
        const initialConfig = {
          state: {
            appConfig: DEFAULT_CONFIG
          }
        };
        const configString = JSON.stringify(initialConfig);
        
        // Try to create in Supabase first
        try {
          await supabaseStorage.setItem(STORAGE_NAME, configString);
          logger.info('✓ Created default config in Supabase');
        } catch (createError: any) {
          if (createError?.code === '42501') {
            logger.warn('RLS prevents creating config in Supabase, using localStorage only');
          } else {
            logger.warn('Failed to create config in Supabase, falling back to localStorage');
            logger.error('Create error:', createError);
          }
        }
        
        // Always ensure localStorage has the config
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem(STORAGE_NAME, configString);
          logger.info('✓ Created default config in localStorage');
        }
      }
    }
  } catch (error) {
    logger.error('Error during migration:', error);
    
    // Ensure there's always a fallback config in localStorage
    if (typeof localStorage !== 'undefined') {
      const existingLocal = localStorage.getItem(STORAGE_NAME);
      if (!existingLocal) {
        try {
          const { DEFAULT_CONFIG } = await import('@/lib/constants');
          const initialConfig = {
            state: {
              appConfig: DEFAULT_CONFIG
            }
          };
          localStorage.setItem(STORAGE_NAME, JSON.stringify(initialConfig));
          logger.info('✓ Created fallback config in localStorage after migration error');
        } catch (fallbackError) {
          logger.error('Failed to create fallback config:', fallbackError);
        }
      }
    }
  }
};

export const createStorage = (session: Session | null): StateStorage => {
  if (session?.user?.id) {
    return createSupabaseStorage(session.user.id);
  }
  return createLocalStorage();
};

// Export migration function to be called separately where async is supported
export const migrateUserData = migrateToSupabase;