// src/app/signin-token/page.tsx

'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { CircularProgress } from '@mui/material';

function SigninTokenContent() {
  const router = useRouter();
  const searchParams = useSearchParams(); // useSearchParams is used within the Suspense boundary
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = searchParams.get('token');

    if (!token) {
      setError('Token manquant dans l\'URL.');
      setLoading(false);
      return;
    }

    const verifyToken = async () => {
      try {
        const response = await fetch('/api/auth/verify-token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token }),
        });

        const result = await response.json();

        if (!response.ok) {
          setError(result.message || 'Erreur lors de la vérification du token.');
          setLoading(false);
          return;
        }

        const { email } = result;

        // Stocker l'e-mail dans le stockage local
        window.localStorage.setItem('emailForSignIn', email);

        // Rediriger vers la page de connexion avec le paramètre pour ouvrir le dialogue OTP
        router.push('/auth/signin?fromToken=true');
      } catch (error: any) {
        console.error('Erreur lors de la vérification du token:', error);
        setError('Erreur interne du serveur.');
        setLoading(false);
      }
    };

    verifyToken();
  }, [searchParams, router]);

  return (
    <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md text-center">
      {loading ? (
        <CircularProgress color="inherit" />
      ) : error ? (
        <div>
          <h3 className="text-2xl font-bold text-red-500">Erreur</h3>
          <p className="mt-4 text-red-500">{error}</p>
        </div>
      ) : (
        <p>Vérification en cours...</p>
      )}
    </div>
  );
}

export default function SigninToken() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-white text-black">
      <div className="w-full max-w-md px-6 py-12 bg-white text-black shadow-lg rounded-lg">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <img
            className="mx-auto h-20 w-auto mb-8"
            src="/BISOU_RIVAGE_BLEU_FOND_TRANSPARENT.svg"
            alt="Logo de l'application BisouRivage"
          />
          <h2 className="text-center text-3xl font-bold tracking-tight text-black">
            Vérification du token
          </h2>
        </div>

        {/* Wrap the SigninTokenContent component in Suspense */}
        <Suspense fallback={<CircularProgress color="inherit" />}>
          <SigninTokenContent />
        </Suspense>
      </div>
    </div>
  );
}
