# Storage E2E Tests

This directory contains comprehensive E2E tests for the Supabase storage feature, testing the dual localStorage/Supabase storage strategy.

## Test Structure

```
src/lib/storage/tests/
├── storage.e2e.test.ts          # Main E2E test suite
├── page-objects/                # Page Object Models
│   ├── DashboardPage.ts         # Dashboard interactions
│   ├── AuthPage.ts              # Authentication flows
│   └── ConfigEditorPage.ts      # Config editor interactions
├── helpers/                     # Test utilities
│   ├── storageHelpers.ts        # localStorage operations
│   └── supabaseHelpers.ts       # Database operations
├── fixtures/                    # Test data
│   ├── mockConfig.ts            # Mock configurations
│   └── mockSession.ts           # Mock user sessions
└── README.md                    # This file
```

## Running Tests

### Prerequisites

1. **Local Supabase running:**
   ```bash
   supabase start
   ```

2. **Environment variables set:**
   Ensure `.env.local` contains:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-local-anon-key
   ```

### Test Commands

```bash
# Run all E2E tests
bun run test:e2e

# Run only storage E2E tests
bun run test:storage

# Run with coverage
bun run test:coverage

# Run in watch mode
bun run test:e2e --watch
```

### Test Environment Setup

The tests automatically:
- Clear localStorage before each test
- Reset Supabase database state
- Clean up authentication state
- Handle network mocking for failure scenarios

## Test Scenarios

### Anonymous User Flow
- ✅ Configuration saves to localStorage
- ✅ Config persists across page refreshes  
- ✅ Multiple config updates work correctly

### Authentication Flow
- ✅ localStorage migrates to Supabase on first login
- ✅ Authenticated users use Supabase storage
- ✅ Logout reverts to localStorage

### Cross-Device Sync
- ✅ Config syncs across multiple browser sessions
- ✅ Different users have independent configs
- ✅ Real-time updates across devices

### Failure Scenarios
- ✅ Fallback to localStorage when Supabase unavailable
- ✅ Graceful handling of auth session expiry
- ✅ Recovery when network connection restored

## Test Data

The tests use mock data from `fixtures/`:
- **Mock Configurations:** Simple and expanded dashboard configs in JSON/YAML formats
- **Mock Users:** Test user accounts with IDs matching database seed data
- **Mock Sessions:** NextAuth session objects for authentication testing

## Debugging Tests

### Browser Mode
Run tests with visible browser for debugging:
```bash
bun run test:storage -- --browser.headless=false
```

### Console Logs
Tests include detailed logging for:
- Storage operations
- Authentication state changes  
- Database operations
- Network requests

### Database Inspection
View test data in Supabase Studio:
```bash
supabase studio  # http://localhost:54323
```

## Common Issues

### Test Timeouts
If tests timeout, check:
- Supabase is running (`supabase status`)
- Database migrations applied (`supabase db reset`)
- Environment variables are correct

### Authentication Failures
The tests use mock authentication instead of real OAuth:
- No need for Google/GitHub API keys
- Mock sessions simulate authenticated state
- Auth state is cleared between tests

### Storage Conflicts
Tests automatically clear storage between runs:
- localStorage cleared before each test
- Supabase user_configs table reset
- No manual cleanup required

## Contributing

When adding new tests:
1. Follow the Page Object Model pattern
2. Use existing fixtures and helpers
3. Clear state in beforeEach/afterEach
4. Add meaningful test descriptions
5. Test both success and failure scenarios

## Architecture Testing

These E2E tests validate the storage architecture:
- **Factory Pattern**: Correct storage selection based on auth state
- **Migration Logic**: localStorage → Supabase data transfer
- **Conflict Resolution**: Cloud-wins strategy for subsequent logins
- **Fallback Strategy**: Graceful degradation to localStorage
- **Cross-Device Sync**: Real-time configuration synchronization