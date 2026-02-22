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

const VALID_APP_STATE = {
	activePresetId: "p1",
	presets: [
		{
			id: "p1",
			name: "Test Preset",
			config: {
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
			},
		},
	],
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

	it("should return null state for new user", async () => {
		mockAuth.mockResolvedValue({
			user: { id: "user-1" },
			expires: "2099-01-01",
		} as never);
		mockFindUnique.mockResolvedValue(null);

		const response = await GET();

		expect(response.status).toBe(200);
		const body = await response.json();
		expect(body.state).toBeNull();
	});

	it("should return saved state for existing user", async () => {
		mockAuth.mockResolvedValue({
			user: { id: "user-1" },
			expires: "2099-01-01",
		} as never);
		mockFindUnique.mockResolvedValue({
			id: "cfg-1",
			userId: "user-1",
			data: JSON.stringify(VALID_APP_STATE),
			updatedAt: new Date(),
		});

		const response = await GET();

		expect(response.status).toBe(200);
		const body = await response.json();
		expect(body.state).toEqual(VALID_APP_STATE);
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
			body: JSON.stringify({ state: {} }),
			headers: { "Content-Type": "application/json" },
		});
		const response = await PUT(request);

		expect(response.status).toBe(401);
	});

	it("should return 400 for invalid state", async () => {
		mockAuth.mockResolvedValue({
			user: { id: "user-1" },
			expires: "2099-01-01",
		} as never);

		const request = new Request("http://localhost/api/config", {
			method: "PUT",
			body: JSON.stringify({ state: { invalid: true } }),
			headers: { "Content-Type": "application/json" },
		});
		const response = await PUT(request);

		expect(response.status).toBe(400);
		const body = await response.json();
		expect(body.error).toBe("Invalid state");
	});

	it("should upsert valid state and return ok", async () => {
		mockAuth.mockResolvedValue({
			user: { id: "user-1" },
			expires: "2099-01-01",
		} as never);
		mockUpsert.mockResolvedValue({
			id: "cfg-1",
			userId: "user-1",
			data: "{}",
			updatedAt: new Date(),
		});

		const request = new Request("http://localhost/api/config", {
			method: "PUT",
			body: JSON.stringify({ state: VALID_APP_STATE }),
			headers: { "Content-Type": "application/json" },
		});
		const response = await PUT(request);

		expect(response.status).toBe(200);
		const body = await response.json();
		expect(body.ok).toBe(true);
		expect(mockUpsert).toHaveBeenCalledWith(
			expect.objectContaining({
				where: { userId: "user-1" },
				create: expect.objectContaining({ userId: "user-1" }),
			}),
		);
	});
});
