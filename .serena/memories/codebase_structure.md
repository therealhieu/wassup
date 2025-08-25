# Codebase Structure

## Root Directory Structure
```
wassup/
├── .storybook/           # Storybook configuration
├── public/               # Static assets
├── resources/            # Static data files for development/testing
├── scripts/              # Build and utility scripts
├── src/                  # Source code (main application)
├── package.json          # Dependencies and scripts
├── tsconfig.json         # TypeScript configuration
├── eslint.config.mjs     # ESLint configuration
├── vitest.config.ts      # Vitest testing configuration
├── next.config.ts        # Next.js configuration
└── CLAUDE.md            # Project documentation for AI assistance
```

## Source Directory (`src/`) - DDD Architecture

### Application Layer (`src/app/`)
- **Next.js App Router structure**
- `layout.tsx` - Root layout component
- `[[...page]]/page.tsx` - Catch-all dynamic route
- `api/` - API routes (NextAuth, ping, fetch-title)

### Feature Layer (`src/features/`) - Domain-Driven Design
Each widget follows clean architecture:

```
src/features/{widget-type}/
├── domain/
│   ├── entities/          # Business entities with Zod schemas
│   └── repositories/      # Repository interfaces (contracts)
├── infrastructure/
│   ├── config.schemas.ts  # Widget configuration schemas
│   └── repositories/      # Repository implementations
├── presentation/
│   ├── {Widget}.tsx      # Main widget component
│   ├── {Widget}.stories.tsx # Storybook stories
│   └── {Widget}Skeleton.tsx # Loading states
└── services/
    └── {widget}.actions.ts   # Next.js server actions
```

### Available Widget Features:
- `bookmark/` - Organized bookmark groups
- `feed/` - RSS/Atom feed aggregation
- `reddit/` - Reddit post display
- `skeleton/` - Placeholder/loading widget
- `tabs/` - Tab container for organizing widgets
- `weather/` - Weather information display
- `youtube/` - YouTube video display
- `geocoding/` - Location services (shared utility)

### Infrastructure Layer (`src/infrastructure/`)
- `config.schemas.ts` - Master configuration schema
- Core schemas that unite all widget configurations

### Shared Libraries (`src/lib/`)
- `constants.ts` - Application constants and default configuration
- `schemas.ts` - Shared validation schemas
- `utils.ts` - Utility functions
- `logger.ts` - Logging configuration
- `actions.ts` - Shared server actions

### UI Components (`src/components/`)
- `app-bar/` - Application header and navigation components
- `DashboardPage.tsx` - Main dashboard layout
- `DashboardColumn.tsx` - Column layout component
- `Widget.tsx` - Generic widget wrapper
- `ErrorWidget.tsx` - Error display component
- Theme and mode-aware rendering components

### State Management (`src/stores/`)
- `app-store.ts` - Main Zustand store
- `slices/` - Store slices for different concerns
  - `app-config-slice.ts` - Configuration state
  - `widget-cache-slice.ts` - Widget caching state

### Providers (`src/providers/`)
- `ReactQueryProvider.tsx` - React Query setup
- `AppStoreContextProvider.tsx` - Zustand store provider

### Development (`src/stories/`)
- Storybook examples and assets
- Component documentation and testing

## Key Architectural Principles

### Domain-Driven Design (DDD)
- **Domain Layer**: Business logic and entities
- **Infrastructure Layer**: External concerns (APIs, config, persistence)
- **Presentation Layer**: UI components and user interactions
- **Application Layer**: Use cases and orchestration (services)

### Repository Pattern
- Abstract data access through interfaces in domain layer
- Concrete implementations in infrastructure layer
- Enables testing with mock repositories
- Clean separation between business logic and data access

### Configuration Management
- Master schema in `src/infrastructure/config.schemas.ts`
- Widget-specific schemas in each feature's infrastructure
- Type-safe configuration with Zod validation
- Default configuration in `src/lib/constants.ts`

### Component Architecture
- Main component + Skeleton loading state
- Storybook stories for all components
- Error boundaries and graceful degradation
- Material-UI integration with custom theming