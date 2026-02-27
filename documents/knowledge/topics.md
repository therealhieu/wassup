# Wassup — Lesson Topics

Topics and lessons inferred from building the Wassup project. Each topic maps to a real engineering decision made during development.

---

## Architecture & Design

> 📄 **Full lesson:** [architecture-and-design.md](./architecture-and-design.md)

### 1. Dashboard Architecture Patterns
- Multi-column, multi-widget layout with independent widget lifecycles
- Pluggable widget system: each widget owns its own config schema, data fetching, and rendering
- Configuration-driven rendering vs hardcoded layouts

### 2. Configuration-Driven UIs
- Defining app behavior through a JSON schema (presets, widget configs)
- Seed presets vs user-created presets
- Schema versioning and migration strategies

### 3. Zero-Knowledge Encryption
- Client-side encryption using the Web Crypto API
- Ensuring the server never sees plaintext user data
- Key derivation, encryption/decryption flows, and trust model

---

## React & Next.js

> 📄 **Full lesson:** [react-and-nextjs.md](./react-and-nextjs.md)

### 4. React 19 Performance Patterns
- Memoization (`React.memo`, `useMemo`, `useCallback`) in data-heavy dashboards
- Avoiding re-renders when multiple widgets fetch data independently
- Profiling and identifying render bottlenecks

### 5. Hydration Mismatch Debugging
- What causes server/client HTML mismatches in Next.js App Router
- Diagnosing hydration errors with React DevTools
- Patterns to avoid: dynamic values at render time, browser-only APIs in SSR

### 6. Cross-Column Drag and Drop (dnd-kit)
- Lifting `DndContext` to a shared parent for cross-container dragging
- Stable widget IDs using `WeakMap`
- Optimistic state management during drag: `onDragStart`, `onDragOver`, `onDragEnd`, `onDragCancel`
- Reverting state on cancelled drags

### 7. Upgrading Major Framework Versions (Next.js 16, React 19)
- Dependency compatibility auditing (e.g., MUI AppRouterCacheProvider)
- Handling breaking changes in client component restrictions
- Incremental adoption strategies

---

## Auth & Security

> 📄 **Full lesson:** [auth-and-security.md](./auth-and-security.md)

### 8. NextAuth.js + OAuth Integration
- Setting up GitHub OAuth with NextAuth.js in Next.js App Router
- Session management and protected routes
- Handling OAuth callback flows

### 9. Content Security Policy (CSP) in Practice
- Why CSP exists and what it protects against
- Common pitfalls: `form-action`, `img-src`, `connect-src` for third-party APIs
- Iterating on CSP without breaking OAuth redirects, external images (Reddit, RSS)

---

## Data & Persistence

> 📄 **Full lesson:** [data-and-persistence.md](./data-and-persistence.md)

### 10. Write-Through Cache Strategy
- `localStorage` as a fast local cache, server API as source of truth
- Handling anonymous vs authenticated user flows
- Conflict resolution and sync timing

### 11. Prisma + PostgreSQL for Solo/Small Projects
- When a Docker-managed database is the right choice
- Integrating Prisma with Next.js server actions
- Schema design and migrations for a single-user / small-user app

### 12. Encrypted Sync Hook (`useEncryptedSync`)
- Custom hook design for transparent encrypt-on-write, decrypt-on-read
- Stabilizing `useEffect` dependencies to avoid infinite re-render loops
- Testing encryption round-trips

---

## UI & UX

### 13. Visual Config Editor
- Building a form-based editor for complex nested configurations
- `WidgetFormDialog`: inline editing for tabs, widget types, and child widgets
- Schema-driven form generation

### 14. Preset System UX
- Preset selector with drag-and-drop reordering
- Inline renaming, import/export (JSON file), delete with confirmation dialog
- Seed presets vs user presets: display logic and fallback behavior

### 15. Widget Library Design
- Feed (RSS), GitHub, Reddit, YouTube, Weather, Hacker News, Bookmarks, Tabs
- Each widget: config schema, API route, client component, error/loading states
- Adding a new widget end-to-end

---

## Testing & Quality

### 16. Testing Strategies for a Dashboard App
- Unit testing widget logic and config parsing
- Integration testing API routes
- E2E considerations: preset switching, drag-and-drop, auth flows

### 17. Debugging Production Issues
- Reddit API IP-based blocking on VPS — implementing server-side OAuth
- CSP blocking external images — iterative policy loosening
- Infinite re-render loops — dependency stabilization in React hooks
