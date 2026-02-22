"use client";

const ALGORITHM = "AES-GCM";
const PBKDF2_ITERATIONS = 600_000;
const SALT_LENGTH = 16; // bytes
const IV_LENGTH = 12; // bytes

// ── Key derivation ───────────────────────────────────────────────────────────

async function deriveKey(
	passphrase: string,
	salt: Uint8Array,
): Promise<CryptoKey> {
	const keyMaterial = await crypto.subtle.importKey(
		"raw",
		new TextEncoder().encode(passphrase),
		"PBKDF2",
		false,
		["deriveKey"],
	);
	return crypto.subtle.deriveKey(
		{
			name: "PBKDF2",
			salt: salt as BufferSource,
			iterations: PBKDF2_ITERATIONS,
			hash: "SHA-256",
		},
		keyMaterial,
		{ name: ALGORITHM, length: 256 },
		false,
		["encrypt", "decrypt"],
	);
}

// ── Encrypt / Decrypt ────────────────────────────────────────────────────────

/**
 * Encrypts plaintext config JSON using AES-256-GCM.
 *
 * @param existingSalt - Reuses the user's existing salt so the same passphrase
 *   derives the same key. Pass this on subsequent saves. Omit on first-time
 *   setup to generate a new random salt.
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

	// Pack: iv (12 bytes) + ciphertext+authTag → single base64 string
	const packed = new Uint8Array(IV_LENGTH + ciphertextBuffer.byteLength);
	packed.set(iv, 0);
	packed.set(new Uint8Array(ciphertextBuffer), IV_LENGTH);

	return {
		encrypted: uint8ToBase64(packed),
		salt: uint8ToBase64(salt),
	};
}

/**
 * Decrypts a base64-encoded AES-256-GCM ciphertext.
 * Throws DOMException if the passphrase is incorrect (GCM auth tag mismatch).
 */
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

// ── Base64 helpers ───────────────────────────────────────────────────────────
// Uses a loop instead of spread (...bytes) to avoid
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
