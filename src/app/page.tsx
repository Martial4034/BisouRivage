'use client';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function Home() {
  const { data: session, status } = useSession();
  console.log(session);
  const router = useRouter();

  
  if (status === 'loading') {
    return <div>Loading...</div>;
  }

  return (
    <div className="p-8">
      <div className='text-black'>{session?.user?.email}</div>
      <div className='text-black'>{session?.user?.role}</div>
    </div>
  );
}
