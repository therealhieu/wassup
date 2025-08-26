import { createClient } from '@supabase/supabase-js';

// Create a test Supabase client with service role for testing
const supabaseUrl = typeof process !== 'undefined' ? (process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321') : 'http://127.0.0.1:54321';
const supabaseServiceKey = typeof process !== 'undefined' ? (process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU') : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const testSupabase = createClient(supabaseUrl, supabaseServiceKey);

export class SupabaseTestHelpers {
  
  // Database cleanup for tests
  async clearUserConfigs(): Promise<void> {
    const { error } = await testSupabase
      .from('user_configs')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all records
    
    if (error) {
      console.warn('Error clearing user_configs:', error.message);
    }
  }

  async clearUserConfigsForUser(userId: string): Promise<void> {
    const { error } = await testSupabase
      .from('user_configs')
      .delete()
      .eq('user_id', userId);
    
    if (error) {
      console.warn(`Error clearing configs for user ${userId}:`, error.message);
    }
  }

  // Insert test data
  async insertUserConfig(userId: string, storageKey: string, config: any): Promise<void> {
    const { error } = await testSupabase
      .from('user_configs')
      .insert({
        user_id: userId,
        storage_key: storageKey,
        config: config,
        updated_at: new Date().toISOString()
      });
    
    if (error) {
      console.warn('Error inserting user config:', error.message);
      throw error;
    }
  }

  // Verify data exists
  async getUserConfig(userId: string, storageKey: string): Promise<any> {
    const { data, error } = await testSupabase
      .from('user_configs')
      .select('*')
      .eq('user_id', userId)
      .eq('storage_key', storageKey)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') { // No rows returned
        return null;
      }
      console.warn('Error getting user config:', error.message);
      throw error;
    }
    
    return data;
  }

  // Check if config exists
  async hasUserConfig(userId: string, storageKey: string): Promise<boolean> {
    const config = await this.getUserConfig(userId, storageKey);
    return config !== null;
  }

  // Count configs for user
  async getUserConfigCount(userId: string): Promise<number> {
    const { count, error } = await testSupabase
      .from('user_configs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);
    
    if (error) {
      console.warn('Error counting user configs:', error.message);
      return 0;
    }
    
    return count || 0;
  }

  // Verify migration worked
  async verifyMigration(userId: string, storageKey: string, expectedConfig: any): Promise<boolean> {
    const config = await this.getUserConfig(userId, storageKey);
    if (!config) return false;
    
    try {
      return JSON.stringify(config.config) === JSON.stringify(expectedConfig);
    } catch {
      return false;
    }
  }

  // Wait for data to be saved (for async operations)
  async waitForConfigSave(userId: string, storageKey: string, timeout: number = 10000): Promise<boolean> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      const hasConfig = await this.hasUserConfig(userId, storageKey);
      if (hasConfig) {
        return true;
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    return false;
  }

  // Database health check
  async isSupabaseConnected(): Promise<boolean> {
    try {
      const { error } = await testSupabase
        .from('user_configs')
        .select('id')
        .limit(1);
      
      return !error;
    } catch {
      return false;
    }
  }
}