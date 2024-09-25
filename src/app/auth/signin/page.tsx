'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { CircularProgress } from '@mui/material';
import { CustomAlertDialog } from '@/app/components/ui/CustomAlertDialog';
import { useStoreRedirectUrl } from '@/app/hooks/useStoreRedirectUrl';

export default function Signin() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);
  const [timer, setTimer] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { status } = useSession();
  const router = useRouter();

  useStoreRedirectUrl();

  useEffect(() => {
    if (status === 'authenticated') {
      const redirectUrl = sessionStorage.getItem('redirectUrl') || '/';
      router.push(redirectUrl);
    }
  }, [status, router]);

  useEffect(() => {
    let countdown: NodeJS.Timeout | undefined;
    if (timer > 0) {
      countdown = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else {
      clearInterval(countdown);
      setIsButtonDisabled(false);
    }
    return () => clearInterval(countdown);
  }, [timer]);

  const signIn = async () => {
    setIsButtonDisabled(true);
    setIsLoading(true);
    setError('');
    setSuccess('');
    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });
  
      const result = await response.json();
      if (!response.ok) throw new Error(result.message);
  
      if (result.userExists) {
        // Utilisateur existant : un lien de connexion a été envoyé
        window.localStorage.setItem('emailForSignIn', email); // Écrase l'ancienne valeur avec la nouvelle
        setSuccess('Un lien de connexion vous a été envoyé par email.');
      } else {
        // Nouvel utilisateur : déclencher l'inscription
        setIsModalOpen(true);
      }
    } catch (error: any) {
      setIsLoading(false);
      setIsButtonDisabled(false);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };
  

  const handleSignUp = async () => {
    setIsLoading(true);
    try {
      // Appeler à nouveau l'API pour insérer l'utilisateur cette fois
      await fetch('/api/auth/registerUser', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      setIsModalOpen(false);
      setSuccess('Votre compte a été créé et un lien de connexion vous a été envoyé.');
      setTimer(59); // 59 seconds timer
    } catch (error: any) {
      setIsLoading(false);
      setError(error.message);
    }
  };

  const handleClose = () => {
    setIsModalOpen(false);
  };

  // Nouvelle fonction pour gérer l'appui sur la touche "Enter"
  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      signIn(); // Appelle la fonction signIn lorsque "Enter" est pressé
    }
  };

  return (
    <>
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="w-full max-w-md px-6 py-12 bg-white text-black shadow-lg rounded-lg">
          <div className="sm:mx-auto sm:w-full sm:max-w-md">
            <img
              className="mx-auto h-20 w-auto mb-8"
              src="/BISOU_RIVAGE_BLEU_FOND_TRANSPARENT.svg"
              alt="Your Company Logo"
            />
            <h2 className="mt-4 text-center text-3xl font-bold tracking-tight text-black">
              Sign in to your account
            </h2>
          </div>

          <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
            <div className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email address
                </label>
                <div className="mt-2">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={handleKeyDown} // Ajoute l'événement keydown
                    required
                    className="block w-full rounded-md bg-black/5 text-black py-2 px-3 shadow-sm focus:ring-2 focus:ring-black focus:border-black placeholder-gray-400 sm:text-sm"
                    placeholder="Enter your email"
                  />
                </div>
              </div>

              <div>
                <button
                  disabled={isButtonDisabled}
                  onClick={signIn}
                  className={`w-full flex justify-center rounded-md bg-black py-2 text-sm font-semibold text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-black focus:ring-opacity-50 transition duration-150 ease-in-out ${isButtonDisabled ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                >
                  {isLoading ? <CircularProgress size={20} color="inherit" /> : "Sign In"}
                </button>
              </div>

              {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
              {success && <p className="mt-2 text-sm text-green-600">{success}</p>}
            </div>
          </div>
        </div>
      </div>

      <CustomAlertDialog
        isOpen={isModalOpen}
        onClose={handleClose}
        title="Inscription"
        description="Il semblerait que vous vous inscriviez pour la première fois. Cliquez sur le bouton ci-dessous pour recevoir votre email d'inscription. Pensez a bien utilisé ce même navigateur pour vous connecter."
        actionText="Recevoir"
        onActionClick={handleSignUp}
      />
    </>
  );
}
