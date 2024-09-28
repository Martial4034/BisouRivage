// src/app/api/auth/verify-token/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { firestoreAdmin, Timestamp } from '@/app/firebaseAdmin';

export async function POST(req: NextRequest) {
  const { token } = await req.json();

  try {
    const tokenDoc = await firestoreAdmin.collection('otpTokens').doc(token).get();

    if (!tokenDoc.exists) {
      return NextResponse.json({ message: 'Token invalide ou expiré.' }, { status: 400 });
    }

    const tokenData = tokenDoc.data();
    if (!tokenData) {
      return NextResponse.json({ message: 'Token invalide ou expiré.' }, { status: 400 });
    }
    const now = Timestamp.now();

    if (now.toMillis() > tokenData.expiresAt.toMillis()) {
      // Token expiré, le supprimer de la base de données
      await firestoreAdmin.collection('otpTokens').doc(token).delete();
      return NextResponse.json({ message: 'Token expiré.' }, { status: 400 });
    }

    const email = tokenData.email;

    // Supprimer le token après utilisation pour éviter la réutilisation
    await firestoreAdmin.collection('otpTokens').doc(token).delete();

    return NextResponse.json({ email }, { status: 200 });
  } catch (error: any) {
    console.error('Erreur lors de la vérification du token:', error);
    return NextResponse.json({ message: 'Erreur interne du serveur.' }, { status: 500 });
  }
}
