import { StateStorage } from './types';
import { STORAGE_NAME } from '.';

export const createSupabaseStorage = (userId: string): StateStorage => {
  return {
    getItem: async (name: string): Promise<string | null> => {
      try {
        console.log(`[Storage] Fetching config for user ${userId} with key ${name}`);
        
        // Use API route instead of direct Supabase client
        const response = await fetch(`/api/user-config?key=${encodeURIComponent(name)}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          cache: 'no-store', // Don't cache user config requests
        });

        if (!response.ok) {
          if (response.status === 401) {
            console.warn('Authentication required for Supabase access');
            console.warn('Falling back to localStorage only');
          } else {
            const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
            console.error('API error fetching user config:', {
              status: response.status,
              error: errorData.error,
              details: errorData.details
            });
          }
          
          // On error, try localStorage as fallback
          const localData = typeof localStorage !== 'undefined' ? localStorage.getItem(name) : null;
          if (localData) {
            console.log('Error with API, using localStorage as fallback');
            return localData;
          }
          return null;
        }
        
        const result = await response.json();
        
        // Check if we have any data
        if (!result.data) {
          console.log(`No config found in Supabase for user: ${userId}`);
          return null; // Return null to trigger default config creation in migration
        }
        
        // We have data in Supabase, use it (cloud wins)
        console.log(`Successfully loaded config from Supabase for user: ${userId}`);
        
        // Update localStorage with the Supabase config for offline use
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem(name, result.data);
          console.log('Updated localStorage with Supabase config');
        }
        
        return result.data;
      } catch (e) {
        console.error('Unexpected error in Supabase getItem:', e);
        
        // On unexpected error, try localStorage as last resort
        if (typeof localStorage !== 'undefined') {
          const localData = localStorage.getItem(name);
          if (localData) {
            console.log('Using localStorage as fallback after unexpected error');
            return localData;
          }
        }
        
        return null;
      }
    },

    setItem: async (name: string, value: string): Promise<void> => {
      try {
        console.log(`[Storage] Saving config for user ${userId} with key ${name}`);
        
        // Validate JSON before sending
        try {
          JSON.parse(value);
        } catch (parseError) {
          console.error('Invalid JSON in value, cannot save to Supabase:', parseError);
          throw new Error('Invalid JSON format');
        }
        
        // Use API route instead of direct Supabase client
        const response = await fetch('/api/user-config', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            key: name,
            value: value
          }),
        });

        if (!response.ok) {
          if (response.status === 401) {
            console.warn('Authentication required for Supabase access');
            console.warn('Falling back to localStorage only');
          } else {
            const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
            console.error('API error saving user config:', {
              status: response.status,
              error: errorData.error,
              details: errorData.details
            });
          }
          
          // If API save fails, at least try to save to localStorage
          if (typeof localStorage !== 'undefined') {
            localStorage.setItem(name, value);
            console.log('Saved to localStorage as fallback after API error');
          } else {
            console.warn('localStorage not available, config changes will not persist');
          }
        } else {
          console.log(`Successfully saved config to Supabase for user: ${userId}`);
          
          // Also update localStorage for offline access
          if (typeof localStorage !== 'undefined') {
            localStorage.setItem(name, value);
            console.log('Also saved config to localStorage for offline access');
          }
        }
      } catch (e) {
        console.error('Unexpected error in Supabase setItem:', e);
        
        // Try localStorage as fallback
        if (typeof localStorage !== 'undefined') {
          try {
            localStorage.setItem(name, value);
            console.log('Saved to localStorage as fallback after exception');
          } catch (localError) {
            console.error('Failed to save to localStorage:', localError);
          }
        }
      }
    },

    removeItem: async (name: string): Promise<void> => {
      try {
        console.log(`[Storage] Removing config for user ${userId} with key ${name}`);
        
        // Use API route instead of direct Supabase client
        const response = await fetch(`/api/user-config?key=${encodeURIComponent(name)}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
        });
          
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
          console.error('API error removing user config:', {
            status: response.status,
            error: errorData.error,
            details: errorData.details
          });
        } else {
          console.log(`Successfully removed config from Supabase for user: ${userId}`);
          
          // Also remove from localStorage for consistency
          if (typeof localStorage !== 'undefined') {
            localStorage.removeItem(name);
            console.log('Also removed config from localStorage');
          }
        }
      } catch (e) {
        console.error('Unexpected error in Supabase removeItem:', e);
      }
    },
  };
};