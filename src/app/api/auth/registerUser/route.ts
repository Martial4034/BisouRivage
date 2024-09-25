import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { authAdmin, firestoreAdmin, FieldValue } from '@/app/firebaseAdmin';
import { SignUpEmailTemplate } from '@/app/components/email/AuthEmailTemplates';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  const { email } = await req.json();

  try {
    // Vérifiez si l'utilisateur existe déjà
    try {
      const existingUser = await authAdmin.getUserByEmail(email);
      return NextResponse.json({ message: 'The email address is already in use by another account.' }, { status: 400 });
    } catch (error) {
      if ((error as any).code !== 'auth/user-not-found') {
        console.error('Error checking user:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
      }
    }

    // Générer un mot de passe aléatoire pour l'utilisateur
    const password = Array(24)
      .fill('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz')
      .map(x => x[Math.floor(Math.random() * x.length)])
      .join('');

    // Créer un nouvel utilisateur dans Firebase Auth
    const userRecord = await authAdmin.createUser({
      email: email,
      password: password,
    });

    // Créer un document dans Firestore avec les informations utilisateur
    await firestoreAdmin.collection('users').doc(userRecord.uid).set({
      email: email,
      createdAt: FieldValue.serverTimestamp(),
      role: 'user',
      lastLogin: FieldValue.serverTimestamp(),
      lastEmailSent: FieldValue.serverTimestamp(),
      emailSent: 1,
      ip: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip'),
    });

    // Générer le lien de connexion pour l'utilisateur
    const actionCodeSettings = {
      url: `${process.env.NEXTAUTH_URL}/auth/signin-confirm`,
      handleCodeInApp: true,
    };

    const signUpLink = await authAdmin.generateSignInWithEmailLink(email, actionCodeSettings);

    // Utiliser le template d'email d'inscription
    const emailTemplate = SignUpEmailTemplate;

    // Envoyer l'email d'inscription via Resend
    const { data, error } = await resend.emails.send({
      from: `${process.env.PROJECT_NAME} <onboarding@bisourivage.fr>`,
      to: [email],
      subject: 'Bienvenue sur Bisourivage',
      react: emailTemplate({ url: signUpLink, email }),
    });

    console.log('Sending sign-up email with URL:', signUpLink);

    if (error) {
      return NextResponse.json({ message: 'Error sending email' }, { status: 400 });
    }

    return NextResponse.json({ message: 'User created and email sent', data }, { status: 200 });
  } catch (error) {
    console.error('Error creating user or sending email:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
