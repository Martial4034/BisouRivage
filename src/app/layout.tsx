"use client";

import { useEffect } from 'react';
import { TopNavBar } from './components/TopNavBar';
import './globals.css';
import { GoogleAnalytics } from '@next/third-parties/google'
import { Toaster } from "@/app/components/ui/toaster";
import Providers from './Providers';
import ClientWrapper from './ClientWrapper';
import Footer from '@/app/components/Footer';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Désactiver le menu contextuel
    const handleContextMenu = (event: MouseEvent) => event.preventDefault();
    document.addEventListener('contextmenu', handleContextMenu);

    // Désactiver les raccourcis clavier
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && (event.key === 's' || event.key === 'u')) {
        event.preventDefault();
      }
    };
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);
  
  return (
    <html lang="fr" className="h-full">
      <head>
        {/* Balises méta essentielles */}
        <title>Bisou Rivage : Photographie d'art · Galerie Art Française · Achat Photo en ligne</title>
        <meta name="description" content="  Des photos exclusives en tirages limités et numérotés par de jeunes Artistes et Designers, découvrez l'univers de Bisou Rivage !" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />

        {/* Balises Open Graph pour les réseaux sociaux */}
        <meta property="og:title" content="Bisou Rivage : Photographie d'art · Galerie Art Française · Achat Photo en ligne" />
        <meta property="og:description" content="  Des photos exclusives en tirages limités et numérotés par de jeunes Artistes et Designers, découvrez l'univers de Bisou Rivage !" />
        <meta property="og:image" content="https://bisourivage.fr/images/og-image.jpg" />
        <meta property="og:url" content="https://bisourivage.fr" />
        <meta property="og:type" content="website" />

        {/* Balises Twitter Card */}
        <meta name="twitter:title" content="Bisou Rivage : Photographie d'art · Galerie Art Française · Achat Photo en ligne" />
        <meta name="twitter:description" content="  Des photos exclusives en tirages limités et numérotés par de jeunes Artistes et Designers, découvrez l'univers de Bisou Rivage !" />
        <meta name="twitter:image" content="https://bisourivage.fr/images/og-image.jpg" />
        <meta name="twitter:card" content="summary_large_image" />

        {/* Favicons */}
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/images/og-image.jpg" />

        {/* Autres balises méta */}
        <meta charSet="UTF-8" />
      </head>
      <body className="min-h-screen flex flex-col">
        <GoogleAnalytics gaId="G-S29V577DYX" />
        <Providers>
          <ClientWrapper>
            <TopNavBar />
            <main className="flex-grow">
              {children}
            </main>
            <Toaster />
            <Footer />
          </ClientWrapper>
        </Providers>
      </body>
    </html>
  );
}
