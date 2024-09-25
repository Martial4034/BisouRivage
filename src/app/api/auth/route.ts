// src/app/api/auth/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { authAdmin, firestoreAdmin, FieldValue } from '@/app/firebaseAdmin';
import { Resend } from 'resend';
import { SignInEmailTemplate } from '@/app/components/email/AuthEmailTemplates';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  const { email } = await req.json();

  try {
    // Vérification si l'utilisateur existe déjà
    let userRecord;
    try {
      userRecord = await authAdmin.getUserByEmail(email);
    } catch (error) {
      if ((error as any).code === 'auth/user-not-found') {
        // L'utilisateur n'existe pas
        return NextResponse.json({ userExists: false });
      }
      console.error('Error checking user:', error);
      return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }

    // Si l'utilisateur existe, générer le lien de connexion
    console.log('User exists:', userRecord.uid);
    const actionCodeSettings = {
      url: `${process.env.NEXTAUTH_URL}/auth/signin-confirm`,
      handleCodeInApp: true,
    };

    const signInLink = await authAdmin.generateSignInWithEmailLink(email, actionCodeSettings);

    // Mettre à jour les informations de l'utilisateur dans Firestore
    const userDocRef = firestoreAdmin.collection('users').doc(userRecord.uid);
    await userDocRef.update({
      lastEmailSent: FieldValue.serverTimestamp(),
      emailSent: FieldValue.increment(1),
      lastLogin: FieldValue.serverTimestamp(),
    });

    // Envoyer l'email de connexion avec Resend
    await resend.emails.send({
      from: `${process.env.PROJECT_NAME} <onboarding@bisourivage.fr>`,
      to: [email],
      subject: 'Votre lien de connexion',
      react: SignInEmailTemplate({ url: signInLink, email }),
    });

    return NextResponse.json({ userExists: true, message: 'Lien de connexion envoyé.' });
  } catch (error) {
    console.error('Error sending sign-in link:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
