# Project Overview: Wassup Dashboard

## Purpose
"Wassup" is a customizable dashboard application designed to display various configurable widgets in a flexible layout. It serves as a personal dashboard for displaying weather, Reddit posts, YouTube videos, RSS feeds, bookmarks, and tabs to organize content.

## Key Features
- **Customizable Widgets**: Multiple widget types including weather, reddit, youtube, feed, bookmark, tabs, and skeleton
- **Flexible Layout**: 1-12 column grid system for organizing widgets
- **Configuration Management**: JSON-based configuration with real-time editing capabilities
- **Authentication**: NextAuth.js integration with conditional config loading
- **Theme Support**: Light/dark theme switching
- **Real-time Updates**: React Query for background data updates and caching
- **Storybook Integration**: Component documentation and testing

## Architecture Philosophy
- **Domain-Driven Design (DDD)**: Clean architecture with feature-based organization
- **Repository Pattern**: Abstracted data access for testability and separation of concerns
- **Type Safety**: Comprehensive TypeScript usage with Zod validation schemas
- **Error Handling**: Functional error handling using the `neverthrow` library
- **Performance**: Next.js 15 with Turbopack, React 19 concurrent features, and intelligent caching

## Target Users
Developers and power users who want a customizable, lightweight dashboard for aggregating information from various sources.