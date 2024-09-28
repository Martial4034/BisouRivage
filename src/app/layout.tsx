// src/app/layout.tsx

import { TopNavBar } from './components/TopNavBar';
import './globals.css';
import SessionProvider from './SessionProvider';
import ClientWrapper from './ClientWrapper';
import { Toaster } from "@/app/components/ui/toaster";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className="h-full">
      <head>
        {/* Balises méta essentielles */}
        <title>BisouRivage - Marketplace de Photographies d'Artistes Français</title>
        <meta name="description" content="Découvrez et achetez des photographies de paysages français réalisées par de jeunes artistes diplômés. BisouRivage est votre marketplace dédiée à l'art photographique français." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />

        {/* Balises Open Graph pour les réseaux sociaux */}
        <meta property="og:title" content="BisouRivage - Marketplace de Photographies d'Artistes Français" />
        <meta property="og:description" content="Découvrez et achetez des photographies de paysages français réalisées par de jeunes artistes diplômés." />
        <meta property="og:image" content="https://bisourivage.fr/images/og-image.jpg" />
        <meta property="og:url" content="https://bisourivage.fr" />
        <meta property="og:type" content="website" />

        {/* Balises Twitter Card */}
        <meta name="twitter:title" content="BisouRivage - Marketplace de Photographies d'Artistes Français" />
        <meta name="twitter:description" content="Découvrez et achetez des photographies de paysages français réalisées par de jeunes artistes diplômés." />
        <meta name="twitter:image" content="https://bisourivage.fr/images/og-image.jpg" />
        <meta name="twitter:card" content="summary_large_image" />

        {/* Favicons */}
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/images/og-image.jpg" />

        {/* Autres balises méta */}
        <meta charSet="UTF-8" />
      </head>
      <body className="h-full">
        <SessionProvider>
          <ClientWrapper>
            <TopNavBar />
            {children}
            <Toaster />
          </ClientWrapper>
        </SessionProvider>
      </body>
    </html>
  );
}
