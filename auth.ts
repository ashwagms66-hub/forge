/**
 * NextAuth (Auth.js) configuration - server-only.
 *
 * Session strategy is JWT (no database adapter): the session is a signed,
 * httpOnly cookie containing minimal user info (id, name, email, image).
 * Consistent with the rest of Forge, which has no database - see
 * src/history/store.ts for the same in-memory approach applied to
 * analysis history.
 *
 * AUTH_SECRET, GITHUB_CLIENT_ID, and GITHUB_CLIENT_SECRET are read from
 * process.env only. This file is never imported by client components.
 */

import NextAuth from 'next-auth';
import GitHub from 'next-auth/providers/github';

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [GitHub],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, profile }) {
      if (profile) {
        token.id = String(profile.id ?? token.sub);
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = (token.id as string | undefined) ?? token.sub ?? '';
      }
      return session;
    },
  },
});
