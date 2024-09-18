import NextAuth, { NextAuthOptions, Session, TokenSet } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { getUserRole } from '@/app/firebaseAdmin';

// Configuration des options d'authentification
export const authOptions: NextAuthOptions = {
  pages: {
    signIn: '/auth/signin',
  },
  session: {
    strategy: 'jwt' as const, // Utilisation du type correct pour la stratégie de session
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
    // Typage explicite pour jwt callback
    async jwt({ token, user }: { token: TokenSet; user?: any }) {
      if (user) {
        token.uid = user.uid;
        token.role = user.role;
      }
      return token;
    },
    // Typage explicite pour session callback
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

// Handler pour Next.js API routes
const handler = NextAuth(authOptions);

// Gestion des requêtes GET et POST
export { handler as GET, handler as POST };
