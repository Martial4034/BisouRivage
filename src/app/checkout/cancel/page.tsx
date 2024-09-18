'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function CheckoutCancel() {
  const router = useRouter();

  useEffect(() => {
    // Stocker une information dans localStorage pour déclencher le toast sur la page /checkout
    window.localStorage.setItem('checkoutCancelled', 'true');

    // Rediriger immédiatement vers la page /checkout
    router.push('/checkout');
  }, [router]);

  return null; 
}
