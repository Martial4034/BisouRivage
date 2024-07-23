import { NextRequest, NextResponse } from 'next/server';
import { authAdmin, firestoreAdmin } from '@/app/firebaseAdmin';

export async function POST(req: NextRequest) {
  const { email } = await req.json();

  try {
    const userRecord = await authAdmin.getUserByEmail(email);
    const userDoc = await firestoreAdmin.collection('users').doc(userRecord.uid).get();
    
    if (!userDoc.exists) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    const userData = userDoc.data();
    return NextResponse.json(userData, { status: 200 });
  } catch (error) {
    console.error('Error fetching user data:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}