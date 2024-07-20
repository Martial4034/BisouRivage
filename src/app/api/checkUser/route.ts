// src/app/api/checkUser/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { authAdmin } from '@/app/firebaseAdmin';

export async function POST(req: NextRequest) {
  const { email } = await req.json();

  try {
    const userRecord = await authAdmin.getUserByEmail(email);
    return NextResponse.json({ userExists: true });
  } catch (error: any) {
    if (error.code === 'auth/user-not-found') {
      return NextResponse.json({ userExists: false });
    }
    console.error('Error checking user:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
