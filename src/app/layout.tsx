import { TopNavBar } from './components/TopNavBar';
import './globals.css'
import SessionProvider from './SessionProvider';
import { useStoreRedirectUrl } from './hooks/useStoreRedirectUrl';

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  useStoreRedirectUrl();
  
  return (
    <html lang="en" className="h-full">
      <body className="h-full">
      <SessionProvider>
        <TopNavBar />
        {children}
      </SessionProvider>
      </body>
    </html>
  )
}