-- Add version column for optimistic locking
ALTER TABLE user_configs ADD COLUMN version INTEGER NOT NULL DEFAULT 1;

-- Create index on version for performance
CREATE INDEX idx_user_configs_version ON user_configs(version);
