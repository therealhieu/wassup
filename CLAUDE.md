# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

"Wassup" is a customizable dashboard application built with Next.js 15, TypeScript, and React 19. It displays various configurable widgets including weather, Reddit posts, YouTube videos, RSS feeds, bookmarks, and tabs to organize content.

## Development Commands

### Environment Setup
- Development server loads environment variables from `.env.local`
- Default Supabase configuration for local development:
  - URL: `http://127.0.0.1:54321`
  - Requires Supabase CLI for local development

### Core Development
- `bun run dev` - Start development server with Turbopack (Next.js 15.5)
- `bun run build` - Build for production
- `bun run build-no-lint` - Build without linting (faster)
- `bun run start` - Start production server
- `bun run lint` - Run ESLint CLI (migrated from next lint for Next.js 16 compatibility)

### Testing & Quality
- `bun test` - Run all tests with Vitest
- `bun run test:unit` - Run unit tests only
- `bun run test:integration` - Run integration tests only
- `bun run test:e2e` - Run E2E tests with Playwright (Firefox)
- `bun run test:storage` - Run specific storage E2E tests
- `bun run test:coverage` - Run tests with coverage report
- `bun run storybook` - Start Storybook development server on port 6006
- `bun run build-storybook` - Build Storybook

### Configuration
- `bun run watch-config` - Watch configuration changes

### Package Management
**Note: Bun is the preferred package manager for this project** (25x faster installs than npm)
- `bun install` - Install dependencies
- `bun add <package>` - Add new dependency
- `bun add -d <package>` - Add dev dependency
- `bun update` - Update all dependencies
- `bun update <package>` - Update specific package

## Architecture

### Feature-Based Organization
Each widget type follows Domain-Driven Design (DDD) with clean architecture:

```
src/features/{widget-type}/
├── domain/
│   ├── entities/          # Business entities
│   └── repositories/      # Repository interfaces
├── infrastructure/
│   ├── config.schemas.ts  # Zod validation schemas
│   └── repositories/      # Repository implementations
├── presentation/
│   ├── {Widget}.tsx      # Main widget component
│   ├── {Widget}.stories.tsx # Storybook stories
│   └── {Widget}Skeleton.tsx # Loading states
└── services/
    └── {widget}.actions.ts   # Server actions
```

### Available Widget Types
- `weather` - Weather information using OpenMeteo API
- `reddit` - Reddit posts from specified subreddits
- `youtube` - YouTube videos from specified channels
- `feed` - RSS/Atom feed aggregation
- `bookmark` - Organized bookmark groups
- `tabs` - Tab container for organizing other widgets
- `skeleton` - Placeholder/loading widget

### Configuration System
- Widgets are configured through `src/lib/constants.ts` using the `AppConfig` schema
- Configuration uses Zod schemas for type safety and validation
- Default config defines dashboard layout with columns (1-12 grid system) and widget placement
- Authentication controls which config is displayed (skeleton vs full config)

### State Management
- **Zustand** for application state (`src/stores/`)
- **React Query** for server state and caching (`@tanstack/react-query`)
- **NextAuth.js** for authentication
- Store slices: `app-config-slice.ts`, `widget-cache-slice.ts`

### Key Directories
- `src/components/` - Shared UI components and app bar
- `src/stores/` - Zustand stores and state management
- `src/providers/` - React context providers
- `src/infrastructure/` - Core configuration schemas
- `src/lib/` - Shared utilities, constants, and schemas
- `resources/` - Static data files for development/testing

## Testing Strategy

### Test Projects Structure
The testing setup uses Vitest with multiple project configurations:

#### Unit Tests
- **Files**: `*.{test,spec}.ts` and `*.unit.test.ts`
- **Excludes**: Integration and E2E tests
- **Environment**: Node.js with Supabase environment variables

#### Integration Tests  
- **Files**: `*.integration.test.ts`
- **Environment**: Node.js with Supabase environment variables

#### E2E Tests
- **Files**: `*.e2e.test.ts`
- **Browser**: Firefox via Playwright (headless)
- **Environment**: Full browser environment with Supabase

#### Storybook Tests
- **Integration**: Storybook experimental test addon
- **Browser**: Chromium via Playwright
- **Coverage**: Automated story testing and interaction testing

## Key Technical Details

### Framework Stack
- **Next.js 15.5** with App Router and Turbopack
- **React 19.1** with concurrent features
- **TypeScript 5** for type safety
- **Material-UI v7** for UI components
- **Tailwind CSS v4** for styling

### Data Fetching
- Server Actions for widget data (`{widget}.actions.ts`)
- React Query for caching and background updates
- Repository pattern for data access abstraction

### Authentication
- NextAuth.js v5 beta with session management
- Conditional config loading based on auth state
- Protected widget features and configurations

### Error Handling
- `neverthrow` library for functional error handling
- Type-safe error propagation throughout the application

### Database & Storage
- **Supabase** for backend services and database
- Local development uses Supabase CLI on `http://127.0.0.1:54321`
- Browser storage using IndexedDB via `idb-keyval` for client-side caching

## Development Patterns

### Adding New Widgets
1. Create feature folder following DDD structure
2. Define domain entities and repository interface
3. Implement infrastructure with config schema and repository
4. Create presentation components with stories
5. Add widget type to union schema in `src/infrastructure/config.schemas.ts`
6. Update configuration in `src/lib/constants.ts`

### Configuration Schema Updates
- All widget configs use Zod for validation
- Update schemas in `{widget}/infrastructure/config.schemas.ts`
- Export schema to main config union in `src/infrastructure/config.schemas.ts`

### Repository Pattern
- Abstract data access through repository interfaces in domain layer
- Concrete implementations in infrastructure layer
- Enables testing with mock repositories and clean separation of concerns

## Memories

### MCPs
- Use postgres mcp to query local supabase
- Use playwright mcp when need to perform UI operations
- Use the mui-mcp server to answer any MUI questions
  - call the "useMuiDocs" tool to fetch the docs of the package relevant in the question
  - call the "fetchDocs" tool to fetch any additional docs if needed using ONLY the URLs present in the returned content.
  - repeat steps 1-2 until you have fetched all relevant docs for the given question
  - use the fetched content to answer the question