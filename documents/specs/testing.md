# Wassup — Testing Standards

## Philosophy

Test pyramid: many unit tests, some integration tests, few E2E tests. Tests must be fast, reliable, and provide clear failure messages.

## File Organization

Tests live in `tests/` folders co-located with source code:

```
src/path/to/module.ts
src/path/to/tests/
  module/
    module.unit.test.ts
    module.integration.test.ts
```

## Test Types

### Unit Tests (`.unit.test.ts`)

- No external dependencies
- Fast (<100ms per test)
- Mock all external dependencies
- Test pure functions, edge cases, error handling

### Integration Tests (`.integration.test.ts`)

- Test module boundaries and data flow
- May use real external services
- Moderate execution time (<5s per test)
- Focus: repository implementations, API integrations

### E2E Tests (`.e2e.test.ts`)

- Full browser automation with Playwright
- Test complete user workflows
- Sequential execution

## Commands

```bash
bun test                  # All tests
bun run test:unit         # Unit only
bun run test:integration  # Integration only
bun run test:e2e          # E2E only
bun test --coverage       # With coverage
bun test --watch          # Watch mode
```

## Best Practices

1. **Naming**: Descriptive — `it('should return weather data when valid location is provided')`
2. **Isolation**: `beforeEach` / `afterEach` for setup/teardown
3. **Mocking**:
   - Unit: mock all external deps
   - Integration: mock only external APIs, use real internal modules
   - E2E: real services
4. **Test data**: Use fixtures in `fixtures/` folders, factory functions for generation

## Execution Strategy

| Context | Scope |
|---------|-------|
| Development | Unit tests (fast feedback) |
| Pre-commit | Unit + integration |
| CI/CD | Full suite including E2E |
