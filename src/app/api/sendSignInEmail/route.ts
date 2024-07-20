import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { authAdmin, firestoreAdmin, FieldValue } from '@/app/firebaseAdmin';
import { SignUpEmailTemplate, SignInEmailTemplate } from '@/app/components/EmailTemplates';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  const { to, email, isSignUp } = await req.json();

  try {
    let link;
    let template;
    if (isSignUp) {
      // Générer un mot de passe aléatoire
      const password = Array(24).fill('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz').map(x => x[Math.floor(Math.random() * x.length)]).join('');

      // Créer un nouvel utilisateur
      const userRecord = await authAdmin.createUser({
        email: email,
        password: password,
      });

      // Créer un document dans la collection users avec les informations nécessaires
      await firestoreAdmin.collection('users').doc(userRecord.uid).set({
        email: email,
        createdAt: FieldValue.serverTimestamp(),
        role: 'user',
        lastLogin: FieldValue.serverTimestamp(),
        lastEmailSent: FieldValue.serverTimestamp(), // Champs pour traquer le dernier mail envoyé
        emailSent: 1, // Compteur de mails envoyés
        ip: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip'),
      });

      // Utiliser le template d'email d'inscription
      template = SignUpEmailTemplate;

      // Générer le lien de connexion
      const actionCodeSettings = {
        url: `${process.env.NEXTAUTH_URL}/auth/signin-confirm`,
        handleCodeInApp: true,
      };

      link = await authAdmin.generateSignInWithEmailLink(email, actionCodeSettings);
    } else {
      // Générer le lien de connexion pour l'utilisateur existant
      const actionCodeSettings = {
        url: `${process.env.NEXTAUTH_URL}/auth/signin-confirm`,
        handleCodeInApp: true,
      };

      link = await authAdmin.generateSignInWithEmailLink(email, actionCodeSettings);

      // Mettre à jour le document de l'utilisateur avec les informations nécessaires
      const userRecord = await authAdmin.getUserByEmail(email);
      const userDocRef = firestoreAdmin.collection('users').doc(userRecord.uid);

      await userDocRef.update({
        lastEmailSent: FieldValue.serverTimestamp(),
        emailSent: FieldValue.increment(1),
        lastLogin: FieldValue.serverTimestamp(), // Mise à jour de la dernière connexion
      });

      // Utiliser le template d'email de connexion
      template = SignInEmailTemplate;
    }

    // Envoyer l'email avec Resend
    const { data, error } = await resend.emails.send({
      from: `${process.env.PROJECT_NAME} <onboarding@laubier.online>`,
      to: [to],
      subject: isSignUp ? 'Bienvenue sur Bisourivage' : 'Votre lien de connexion',
      text: '',
      react: template({ url: link, email }),
    });

    console.log('Sending Email with URL:', link);

    if (error) {
      return NextResponse.json(error, { status: 400 });
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error('Error sending email:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
