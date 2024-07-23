// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  const protectedPaths = ['/auth/signin', '/auth/signin-confirm'];

  if (protectedPaths.includes(req.nextUrl.pathname)) {
    if (token) {
      const redirectUrl = req.cookies.get('redirectUrl')?.value || '/';
      return NextResponse.redirect(new URL(redirectUrl, req.url));
    }
  } else {
    if (!token) {
      req.nextUrl.searchParams.set('redirectUrl', req.nextUrl.pathname);
      return NextResponse.redirect(new URL('/auth/signin', req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/auth/:path*', '/profile', '/dashboard'],
};
