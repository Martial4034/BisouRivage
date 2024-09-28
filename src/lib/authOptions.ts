// src/lib/authOptions.ts

import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { authAdmin, firestoreAdmin } from '@/app/firebaseAdmin';
import { getUserRole } from '@/app/firebaseAdmin';

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error', // Page d'erreur personnalisée (optionnel)
  },
  session: {
    strategy: 'jwt',
  },
  providers: [
    CredentialsProvider({
      name: 'Connexion par Code OTP',
      credentials: {
        email: { label: 'Email', type: 'text' },
        code: { label: 'Code OTP', type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials) {
          throw new Error('Les informations d\'identification sont manquantes.');
        }
        const { email, code } = credentials;

        try {
          // Récupérer l'utilisateur par email
          const userRecord = await authAdmin.getUserByEmail(email);
          const uid = userRecord.uid;

          // Récupérer le code OTP depuis Firestore
          const otpDoc = await firestoreAdmin.collection('otpCodes').doc(uid).get();
          if (!otpDoc.exists) {
            throw new Error('Code invalide ou expiré.');
          }

          const otpData = otpDoc.data();
          const now = new Date();
          const expiresAt = otpData?.expiresAt.toDate();

          if (!otpData || now > expiresAt || otpData.code !== code) {
            throw new Error('Code invalide ou expiré.');
          }

          // Supprimer le code OTP après vérification réussie
          await firestoreAdmin.collection('otpCodes').doc(uid).delete();

          // Récupérer le rôle de l'utilisateur
          const role = await getUserRole(uid);

          // Retourner l'objet utilisateur pour la session
          return { id: uid, uid, email: userRecord.email, role: role ?? '' };
        } catch (error) {
          console.error('Erreur lors de l\'autorisation:', error);
          throw new Error('Échec de l\'authentification.');
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.uid = user.uid;
        token.role = user.role;
        token.email = user.email;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.uid = token.uid as string;
        session.user.role = token.role as string;
        session.user.email = token.email as string;
      }
      return session;
    },
  },
};
