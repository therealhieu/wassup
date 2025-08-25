# Code Style and Conventions

## Code Formatting (Prettier)
- **Tab Width**: 4 spaces
- **Use Tabs**: true (actual tab characters, not spaces)
- Configuration in `.prettierrc`

## TypeScript Configuration
- **Target**: ES2017
- **Strict Mode**: Enabled
- **Module Resolution**: bundler
- **JSX**: preserve (handled by Next.js)
- **Path Mapping**: `@/*` maps to `./src/*`
- **Library Support**: DOM, DOM.iterable, ESNext

## ESLint Configuration
- **Base Config**: Next.js core-web-vitals and TypeScript
- **Storybook Integration**: eslint-plugin-storybook for component stories
- **neverthrow Plugin**: For functional error handling patterns

## File Naming Conventions
- **Components**: PascalCase (e.g., `WeatherWidget.tsx`)
- **Stories**: Component name + `.stories.tsx` (e.g., `WeatherWidget.stories.tsx`)
- **Tests**: Component/module name + `.test.ts` (e.g., `weather.test.ts`)
- **Schemas**: Module name + `.schemas.ts` (e.g., `config.schemas.ts`)
- **Actions**: Module name + `.actions.ts` (e.g., `weather.actions.ts`)
- **Repositories**: Implementation type + module + `repository.ts` (e.g., `openmeteo.daily-weather-report.ts`)

## Directory Structure Conventions
- **Feature-Based Organization**: Each widget type has its own feature directory
- **Domain-Driven Design**: Layered architecture within features
  - `domain/` - Business entities and repository interfaces
  - `infrastructure/` - External concerns (config, repository implementations)
  - `presentation/` - UI components and stories
  - `services/` - Application logic and server actions

## Architecture Patterns
- **Repository Pattern**: Abstract data access through interfaces
- **Entity Pattern**: Business objects with validation schemas
- **Functional Error Handling**: Using `neverthrow` Result types
- **Type-Safe Configuration**: Zod schemas for all configuration
- **Server Actions**: Next.js server actions for data fetching
- **Component Stories**: Storybook stories for all UI components

## Import Conventions
- **Absolute Imports**: Use `@/` path mapping for src directory
- **Type Imports**: Use `import type` for type-only imports
- **Schema Exports**: Export both type and schema from same file

## Component Conventions
- **Props Interface**: Use TypeScript interfaces for component props
- **Default Export**: Components use default export
- **Skeleton Components**: Loading states as separate components with "Skeleton" suffix
- **Story Files**: Complete stories for components and skeletons

## Error Handling Conventions
- **Result Types**: Use `neverthrow` Result<T, E> for error-prone operations
- **Type-Safe Errors**: Define specific error types for different failure modes
- **Repository Returns**: Repositories return Result types, not throw exceptions

## Validation Conventions
- **Zod Schemas**: All data validation uses Zod
- **Schema Co-location**: Schemas defined alongside domain entities
- **Runtime Validation**: Parse external data with schema validation
- **Type Inference**: Use Zod's inferred types for TypeScript types