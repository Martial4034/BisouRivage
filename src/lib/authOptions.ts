// src/lib/authOptions.ts

import { NextAuthOptions, Session, TokenSet } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { getUserRole } from '@/app/firebaseAdmin';

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: '/auth/signin',
  },
  session: {
    strategy: 'jwt' as const,
  },
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {},
      async authorize(credentials: any): Promise<any> {
        const user = JSON.parse(credentials.user);
        if (user) {
          return { ...user, uid: user.uid, role: await getUserRole(user.uid) };
        }
        return null;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }: { token: TokenSet; user?: any }) {
      if (user) {
        token.uid = user.uid;
        token.role = user.role;
      }
      return token;
    },
    async session({
      session,
      token,
    }: {
      session: Session;
      token: TokenSet;
    }) {
      if (token) {
        session.user.uid = token.uid as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
};
