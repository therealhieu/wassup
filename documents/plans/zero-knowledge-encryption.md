# Zero-Knowledge Encryption for User Config Data

## Goal

Ensure that even the server operator (you) cannot read users' dashboard configurations. All encryption/decryption happens in the browser. The server is a blind vault that stores opaque ciphertext.

## Architecture

```
                        TRUST BOUNDARY
                             │
  ┌─── BROWSER ─────────────┤──── SERVER ────────────┐
  │                          │                        │
  │  passphrase (memory)     │                        │
  │       ↓                  │                        │
  │  PBKDF2 → AES key       │                        │
  │       ↓                  │                        │
  │  encrypt(config) ──────────→ store(ciphertext)    │
  │                          │                        │
  │  decrypt(ciphertext) ←─────  return(ciphertext)   │
  │       ↓                  │                        │
  │  Zod validate            │  ← cannot validate     │
  │  Render dashboard        │  ← cannot render       │
  │                          │  ← cannot read         │
  └──────────────────────────┤────────────────────────┘
                             │
          Key NEVER crosses this boundary
```

## Crypto Spec

- **Algorithm**: AES-256-GCM (authenticated encryption)
- **Key derivation**: PBKDF2 with SHA-256, 600,000 iterations (OWASP 2024 recommendation)
- **Salt**: 16 random bytes per user (stored in DB, not secret)
- **IV**: 12 random bytes per encryption (prepended to ciphertext)
- **API**: Web Crypto API (native browser, no dependencies)

## Data Flow

### First-time user (signed in, no data on server)

```
1. Sign in via GitHub OAuth
2. Server returns { encryptedData: null, salt: null }
3. App shows PassphraseDialog: "Set an encryption passphrase"
4. User enters + confirms passphrase
5. App generates random salt, derives AES key from passphrase + salt
6. Passphrase held in memory (React state), never persisted
7. Default config loaded, saved to localStorage
8. On first edit: encrypt(config) → PUT /api/config with { encryptedData, salt }
```

### Returning user (same device)

```
1. Sign in via GitHub OAuth
2. Load from localStorage (instant, unencrypted local cache)
3. Fetch server data → { encryptedData, salt }
4. Check sessionStorage for cached passphrase
   4a. If cached → try decrypt silently → success → done (no prompt)
   4b. If cached → decrypt fails → clear cache, show PassphraseDialog
   4c. If not cached → show PassphraseDialog: "Enter your passphrase to unlock"
5. Derive key from passphrase + salt
6. Decrypt server data → Zod validate on client → reconcile with localStorage
7. Passphrase held in memory + sessionStorage (survives page refresh, clears on browser close)
```

### Returning user (new device/browser)

```
1. Sign in via GitHub OAuth
2. localStorage is empty
3. Fetch server data → { encryptedData, salt }
4. PassphraseDialog: "Enter your passphrase to unlock"
5. Decrypt → load → save to localStorage as local cache
```

### Wrong passphrase

```
1. decrypt() throws (GCM authentication tag mismatch)
2. Dialog shows: "Incorrect passphrase. Try again."
3. No data loss — ciphertext is intact on server
4. User can retry unlimited times
```

### Anonymous user (not signed in)

```
No change. localStorage only. No server sync. No encryption needed.
```

## File Changes

### 1. NEW: `src/lib/client-crypto.ts`

Client-only module. Uses Web Crypto API (zero dependencies).

```ts
const ALGORITHM = "AES-GCM";
const PBKDF2_ITERATIONS = 600_000;
const SALT_LENGTH = 16; // bytes
const IV_LENGTH = 12;   // bytes

async function deriveKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(passphrase),
    "PBKDF2",
    false,
    ["deriveKey"],
  );
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: PBKDF2_ITERATIONS, hash: "SHA-256" },
    keyMaterial,
    { name: ALGORITHM, length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

/**
 * Encrypts plaintext config JSON.
 *
 * @param existingSalt - If provided, reuses the user's existing salt so the
 *   same passphrase derives the same key. Pass this on subsequent saves.
 *   Omit (or undefined) on first-time setup to generate a new random salt.
 */
export async function encryptConfig(
  plaintext: string,
  passphrase: string,
  existingSalt?: string,
): Promise<{ encrypted: string; salt: string }> {
  const salt = existingSalt
    ? base64ToUint8(existingSalt)
    : crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const key = await deriveKey(passphrase, salt);
  const ciphertextBuffer = await crypto.subtle.encrypt(
    { name: ALGORITHM, iv },
    key,
    new TextEncoder().encode(plaintext),
  );

  // Pack: iv (12) + ciphertext+authTag → single base64 string
  const packed = new Uint8Array(IV_LENGTH + ciphertextBuffer.byteLength);
  packed.set(iv, 0);
  packed.set(new Uint8Array(ciphertextBuffer), IV_LENGTH);

  return {
    encrypted: uint8ToBase64(packed),
    salt: uint8ToBase64(salt),
  };
}

export async function decryptConfig(
  encrypted: string,
  salt: string,
  passphrase: string,
): Promise<string> {
  const packed = base64ToUint8(encrypted);
  const saltBytes = base64ToUint8(salt);

  const iv = packed.slice(0, IV_LENGTH);
  const ciphertext = packed.slice(IV_LENGTH);

  const key = await deriveKey(passphrase, saltBytes);
  const plainBuffer = await crypto.subtle.decrypt(
    { name: ALGORITHM, iv },
    key,
    ciphertext,
  );

  return new TextDecoder().decode(plainBuffer);
}

// Helper: Uint8Array ↔ base64
// NOTE: Uses a loop instead of spread (...bytes) to avoid
// "Maximum call stack size exceeded" on large payloads (>50KB).
function uint8ToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToUint8(b64: string): Uint8Array {
  const binary = atob(b64);
  return Uint8Array.from(binary, (c) => c.charCodeAt(0));
}
```

### 2. NEW: `src/components/PassphraseDialog.tsx`

MUI Dialog with two modes:
- **Setup mode** (`isNewUser=true`): passphrase + confirm field, "Set Passphrase" button
- **Unlock mode** (`isNewUser=false`): single passphrase field, "Unlock" button

```tsx
interface PassphraseDialogProps {
  open: boolean;
  isNewUser: boolean;
  error?: string;
  onSubmit: (passphrase: string) => void;
}

function PassphraseDialog({ open, isNewUser, error, onSubmit }: PassphraseDialogProps) {
  // State: passphrase, confirmPassphrase, localError
  // Validation: min 8 chars, match confirm (setup mode)
  // On submit: call onSubmit(passphrase)
  // Show error from parent (wrong passphrase)
  // Dialog is NOT dismissible (no close button, no backdrop click)
}
```

### 3. MODIFY: `prisma/schema.prisma`

Add `salt` column to `UserConfig`:

```prisma
model UserConfig {
  id        String   @id @default(cuid())
  userId    String   @unique
  data      String   // CIPHERTEXT (base64-encoded AES-256-GCM output)
  salt      String   // PBKDF2 salt (base64-encoded, 16 bytes)
  updatedAt DateTime @updatedAt
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

Then truncate and recreate:

```bash
rm dev.db
bunx prisma migrate dev --name add-encryption-salt
```

### 4. MODIFY: `src/app/api/config/route.ts`

Server becomes a blind vault. Key changes:

- **Remove** `AppStateSchema` import and Zod validation
- **Add** basic size/type guard on the opaque blob
- **Return** `encryptedData` + `salt` fields

```ts
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createRateLimiter } from "@/lib/rate-limit";
import { validateOrigin } from "@/lib/csrf";

const limiter = createRateLimiter(30, 60_000);
const MAX_PAYLOAD_SIZE = 500_000; // 500KB

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { success } = limiter.check(session.user.id);
  if (!success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const record = await prisma.userConfig.findUnique({
    where: { userId: session.user.id },
  });

  return NextResponse.json({
    encryptedData: record?.data ?? null,
    salt: record?.salt ?? null,
  });
}

export async function PUT(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!validateOrigin(request)) {
    return NextResponse.json({ error: "CSRF validation failed" }, { status: 403 });
  }

  const { success } = limiter.check(session.user.id);
  if (!success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const body = await request.json();
  const { encryptedData, salt } = body;

  // Cannot validate structure — data is ciphertext. Only validate shape/size.
  if (
    typeof encryptedData !== "string" ||
    typeof salt !== "string" ||
    encryptedData.length > MAX_PAYLOAD_SIZE ||
    salt.length > 100
  ) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  await prisma.userConfig.upsert({
    where: { userId: session.user.id },
    create: { userId: session.user.id, data: encryptedData, salt },
    update: { data: encryptedData, salt },
  });

  return NextResponse.json({ ok: true });
}
```

### 5. MODIFY: `src/providers/AppConfigProvider.tsx`

Key changes to the provider:

**New constants:**
```ts
const PASSPHRASE_SESSION_KEY = "wassup-pp";
```

**New state:**
```ts
const [passphrase, setPassphrase] = useState<string | null>(null);
const [showPassphraseDialog, setShowPassphraseDialog] = useState(false);
const [isNewEncryptionUser, setIsNewEncryptionUser] = useState(false);
const [passphraseError, setPassphraseError] = useState<string | undefined>();
const serverDataRef = useRef<{ encryptedData: string; salt: string } | null>(null);
```

**Modified hydration logic:**
```ts
useEffect(() => {
  if (status === "loading") return;

  // Always load localStorage first (instant)
  const local = loadFromStorage(userId);
  dispatch({ type: "SET_STATE", payload: local });

  if (isAuthenticated) {
    fetch("/api/config")
      .then((res) => res.json())
      .then(async ({ encryptedData, salt }) => {
        if (encryptedData && salt) {
          serverDataRef.current = { encryptedData, salt };

          // Try cached passphrase from sessionStorage first (avoids re-prompting on refresh)
          const cached = sessionStorage.getItem(PASSPHRASE_SESSION_KEY);
          if (cached) {
            try {
              const plaintext = await decryptConfig(encryptedData, salt, cached);
              const serverState = AppStateSchema.parse(JSON.parse(plaintext));
              dispatch({ type: "SET_STATE", payload: serverState });
              saveToStorage(userId, serverState);
              setPassphrase(cached);
              isHydrated.current = true;
              return; // Success — no dialog needed
            } catch {
              sessionStorage.removeItem(PASSPHRASE_SESSION_KEY); // Stale/wrong — clear
            }
          }

          // No cached passphrase or it failed — prompt user
          setIsNewEncryptionUser(false);
          setShowPassphraseDialog(true);
        } else {
          // No server data — new user, needs to set passphrase
          setIsNewEncryptionUser(true);
          setShowPassphraseDialog(true);
          isHydrated.current = true;
        }
      })
      .catch(() => {
        isHydrated.current = true;
      });
  } else {
    isHydrated.current = true;
  }
}, [status, userId, isAuthenticated]);
```

**Passphrase submit handler:**
```ts
const handlePassphraseSubmit = useCallback(async (enteredPassphrase: string) => {
  if (isNewEncryptionUser) {
    // New user — store passphrase in memory + sessionStorage
    setPassphrase(enteredPassphrase);
    sessionStorage.setItem(PASSPHRASE_SESSION_KEY, enteredPassphrase);
    setShowPassphraseDialog(false);
    isHydrated.current = true;
    return;
  }

  // Existing user — try to decrypt server data
  const { encryptedData, salt } = serverDataRef.current!;
  try {
    const plaintext = await decryptConfig(encryptedData, salt, enteredPassphrase);
    const serverState = JSON.parse(plaintext);
    const validated = AppStateSchema.parse(serverState); // Zod validates HERE
    dispatch({ type: "SET_STATE", payload: validated });
    saveToStorage(userId, validated);
    setPassphrase(enteredPassphrase);
    sessionStorage.setItem(PASSPHRASE_SESSION_KEY, enteredPassphrase);
    setShowPassphraseDialog(false);
    setPassphraseError(undefined);
    isHydrated.current = true;
  } catch (err) {
    // Distinguish GCM auth failure (wrong passphrase) from other errors
    if (err instanceof DOMException) {
      setPassphraseError("Incorrect passphrase. Please try again.");
    } else {
      setPassphraseError("Failed to decrypt data. It may be corrupted.");
      logger.error("Decryption error (non-auth)", err);
    }
  }
}, [isNewEncryptionUser, userId]);
```

**Modified sync logic:**
```ts
const syncToServer = useDebouncedCallback(
  async (appState: AppState) => {
    if (!passphrase) return; // Can't encrypt without passphrase

    try {
      const plaintext = JSON.stringify(appState);

      // Reuse existing salt if available (subsequent saves).
      // First save generates a new salt via encryptConfig.
      const existingSalt = serverDataRef.current?.salt;
      const result = await encryptConfig(plaintext, passphrase, existingSalt);

      // Cache the salt for future encryptions
      serverDataRef.current = { encryptedData: result.encrypted, salt: result.salt };

      await fetch("/api/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          encryptedData: result.encrypted,
          salt: result.salt,
        }),
      });
    } catch (err) {
      logger.error("Failed to sync encrypted state to server", err);
    }
  },
  1000,
);
```

**Render PassphraseDialog:**
```tsx
return (
  <AppConfigContext.Provider value={value}>
    <PassphraseDialog
      open={showPassphraseDialog}
      isNewUser={isNewEncryptionUser}
      error={passphraseError}
      onSubmit={handlePassphraseSubmit}
    />
    {children}
  </AppConfigContext.Provider>
);
```

### 6. MODIFY: `src/app/api/config/tests/config-route/config-route.test.ts`

Update tests to match the new API shape:
- PUT sends `{ encryptedData, salt }` instead of `{ state }`
- GET returns `{ encryptedData, salt }` instead of `{ state }`
- Remove Zod validation tests (server can't validate ciphertext)
- Keep auth, CSRF, rate-limit tests

## Salt Handling Detail

The salt is generated **once** per user on their first save and reused for all subsequent encryptions. This means:

```
Same passphrase + same salt = same derived key = can decrypt all versions
```

The salt is stored in the DB alongside the ciphertext. It's NOT secret — its purpose is to prevent rainbow table attacks on the PBKDF2 derivation.

However, each encryption uses a **fresh random IV**, so encrypting the same plaintext twice produces different ciphertext (semantic security).

## Security Properties

| Property | Guaranteed? |
|----------|------------|
| Server operator cannot read user data | ✅ Yes |
| Database leak reveals nothing | ✅ Yes (ciphertext + salt, no key) |
| Tamper detection | ✅ Yes (GCM auth tag) |
| Cross-device sync | ✅ Yes (user re-enters passphrase) |
| Brute-force resistance | ✅ Yes (600K PBKDF2 iterations) |
| Recovery if passphrase lost | ❌ No (by design) |
| Server-side validation of config | ❌ No (opaque ciphertext) |

## Execution Steps

```
1. Implement src/lib/client-crypto.ts
2. Implement src/components/PassphraseDialog.tsx
3. Update prisma/schema.prisma (add salt column)
4. Truncate DB: rm dev.db && bunx prisma migrate dev --name encryption-salt
5. Update src/app/api/config/route.ts (blind vault)
6. Update src/providers/AppConfigProvider.tsx (encrypt/decrypt flow)
7. Update tests
8. Verify: tsc --noEmit, vitest, manual browser test
```

## Estimated Effort

| Task | Time |
|------|------|
| `client-crypto.ts` | 1 hour |
| `PassphraseDialog.tsx` | 1 hour |
| Schema + DB reset | 10 min |
| Server route changes | 20 min |
| `AppConfigProvider` changes | 2 hours |
| Test updates | 1 hour |
| Manual testing | 30 min |
| **Total** | **~6 hours** |
