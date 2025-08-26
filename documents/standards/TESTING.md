# Testing Standards

This document defines the testing standards and practices for the Wassup project, establishing a comprehensive three-tier testing strategy with clear file organization and naming conventions.

## Testing Philosophy

We follow a **test pyramid approach** that emphasizes:
- **Many Unit Tests**: Fast, isolated, focused testing of individual components
- **Some Integration Tests**: Module interaction and API testing
- **Few E2E Tests**: Critical user journey validation

**Core Principles:**
- Fast feedback loops with comprehensive coverage
- Tests should be reliable, maintainable, and provide clear failure messages
- Test organization should mirror source code structure
- Each test type serves a specific purpose and scope

## File Organization Structure

All test files are organized in dedicated `tests/` folders with clear separation by test type.

### Naming Convention Pattern

For any source file, tests are organized as follows:

```
src/path/to/module.ts
src/path/to/tests/
  module/
    module.unit.test.ts       # Unit tests
    module.integration.test.ts # Integration tests
    module.e2e.test.ts        # E2E tests
```

### Examples

**For `src/lib/utils.ts`:**
```
src/lib/
  utils.ts
  tests/
    utils/
      utils.unit.test.ts
      utils.integration.test.ts
      utils.e2e.test.ts
```

**For `src/features/weather/services/weather.ts`:**
```
src/features/weather/services/
  weather.ts
  tests/
    weather/
      weather.unit.test.ts
      weather.integration.test.ts
      weather.e2e.test.ts
```

## Test Types & Scope

### Unit Tests (`.unit.test.ts`)

**Purpose:** Test individual functions, classes, or components in complete isolation.

**Characteristics:**
- No external dependencies (APIs, databases, file system)
- Fast execution (< 100ms per test)
- Extensive mocking of dependencies
- High code coverage focus

**What to Test:**
- Pure functions and their edge cases
- Component rendering with different props
- Business logic validation
- Error handling scenarios
- Input validation and sanitization

**Example Structure:**
```typescript
import { describe, expect, it, vi } from "vitest";
import { functionToTest } from "../module";

describe('functionToTest', () => {
    it('should handle valid input correctly', () => {
        // Test implementation
    });
    
    it('should throw error for invalid input', () => {
        // Test implementation
    });
});
```

### Integration Tests (`.integration.test.ts`)

**Purpose:** Test interactions between modules, components, or external services.

**Characteristics:**
- Tests module boundaries and data flow
- May include controlled external dependencies
- Moderate execution time (< 5s per test)
- Focus on interface contracts

**What to Test:**
- API integrations with real or mock servers
- Database operations (with test database)
- Module interactions and data transformation
- Configuration loading and validation
- Repository pattern implementations

**Example Structure:**
```typescript
import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { IntegrationService } from "../service";

describe('IntegrationService', () => {
    beforeEach(() => {
        // Setup test environment
    });
    
    afterEach(() => {
        // Cleanup
    });
    
    it('should integrate with external API correctly', async () => {
        // Test implementation
    });
});
```

### E2E Tests (`.e2e.test.ts`)

**Purpose:** Test complete user workflows and critical application paths.

**Characteristics:**
- Full browser automation with Playwright
- Tests real user interactions
- Slower execution (5s+ per test)
- Cross-browser compatibility testing

**What to Test:**
- Complete user workflows (login -> dashboard -> widget interaction)
- Critical business processes
- Cross-browser compatibility
- Visual regression testing
- Performance monitoring
- Accessibility compliance

**Example Structure:**
```typescript
import { test, expect } from '@playwright/test';

test.describe('Dashboard Workflow', () => {
    test('should load dashboard and display widgets', async ({ page }) => {
        await page.goto('/');
        
        // Test user interactions
        await expect(page.locator('[data-testid="weather-widget"]').toBeVisible());
    });
});
```

## Framework Configuration

### Current Setup

**Vitest Configuration** (`vitest.config.ts`):
- Browser testing with Playwright integration
- Storybook test addon for component testing
- V8 coverage reporting
- Workspace configuration for multiple test environments

**Available Testing Tools:**
- **Vitest 3.1.2**: Primary testing framework
- **Playwright 1.52.0**: Browser automation and E2E testing
- **Storybook Test Addon**: Component visual testing
- **@vitest/browser**: Browser-based unit testing
- **@vitest/coverage-v8**: Code coverage analysis

## Running Tests

### Available Commands

```bash
# Run all tests
bun test

# Run specific test types (to be added)
bun test:unit        # Unit tests only
bun test:integration # Integration tests only  
bun test:e2e        # E2E tests only

# Run tests with coverage
bun test --coverage

# Run tests in watch mode
bun test --watch

# Run Storybook tests
bun run storybook
```

### Test Execution Strategy

1. **Development**: Fast unit tests for immediate feedback
2. **Pre-commit**: Unit + integration tests
3. **CI/CD**: Full test suite including E2E tests
4. **Deployment**: Smoke tests on production environment

## E2E Testing Guidelines

### Page Object Model Pattern

Organize E2E tests using the Page Object Model for maintainability:

```typescript
// page-objects/DashboardPage.ts
export class DashboardPage {
    constructor(private page: Page) {}
    
    async navigateTo() {
        await this.page.goto('/');
    }
    
    async getWeatherWidget() {
        return this.page.locator('[data-testid="weather-widget"]');
    }
}
```

### Browser Testing Strategy

- **Primary**: Chromium (fastest, most reliable)
- **Secondary**: Firefox and Safari (compatibility testing)
- **Mobile**: Device emulation for responsive testing

### Performance Monitoring

```typescript
test('dashboard should load within performance budget', async ({ page }) => {
    const response = await page.goto('/');
    
    // Assert performance metrics
    const loadTime = await page.evaluate(() => 
        performance.timing.loadEventEnd - performance.timing.navigationStart
    );
    expect(loadTime).toBeLessThan(3000); // 3 second budget
});
```

## Best Practices

### General Testing Principles

1. **Test Naming**: Use descriptive test names that explain the scenario
   ```typescript
   // Good
   it('should return weather data when valid location is provided')
   
   // Bad
   it('should work')
   ```

2. **Test Organization**: Group related tests using `describe` blocks
3. **Setup/Teardown**: Use `beforeEach`/`afterEach` for test isolation
4. **Assertions**: Use specific matchers and meaningful error messages

### Mocking Strategies

**Unit Tests**: Mock all external dependencies
```typescript
vi.mock('../external-service', () => ({
    fetchData: vi.fn().mockResolvedValue(mockData)
}));
```

**Integration Tests**: Mock only external APIs, use real internal modules
```typescript
// Mock external API
vi.mock('node-fetch');

// Use real internal modules
import { processData } from '../internal-service';
```

**E2E Tests**: Use real services or dedicated test environments

### Test Data Management

1. **Fixtures**: Store test data in `fixtures/` folders
2. **Factories**: Use factory functions for generating test data
3. **Cleanup**: Ensure test data is cleaned up after each test

### Parallel Execution

- Unit tests: Run in parallel by default
- Integration tests: Limited parallelism for shared resources
- E2E tests: Sequential execution to avoid conflicts

## Migration Guide

### Migrating Existing Tests

**Current State:** Tests are co-located with source files
**Target State:** Tests in dedicated `tests/` folders

**Migration Steps:**

1. **Identify Test Files**: Find existing `*.test.ts` files
2. **Create Test Directories**: Create `tests/{module}/` structure
3. **Move and Rename**: Move tests to new location with type suffix
4. **Update Imports**: Adjust import paths to reference source files
5. **Categorize Tests**: Determine if existing tests are unit, integration, or E2E
6. **Add Missing Test Types**: Create additional test files for missing coverage

**Example Migration:**
```bash
# Before
src/features/weather/services/weather.test.ts

# After
src/features/weather/services/tests/weather/
  weather.unit.test.ts       # Isolated logic tests
  weather.integration.test.ts # API integration tests
  weather.e2e.test.ts        # Full workflow tests
```

### Gradual Migration Approach

1. **Phase 1**: New tests follow new structure
2. **Phase 2**: Migrate critical path tests
3. **Phase 3**: Complete migration of remaining tests

## CI/CD Integration

### Test Pipeline Structure

```yaml
# Example CI configuration
test:
  unit:
    runs-on: ubuntu-latest
    steps:
      - run: bun test:unit
  
  integration:
    runs-on: ubuntu-latest
    services:
      - postgres
    steps:
      - run: bun test:integration
      
  e2e:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        browser: [chromium, firefox]
    steps:
      - run: bun test:e2e
```

### Quality Gates

- **Unit Tests**: 80%+ code coverage
- **Integration Tests**: All API endpoints covered
- **E2E Tests**: All critical user paths tested
- **Performance**: Load time < 3s, Core Web Vitals thresholds met

## Tooling and Utilities

### Test Utilities Location

```
src/
  testing/
    fixtures/          # Test data
    mocks/            # Mock implementations
    factories/        # Test data factories
    utils/            # Testing utilities
```

### Recommended Testing Libraries

- **@testing-library/react**: Component testing utilities
- **msw**: API mocking for integration tests
- **faker**: Generate realistic test data
- **@playwright/test**: E2E testing framework

## Accessibility Testing

### A11y Testing in E2E Tests

```typescript
import { injectAxe, checkA11y } from 'axe-playwright';

test('dashboard should be accessible', async ({ page }) => {
    await page.goto('/');
    await injectAxe(page);
    await checkA11y(page);
});
```

## Performance Testing

### Core Web Vitals Monitoring

```typescript
test('should meet Core Web Vitals thresholds', async ({ page }) => {
    await page.goto('/');
    
    const metrics = await page.evaluate(() => ({
        lcp: performance.getEntriesByType('largest-contentful-paint')[0]?.startTime,
        fid: performance.getEntriesByType('first-input')[0]?.processingStart,
        cls: performance.getEntriesByType('layout-shift').reduce((cls, entry) => cls + entry.value, 0)
    }));
    
    expect(metrics.lcp).toBeLessThan(2500); // 2.5s
    expect(metrics.cls).toBeLessThan(0.1);   // 0.1
});
```

This testing standard ensures consistent, comprehensive, and maintainable testing practices across the Wassup project, supporting both development velocity and application quality.
