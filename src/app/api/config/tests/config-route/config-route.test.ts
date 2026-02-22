import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mocks (must be hoisted before imports) ───────────────────────────────────

vi.mock("@/lib/auth", () => ({
	auth: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
	prisma: {
		userConfig: {
			findUnique: vi.fn(),
			upsert: vi.fn(),
		},
	},
}));

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { GET, PUT } from "@/app/api/config/route";

const mockAuth = vi.mocked(auth);
const mockFindUnique = vi.mocked(prisma.userConfig.findUnique);
const mockUpsert = vi.mocked(prisma.userConfig.upsert);

const VALID_HEADERS = {
	"Content-Type": "application/json",
	Origin: "http://localhost",
	Host: "localhost",
};

// ── Tests ────────────────────────────────────────────────────────────────────

describe("GET /api/config", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("should return 401 when unauthenticated", async () => {
		mockAuth.mockResolvedValue(null);

		const response = await GET();

		expect(response.status).toBe(401);
		const body = await response.json();
		expect(body.error).toBe("Unauthorized");
	});

	it("should return null encryptedData for new user", async () => {
		mockAuth.mockResolvedValue({
			user: { id: "user-1" },
			expires: "2099-01-01",
		} as never);
		mockFindUnique.mockResolvedValue(null);

		const response = await GET();

		expect(response.status).toBe(200);
		const body = await response.json();
		expect(body.encryptedData).toBeNull();
		expect(body.salt).toBeNull();
	});

	it("should return encrypted data and salt for existing user", async () => {
		mockAuth.mockResolvedValue({
			user: { id: "user-1" },
			expires: "2099-01-01",
		} as never);
		mockFindUnique.mockResolvedValue({
			id: "cfg-1",
			userId: "user-1",
			data: "encrypted-ciphertext-base64",
			salt: "salt-base64",
			updatedAt: new Date(),
		});

		const response = await GET();

		expect(response.status).toBe(200);
		const body = await response.json();
		expect(body.encryptedData).toBe("encrypted-ciphertext-base64");
		expect(body.salt).toBe("salt-base64");
	});
});

describe("PUT /api/config", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("should return 401 when unauthenticated", async () => {
		mockAuth.mockResolvedValue(null);

		const request = new Request("http://localhost/api/config", {
			method: "PUT",
			body: JSON.stringify({ encryptedData: "test", salt: "test" }),
			headers: VALID_HEADERS,
		});
		const response = await PUT(request);

		expect(response.status).toBe(401);
	});

	it("should return 400 for non-string encryptedData", async () => {
		mockAuth.mockResolvedValue({
			user: { id: "user-1" },
			expires: "2099-01-01",
		} as never);

		const request = new Request("http://localhost/api/config", {
			method: "PUT",
			body: JSON.stringify({ encryptedData: 123, salt: "test" }),
			headers: VALID_HEADERS,
		});
		const response = await PUT(request);

		expect(response.status).toBe(400);
		const body = await response.json();
		expect(body.error).toBe("Invalid payload");
	});

	it("should return 400 for missing salt", async () => {
		mockAuth.mockResolvedValue({
			user: { id: "user-1" },
			expires: "2099-01-01",
		} as never);

		const request = new Request("http://localhost/api/config", {
			method: "PUT",
			body: JSON.stringify({ encryptedData: "test", salt: 123 }),
			headers: VALID_HEADERS,
		});
		const response = await PUT(request);

		expect(response.status).toBe(400);
	});

	it("should upsert encrypted data and return ok", async () => {
		mockAuth.mockResolvedValue({
			user: { id: "user-1" },
			expires: "2099-01-01",
		} as never);
		mockUpsert.mockResolvedValue({
			id: "cfg-1",
			userId: "user-1",
			data: "encrypted-data",
			salt: "salt-data",
			updatedAt: new Date(),
		});

		const request = new Request("http://localhost/api/config", {
			method: "PUT",
			body: JSON.stringify({
				encryptedData: "encrypted-data",
				salt: "salt-data",
			}),
			headers: VALID_HEADERS,
		});
		const response = await PUT(request);

		expect(response.status).toBe(200);
		const body = await response.json();
		expect(body.ok).toBe(true);
		expect(mockUpsert).toHaveBeenCalledWith(
			expect.objectContaining({
				where: { userId: "user-1" },
				create: expect.objectContaining({
					userId: "user-1",
					data: "encrypted-data",
					salt: "salt-data",
				}),
				update: expect.objectContaining({
					data: "encrypted-data",
					salt: "salt-data",
				}),
			}),
		);
	});

	it("should return 403 when Origin does not match Host (CSRF)", async () => {
		mockAuth.mockResolvedValue({
			user: { id: "user-1" },
			expires: "2099-01-01",
		} as never);

		const request = new Request("http://localhost/api/config", {
			method: "PUT",
			body: JSON.stringify({
				encryptedData: "test",
				salt: "test",
			}),
			headers: {
				"Content-Type": "application/json",
				Origin: "http://evil.com",
				Host: "localhost",
			},
		});
		const response = await PUT(request);

		expect(response.status).toBe(403);
		const body = await response.json();
		expect(body.error).toBe("CSRF validation failed");
	});
});
