// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(req: NextRequest) {
  const token = await getToken({ req });
  const url = req.nextUrl.clone();
  const pathname = req.nextUrl.pathname;
  const isApiRoute = pathname.startsWith('/api/');

  // Routes nécessitant le rôle 'artiste'
  if (
    pathname.startsWith('/dashboard/artiste') ||
    pathname.startsWith('/api/artiste')
  ) {
    if (!token) {
      if (isApiRoute) {
        return new NextResponse(
          JSON.stringify({ error: 'Unauthorized' }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        );
      } else {
        url.pathname = '/auth/signin';
        url.searchParams.set('redirectUrl', pathname);
        return NextResponse.redirect(url);
      }
    } else if (token.role !== 'artiste') {
      if (isApiRoute) {
        return new NextResponse(
          JSON.stringify({ error: 'Forbidden' }),
          { 
            status: 555, 
            headers: { 
              'Content-Type': 'application/json',
              'X-User-Email': token.email as string
            } 
          }
        );
      } else {
        url.pathname = '/';
        return NextResponse.redirect(url);
      }
    }
  }
  // Routes nécessitant simplement une authentification
  else if (
    pathname.startsWith('/profile') ||
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/api/secured') ||
    pathname.startsWith('/checkout/success') ||
    pathname.startsWith('/checkout/cancel')
  ) {
    if (!token) {
      if (isApiRoute) {
        return new NextResponse(
          JSON.stringify({ error: 'Unauthorized' }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        );
      } else {
        url.pathname = '/auth/signin';
        url.searchParams.set('redirectUrl', pathname);
        return NextResponse.redirect(url);
      }
    }
  }

  // Continuer la requête si les conditions sont remplies
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/profile',
    '/dashboard/:path*',
    '/api/secured/:path*',
    '/api/artiste/:path*',
    '/checkout/success',
    '/checkout/cancel',
  ],
};
