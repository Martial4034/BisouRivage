"use client"

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

export function useStoreRedirectUrl() {
  const pathname = usePathname() as string;

  useEffect(() => {
    const authPaths = ['/auth/signin', '/auth/signin-confirm'];
    if (!authPaths.includes(pathname)) {
      if (pathname !== null && !/^\d+$/.test(pathname.slice(1))) {
        sessionStorage.setItem('redirectUrl', pathname);
        localStorage.setItem('redirectUrl', pathname);
      }
    }
  }, [pathname]);
}
