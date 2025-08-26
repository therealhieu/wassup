-- Drop the existing RLS policy that relies on Supabase auth
DROP POLICY IF EXISTS "user_configs_policy" ON user_configs;

-- Create a service role policy that allows full access for service operations
-- This will allow the server-side Supabase client (with service role key) to bypass RLS
CREATE POLICY "user_configs_service_policy" ON user_configs
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- Keep RLS enabled but create a policy that works with our setup
-- Since we don't have Supabase auth users, we'll allow the service role to manage all data
