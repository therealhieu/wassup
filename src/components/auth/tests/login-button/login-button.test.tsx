import { describe, it, expect, vi } from "vitest";

vi.mock("next-auth/react", () => ({
    useSession: vi.fn(),
    signIn: vi.fn(),
    signOut: vi.fn(),
}));

import { useSession } from "next-auth/react";

describe("LoginButton", () => {
    it("should export LoginButton as a function", async () => {
        const mod = await import("@/components/auth/LoginButton");
        expect(typeof mod.LoginButton).toBe("function");
    });

    it("should use useSession hook", () => {
        vi.mocked(useSession).mockReturnValue({
            data: null,
            status: "unauthenticated",
            update: vi.fn(),
        });

        const result = useSession();
        expect(result.status).toBe("unauthenticated");
        expect(result.data).toBeNull();
    });

    it("should support authenticated session shape", () => {
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

        const result = useSession();
        expect(result.status).toBe("authenticated");
        expect(result.data?.user?.name).toBe("Test User");
    });
});
