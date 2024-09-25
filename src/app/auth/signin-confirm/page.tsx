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

  // Rediriger l'utilisateur si authentifié
  useEffect(() => {
    if (status === 'authenticated') {
      const redirectUrl = sessionStorage.getItem('redirectUrl') || '/';
      router.push(redirectUrl);
    }
  }, [status, router]);

  // Gérer la connexion avec le lien reçu par email
  useEffect(() => {
    const handleSignIn = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      let email = urlParams.get('email'); // Vérifier si l'email est dans l'URL

      // Si le lien est valide pour la connexion avec Firebase
      if (isSignInWithEmailLink(auth, window.location.href)) {
        // Si l'email n'est pas dans l'URL, on essaie de le récupérer dans le localStorage
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
          // Connexion avec le lien envoyé par email
          const result = await signInWithEmailLink(auth, email, window.location.href);
          await signIn('credentials', { user: JSON.stringify(result.user), redirect: true });
        } catch (error) {
          console.error('Error signing in with email link:', error);
          setError('Il semblerait que nous puissions pas vous connecter. Veillez à utilisé le même navigateur que celui utilisé pour demander le lien de connexion.');
          setLoading(false);
        }
      } else {
        setError('Il semblerait que nous puissions pas vous connecter. Veillez à utilisé le même navigateur que celui utilisé pour demander le lien de connexion.');
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
            className="mx-auto h-20 w-auto mb-8"
            src="/BISOU_RIVAGE_BLEU_FOND_TRANSPARENT.svg" 
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
