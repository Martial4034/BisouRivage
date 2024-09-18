import SuccessPageClient from '@/app/components/order/SuccessPageClient';

export default function SuccessPage({ searchParams }: { searchParams: { session_id?: string } }) {
  const sessionId = searchParams.session_id;

  return <SuccessPageClient sessionId={sessionId} />;
}