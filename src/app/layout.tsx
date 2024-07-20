import './globals.css'
import SessionProvider from './SessionProvider';


export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full">
      <SessionProvider>
        {children}
      </SessionProvider>
      </body>
    </html>
  )
}