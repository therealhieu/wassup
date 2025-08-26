# Supabase Storage Implementation Plan

## Overview

Implement dual storage strategy for Wassup dashboard configurations:
- **Authenticated users**: Supabase (cloud sync)
- **Anonymous users**: localStorage (local only)

## Goals

- Seamless config sync across devices for logged-in users
- Local development with Docker-based Supabase
- Zero configuration complexity for end users
- Maintain existing localStorage experience for anonymous users
- Type-safe storage implementation with error handling

## Architecture

### Storage Strategy Decision Tree
```
User visits dashboard
├── Not logged in → localStorage
└── Logged in → Supabase
    ├── Local dev → Local Supabase (Docker)
    └── Production → Cloud Supabase
```

### Component Integration
```typescript
// Simple factory pattern
const storage = createStorage(session); // Returns correct storage based on auth
```

## Local Development Setup

### 1. Supabase CLI Installation
```bash
brew install supabase/tap/supabase
```

### 2. Project Initialization
```bash
supabase init
```

### 3. Local Instance Management
```bash
# Start local Supabase stack
supabase start

# Stop local stack  
supabase stop

# Reset database with seed data
supabase db reset --with-seed
```

### 4. Configuration Files
- `supabase/config.toml` - Local Supabase configuration
- `supabase/migrations/` - Database schema versions
- `supabase/seed.sql` - Development test data

## Database Schema

### Core Table
```sql
-- user_configs table - simplified schema
CREATE TABLE user_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  storage_key TEXT NOT NULL,
  config JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, storage_key)
);

-- Row Level Security
ALTER TABLE user_configs ENABLE ROW LEVEL SECURITY;

-- Single optimized RLS policy
CREATE POLICY "user_configs_policy" ON user_configs
  FOR ALL TO authenticated
  USING (user_id = auth.uid()::text)
  WITH CHECK (user_id = auth.uid()::text);
```

### Indexes
```sql
-- Essential indexes only
CREATE INDEX idx_user_configs_user_storage ON user_configs(user_id, storage_key);
CREATE INDEX idx_user_configs_updated_at ON user_configs(updated_at DESC);
```

## Implementation

### File Structure
```
src/lib/storage/
├── index.ts                 # Storage factory
├── local-storage.ts         # localStorage implementation  
├── supabase-storage.ts      # Supabase implementation
└── types.ts                 # Shared interfaces

src/lib/
└── supabase.ts              # Supabase client config
```

## File Previews

### Storage Factory with Migration
```typescript
// src/lib/storage/index.ts
import { Session } from 'next-auth';
import { StateStorage } from 'zustand/middleware';
import { createLocalStorage } from './local-storage';
import { createSupabaseStorage } from './supabase-storage';

export const STORAGE_NAME = 'app-store-storage';

export const createStorage = (session: Session | null): StateStorage => {
  if (session?.user?.id) {
    // Automatically migrate on first login
    migrateToSupabase(session.user.id);
    return createSupabaseStorage(session.user.id);
  }
  return createLocalStorage();
};

// Simple migration - local data takes precedence on first login
const migrateToSupabase = async (userId: string) => {
  const localData = localStorage.getItem(STORAGE_NAME);
  if (localData) {
    const supabaseStorage = createSupabaseStorage(userId);
    const existingConfig = await supabaseStorage.getItem(STORAGE_NAME);
    
    // Simple rule: if no remote config exists, migrate local data
    if (!existingConfig) {
      await supabaseStorage.setItem(STORAGE_NAME, localData);
      logger.info('✓ Migrated config to Supabase');
    }
    // If remote config exists, use it (cloud wins)
  }
};
```

### Types Definition
```typescript
// src/lib/storage/types.ts
export interface StateStorage {
  getItem: (name: string) => Promise<string | null>;
  setItem: (name: string, value: string) => Promise<void>;
  removeItem: (name: string) => Promise<void>;
}
```

### Local Storage Implementation
```typescript
// src/lib/storage/local-storage.ts
import { StateStorage } from './types';

export const createLocalStorage = (): StateStorage => {
  return {
    getItem: async (name: string): Promise<string | null> => {
      return localStorage.getItem(name);
    },
    setItem: async (name: string, value: string): Promise<void> => {
      localStorage.setItem(name, value);
    },
    removeItem: async (name: string): Promise<void> => {
      localStorage.removeItem(name);
    },
  };
};
```

### Supabase Storage Implementation
```typescript
// src/lib/storage/supabase-storage.ts
import { supabase } from '@/lib/supabase';
import { StateStorage } from './types';

export const createSupabaseStorage = (userId: string): StateStorage => {
  return {
    getItem: async (name: string): Promise<string | null> => {
      const { data, error } = await supabase
        .from('user_configs')
        .select('config')
        .eq('user_id', userId)
        .eq('storage_key', name)
        .single();

      if (error || !data) return null;
      return JSON.stringify(data.config);
    },

    setItem: async (name: string, value: string): Promise<void> => {
      const config = JSON.parse(value);
      
      await supabase
        .from('user_configs')
        .upsert({
          user_id: userId,
          storage_key: name,
          config,
          updated_at: new Date().toISOString()
        });
    },

    removeItem: async (name: string): Promise<void> => {
      await supabase
        .from('user_configs')
        .delete()
        .eq('user_id', userId)
        .eq('storage_key', name);
    },
  };
};
```

### Supabase Client Configuration
```typescript
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Simple client configuration
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true
  }
});
```

## Environment Configuration

### Local Development (.env.local)
```bash
# Local Supabase instance (Docker)
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=local-dev-secret
```

### Production (.env.production)
```bash
# Cloud Supabase instance
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-production-key

# NextAuth
NEXTAUTH_URL=https://yourdomain.com
NEXTAUTH_SECRET=production-secret
```


## Development Workflow

### Daily Development
```bash
# Option 1: Start everything
npm run dev:full

# Option 2: Manual steps
supabase start
bun run dev
```

### Database Operations
```bash
# View data in GUI
supabase studio  # http://localhost:54323

# Reset to clean state
supabase db reset

# Reset with test data
supabase db reset --with-seed
```

### Schema Changes
```bash
# Create migration
supabase migration new feature_name

# Apply migrations
supabase db push

# Generate TypeScript types
supabase gen types typescript --local > src/types/supabase.ts
```

## Migration Strategy

### Migration Logic Location
The migration logic is located in `src/lib/storage/index.ts` within the `createStorage` function. It automatically triggers when a user session exists, ensuring seamless data migration from localStorage to Supabase on first login.

### Simple Conflict Resolution
- **First Login**: If no remote config exists, migrate local data to Supabase
- **Subsequent Logins**: Use remote data (cloud is source of truth)
- **Fallback**: If Supabase fails, gracefully fallback to localStorage


## Implementation Phases

### Phase 1: Core Storage (Week 1)
- [ ] Set up local Supabase with Docker
- [ ] Create simple database schema
- [ ] Implement RLS policy
- [ ] Implement storage factory and implementations (3 files)
- [ ] Update app store integration
- [ ] Basic testing

### Phase 2: Migration & Polish (Week 2)
- [ ] Implement simple migration on login
- [ ] Add error handling and fallback to localStorage
- [ ] Comprehensive testing including edge cases
- [ ] User feedback for storage status

### Phase 3: Enhancement (Future)
- [ ] Real-time sync across tabs/devices
- [ ] Configuration versioning/history
- [ ] Backup/export functionality
- [ ] Analytics on usage patterns

## Success Metrics

### Technical
- Zero breaking changes for existing users
- <100ms storage operation latency
- 99.9% storage operation success rate
- Type-safe implementation throughout
- Graceful fallback to localStorage on failures

### User Experience  
- Transparent storage selection (no user configuration needed)
- Seamless cross-device sync for authenticated users
- Graceful fallback to localStorage on errors
- Clear feedback on storage status

## Package Dependencies

```bash
# Required packages
npm install @supabase/supabase-js

# Development tools
npm install -g @supabase/cli
```

## Resources

- [Supabase Local Development](https://supabase.com/docs/guides/cli/local-development)
- [NextAuth.js with Supabase](https://supabase.com/docs/guides/auth/auth-helpers/nextjs)
- [Zustand Persistence](https://docs.pmnd.rs/zustand/integrations/persisting-store-data)

## Risk Mitigation

### Technical Risks
- **Supabase service outage**: Automatic fallback to localStorage
- **Migration failures**: Non-destructive migration, keep local backup
- **Schema changes**: Versioned migrations with rollback capability

### User Experience Risks  
- **Slow network**: Implement timeout and fallback
- **Storage quota exceeded**: Error handling with user notification
- **Auth session issues**: Graceful degradation to localStorage

## Testing Strategy

### Overview
Minimal and straightforward testing approach following the established testing standards. Tests focus on critical paths with clear separation between unit, integration, and E2E tests.

### Test File Structure
```
src/lib/storage/tests/
├── index/
│   ├── index.unit.test.ts           # Storage factory tests
│   └── index.integration.test.ts    # Factory integration tests
├── local-storage/
│   └── local-storage.unit.test.ts   # LocalStorage implementation
├── supabase-storage/
│   ├── supabase-storage.unit.test.ts        # Supabase storage unit tests
│   └── supabase-storage.integration.test.ts # Database integration tests
├── migration/
│   ├── migration.unit.test.ts       # Migration logic tests
│   └── migration.integration.test.ts # End-to-end migration tests
└── storage.e2e.test.ts              # User workflow tests
```

### Unit Test Suites

#### Storage Factory Tests (`index.unit.test.ts`)
```typescript
describe('createStorage Factory', () => {
  it('should return localStorage when no session exists')
  it('should return supabaseStorage when session exists')
  it('should trigger migration when user logs in')
})
```

#### LocalStorage Implementation (`local-storage.unit.test.ts`)
```typescript
describe('LocalStorage Implementation', () => {
  describe('getItem', () => {
    it('should retrieve existing items')
    it('should return null for non-existent keys')
  })
  
  describe('setItem', () => {
    it('should store string values')
    it('should overwrite existing values')
  })
  
  describe('removeItem', () => {
    it('should delete existing items')
    it('should handle removing non-existent keys')
  })
})
```

#### Supabase Storage Implementation (`supabase-storage.unit.test.ts`)
```typescript
describe('SupabaseStorage Implementation', () => {
  describe('getItem', () => {
    it('should fetch config from Supabase')
    it('should return null when config not found')
    it('should handle database errors gracefully')
  })
  
  describe('setItem', () => {
    it('should create new config entry')
    it('should update existing config')
    it('should parse and stringify JSON correctly')
  })
  
  describe('removeItem', () => {
    it('should delete config from database')
    it('should handle non-existent config deletion')
  })
})
```

#### Migration Logic Tests (`migration.unit.test.ts`)
```typescript
describe('Storage Migration', () => {
  describe('migrateToSupabase', () => {
    it('should migrate when no remote config exists')
    it('should skip migration when remote config exists')
    it('should preserve local data during migration')
  })
  
  describe('Conflict Resolution', () => {
    it('should prioritize remote data over local (cloud wins)')
    it('should handle migration errors without data loss')
  })
})
```

### Integration Test Suites

#### Factory Integration Tests (`index.integration.test.ts`)
```typescript
describe('Storage Factory Integration', () => {
  it('should switch storage based on authentication state')
  it('should handle session changes dynamically')
})
```

#### Database Integration Tests (`supabase-storage.integration.test.ts`)
```typescript
describe('Supabase Storage Integration', () => {
  describe('Database Operations', () => {
    it('should perform CRUD operations on user_configs table')
    it('should enforce unique constraint on user_id + storage_key')
    it('should update timestamp on modifications')
  })
  
  describe('Row Level Security', () => {
    it('should only allow access to own configs')
    it('should deny access to other users configs')
  })
  
  describe('Network Resilience', () => {
    it('should handle network timeouts')
    it('should fallback to localStorage on Supabase errors')
  })
})
```

#### Migration Integration Tests (`migration.integration.test.ts`)
```typescript
describe('Storage Migration Integration', () => {
  it('should complete end-to-end migration on first login')
  it('should handle partial migration failures')
  it('should maintain data integrity during migration')
})
```

### E2E Test Suite

#### User Workflow Tests (`storage.e2e.test.ts`)
```typescript
describe('Storage System E2E', () => {
  describe('Anonymous User Flow', () => {
    test('saves configuration to localStorage')
    test('persists config across page refreshes')
  })
  
  describe('Authentication Flow', () => {
    test('migrates localStorage to Supabase on login')
    test('uses Supabase storage for authenticated sessions')
    test('reverts to localStorage on logout')
  })
  
  describe('Cross-Device Sync', () => {
    test('syncs config across multiple browser sessions')
    test('reflects changes in real-time across devices')
  })
  
  describe('Failure Scenarios', () => {
    test('falls back to localStorage when Supabase unavailable')
    test('handles auth session expiry gracefully')
  })
})
```

### Test Utilities & Fixtures

#### Test Fixtures
- `mockConfig` - Sample dashboard configuration
- `mockSession` - Sample NextAuth session
- `mockSupabaseResponse` - Sample database responses
- `mockUserConfigs` - Test data for user_configs table

#### Test Helpers
- `clearAllStorage()` - Reset localStorage and test database
- `seedLocalStorage()` - Populate localStorage with test data
- `mockSupabaseClient()` - Mock Supabase operations
- `waitForMigration()` - Wait for async migration completion
- `createTestSession()` - Generate test authentication sessions

### Test Execution Strategy

#### Coverage Targets
- **Unit Tests**: 90%+ code coverage of business logic
- **Integration Tests**: All Supabase operations and migration paths
- **E2E Tests**: Critical user workflows (login, sync, fallback)

#### Test Commands
```bash
# Run all storage tests
bun test src/lib/storage

# Run specific test types
bun test:unit src/lib/storage           # Fast, isolated tests
bun test:integration src/lib/storage    # API integration tests  
bun test:e2e src/lib/storage           # Browser automation tests

# Run with coverage
bun test --coverage src/lib/storage
```

#### CI/CD Pipeline Integration
1. **Unit Tests**: Run on every commit (< 30 seconds)
2. **Integration Tests**: Run on pull requests (< 2 minutes)
3. **E2E Tests**: Run before deployment (< 5 minutes)

#### Local Development Testing
```bash
# Start local Supabase for integration tests
supabase start

# Run tests with local database
bun test:integration src/lib/storage

# Reset test database
supabase db reset --with-seed
```

This testing strategy ensures comprehensive coverage while maintaining fast feedback loops and reliable test execution across all environments.

## Expected Outcomes

1. **For Anonymous Users**: Identical experience to current localStorage system
2. **For Authenticated Users**: Seamless config sync across all devices
3. **For Developers**: Clean, maintainable storage abstraction with local development environment
4. **For DevOps**: Simple deployment with environment-based configuration

This implementation provides the foundation for advanced features like real-time collaboration, configuration templates, and user analytics while maintaining the simplicity that makes Wassup dashboard easy to use.