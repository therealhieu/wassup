import { Session } from 'next-auth';
import { StateStorage } from 'zustand/middleware';
import { createLocalStorage } from './local-storage';
import { createSupabaseStorage } from './supabase-storage';
import { baseLogger } from '../logger';

const logger = baseLogger.getSubLogger({
	name: "Storage Index",
});

export const STORAGE_NAME = 'app-store-storage';

// Migration function - prioritize local storage, sync to cloud if needed
const migrateToSupabase = async (userId: string) => {
  try {
    logger.info('🚀 Starting migration for user:', userId);
    const supabaseStorage = createSupabaseStorage(userId);
    
    // First check for local storage config (local wins for new users)
    // Only check localStorage if we're in browser environment
    const localData = (typeof window !== 'undefined' && typeof localStorage !== 'undefined') 
      ? localStorage.getItem(STORAGE_NAME) 
      : null;
    
    logger.info('📦 Local storage check:', { hasLocalData: !!localData, dataLength: localData?.length });
    
    if (localData) {
      // Local config exists, check if we need to sync to cloud
      logger.info('Local config found, checking cloud sync status');
      
      try {
        const existingCloudConfig = await supabaseStorage.getItem(STORAGE_NAME);
        logger.info('☁️ Cloud config check:', { hasCloudConfig: !!existingCloudConfig });
        
        if (!existingCloudConfig) {
          // No cloud config, sync local to cloud (first login)
          logger.info('First login detected - syncing local config to cloud');
          await supabaseStorage.setItem(STORAGE_NAME, localData);
          logger.info('✓ Synced local config to Supabase on first login');
        } else {
          // Cloud config exists, use cloud config (existing user)
          logger.info('Existing user - using cloud config, updating localStorage');
          if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
            localStorage.setItem(STORAGE_NAME, existingCloudConfig);
            logger.info('✓ Updated localStorage with cloud config');
          }
        }
      } catch (cloudError: any) {
        if (cloudError?.code === '42501') {
          logger.warn('RLS prevents cloud operations, continuing with localStorage only');
        } else {
          logger.warn('Failed to sync with cloud, continuing with localStorage');
          logger.error('Cloud sync error:', cloudError);
        }
      }
    } else {
      // No local config, check cloud
      logger.info('No local config found, checking cloud');
      
      try {
        const existingCloudConfig = await supabaseStorage.getItem(STORAGE_NAME);
        
        if (existingCloudConfig) {
          // Cloud config exists, update local storage
          logger.info('Cloud config found, updating localStorage');
          if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
            localStorage.setItem(STORAGE_NAME, existingCloudConfig);
            logger.info('✓ Updated localStorage with cloud config');
          }
        } else {
          // No config anywhere - user will start with empty state
          logger.info('No config found in either localStorage or cloud');
        }
      } catch (cloudError: any) {
        logger.warn('Failed to check cloud config, user starts with empty state');
        logger.error('Cloud check error:', cloudError);
      }
    }
  } catch (error) {
    logger.error('Error during migration:', error);
    // No fallback config creation - user starts with empty state if migration fails
  }
};

export const createStorage = (session: Session | null | undefined): StateStorage => {
  if (session?.user?.id) {
    return createSupabaseStorage(session.user.id);
  }
  return createLocalStorage();
};

// Export migration function to be called separately where async is supported
export const migrateUserData = migrateToSupabase;