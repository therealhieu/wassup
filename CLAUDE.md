# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

"Wassup" is a customizable dashboard application built with Next.js 15, TypeScript, and React 19. It displays various configurable widgets including weather, Reddit posts, YouTube videos, RSS feeds, bookmarks, and tabs to organize content.

## Development Commands

### Core Development
- `bun run dev` - Start development server with Turbopack (Next.js 15)
- `bun run build` - Build for production
- `bun run build-no-lint` - Build without linting (faster)
- `bun run start` - Start production server
- `bun run lint` - Run ESLint

### Testing & Quality
- `bun test` - Run unit tests with Vitest
- `bun run storybook` - Start Storybook development server on port 6006
- `bun run build-storybook` - Build Storybook

### Configuration
- `bun run watch-config` - Watch configuration changes

### Package Management
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

### Unit Tests (Vitest)
- Configuration: `vitest.config.ts`
- Integrated with Storybook test addon
- Runs in browser environment using Playwright
- Repository tests: `*.test.ts` files in infrastructure folders

### Component Testing (Storybook)
- Stories for all widget components: `*.stories.tsx`
- Includes both main components and skeleton loading states
- Test addon integration for automated story testing

### Browser Testing (Playwright)
- Available as dev dependency for E2E testing
- Integrated with Vitest browser testing

## Key Technical Details

### Framework Stack
- **Next.js 15** with App Router and Turbopack
- **React 19** with concurrent features
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

## Current TODOs
- Specify which widgets can load server-side
- Remove ergonomic caching methods  
- Move integration tests to correct locations
- Implement responsive design