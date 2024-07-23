// src/app/hooks/useStoreRedirectUrl.ts
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

export function useStoreRedirectUrl() {
  const pathname = usePathname() as string;

  useEffect(() => {
    const authPaths = ['/auth/signin', '/auth/signin-confirm'];
    if (!authPaths.includes(pathname)) {
      if (pathname !== null) {
        sessionStorage.setItem('redirectUrl', pathname);
      }
    }
  }, [pathname]);
}
