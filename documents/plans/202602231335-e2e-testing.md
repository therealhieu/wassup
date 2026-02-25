# E2E Testing Plan

## Overview

End-to-end tests using Playwright to verify critical user flows: authentication, preset navigation, page tab management, and edit operations. Tests run against the app with `NODE_ENV=test`, which enables a Credentials provider for authentication without GitHub OAuth.

---

## Infrastructure

### Test Auth

A test-only `Credentials` provider is registered when `NODE_ENV=test` (gated in `src/lib/auth.ts`). It accepts `userId`, `email`, and `name` via form POST — no OAuth redirect. Production builds (`NODE_ENV=production`) never include this provider.

### Playwright Fixtures

```ts
// e2e/fixtures/auth.ts
export const test = base.extend<{ authenticatedPage: Page }>({
  authenticatedPage: async ({ page }, use) => {
    // Sign in via test Credentials provider
    await signInAsTestUser(page);
    await use(page);
  },
});
```

| Fixture                | Auth State   | Usage                                       |
|------------------------|-------------|---------------------------------------------|
| `{ page }`             | No auth     | Testing sign-in prompts, access restrictions |
| `{ authenticatedPage }` | Signed in  | Testing presets, tabs, edit operations        |

### File Structure

```
e2e/
├── fixtures/auth.ts             # shared auth fixture
├── tsconfig.json                # @playwright/test types
├── auth.spec.ts                 # authentication & access control
├── preset-navigation.spec.ts    # preset switching, CRUD
├── page-tabs.spec.ts            # tab navigation & management
└── edit-operations.spec.ts      # enter/exit edit, save, cancel
```

---

## Prerequisites — `data-testid` Attributes

Add the following `data-testid` attributes to key components before writing tests. This makes selectors resilient against text/label changes.

| Component                | `data-testid`              | File                                    |
|--------------------------|----------------------------|-----------------------------------------|
| Preset selector button   | `preset-selector`          | `PresetSelector.tsx`                    |
| Edit mode toggle         | `edit-mode-toggle`         | `DashboardAppBar.tsx`                   |
| Save button              | `edit-save`                | `EditModeContainer.tsx`                 |
| Cancel button            | `edit-cancel`              | `EditModeContainer.tsx`                 |
| Page tab                 | `page-tab-{index}`         | `EditablePageTabBar.tsx`                |
| Add page button          | `add-page`                 | `EditablePageTabBar.tsx`                |
| Sign-in button           | `sign-in`                  | `LoginButton.tsx` or `DashboardAppBar.tsx` |

---

## Test Specs

### 1. `auth.spec.ts` — Authentication & Access Control

Uses **both** `page` (no auth) and `authenticatedPage` (signed in).

| Test                                          | Fixture              | Assertions                              |
|----------------------------------------------|----------------------|-----------------------------------------|
| Unauthenticated user sees sign-in button     | `page`               | Sign-in button visible                  |
| Unauthenticated user cannot see edit button  | `page`               | Edit button not visible                 |
| Unauthenticated user still sees dashboard    | `page`               | Page loads with widgets (default config) |
| Authenticated user sees dashboard            | `authenticatedPage`  | Dashboard visible, no sign-in button    |
| Authenticated user sees edit button          | `authenticatedPage`  | Edit button visible                     |
| Authenticated user sees preset selector      | `authenticatedPage`  | Preset selector visible                 |

### 2. `preset-navigation.spec.ts` — Preset CRUD

Uses `authenticatedPage` only.

| Test                                         | Steps                                                | Assertions                                           |
|----------------------------------------------|------------------------------------------------------|------------------------------------------------------|
| Shows active preset name in selector         | Load page                                            | Preset selector displays the seeded preset name      |
| Opens preset menu on click                   | Click preset selector                                | Menu visible with preset items                       |
| Switch preset updates selector label         | Open menu → click second preset                      | Selector label changes to second preset name         |
| Menu closes after selection                  | Open menu → click preset                             | Menu not visible                                     |
| Create new preset                            | Open menu → click "New Preset"                       | New preset created, selector shows "New Preset"      |
| Rename preset inline                         | Open menu → click edit icon → type new name → Enter  | Preset renamed, selector updated                     |
| Rename preserves on Escape                   | Open menu → click edit → type → Escape               | Original name preserved                              |
| Delete preset with confirmation              | Open menu → click delete icon → confirm dialog       | Preset removed, active switches to remaining         |
| Cancel delete preserves preset               | Open menu → click delete icon → cancel dialog        | Preset still exists                                  |
| Cannot delete last preset                    | Delete all but one → check delete icon               | Delete icon not visible on last preset               |
| Preset switch persists widgets               | Switch to preset A → switch to B → switch back to A  | Preset A's widgets are intact                        |
| Preset persists after reload                 | Switch preset → reload page                          | Same preset is active after reload                   |

### 3. `page-tabs.spec.ts` — Tab Navigation & Management

Uses `authenticatedPage`. All tests enter edit mode first.

| Test                                         | Steps                                                | Assertions                                           |
|----------------------------------------------|------------------------------------------------------|------------------------------------------------------|
| Shows page tabs in edit mode                 | Enter edit mode                                      | At least one tab visible                             |
| Click tab switches active page               | Enter edit → click second tab                        | Second tab highlighted, column content changes       |
| Add new page tab                             | Enter edit → click add page button                   | New tab appears, becomes active                      |
| Delete page tab                              | Enter edit → click close icon on a tab               | Tab removed, active switches to remaining            |
| Cannot delete last page tab                  | Delete all but one → check close icon                | Close icon not visible on last tab                   |
| Rename tab via double-click                  | Enter edit → double-click tab text → type → Enter    | Tab label updated                                    |
| Rename tab cancelled on Escape               | Enter edit → double-click → type → Escape            | Original label preserved                             |
| Tab state resets on cancel edit              | Enter edit → add tab → cancel                        | Added tab is gone, original tabs restored            |
| Switching presets resets tabs                | Enter edit → switch preset                           | Tabs reflect the new preset's pages                  |

### 4. `edit-operations.spec.ts` — Edit Mode

Uses `authenticatedPage`.

| Test                                         | Steps                                                | Assertions                                           |
|----------------------------------------------|------------------------------------------------------|------------------------------------------------------|
| Enter edit mode                              | Click edit button                                    | Save/Cancel visible, edit button hidden              |
| Exit via save                                | Enter edit → save                                    | Edit button visible, save/cancel hidden              |
| Exit via cancel                              | Enter edit → cancel                                  | Edit button visible, save/cancel hidden              |
| Cancel discards changes                      | Enter edit → add page → cancel                       | New page not present                                 |
| Save persists changes                        | Enter edit → add page → save                         | New page persists                                    |
| Save persists across reload                  | Enter edit → add page → save → reload                | New page still present                               |
| Cannot nest edit mode                        | Enter edit → edit button should be hidden             | Only one edit mode at a time                         |
| Edit mode shows column layout options        | Enter edit                                           | Column layout editor visible                         |

---

## Running

```bash
# Install browsers (first time)
bunx playwright install chromium

# Run all E2E tests
bun run test:e2e

# Run a specific spec
bun run test:e2e -- e2e/preset-navigation.spec.ts

# Run in headed mode (see the browser)
bun run test:e2e -- --headed

# Debug a specific test
bun run test:e2e -- --debug e2e/auth.spec.ts
```

---

## CI Integration

E2E tests are **not** in the CI pipeline yet. Add when tests are stable:

```yaml
# .github/workflows/ci.yml — future addition
- run: bunx playwright install --with-deps chromium
- run: bun run test:e2e
  env:
    DATABASE_URL: file:/tmp/ci.db
```

---

## Out of Scope

- ❌ Cross-browser testing (Firefox, Safari) — Chromium only for now
- ❌ Drag-and-drop reorder tests — hard to test reliably with Playwright
- ❌ Mobile responsive tests
- ❌ Visual regression testing
- ❌ Performance testing
