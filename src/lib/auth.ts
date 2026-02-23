import NextAuth, { type NextAuthConfig } from "next-auth";
import GitHub from "next-auth/providers/github";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";

const config: NextAuthConfig = {
	adapter: PrismaAdapter(prisma as never),
	providers: [GitHub],
	callbacks: {
		session({ session, user }) {
			session.user.id = user.id;
			return session;
		},
	},
};

// Test-only credentials provider — only enabled when explicitly opted in
if (process.env.ENABLE_TEST_CREDENTIALS === "true") {
	config.providers = [
		...config.providers,
		Credentials({
			id: "test-credentials",
			name: "Test",
			credentials: {
				userId: { type: "text" },
				email: { type: "text" },
				name: { type: "text" },
			},
			async authorize(credentials) {
				if (!credentials?.userId) return null;
				return {
					id: credentials.userId as string,
					email: (credentials.email as string) ?? "test@example.com",
					name: (credentials.name as string) ?? "Test User",
				};
			},
		}),
	];
}

export const { handlers, auth, signIn, signOut } = NextAuth(config);
