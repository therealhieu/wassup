-- Create user_configs table for storing dashboard configurations
CREATE TABLE user_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  storage_key TEXT NOT NULL,
  config JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, storage_key)
);

-- Enable Row Level Security
ALTER TABLE user_configs ENABLE ROW LEVEL SECURITY;

-- Create RLS policy - users can only access their own configs
CREATE POLICY "user_configs_policy" ON user_configs
  FOR ALL TO authenticated
  USING (user_id = auth.uid()::text)
  WITH CHECK (user_id = auth.uid()::text);

-- Create indexes for performance
CREATE INDEX idx_user_configs_user_storage ON user_configs(user_id, storage_key);
CREATE INDEX idx_user_configs_updated_at ON user_configs(updated_at DESC);