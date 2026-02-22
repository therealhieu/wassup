# Presets Feature

## Overview

Presets are **mutable, user-owned configuration profiles**. Users can switch between presets via a dropdown in the app bar, edit a preset's config and name through the gear icon editor, create new blank presets, and delete presets they no longer need.

---

## Data Model

### New types — `src/infrastructure/config.schemas.ts`

```ts
export const PresetSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(100),
  config: AppConfigSchema,
});

export type Preset = z.infer<typeof PresetSchema>;

export const AppStateSchema = z.object({
  activePresetId: z.string(),
  presets: z.array(PresetSchema).min(1).max(50),
});

export type AppState = z.infer<typeof AppStateSchema>;
```

### Backward-compatible migration — `src/lib/migration.ts` (new)

When loading persisted data, detect if it's a legacy `AppConfig` and auto-wrap into `AppState`.

```ts
import { AppState, AppStateSchema, AppConfigSchema } from "@/infrastructure/config.schemas";
import { DEFAULT_APP_STATE } from "@/lib/constants";

export function migrateToAppState(raw: unknown): AppState {
  // Try new shape first
  const asAppState = AppStateSchema.safeParse(raw);
  if (asAppState.success) return asAppState.data;

  // Legacy: raw is a plain AppConfig
  const asConfig = AppConfigSchema.safeParse(raw);
  if (asConfig.success) {
    return {
      activePresetId: "default",
      presets: [{ id: "default", name: "My Dashboard", config: asConfig.data }],
    };
  }

  return DEFAULT_APP_STATE;
}
```

---

## Seed Presets — `src/lib/presets.ts` (new)

Static templates for seeding `DEFAULT_APP_STATE`. Uses the `Preset` type directly (no separate interface).

```ts
import { Preset, AppConfigSchema } from "@/infrastructure/config.schemas";

export const SEED_PRESETS: Preset[] = [
  {
    id: "hieu",
    name: "Hieu's Dashboard",
    config: AppConfigSchema.parse({ /* current DEFAULT_CONFIG body from constants.ts */ }),
  },
  {
    id: "general-swe",
    name: "Software Engineer",
    config: AppConfigSchema.parse({
      ui: {
        theme: "dark",
        pages: [{ title: "Home", path: "/", columns: [/* general SWE widgets */] }],
      },
    }),
  },
  {
    id: "blank",
    name: "Blank",
    config: AppConfigSchema.parse({
      ui: {
        theme: "light",
        pages: [{ title: "Home", path: "/", columns: [{ size: 12, widgets: [] }] }],
      },
    }),
  },
];

export const BLANK_CONFIG = SEED_PRESETS.find((p) => p.id === "blank")!.config;
```

---

## Constants Update — `src/lib/constants.ts`

```ts
import { AppState } from "@/infrastructure/config.schemas";
import { SEED_PRESETS } from "./presets";

export const DEFAULT_APP_STATE: AppState = {
  activePresetId: "hieu",
  presets: SEED_PRESETS,
};

// Backward compat for consumers that only need the active config
export const DEFAULT_CONFIG = DEFAULT_APP_STATE.presets[0].config;
```

---

## Provider Update — `src/providers/AppConfigProvider.tsx`

### Extended context interface

```ts
interface AppConfigContextValue {
  // Existing (backward-compatible) — derived from active preset
  config: AppConfig;
  setConfig: (config: AppConfig) => void;
  setTheme: (theme: "light" | "dark") => void;

  // New — preset management
  presets: Preset[];
  activePresetId: string;
  setActivePresetId: (id: string) => void;
  updatePreset: (id: string, patch: { name?: string; config?: AppConfig }) => void;
  createPreset: (from?: string) => void;   // optional source preset ID for future clone
  deletePreset: (id: string) => void;
}
```

> **Design note:** `updatePreset` replaces the separate `renamePreset` + `setConfig` calls. A single dispatch avoids double write-through within the debounce window.

### Internal state — Reducer

The reducer manages `AppState` instead of `AppConfig`:

```ts
type Action =
  | { type: "SET_STATE"; payload: AppState }
  | { type: "SET_CONFIG"; payload: AppConfig }
  | { type: "SET_THEME"; payload: "light" | "dark" }
  | { type: "SET_ACTIVE_PRESET"; payload: string }
  | { type: "UPDATE_PRESET"; payload: { id: string; name?: string; config?: AppConfig } }
  | { type: "CREATE_PRESET"; payload: Preset }
  | { type: "DELETE_PRESET"; payload: string };

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "SET_STATE":
      return action.payload;

    case "SET_CONFIG":
      return {
        ...state,
        presets: state.presets.map((p) =>
          p.id === state.activePresetId ? { ...p, config: action.payload } : p
        ),
      };

    case "SET_THEME":
      return {
        ...state,
        presets: state.presets.map((p) =>
          p.id === state.activePresetId
            ? { ...p, config: { ...p.config, ui: { ...p.config.ui, theme: action.payload } } }
            : p
        ),
      };

    case "SET_ACTIVE_PRESET":
      return { ...state, activePresetId: action.payload };

    case "UPDATE_PRESET":
      return {
        ...state,
        presets: state.presets.map((p) =>
          p.id === action.payload.id
            ? {
                ...p,
                ...(action.payload.name !== undefined && { name: action.payload.name }),
                ...(action.payload.config !== undefined && { config: action.payload.config }),
              }
            : p
        ),
      };

    case "CREATE_PRESET":
      return {
        ...state,
        activePresetId: action.payload.id,
        presets: [...state.presets, action.payload],
      };

    case "DELETE_PRESET": {
      const remaining = state.presets.filter((p) => p.id !== action.payload);
      return {
        ...state,
        presets: remaining,
        activePresetId:
          state.activePresetId === action.payload ? remaining[0].id : state.activePresetId,
      };
    }
  }
}
```

### Derived config

```ts
const activePreset = state.presets.find((p) => p.id === state.activePresetId)!;
const config = activePreset.config;
```

---

## Sync Strategy

The existing three-phase sync pattern is preserved exactly, with `AppConfig` replaced by `AppState` at every step.

### Storage key versioning

```ts
const STORAGE_KEY_ANONYMOUS = "wassup-state";         // was "wassup-config"
const STORAGE_KEY_PREFIX = "wassup-state-";            // was "wassup-config-"
```

New key names prevent old tabs from misinterpreting `AppState` as `AppConfig`. The migration function handles old data if needed.

### Phase 1 — Hydrate from localStorage (instant)

```ts
export function loadFromStorage(userId: string | null): AppState {
  if (typeof window === "undefined") return DEFAULT_APP_STATE;
  try {
    // Try new key first
    let raw = localStorage.getItem(storageKey(userId));

    // Fallback: try legacy key for migration
    if (!raw) {
      const legacyKey = userId ? `wassup-config-${userId}` : "wassup-config";
      raw = localStorage.getItem(legacyKey);
      if (raw) {
        // Migrate and save to new key, remove old key
        const migrated = migrateToAppState(JSON.parse(raw));
        saveToStorage(userId, migrated);
        localStorage.removeItem(legacyKey);
        return migrated;
      }
      return DEFAULT_APP_STATE;
    }

    return migrateToAppState(JSON.parse(raw));
  } catch {
    return DEFAULT_APP_STATE;
  }
}
```

### Phase 2 — Server reconciliation (authenticated only)

```ts
// On mount, after localStorage hydration:
if (isAuthenticated) {
  fetch("/api/config")
    .then((res) => res.json())
    .then(({ state: serverState }) => {
      if (serverState) {
        const migrated = migrateToAppState(serverState);
        dispatch({ type: "SET_STATE", payload: migrated });
        saveToStorage(userId, migrated);
      }
    })
    .catch(() => { /* server unavailable — localStorage is fine */ })
    .finally(() => { isHydrated.current = true; });
} else {
  isHydrated.current = true;
}
```

### Phase 3 — Write-through on every change

```ts
useEffect(() => {
  if (!isHydrated.current) return;
  saveToStorage(userId, state);                      // localStorage always
  if (isAuthenticated) syncToServer(state);           // debounced server sync
}, [state, userId, isAuthenticated, syncToServer]);
```

Where `syncToServer`:

```ts
const syncToServer = useDebouncedCallback(async (appState: AppState) => {
  try {
    await fetch("/api/config", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ state: appState }),
    });
  } catch (err) {
    logger.error("Failed to sync state to server", err);
  }
}, 1000);
```

### Anonymous users

Anonymous users use localStorage only — same as before. The only difference is the stored shape is `AppState` instead of `AppConfig`. No server calls.

---

## API Route Update — `src/app/api/config/route.ts`

### GET

```ts
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const record = await prisma.userConfig.findUnique({
    where: { userId: session.user.id },
  });

  // Return raw JSON — client-side migrateToAppState handles both old and new shapes
  return NextResponse.json({
    state: record ? JSON.parse(record.data) : null,
  });
}
```

### PUT

```ts
export async function PUT(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = AppStateSchema.safeParse(body.state);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid state", details: parsed.error.flatten() },
      { status: 400 },
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

No Prisma schema change — `UserConfig.data` is already a JSON string.

---

## New Component — `src/components/app-bar/PresetSelector.tsx`

Dropdown in the app bar to switch presets, create, and delete.

```tsx
"use client";

import {
  Select, MenuItem, SelectChangeEvent,
  ListItemText, ListItemIcon, Divider, IconButton,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { useAppConfig } from "@/providers/AppConfigProvider";

const NEW_PRESET_VALUE = "__new__";

export function PresetSelector() {
  const {
    presets, activePresetId,
    setActivePresetId, createPreset, deletePreset,
  } = useAppConfig();

  const handleChange = (e: SelectChangeEvent<string>) => { ... };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (presets.length <= 1) return;
    if (!window.confirm("Delete this preset? This cannot be undone.")) return;
    deletePreset(id);
  };

  return (
    <Select value={activePresetId} onChange={handleChange} size="small">
      {presets.map((p) => (
        <MenuItem key={p.id} value={p.id}>
          <ListItemText primary={p.name} />
          {presets.length > 1 && (
            <IconButton size="small" onClick={(e) => handleDelete(e, p.id)} sx={{ ml: 1 }}>
              <DeleteOutlineIcon fontSize="small" />
            </IconButton>
          )}
        </MenuItem>
      ))}
      <Divider />
      <MenuItem value={NEW_PRESET_VALUE}>
        <ListItemIcon><AddIcon fontSize="small" /></ListItemIcon>
        <ListItemText primary="New Preset" />
      </MenuItem>
    </Select>
  );
}
```

### Delete behavior

- Confirmation via `window.confirm()` before delete.
- Deleting the **active** preset auto-switches to the first remaining preset.
- Blocked if it's the **last** preset (schema `min(1)` + UI guard).

---

## EditorPanel Update — `src/components/app-bar/EditorPanel.tsx`

Add a `TextField` for the preset name above the Monaco editor. Uses the consolidated `updatePreset` action.

```tsx
// Key additions:

import { TextField } from "@mui/material";

// Inside component — derive from active preset:
const { config, presets, activePresetId, updatePreset } = useAppConfig();
const activePreset = presets.find((p) => p.id === activePresetId)!;
const [presetName, setPresetName] = useState(activePreset.name);

// Reset name when dialog opens:
useEffect(() => {
  if (open) setPresetName(activePreset.name);
}, [open, activePreset.name]);

// On Apply — single dispatch for both name and config:
const handleApply = () => {
  // ... existing YAML parse + validate ...
  updatePreset(activePresetId, {
    name: presetName,
    config: result.data,
  });
  onClose?.();
};

// In JSX — above ConfigEditor:
<TextField
  label="Preset Name"
  value={presetName}
  onChange={(e) => { setPresetName(e.target.value); setHasUserChanges(true); }}
  size="small"
  fullWidth
  sx={{ mb: 1 }}
/>
```

---

## App Bar Update — `src/components/app-bar/DashboardAppBar.tsx`

```tsx
import { PresetSelector } from "./PresetSelector";

<Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
  <RouterMenu />
  <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
    <PresetSelector />
    <ThemeMenu />
    <OpenConfigEditorButton />
    <LoginButton />
  </div>
</Toolbar>
```

---

## UI Layout

```
App Bar:
┌────────────────────────────────────────────────────────────────────┐
│ Wassup  Home  AI  Sports    [Hieu's Dashboard ▼] [🌙] [⚙️] [👤] │
└────────────────────────────────────────────────────────────────────┘
                                     │
                              Dropdown menu:
                              ├─ Hieu's Dashboard  [🗑]  ← active
                              ├─ Software Engineer [🗑]
                              ├─ ─────────────────────
                              └─ + New Preset

Gear ⚙️ opens EditorPanel:
┌────────────────────────────────────────────────────────────────────┐
│ Preset Name: [Hieu's Dashboard                                 ]  │
│ ┌───────────────────────────┐  ┌────────────────────────────────┐ │
│ │  YAML Editor              │  │  Schema Docs                   │ │
│ │  (active preset's config) │  │                                │ │
│ └───────────────────────────┘  └────────────────────────────────┘ │
│                                             [Cancel]  [Apply]     │
└────────────────────────────────────────────────────────────────────┘
```

---

## Persistence

**What's stored** (localStorage key + server `UserConfig.data`):

```json
{
  "activePresetId": "abc123",
  "presets": [
    { "id": "abc123", "name": "Hieu's Dashboard", "config": { "ui": { ... } } },
    { "id": "def456", "name": "Work", "config": { "ui": { ... } } }
  ]
}
```

**Migration**: existing `AppConfig` data (in both localStorage and DB) is auto-wrapped into `AppState` on first load. No DB schema change needed.

---

## Data Flow

```
Switching preset:
  PresetSelector → setActivePresetId(id) → reducer updates activePresetId
  → config derived from new active preset → dashboard re-renders
  → write-through: localStorage (always) + server (if authed)

Editing preset:
  ⚙️ click → EditorPanel opens (name + YAML of active preset)
  → user edits name / YAML → Apply
  → updatePreset(id, { name, config }) → single reducer dispatch
  → write-through: localStorage + debounced server sync

Creating preset:
  "+ New Preset" in dropdown → createPreset()
  → reducer adds { id: crypto.randomUUID(), name: "New Preset", config: BLANK_CONFIG }
  → sets activePresetId to new id → dashboard shows blank
  → write-through: localStorage + server

Deleting preset:
  🗑 icon in dropdown → window.confirm() → deletePreset(id)
  → if active preset deleted → switch to first remaining
  → blocked if last preset (schema min(1) + UI guard)
  → write-through: localStorage + server
```

---

## File Change Summary

| File | Action | Description |
|---|---|---|
| `src/infrastructure/config.schemas.ts` | Modify | Add `PresetSchema`, `AppStateSchema` |
| `src/lib/presets.ts` | Create | Seed preset templates + `BLANK_CONFIG` |
| `src/lib/migration.ts` | Create | `migrateToAppState()` helper |
| `src/lib/constants.ts` | Modify | Add `DEFAULT_APP_STATE`, derive `DEFAULT_CONFIG` |
| `src/providers/AppConfigProvider.tsx` | Modify | State becomes `AppState`; expose preset CRUD; versioned storage keys; sync sends `AppState` |
| `src/app/api/config/route.ts` | Modify | Validate `AppStateSchema`; request/response uses `state` field |
| `src/components/app-bar/PresetSelector.tsx` | Create | Dropdown with switch / create / delete |
| `src/components/app-bar/EditorPanel.tsx` | Modify | Add preset name `TextField`; use `updatePreset` |
| `src/components/app-bar/DashboardAppBar.tsx` | Modify | Add `PresetSelector` to toolbar |
| Tests (see below) | Modify | Update for `AppState` shape |

---

## Test Scenarios

### `src/providers/tests/app-config-provider/app-config-provider.test.ts`

Update existing + add new:

| Test | Description |
|---|---|
| `storageKey` | Returns `"wassup-state"` (anon) / `"wassup-state-{userId}"` (authed) |
| `loadFromStorage` — new key | Returns stored `AppState` |
| `loadFromStorage` — legacy key migration | Reads from `"wassup-config"`, migrates to `AppState`, saves to `"wassup-state"`, removes old key |
| `loadFromStorage` — empty | Returns `DEFAULT_APP_STATE` |
| `loadFromStorage` — invalid | Returns `DEFAULT_APP_STATE` |
| `migrateToAppState` — valid `AppState` | Returns as-is |
| `migrateToAppState` — legacy `AppConfig` | Wraps into single-preset `AppState` |
| `migrateToAppState` — garbage | Returns `DEFAULT_APP_STATE` |

### `src/lib/tests/migration/migration.test.ts` (new)

| Test | Description |
|---|---|
| `migrateToAppState` — valid `AppState` | Pass-through |
| `migrateToAppState` — legacy `AppConfig` | Wraps with `id: "default"`, `name: "My Dashboard"` |
| `migrateToAppState` — invalid data | Falls back to `DEFAULT_APP_STATE` |

### `src/app/api/config/tests/config-route/config-route.test.ts`

Update existing + add new:

| Test | Description |
|---|---|
| GET — returns `{ state: null }` for new user | Changed from `{ config: null }` |
| GET — returns `{ state: AppState }` for existing user | Changed response shape |
| PUT — validates with `AppStateSchema` | `{ state: {...} }` body |
| PUT — rejects invalid state | 400 response |

### Reducer unit tests (new, in provider tests)

| Test | Description |
|---|---|
| `SET_STATE` | Replaces entire state |
| `SET_CONFIG` | Updates only the active preset's config |
| `SET_THEME` | Updates only the active preset's `ui.theme` |
| `SET_ACTIVE_PRESET` | Changes `activePresetId` |
| `UPDATE_PRESET` | Patches name, config, or both on target preset |
| `CREATE_PRESET` | Appends preset + activates it |
| `DELETE_PRESET` — active | Removes + switches to first remaining |
| `DELETE_PRESET` — non-active | Removes, `activePresetId` unchanged |

---

## Out of Scope

- ❌ Drag-and-drop reorder of presets
- ❌ Import/export preset files
- ❌ Preset sharing between users
- ❌ Prisma schema change
