# Storage E2E Tests

This directory now contains a minimal E2E test for localStorage-only behavior.

## Test Structure

```
src/lib/storage/tests/
├── storage-simple.e2e.test.ts  # Simple localStorage-only test
└── README.md                   # This file
```

## Running Tests

```bash
# Run all E2E tests
bun run test:e2e

# Or run vitest directly
bun test
```

## Notes

- The app persists configuration in `localStorage` only.
- Remote/cloud sync is intentionally not part of this build.
