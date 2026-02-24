# Readonly Seed Presets

## Problem

User config is cached in localStorage. When a new version ships with updated or new seed presets, existing users never see the changes because their cached `AppState` passes schema validation and is returned as-is by `migrateToAppState()`.

Additionally, users can freely edit seed presets in-place, making it impossible to safely overwrite them on update without risking data loss.

## Solution

Make seed presets **readonly** (derived, not stored) and **reconcile** them on every hydration. Users must **duplicate** a seed preset before customizing it.

---

## Plan

### 1. Export Seed Preset Helpers — `src/lib/presets.ts`

```ts
export const SEED_PRESET_IDS = new Set(SEED_PRESETS.map(p => p.id));
export const isSeedPreset = (id: string) => SEED_PRESET_IDS.has(id);
```

No schema change. Readonly status is derived from the well-known seed ID set.

### 2. Reconcile Seed Presets on Hydration — `src/providers/AppConfigProvider.tsx`

Add `reconcileWithSeedPresets()` called inside `loadFromStorage()` after `migrateToAppState()`:

```ts
function reconcileWithSeedPresets(state: AppState): AppState {
  const existingIds = new Set(state.presets.map(p => p.id));

  // Overwrite existing seed presets with latest version (safe — they're readonly)
  const updatedPresets = state.presets
    .filter(p => !SEED_PRESET_IDS.has(p.id))  // keep only user presets
    .concat(SEED_PRESETS);                      // re-add all current seeds

  // Preserve user's ordering: seed presets that existed stay in their position
  const orderedPresets = state.presets
    .map(p => SEED_PRESET_IDS.has(p.id)
      ? SEED_PRESETS.find(sp => sp.id === p.id)!
      : p)
    .filter(Boolean);

  // Append any new seed presets not in user's list
  const newSeeds = SEED_PRESETS.filter(sp => !existingIds.has(sp.id));
  const finalPresets = [...orderedPresets, ...newSeeds];

  // Fix activePresetId if it pointed to a removed preset
  const activeValid = finalPresets.some(p => p.id === state.activePresetId);
  return {
    activePresetId: activeValid ? state.activePresetId : finalPresets[0].id,
    presets: finalPresets,
  };
}
```

### 3. Guard Mutations in Reducer — `src/providers/AppConfigProvider.tsx`

| Action             | Seed Preset Behavior                                          |
|--------------------|---------------------------------------------------------------|
| `SET_CONFIG`       | Auto-duplicate → create `"<Name> (Custom)"`, switch to it    |
| `SET_THEME`        | Same — duplicate first                                        |
| `UPDATE_PRESET`    | Block rename (no-op)                                          |
| `DELETE_PRESET`    | Block (no-op) — see rationale below                           |
| `REORDER_PRESETS`  | **Allow** — reordering is safe (ID-based, not position-based) |

#### Why Block Deletion?

`reconcileWithSeedPresets()` re-adds all current seed presets on every hydration. If deletion were allowed, the preset would **reappear on next page load** — confusing and feels broken. Alternatives like storing `hiddenSeedIds` add schema complexity for minimal gain. Seed presets are lightweight templates; keeping them visible is fine.

For auto-duplicate on edit, add a new `DUPLICATE_AND_EDIT` action or handle it inline:

```ts
case "SET_CONFIG": {
  if (isSeedPreset(state.activePresetId)) {
    const source = state.presets.find(p => p.id === state.activePresetId)!;
    const dup: Preset = {
      id: crypto.randomUUID(),
      name: `${source.name} (Custom)`,
      config: action.payload,
    };
    return {
      ...state,
      activePresetId: dup.id,
      presets: [...state.presets, dup],
    };
  }
  // existing logic for user presets
}
```

### 4. UI Changes — `src/components/app-bar/PresetSelector.tsx`

For each preset item, check `isSeedPreset(p.id)`:

- **Seed presets**: hide delete icon, hide rename (edit) icon, show a lock icon or `(Built-in)` suffix
- **Add duplicate icon**: clicking it creates a copy with `"<Name> (Custom)"` and switches to it
- **User presets**: no change

### 5. Reorder Safety Analysis

Reordering stores an array of IDs. Reconciliation works by ID matching:

| Concern                          | Impact | Notes                                                        |
|----------------------------------|--------|--------------------------------------------------------------|
| New seed presets added upstream  | Safe   | Appended at end; user's custom order preserved               |
| Seed presets content overwritten | Safe   | Updates content, not position                                |
| Removed seed presets             | Safe   | Filtered out; activePresetId falls back to first if needed   |
| Mixed seed + custom order        | Safe   | ID-based matching is position-independent                    |

**Verdict: Reordering is fully safe with reconciliation.**

---

## Files to Touch

| File                                              | Change                                                                     |
|---------------------------------------------------|----------------------------------------------------------------------------|
| `src/lib/presets.ts`                              | Export `SEED_PRESET_IDS`, `isSeedPreset()`                                 |
| `src/providers/AppConfigProvider.tsx`              | `reconcileWithSeedPresets()` in `loadFromStorage`, guard reducer mutations  |
| `src/components/app-bar/PresetSelector.tsx`        | Conditional UI for seed vs user presets, add duplicate button               |
| `src/providers/tests/app-config-provider/*.test.ts`| Update tests for new reconciliation and readonly guards                    |
| `src/lib/tests/migration/migration.test.ts`       | Verify reconciliation merges new seeds correctly                           |

## Testing

1. **New user** — gets all current seed presets, no duplicates
2. **Existing user** — new seed presets appear, removed ones disappear, user presets untouched
3. **Edit seed preset** — auto-duplicates, user lands on the custom copy
4. **Delete seed preset** — blocked (no-op)
5. **Rename seed preset** — blocked (no-op)
6. **Reorder** — preserved across reconciliation
7. **activePresetId pointed to removed seed** — falls back gracefully
