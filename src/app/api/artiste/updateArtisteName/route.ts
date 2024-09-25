import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import { firestoreAdmin } from '@/app/firebaseAdmin';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'artiste') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { artiste_name } = await req.json();

  if (!artiste_name || artiste_name.trim().split(' ').length < 2) {
    return NextResponse.json({ error: 'Nom d\'artiste invalide' }, { status: 400 });
  }

  try {
    const userRef = firestoreAdmin.collection('users').doc(session.user.uid);
    await userRef.update({ artiste_name });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du nom d\'artiste:', error);
    return NextResponse.json({ error: 'Échec de la mise à jour' }, { status: 500 });
  }
}
