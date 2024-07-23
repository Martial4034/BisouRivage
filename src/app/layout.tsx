import { TopNavBar } from './components/TopNavBar';
import './globals.css'
import SessionProvider from './SessionProvider';
import ClientWrapper from './ClientWrapper';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full">
        <SessionProvider>
          <ClientWrapper>
            <TopNavBar />
            {children}
          </ClientWrapper>
        </SessionProvider>
      </body>
    </html>
  );
}
