// src/app/api/auth/registerUser/route.ts

import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import {
  authAdmin,
  firestoreAdmin,
  FieldValue,
  Timestamp,
} from "@/app/firebaseAdmin";
import { SignUpEmailTemplate } from "@/app/components/email/AuthEmailTemplates";
import { v4 as uuidv4 } from "uuid";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  const { email } = await req.json();

  try {
    // Vérifier si l'utilisateur existe déjà
    try {
      const existingUser = await authAdmin.getUserByEmail(email);
      return NextResponse.json(
        { message: "L'adresse email est déjà utilisée par un autre compte." },
        { status: 400 }
      );
    } catch (error: any) {
      if (error.code !== "auth/user-not-found") {
        console.error(
          "Erreur lors de la vérification de l'utilisateur:",
          error
        );
        return NextResponse.json(
          { message: "Erreur interne du serveur." },
          { status: 500 }
        );
      }
      // Si l'utilisateur n'existe pas, on continue pour le créer
    }

    // Générer un mot de passe aléatoire pour l'utilisateur
    const password = Array(24)
      .fill("0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz")
      .map((x) => x[Math.floor(Math.random() * x.length)])
      .join("");

    // Créer un nouvel utilisateur dans Firebase Auth
    const userRecord = await authAdmin.createUser({
      email: email,
      password: password,
    });

    const uid = userRecord.uid;

    // Créer un document dans Firestore avec les informations utilisateur
    await firestoreAdmin
      .collection("users")
      .doc(uid)
      .set({
        email: email,
        createdAt: FieldValue.serverTimestamp(),
        role: "user",
        lastLogin: FieldValue.serverTimestamp(),
        lastEmailSent: FieldValue.serverTimestamp(),
        emailSent: 1,
        ip: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip"),
      });

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

    const signUpurl = `${process.env.NEXTAUTH_URL}/auth/signin-token?token=${token}`;

    // Envoyer le code OTP par email
    await resend.emails.send({
      from: `${process.env.PROJECT_NAME} <onboarding@bisourivage.fr>`,
      to: [email],
      subject: "Bienvenue sur Bisourivage - Votre code de connexion",
      react: SignUpEmailTemplate({ code: otpCode, email, url: signUpurl }),
    });

    return NextResponse.json(
      { message: "Utilisateur créé et code OTP envoyé" },
      { status: 200 }
    );
  } catch (error: any) {
    console.error(
      "Erreur lors de la création de l'utilisateur ou de l'envoi de l'email:",
      error
    );
    return NextResponse.json(
      { message: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
