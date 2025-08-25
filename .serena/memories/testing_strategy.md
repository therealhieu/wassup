# Testing Strategy

## Testing Framework
- **Primary**: Vitest 3.1.2 with browser testing
- **Browser Provider**: Playwright for E2E and browser testing
- **Component Testing**: Storybook Test Addon integration
- **Coverage**: V8 coverage reporting

## Testing Configuration (vitest.config.ts)
```typescript
// Browser-based testing with Playwright
test: {
  browser: {
    enabled: true,
    headless: true,
    provider: "playwright",
    instances: [{ browser: "chromium" }]
  }
}
```

## Test File Conventions

### Unit Tests
- **Pattern**: `*.test.ts` files co-located with source code
- **Location**: Usually in `infrastructure/` directories for repositories
- **Examples**: 
  - `src/features/weather/services/weather.test.ts`
  - `src/features/youtube/infrastructure/repositories/page-source.youtube-channel-repository.test.ts`
  - `src/features/feed/infrastructure/repositories/rss.feed-respository.test.ts`

### Component Tests via Storybook
- **Pattern**: `*.stories.tsx` files for every component
- **Integration**: Storybook Test Addon runs stories as tests
- **Coverage**: Both main components and skeleton loading states

### Story File Examples
```
src/features/weather/presentation/WeatherWidget.stories.tsx
src/features/weather/presentation/WeatherWidgetSkeleton.stories.tsx
src/components/app-bar/ConfigEditor.stories.tsx
```

## Testing Layers

### 1. Repository Layer Testing
- **Focus**: Data access and external API integration
- **Mocking**: External API calls and network requests
- **Validation**: Data transformation and error handling
- **Example**: Testing OpenMeteo weather API integration

### 2. Component Layer Testing (via Storybook)
- **Focus**: UI rendering and user interactions
- **Stories**: Different component states and props
- **Visual Testing**: Component appearance and behavior
- **Accessibility**: Built-in a11y testing through Storybook

### 3. Service Layer Testing
- **Focus**: Business logic and server actions
- **Integration**: Testing service orchestration
- **Error Handling**: neverthrow Result type testing

### 4. Browser Testing
- **Provider**: Playwright with Chromium
- **Scope**: End-to-end user workflows
- **Real Browser**: Actual DOM and JavaScript execution

## Running Tests

### Commands
- `bun test` - Run all tests with Vitest
- `bun run storybook` - Start Storybook for visual component testing
- `bun run build-storybook` - Build Storybook with tests

### Test Execution Flow
1. **Unit Tests**: Repository and service layer tests
2. **Story Tests**: Automated testing of Storybook stories
3. **Browser Tests**: Playwright-based browser execution
4. **Coverage**: V8 coverage collection and reporting

## Test Organization

### Repository Tests
```
src/features/{widget}/infrastructure/repositories/{implementation}.test.ts
```
Focus on:
- API integration correctness
- Data transformation accuracy
- Error handling robustness
- Schema validation

### Component Stories
```
src/features/{widget}/presentation/{Component}.stories.tsx
src/features/{widget}/presentation/{Component}Skeleton.stories.tsx
```
Focus on:
- Different component states
- Props variation testing
- Loading and error states
- Responsive behavior

## Testing Utilities
- **Playwright**: Browser automation and E2E testing
- **Storybook Test Addon**: Automated story testing
- **Vitest Browser Mode**: Real browser environment for testing
- **V8 Coverage**: Comprehensive code coverage reporting
- **Bun Test Runner**: Native Bun test execution with enhanced performance

## Best Practices
1. **Co-location**: Tests near the code they test
2. **Story-Driven**: Use Storybook stories as living documentation and tests
3. **Browser Reality**: Test in real browser environments
4. **Repository Pattern**: Mock external dependencies in repository tests
5. **Type Safety**: Leverage TypeScript for test reliability
6. **Bun Performance**: Leverage Bun's fast test runner for improved developer experience

## Bun Testing Benefits
- ⚡ **Faster test execution** - Bun's native test runner is significantly faster
- 🔧 **Built-in mocking** - Native mocking capabilities without additional setup
- 📦 **Better module resolution** - Improved handling of TypeScript and JSX
- 🧠 **Smart watching** - Intelligent file watching for test re-runs