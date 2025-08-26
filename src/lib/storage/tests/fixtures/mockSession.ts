import { Session } from 'next-auth';

export const MOCK_USER_1 = {
  id: 'test-user-1',
  name: 'Test User One',
  email: 'test1@example.com',
  image: 'https://avatars.githubusercontent.com/u/1?v=4'
};

export const MOCK_USER_2 = {
  id: 'test-user-2', 
  name: 'Test User Two',
  email: 'test2@example.com',
  image: 'https://avatars.githubusercontent.com/u/2?v=4'
};

export const MOCK_SESSION_1: Session = {
  user: MOCK_USER_1,
  expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours from now
};

export const MOCK_SESSION_2: Session = {
  user: MOCK_USER_2,
  expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours from now
};

// Supabase database mock data matching seed.sql
export const MOCK_SUPABASE_RESPONSES = {
  user1Config: {
    id: '1',
    user_id: 'test-user-1',
    storage_key: 'app-store-storage',
    config: {
      appConfig: {
        columns: 12,
        widgets: [
          {
            id: 'weather-1',
            type: 'weather',
            location: 'Ho Chi Minh City',
            columnStart: 1,
            columnSpan: 6
          }
        ]
      }
    },
    updated_at: '2024-01-01T00:00:00Z'
  },
  user2Config: {
    id: '2',
    user_id: 'test-user-2',
    storage_key: 'app-store-storage', 
    config: {
      appConfig: {
        columns: 12,
        widgets: [
          {
            id: 'weather-2',
            type: 'weather',
            location: 'New York',
            columnStart: 1,
            columnSpan: 12
          }
        ]
      }
    },
    updated_at: '2024-01-01T00:00:00Z'
  }
};

// Helper to create test session with custom data
export function createMockSession(overrides: Partial<Session> = {}): Session {
  return {
    ...MOCK_SESSION_1,
    ...overrides
  };
}