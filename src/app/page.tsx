'use client';
import { signOut, useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';


export default function Home() {
  const session = useSession({
    required: true,
    onUnauthenticated() {
      redirect('/auth/signin');
    },
  });
  return (
    <div className="p-8">
      <div className='text-black'>{session?.data?.user?.email }</div>
      <button className='text-black' onClick={() => signOut()}>Logout</button>
    </div>
  )
}

Home.requireAuth = true