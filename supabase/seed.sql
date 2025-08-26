-- Seed data for local development
-- This file provides sample data for testing the user_configs table

INSERT INTO user_configs (user_id, storage_key, config) VALUES
  ('test-user-1', 'app-store-storage', '{
    "appConfig": {
      "columns": 12,
      "widgets": [
        {
          "id": "weather-1",
          "type": "weather",
          "location": "Ho Chi Minh City",
          "columnStart": 1,
          "columnSpan": 6
        },
        {
          "id": "bookmark-1", 
          "type": "bookmark",
          "groups": [
            {
              "name": "Development",
              "bookmarks": [
                {"name": "GitHub", "url": "https://github.com"},
                {"name": "Supabase", "url": "https://supabase.io"}
              ]
            }
          ],
          "columnStart": 7,
          "columnSpan": 6
        }
      ]
    }
  }'),
  ('test-user-2', 'app-store-storage', '{
    "appConfig": {
      "columns": 12,
      "widgets": [
        {
          "id": "weather-2",
          "type": "weather", 
          "location": "New York",
          "columnStart": 1,
          "columnSpan": 12
        }
      ]
    }
  }');