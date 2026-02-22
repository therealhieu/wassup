# Auth & Per-User Config — Implementation Plan

## Overview

Add user authentication and per-user configuration persistence so that each user has their own dashboard layout, widgets, and theme — synced across devices.

### Decisions

| Decision            | Choice                                                    |
| ------------------- | --------------------------------------------------------- |
| Auth library        | NextAuth v5 (Auth.js)                                     |
| ORM                 | Prisma                                                    |
| Database            | SQLite (dev + prod)                                       |
| Hosting             | Oracle Cloud free tier (persistent VM, block storage)     |
| Caching             | localStorage, write-through, keyed by `userId`            |
| User types          | Anonymous (localStorage only) + Authenticated (server + localStorage) |
| Config storage      | JSON blob in `UserConfig.data` column, validated by Zod   |

### Architecture

```
Browser
  ├── SessionProvider (next-auth/react)
  ├── AppConfigProvider
  │     ├── Anonymous → localStorage["wassup-config"]
  │     └── Authed    → localStorage["wassup-config-{userId}"] + server sync
  └── LoginButton (sign in / avatar / sign out)

API Layer
  ├── /api/auth/[...nextauth]  → NextAuth handlers
  └── /api/config              → GET (load) + PUT (save)

Database (SQLite via Prisma)
  ├── User, Account, Session, VerificationToken  (NextAuth models)
  └── UserConfig (userId, data: JSON string)
```

### Execution Order

```
Phase 1 (DB) → Phase 2 (Auth) → Phase 3 (Config API) → Phase 4 (Provider) → Phase 5 (UI) → Phase 6 (Verify)
```

---

## Phase 1: Database & ORM Setup

**Goal**: Prisma + SQLite working, all models defined, client generated.

### Task 1.1 — Install dependencies

```bash
npm install @prisma/client
npm install -D prisma
```

### Task 1.2 — Initialize Prisma

```bash
npx prisma init --datasource-provider sqlite
```

Creates `prisma/schema.prisma` and adds `DATABASE_URL` to `.env`.

### Task 1.3 — Define schema

**File**: `prisma/schema.prisma` (new)

```prisma
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

// ── NextAuth required models ─────────────────────────────────────────────────

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String?
  access_token      String?
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String?
  session_state     String?
  user              User    @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model User {
  id            String       @id @default(cuid())
  name          String?
  email         String?      @unique
  emailVerified DateTime?
  image         String?
  accounts      Account[]
  sessions      Session[]
  config        UserConfig?
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}

// ── App-specific models ──────────────────────────────────────────────────────

model UserConfig {
  id        String   @id @default(cuid())
  userId    String   @unique
  data      String   // JSON-serialized AppConfig
  updatedAt DateTime @updatedAt
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

### Task 1.4 — Create Prisma singleton

**File**: `src/lib/prisma.ts` (new)

```typescript
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

### Task 1.5 — Run initial migration

```bash
npx prisma migrate dev --name init
npx prisma generate
```

### Task 1.6 — Update `.gitignore`

```gitignore
# Prisma
prisma/*.db
prisma/*.db-journal
```

### Tests — Phase 1

**File**: `src/lib/tests/prisma/prisma.integration.test.ts`

```typescript
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PrismaClient } from "@prisma/client";

describe("Prisma + SQLite", () => {
  let prisma: PrismaClient;

  beforeAll(async () => {
    prisma = new PrismaClient({
      datasources: { db: { url: "file:./test.db" } },
    });
    await prisma.$executeRawUnsafe("PRAGMA journal_mode=WAL");
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("should create and read a User", async () => {
    const user = await prisma.user.create({
      data: { email: "test@example.com", name: "Test User" },
    });

    expect(user.id).toBeDefined();
    expect(user.email).toBe("test@example.com");

    await prisma.user.delete({ where: { id: user.id } });
  });

  it("should create and read a UserConfig", async () => {
    const user = await prisma.user.create({
      data: { email: "config@example.com" },
    });

    const config = await prisma.userConfig.create({
      data: {
        userId: user.id,
        data: JSON.stringify({ ui: { theme: "dark", pages: [] } }),
      },
    });

    expect(config.userId).toBe(user.id);
    expect(JSON.parse(config.data)).toEqual({
      ui: { theme: "dark", pages: [] },
    });

    await prisma.userConfig.delete({ where: { id: config.id } });
    await prisma.user.delete({ where: { id: user.id } });
  });

  it("should enforce UserConfig.userId uniqueness", async () => {
    const user = await prisma.user.create({
      data: { email: "unique@example.com" },
    });

    await prisma.userConfig.create({
      data: { userId: user.id, data: "{}" },
    });

    await expect(
      prisma.userConfig.create({
        data: { userId: user.id, data: "{}" },
      })
    ).rejects.toThrow();

    await prisma.userConfig.deleteMany({ where: { userId: user.id } });
    await prisma.user.delete({ where: { id: user.id } });
  });

  it("should cascade delete UserConfig when User is deleted", async () => {
    const user = await prisma.user.create({
      data: { email: "cascade@example.com" },
    });

    await prisma.userConfig.create({
      data: { userId: user.id, data: "{}" },
    });

    await prisma.user.delete({ where: { id: user.id } });

    const orphaned = await prisma.userConfig.findUnique({
      where: { userId: user.id },
    });
    expect(orphaned).toBeNull();
  });
});
```

### ✅ Phase 1 Checkpoint

- `npx prisma studio` opens and shows empty tables
- `bun run test:integration` — Prisma tests pass

---

## Phase 2: Authentication

**Goal**: NextAuth v5 working with GitHub OAuth, session accessible in components.

### Task 2.1 — Install NextAuth

```bash
npm install next-auth@5 @auth/prisma-adapter
```

### Task 2.2 — Create auth config

**File**: `src/lib/auth.ts` (new)

```typescript
import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [GitHub],
  callbacks: {
    session({ session, user }) {
      session.user.id = user.id;
      return session;
    },
  },
});
```

### Task 2.3 — Create auth route handler

**File**: `src/app/api/auth/[...nextauth]/route.ts` (new)

```typescript
import { handlers } from "@/lib/auth";

export const { GET, POST } = handlers;
```

### Task 2.4 — Add env vars

```
AUTH_SECRET="<run: npx auth secret>"
AUTH_GITHUB_ID="<from GitHub OAuth App>"
AUTH_GITHUB_SECRET="<from GitHub OAuth App>"
```

### Task 2.5 — Add SessionProvider to layout

**File**: `src/app/layout.tsx` (modify)

```typescript
import { SessionProvider } from "next-auth/react";

// Updated provider stack:
// SessionProvider → ReactQueryProvider → AppConfigProvider → AppTheme
<SessionProvider>
  <ReactQueryProvider>
    <AppConfigProvider>
      <AppTheme>
        <DashboardAppBar />
        {children}
      </AppTheme>
    </AppConfigProvider>
  </ReactQueryProvider>
</SessionProvider>
```

### Tests — Phase 2

**File**: `src/lib/tests/auth/auth.unit.test.ts`

```typescript
import { describe, it, expect, vi } from "vitest";

describe("Auth configuration", () => {
  it("should export auth, handlers, signIn, signOut", async () => {
    // Verify the auth module exports the expected interface
    const authModule = await import("@/lib/auth");

    expect(authModule.auth).toBeDefined();
    expect(authModule.handlers).toBeDefined();
    expect(authModule.signIn).toBeDefined();
    expect(authModule.signOut).toBeDefined();
  });

  it("should have GET and POST handlers in route", async () => {
    const routeModule = await import(
      "@/app/api/auth/[...nextauth]/route"
    );

    expect(routeModule.GET).toBeDefined();
    expect(routeModule.POST).toBeDefined();
  });
});
```

**Manual verification** (not automatable without real OAuth):

1. Navigate to `/api/auth/signin`
2. Click "Sign in with GitHub"
3. Complete OAuth flow → redirected to dashboard
4. Check `prisma studio` → User + Account rows created
5. Open browser devtools → session cookie present

### ✅ Phase 2 Checkpoint

- `/api/auth/signin` page renders with GitHub provider
- OAuth flow completes and creates DB records
- Unit tests pass

---

## Phase 3: Config API

**Goal**: Server-side CRUD for per-user config, protected by auth, validated by Zod.

### Task 3.1 — Create config route handler

**File**: `src/app/api/config/route.ts` (new)

```typescript
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AppConfigSchema } from "@/infrastructure/config.schemas";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const record = await prisma.userConfig.findUnique({
    where: { userId: session.user.id },
  });

  return NextResponse.json({
    config: record ? JSON.parse(record.data) : null,
  });
}

export async function PUT(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = AppConfigSchema.safeParse(body.config);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid config", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  await prisma.userConfig.upsert({
    where: { userId: session.user.id },
    create: { userId: session.user.id, data: JSON.stringify(parsed.data) },
    update: { data: JSON.stringify(parsed.data) },
  });

  return NextResponse.json({ ok: true });
}
```

### Tests — Phase 3

**File**: `src/app/api/config/tests/config-route/config-route.unit.test.ts`

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextResponse } from "next/server";

// Mock auth
const mockAuth = vi.fn();
vi.mock("@/lib/auth", () => ({ auth: () => mockAuth() }));

// Mock prisma
const mockPrisma = {
  userConfig: {
    findUnique: vi.fn(),
    upsert: vi.fn(),
  },
};
vi.mock("@/lib/prisma", () => ({ prisma: mockPrisma }));

describe("GET /api/config", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 401 when unauthenticated", async () => {
    mockAuth.mockResolvedValue(null);

    const { GET } = await import("@/app/api/config/route");
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error).toBe("Unauthorized");
  });

  it("should return null config for new user", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    mockPrisma.userConfig.findUnique.mockResolvedValue(null);

    const { GET } = await import("@/app/api/config/route");
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.config).toBeNull();
  });

  it("should return saved config for existing user", async () => {
    const savedConfig = { ui: { theme: "dark", pages: [] } };
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    mockPrisma.userConfig.findUnique.mockResolvedValue({
      data: JSON.stringify(savedConfig),
    });

    const { GET } = await import("@/app/api/config/route");
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.config).toEqual(savedConfig);
  });
});

describe("PUT /api/config", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 401 when unauthenticated", async () => {
    mockAuth.mockResolvedValue(null);

    const { PUT } = await import("@/app/api/config/route");
    const request = new Request("http://localhost/api/config", {
      method: "PUT",
      body: JSON.stringify({ config: {} }),
      headers: { "Content-Type": "application/json" },
    });
    const response = await PUT(request);

    expect(response.status).toBe(401);
  });

  it("should return 400 for invalid config", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });

    const { PUT } = await import("@/app/api/config/route");
    const request = new Request("http://localhost/api/config", {
      method: "PUT",
      body: JSON.stringify({ config: { invalid: true } }),
      headers: { "Content-Type": "application/json" },
    });
    const response = await PUT(request);

    expect(response.status).toBe(400);
  });

  it("should upsert valid config", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    mockPrisma.userConfig.upsert.mockResolvedValue({});

    const validConfig = {
      ui: {
        theme: "dark",
        pages: [
          {
            title: "Home",
            path: "/",
            columns: [{ size: 12, widgets: [] }],
          },
        ],
      },
    };

    const { PUT } = await import("@/app/api/config/route");
    const request = new Request("http://localhost/api/config", {
      method: "PUT",
      body: JSON.stringify({ config: validConfig }),
      headers: { "Content-Type": "application/json" },
    });
    const response = await PUT(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(mockPrisma.userConfig.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: "user-1" },
      })
    );
  });
});
```

### ✅ Phase 3 Checkpoint

- Config API unit tests pass
- Manual: authenticated `GET /api/config` → `{ config: null }`
- Manual: authenticated `PUT /api/config` with valid body → `{ ok: true }`

---

## Phase 4: Dual-Mode AppConfigProvider

**Goal**: Anonymous users use localStorage. Authenticated users use write-through (localStorage + server).

### Task 4.1 — Refactor AppConfigProvider

**File**: `src/providers/AppConfigProvider.tsx` (modify)

Key changes:

1. Import `useSession` from `next-auth/react`
2. Key localStorage by `userId`:
   - Anonymous: `wassup-config`
   - Authenticated: `wassup-config-{userId}`
3. On mount: load from localStorage (instant) → reconcile with server if authenticated
4. On change: write to localStorage (always) + debounced server sync (if authenticated)

```typescript
"use client";

import {
  createContext, useContext, useReducer, useEffect, ReactNode,
} from "react";
import { useSession } from "next-auth/react";
import { useDebouncedCallback } from "use-debounce";
import { AppConfig, AppConfigSchema } from "@/infrastructure/config.schemas";
import { DEFAULT_CONFIG } from "@/lib/constants";
import { baseLogger } from "@/lib/logger";

const STORAGE_KEY_ANONYMOUS = "wassup-config";
const STORAGE_KEY_PREFIX = "wassup-config-";
const logger = baseLogger.getSubLogger({ name: "AppConfigProvider" });

function storageKey(userId: string | null): string {
  return userId ? `${STORAGE_KEY_PREFIX}${userId}` : STORAGE_KEY_ANONYMOUS;
}

function loadFromStorage(userId: string | null): AppConfig {
  if (typeof window === "undefined") return DEFAULT_CONFIG;
  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (!raw) return DEFAULT_CONFIG;
    const parsed = AppConfigSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : DEFAULT_CONFIG;
  } catch {
    return DEFAULT_CONFIG;
  }
}

function saveToStorage(userId: string | null, config: AppConfig): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(storageKey(userId), JSON.stringify(config));
  } catch {
    logger.warn("Failed to save config to localStorage");
  }
}

type Action =
  | { type: "SET_CONFIG"; payload: AppConfig }
  | { type: "SET_THEME"; payload: "light" | "dark" };

function reducer(state: AppConfig, action: Action): AppConfig {
  switch (action.type) {
    case "SET_CONFIG":
      return action.payload;
    case "SET_THEME":
      return { ...state, ui: { ...state.ui, theme: action.payload } };
  }
}

interface AppConfigContextValue {
  config: AppConfig;
  setConfig: (config: AppConfig) => void;
  setTheme: (theme: "light" | "dark") => void;
}

const AppConfigContext = createContext<AppConfigContextValue | null>(null);

export function AppConfigProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const userId = session?.user?.id ?? null;
  const isAuthenticated = status === "authenticated" && userId !== null;

  const [config, dispatch] = useReducer(reducer, DEFAULT_CONFIG);

  const syncToServer = useDebouncedCallback(async (cfg: AppConfig) => {
    try {
      await fetch("/api/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ config: cfg }),
      });
    } catch (err) {
      logger.error("Failed to sync config to server", err);
    }
  }, 1000);

  // Hydration
  useEffect(() => {
    if (status === "loading") return;

    const local = loadFromStorage(userId);
    dispatch({ type: "SET_CONFIG", payload: local });

    if (isAuthenticated) {
      fetch("/api/config")
        .then((res) => res.json())
        .then(({ config: serverConfig }) => {
          if (serverConfig) {
            const parsed = AppConfigSchema.safeParse(serverConfig);
            if (parsed.success) {
              dispatch({ type: "SET_CONFIG", payload: parsed.data });
              saveToStorage(userId, parsed.data);
            }
          }
        })
        .catch(() => { /* server unavailable — localStorage is fine */ });
    }
  }, [status, userId, isAuthenticated]);

  // Persistence (write-through)
  useEffect(() => {
    saveToStorage(userId, config);
    if (isAuthenticated) syncToServer(config);
  }, [config, userId, isAuthenticated, syncToServer]);

  const value: AppConfigContextValue = {
    config,
    setConfig: (payload) => dispatch({ type: "SET_CONFIG", payload }),
    setTheme: (payload) => dispatch({ type: "SET_THEME", payload }),
  };

  return (
    <AppConfigContext.Provider value={value}>
      {children}
    </AppConfigContext.Provider>
  );
}

export function useAppConfig(): AppConfigContextValue {
  const ctx = useContext(AppConfigContext);
  if (!ctx) {
    throw new Error("useAppConfig must be used within AppConfigProvider");
  }
  return ctx;
}
```

### Tests — Phase 4

**File**: `src/providers/tests/app-config-provider/app-config-provider.unit.test.ts`

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";

// Test the pure helper functions extracted for testability

describe("storageKey", () => {
  it("should return anonymous key when userId is null", () => {
    // storageKey(null) → "wassup-config"
    expect(storageKey(null)).toBe("wassup-config");
  });

  it("should return user-specific key when userId is provided", () => {
    // storageKey("abc123") → "wassup-config-abc123"
    expect(storageKey("abc123")).toBe("wassup-config-abc123");
  });
});

describe("loadFromStorage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("should return DEFAULT_CONFIG when nothing is stored", () => {
    const config = loadFromStorage(null);
    expect(config).toEqual(DEFAULT_CONFIG);
  });

  it("should return stored config when valid", () => {
    const validConfig = {
      ui: {
        theme: "dark",
        pages: [
          { title: "Home", path: "/", columns: [{ size: 12, widgets: [] }] },
        ],
      },
    };
    localStorage.setItem("wassup-config", JSON.stringify(validConfig));

    const config = loadFromStorage(null);
    expect(config.ui.theme).toBe("dark");
  });

  it("should return DEFAULT_CONFIG when stored config is invalid", () => {
    localStorage.setItem("wassup-config", JSON.stringify({ invalid: true }));

    const config = loadFromStorage(null);
    expect(config).toEqual(DEFAULT_CONFIG);
  });

  it("should isolate anonymous and authenticated configs", () => {
    const anonConfig = {
      ui: {
        theme: "light",
        pages: [
          { title: "Anon", path: "/", columns: [{ size: 12, widgets: [] }] },
        ],
      },
    };
    const userConfig = {
      ui: {
        theme: "dark",
        pages: [
          { title: "User", path: "/", columns: [{ size: 12, widgets: [] }] },
        ],
      },
    };

    localStorage.setItem("wassup-config", JSON.stringify(anonConfig));
    localStorage.setItem("wassup-config-user1", JSON.stringify(userConfig));

    expect(loadFromStorage(null).ui.pages[0].title).toBe("Anon");
    expect(loadFromStorage("user1").ui.pages[0].title).toBe("User");
  });
});

describe("saveToStorage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("should save to anonymous key", () => {
    saveToStorage(null, DEFAULT_CONFIG);
    expect(localStorage.getItem("wassup-config")).not.toBeNull();
    expect(localStorage.getItem("wassup-config-")).toBeNull();
  });

  it("should save to user-specific key", () => {
    saveToStorage("user1", DEFAULT_CONFIG);
    expect(localStorage.getItem("wassup-config-user1")).not.toBeNull();
    expect(localStorage.getItem("wassup-config")).toBeNull();
  });
});
```

> **Note**: The helper functions (`storageKey`, `loadFromStorage`, `saveToStorage`) should be exported from the module for testability, or extracted into a `src/providers/config-storage.ts` utility file.

### ✅ Phase 4 Checkpoint

- Unit tests for storage helpers pass
- Manual: anonymous user → edit config → refresh → config persists
- Manual: sign in → edit config → check Prisma Studio → UserConfig row created
- Manual: sign out → anonymous config is independent

---

## Phase 5: Auth UI

**Goal**: Login/logout button in the app bar.

### Task 5.1 — Create LoginButton

**File**: `src/components/auth/LoginButton.tsx` (new)

```typescript
"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import { IconButton, Avatar, Menu, MenuItem, Button } from "@mui/material";
import { useState } from "react";

export function LoginButton() {
  const { data: session } = useSession();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  if (!session) {
    return (
      <Button variant="outlined" size="small" onClick={() => signIn()}>
        Sign In
      </Button>
    );
  }

  return (
    <>
      <IconButton onClick={(e) => setAnchorEl(e.currentTarget)}>
        <Avatar
          src={session.user?.image ?? undefined}
          alt={session.user?.name ?? "User"}
          sx={{ width: 32, height: 32 }}
        />
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={!!anchorEl}
        onClose={() => setAnchorEl(null)}
      >
        <MenuItem disabled>{session.user?.name}</MenuItem>
        <MenuItem onClick={() => signOut()}>Sign Out</MenuItem>
      </Menu>
    </>
  );
}
```

### Task 5.2 — Add to DashboardAppBar

**File**: `src/components/app-bar/DashboardAppBar.tsx` (modify)

```typescript
import { LoginButton } from "@/components/auth/LoginButton";

// Inside the toolbar actions:
<div style={{ display: "flex", gap: "0.5rem" }}>
  <ThemeMenu />
  <OpenConfigEditorButton />
  <LoginButton />
</div>
```

### Tests — Phase 5

**File**: `src/components/auth/tests/login-button/login-button.unit.test.tsx`

```typescript
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { LoginButton } from "@/components/auth/LoginButton";

// Mock next-auth/react
vi.mock("next-auth/react", () => ({
  useSession: vi.fn(),
  signIn: vi.fn(),
  signOut: vi.fn(),
}));

import { useSession } from "next-auth/react";

describe("LoginButton", () => {
  it("should render Sign In button when unauthenticated", () => {
    vi.mocked(useSession).mockReturnValue({
      data: null,
      status: "unauthenticated",
      update: vi.fn(),
    });

    render(<LoginButton />);

    expect(screen.getByText("Sign In")).toBeDefined();
  });

  it("should render avatar when authenticated", () => {
    vi.mocked(useSession).mockReturnValue({
      data: {
        user: {
          id: "1",
          name: "Test User",
          email: "test@test.com",
          image: "https://example.com/avatar.jpg",
        },
        expires: "2099-01-01",
      },
      status: "authenticated",
      update: vi.fn(),
    });

    render(<LoginButton />);

    expect(screen.queryByText("Sign In")).toBeNull();
    expect(screen.getByAltText("Test User")).toBeDefined();
  });
});
```

### ✅ Phase 5 Checkpoint

- Unit tests pass
- Visual: app bar shows "Sign In" when logged out
- Visual: app bar shows avatar when logged in
- Click avatar → dropdown with name + "Sign Out"

---

## Phase 6: Verification & Cleanup

**Goal**: Everything works end-to-end, build passes, no regressions.

### Task 6.1 — End-to-end flow verification

| # | Flow                              | Expected Result                                       |
|---|-----------------------------------|-------------------------------------------------------|
| 1 | Anonymous fresh visit             | DEFAULT_CONFIG renders, editable, saved to localStorage |
| 2 | Anonymous returns                 | Config loaded from localStorage                       |
| 3 | Sign in (first time)              | DEFAULT_CONFIG, edits sync to server                  |
| 4 | Sign in (returning)               | Server config loaded, localStorage updated            |
| 5 | Sign out                          | Anonymous config restored (independent)               |
| 6 | Different user signs in           | Their own config loaded                               |
| 7 | Config editor (Monaco)            | Works for both anonymous and authenticated            |
| 8 | Theme toggle                      | Works for both, persisted correctly                   |
| 9 | Server unavailable (offline)      | Authenticated user falls back to localStorage         |

### Task 6.2 — Build & lint

```bash
npm run build
npm run lint
npm run test:unit
```

### Task 6.3 — Update `next.config.ts` if needed

Prisma may need:

```typescript
const nextConfig: NextConfig = {
  serverExternalPackages: ["@prisma/client"],
};
```

### Task 6.4 — Update architecture docs

**File**: `documents/specs/architecture.md` (modify)

Update:
- Directory structure (add `prisma/`, `src/lib/auth.ts`, `src/lib/prisma.ts`)
- Provider stack (add `SessionProvider`)
- Data flow (add server sync path)
- Add Auth section

---

## File Change Summary

| # | File                                            | Action | Phase |
|---|-------------------------------------------------|--------|-------|
| 1 | `prisma/schema.prisma`                          | Create | 1     |
| 2 | `src/lib/prisma.ts`                             | Create | 1     |
| 3 | `.gitignore`                                    | Modify | 1     |
| 4 | `src/lib/tests/prisma/prisma.integration.test.ts` | Create | 1     |
| 5 | `src/lib/auth.ts`                               | Create | 2     |
| 6 | `src/app/api/auth/[...nextauth]/route.ts`       | Create | 2     |
| 7 | `.env`                                          | Modify | 2     |
| 8 | `src/app/layout.tsx`                            | Modify | 2     |
| 9 | `src/lib/tests/auth/auth.unit.test.ts`          | Create | 2     |
| 10 | `src/app/api/config/route.ts`                  | Create | 3     |
| 11 | `src/app/api/config/tests/config-route/config-route.unit.test.ts` | Create | 3     |
| 12 | `src/providers/AppConfigProvider.tsx`           | Modify | 4     |
| 13 | `src/providers/tests/app-config-provider/app-config-provider.unit.test.ts` | Create | 4     |
| 14 | `src/components/auth/LoginButton.tsx`           | Create | 5     |
| 15 | `src/components/app-bar/DashboardAppBar.tsx`    | Modify | 5     |
| 16 | `src/components/auth/tests/login-button/login-button.unit.test.tsx` | Create | 5     |
| 17 | `next.config.ts`                                | Modify | 6     |
| 18 | `documents/specs/architecture.md`               | Modify | 6     |

**8 new source files, 5 modified files, 5 new test files.**
