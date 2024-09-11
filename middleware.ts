import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  const url = req.nextUrl.clone(); // Clone de l'URL actuelle

  // Pages réservées aux artistes uniquement
  const artistProtectedPaths = ['/dashboard/artiste', '/api/artiste'];

  // Vérification si l'utilisateur accède à une page réservée aux artistes
  if (artistProtectedPaths.some((path) => req.nextUrl.pathname.startsWith(path))) {
    if (!token) {
      // Redirige vers la page de connexion si l'utilisateur n'est pas connecté
      url.pathname = '/auth/signin';

      // Ajouter le redirectUrl uniquement pour les artistes
      if (req.nextUrl.pathname === '/dashboard/artiste') {
        url.searchParams.set('redirectUrl', '/dashboard/artiste');
      }
      return NextResponse.redirect(url);
    } else if (token.role !== 'artiste') {
      // Redirige si l'utilisateur n'est pas un artiste
      url.pathname = '/';
      return NextResponse.redirect(url);
    }
  }

  // Pages nécessitant simplement une authentification (non spécifique aux artistes)
  const protectedPaths = ['/profile', '/dashboard'];

  // Si l'utilisateur accède à une page protégée
  if (protectedPaths.some((path) => req.nextUrl.pathname.startsWith(path))) {
    if (!token) {
      // Si non connecté, redirige vers /auth/signin avec un paramètre redirectUrl
      url.pathname = '/auth/signin';
      url.searchParams.set('redirectUrl', req.nextUrl.pathname);
      return NextResponse.redirect(url);
    }
  }

  // Continue la requête si les conditions sont remplies
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/profile', // Page utilisateur protégée
    '/dashboard', // Pages dashboard générales
    '/dashboard/artiste', // Page protégée pour les artistes
    '/api/artiste/:path*', // API pour les artistes
  ],
};
