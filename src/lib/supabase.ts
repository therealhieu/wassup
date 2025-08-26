import { createClient } from '@supabase/supabase-js';
import { dbLogger } from '@/lib/logger';

// Environment variables are required for Supabase connection
// Create a .env.local file with the following variables:
// NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
// NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
// SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

// Get environment variables - these are required
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Use service role key for server-side operations to bypass RLS, fall back to anon key
const supabaseKey = supabaseServiceKey || supabaseAnonKey;

// Validate required environment variables
if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    'Missing required Supabase environment variables. Please create a .env.local file with:\n' +
    '- NEXT_PUBLIC_SUPABASE_URL\n' +
    '- SUPABASE_SERVICE_ROLE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY as fallback)'
  );
}

// Log Supabase configuration (without exposing the full key)
const isUsingServiceRole = supabaseKey === supabaseServiceKey;
dbLogger.info('Supabase configuration initialized', {
  url: supabaseUrl,
  keyPrefix: supabaseKey.substring(0, 10) + '...',
  keyType: isUsingServiceRole ? 'service_role' : 'anon'
});

// Create Supabase client with improved configuration
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true
  },
  // Add debug logs in development
  global: {
    headers: {
      'X-Client-Info': 'wassup-app'
    }
  }
});

// Test the connection and log the result
const testSupabaseConnection = async () => {
  try {
    const { error } = await supabase.from('user_configs').select('count').limit(1);
    if (error) {
      dbLogger.error('Supabase connection test failed:', {
        message: error.message,
        code: error.code
      });
    } else {
      dbLogger.info('✅ Supabase connection successful');
    }
  } catch (e) {
    dbLogger.error('Failed to test Supabase connection:', e);
  }
};

// Run the test in the browser environment
if (typeof window !== 'undefined') {
  testSupabaseConnection();
}