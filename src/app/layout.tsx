import { TopNavBar } from './components/TopNavBar';
import './globals.css';
import SessionProvider from './SessionProvider';
import ClientWrapper from './ClientWrapper';
import { Toaster } from "@/app/components/ui/toaster";

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
              {children}
              <Toaster />
          </ClientWrapper>
        </SessionProvider>
      </body>
    </html>
  );
}
