// types/next-auth.d.ts
import NextAuth, { DefaultSession, DefaultUser } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      uid: string;
      role: string;
    } & DefaultSession['user'];
  }

  interface User {
    uid: string;
    role: string;
  }
}
