'use client';

import { auth } from '@/app/firebase';
import { isSignInWithEmailLink, signInWithEmailLink } from 'firebase/auth';
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { CircularProgress } from '@mui/material';

export default function SigninConfirm() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'authenticated') {
      const redirectUrl = sessionStorage.getItem('redirectUrl') || '/';
      router.push(redirectUrl);
    }
  }, [status, router]);

  useEffect(() => {
    const handleSignIn = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      let email = urlParams.get('email'); // Récupérer l'email depuis l'URL

      if (isSignInWithEmailLink(auth, window.location.href)) {
        // Si l'email n'est pas dans l'URL, on peut vérifier dans le stockage local
        if (!email) {
          const storedEmail = window.localStorage.getItem('emailForSignIn');
          if (storedEmail) {
            email = storedEmail;
          } else {
            setError('No email found. Please try signing in again.');
            setLoading(false);
            return;
          }
        }

        try {
          const result = await signInWithEmailLink(auth, email, window.location.href);
          await signIn('credentials', { user: JSON.stringify(result.user), redirect: true });
        } catch (error) {
          console.error('Error signing in with email link:', error);
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
    <div className="flex min-h-screen items-center justify-center bg-white text-black">
      <div className="w-full max-w-md px-6 py-12 bg-white text-black shadow-lg rounded-lg">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <img
            className="mx-auto h-20 w-auto mb-8" // Logo plus grand avec marge
            src="/logo.svg" // Le chemin vers ton logo personnalisé
            alt="Your Company Logo"
          />
          <h2 className="text-center text-3xl font-bold tracking-tight text-black">
            Sign in to your account
          </h2>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md text-center">
          {loading ? (
            <CircularProgress color="inherit" />
          ) : error ? (
            <p className="text-red-500">{error}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
