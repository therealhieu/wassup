import { describe, it, expect } from "vitest";
import { encryptConfig, decryptConfig } from "@/lib/client-crypto";

describe("client-crypto", () => {
	const PASSPHRASE = "test-passphrase-123";
	const PLAINTEXT = JSON.stringify({
		activePresetId: "p1",
		presets: [{ id: "p1", name: "Test", config: {} }],
	});

	it("encrypt → decrypt round-trip preserves plaintext", async () => {
		const { encrypted, salt } = await encryptConfig(PLAINTEXT, PASSPHRASE);
		const result = await decryptConfig(encrypted, salt, PASSPHRASE);

		expect(result).toBe(PLAINTEXT);
	});

	it("produces different ciphertext for same plaintext (fresh IV)", async () => {
		const result1 = await encryptConfig(PLAINTEXT, PASSPHRASE);
		const result2 = await encryptConfig(PLAINTEXT, PASSPHRASE);

		expect(result1.encrypted).not.toBe(result2.encrypted);
	});

	it("reuses salt when existingSalt is provided", async () => {
		const first = await encryptConfig(PLAINTEXT, PASSPHRASE);
		const second = await encryptConfig(
			PLAINTEXT,
			PASSPHRASE,
			first.salt,
		);

		expect(second.salt).toBe(first.salt);

		// Both should decrypt with the same passphrase
		const plain1 = await decryptConfig(
			first.encrypted,
			first.salt,
			PASSPHRASE,
		);
		const plain2 = await decryptConfig(
			second.encrypted,
			second.salt,
			PASSPHRASE,
		);
		expect(plain1).toBe(PLAINTEXT);
		expect(plain2).toBe(PLAINTEXT);
	});

	it("throws on wrong passphrase", async () => {
		const { encrypted, salt } = await encryptConfig(PLAINTEXT, PASSPHRASE);

		await expect(
			decryptConfig(encrypted, salt, "wrong-passphrase"),
		).rejects.toThrow();
	});

	it("throws on tampered ciphertext", async () => {
		const { encrypted, salt } = await encryptConfig(PLAINTEXT, PASSPHRASE);

		// Flip a character in the middle of the ciphertext
		const tampered =
			encrypted.slice(0, 20) + "X" + encrypted.slice(21);

		await expect(
			decryptConfig(tampered, salt, PASSPHRASE),
		).rejects.toThrow();
	});

	it("handles large payloads without stack overflow", async () => {
		const largePayload = JSON.stringify({ data: "x".repeat(100_000) });
		const { encrypted, salt } = await encryptConfig(
			largePayload,
			PASSPHRASE,
		);
		const result = await decryptConfig(encrypted, salt, PASSPHRASE);

		expect(result).toBe(largePayload);
	});
});
