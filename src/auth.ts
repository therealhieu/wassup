
import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import { authLogger } from "@/lib/logger"

export const { handlers, signIn, signOut, auth } = NextAuth({
  // No adapter - using pure JWT sessions
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    })
  ],
  session: {
    strategy: "jwt", // JWT-only sessions (default when no adapter)
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
  },
  secret: process.env.NEXTAUTH_SECRET, // Required for JWT encryption
  pages: {
    error: "/auth/error",
  },
  callbacks: {
    async jwt({ token, user, account }) {
      // On first sign in, persist user info in the token
      if (user) {
        token.id = user.id;
        token.email = user.email;
        authLogger.info('JWT created', { 
          userId: user.id, 
          email: user.email,
          provider: account?.provider 
        });
      }
      return token;
    },
    async session({ session, token }) {
      // Pass user ID from JWT token to session
      if (session.user) {
        // Use Google ID from token.sub (subject)
        session.user.id = token.sub!;
        authLogger.info('Session created', { 
          userId: session.user.id, 
          email: session.user.email || token.email
        });
      }
      return session;
    },
    async signIn({ user, account, profile }) {
      authLogger.info('Sign in attempt', {
        userId: user.id,
        email: user.email,
        provider: account?.provider,
        accountId: account?.providerAccountId
      });
      // Allow sign in
      return true;
    },
  },
  events: {
    async signIn({ user, account }) {
      authLogger.info('User signed in', {
        userId: user.id,
        email: user.email,
        provider: account?.provider
      });
    },
    async signOut({ token }) {
      authLogger.info('User signed out', {
        userId: token?.sub
      });
    },
  },
})