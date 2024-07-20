'use client';
import { auth } from '@/app/firebase';
import { isSignInWithEmailLink, signInWithEmailLink } from 'firebase/auth';
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function SigninConfirm() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const handleSignIn = async () => {
      if (isSignInWithEmailLink(auth, window.location.href)) {
        let email = window.localStorage.getItem('emailForSignIn');
        
        if (!email) {
          setError('No email found in local storage. Please try signing in again.');
          setLoading(false);
          return;
        }

        try {
          const result = await signInWithEmailLink(auth, email, window.location.href);
          await signIn('credentials', { user: JSON.stringify(result.user), redirect: true, callbackUrl: '/' });
        } catch (error) {
          console.log(error);
          setError('Failed to sign in with email link. Please try again.');
          setLoading(false);
        }
      } else {
        setError('Invalid sign-in link. Please try signing in again.');
        setLoading(false);
      }
    };

    handleSignIn();
  }, [router]);

  return (
    <>
      <div className="flex min-h-full flex-1 flex-col justify-center px-6 py-12 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-sm">
          <img
            className="mx-auto h-10 w-auto"
            src="https://tailwindui.com/img/logos/mark.svg?color=indigo&shade=500"
            alt="Your Company"
          />
          <h2 className="mt-10 text-center text-2xl font-bold leading-9 tracking-tight text-white">
            Sign in to your account
          </h2>
          <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm text-center text-white">
            {loading ? 'Checking code...' : error ? <p className="text-red-500">{error}</p> : null}
          </div>
        </div>
      </div>
    </>
  );
}
