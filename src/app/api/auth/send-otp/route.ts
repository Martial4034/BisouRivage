// src/app/api/auth/send-otp/route.ts

import { NextRequest, NextResponse } from "next/server";
import {
  authAdmin,
  firestoreAdmin,
  FieldValue,
  Timestamp,
} from "@/app/firebaseAdmin";
import { Resend } from "resend";
import { SignInEmailTemplate } from "@/app/components/email/AuthEmailTemplates";
import { v4 as uuidv4 } from "uuid";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  const { email } = await req.json();

  try {
    // Vérifier si l'utilisateur existe
    let userRecord;
    try {
      userRecord = await authAdmin.getUserByEmail(email);
    } catch (error: any) {
      if (error.code === "auth/user-not-found") {
        // L'utilisateur n'existe pas
        return NextResponse.json({ userExists: false }, { status: 200 });
      }
      console.error("Erreur lors de la vérification de l'utilisateur:", error);
      return NextResponse.json(
        { message: "Erreur interne du serveur" },
        { status: 500 }
      );
    }

    const uid = userRecord.uid;

    // Générer le code OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Stocker le code OTP avec expiration (10 minutes)
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);

    await firestoreAdmin
      .collection("otpCodes")
      .doc(uid)
      .set({
        code: otpCode,
        createdAt: FieldValue.serverTimestamp(),
        expiresAt: Timestamp.fromDate(expiresAt),
      });

    // Générer un token sécurisé
    const token = uuidv4();

    // Stocker le token avec l'adresse e-mail et la date d'expiration
    await firestoreAdmin
      .collection("otpTokens")
      .doc(token)
      .set({
        email: email,
        createdAt: FieldValue.serverTimestamp(),
        expiresAt: Timestamp.fromDate(expiresAt),
      });
    
    const signInurl = `${process.env.NEXTAUTH_URL}/auth/signin-token?token=${token}`;

      
    // Mettre à jour les informations de l'utilisateur dans Firestore
    const userDocRef = firestoreAdmin.collection("users").doc(uid);
    await userDocRef.update({
      lastEmailSent: FieldValue.serverTimestamp(),
      emailSent: FieldValue.increment(1),
      lastLogin: FieldValue.serverTimestamp(),
    });

    // Envoyer le code OTP par email
    await resend.emails.send({
      from: `${process.env.PROJECT_NAME} <onboarding@bisourivage.fr>`,
      to: [email],
      subject: "Votre code de connexion",
      react: SignInEmailTemplate({ code: otpCode, email, url: signInurl }),
    });

    return NextResponse.json(
      { userExists: true, message: "Code OTP envoyé." },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Erreur lors de l'envoi du code OTP:", error);
    return NextResponse.json(
      { message: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
