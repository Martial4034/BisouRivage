'use client';
import { useStoreRedirectUrl } from './hooks/useStoreRedirectUrl';

export default function ClientWrapper({ children }: { children: React.ReactNode }) {
  useStoreRedirectUrl();
  return <>{children}</>;
}
