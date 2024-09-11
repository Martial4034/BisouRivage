import { TopNavBar } from './components/TopNavBar';
import './globals.css';
import SessionProvider from './SessionProvider';
import ClientWrapper from './ClientWrapper';
import { ToastProvider, ToastViewport } from './components/ui/toast'; // Ajout du ToastProvider et ToastViewport

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full">
        <SessionProvider>
          <ClientWrapper>
            <TopNavBar />
            <ToastProvider> {/* Envelopper avec ToastProvider */}
              {children}
              <ToastViewport /> {/* Ajouter le Viewport pour afficher les toasts */}
            </ToastProvider>
          </ClientWrapper>
        </SessionProvider>
      </body>
    </html>
  );
}
