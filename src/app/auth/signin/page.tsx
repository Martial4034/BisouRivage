// src/app/auth/signin/page.tsx
'use client';
import { auth } from '@/app/firebase';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { CircularProgress } from '@mui/material';
import { CustomAlertDialog } from '@/app/components/ui/CustomAlertDialog';
import { createUserWithEmailAndPassword } from 'firebase/auth';
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
  const searchParams = useSearchParams();

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
      const response = await fetch('/api/checkUser', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.message);

      if (result.userExists) {
        // Utilisateur existant
        window.localStorage.setItem('emailForSignIn', email);
        await sendSignInLink(email, false);
      } else {
        // Nouvel utilisateur
        window.localStorage.setItem('emailForSignIn', email);
        setIsModalOpen(true);
        setIsLoading(false);
      }
    } catch (error: any) {
      setIsLoading(false);
      setIsButtonDisabled(false);
      setError(error.message);
    }
  };

  const sendSignInLink = async (email: string, isSignUp: boolean) => {
    try {
      const response = await fetch('/api/sendSignInEmail', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: email,
          email: email,
          isSignUp: isSignUp,
        }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Error sending email');

      setSuccess('Un mail de connexion vous a été envoyé par email.');
      setIsLoading(false);
      setTimer(59); // 59 seconds timer
    } catch (error: any) {
      setIsLoading(false);
      setIsButtonDisabled(false);
      setError(error.message);
    }
  };

  const handleSignUp = async () => {
    setIsLoading(true);
    try {
      await sendSignInLink(email, true);
      setIsModalOpen(false);
      setIsButtonDisabled(true);
      setTimer(59);
    } catch (error: any) {
      setIsLoading(false);
      setIsButtonDisabled(false);
      setError(error.message);
    }
  };

  const handleClose = () => {
    setIsModalOpen(false);
  };

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
          <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
            <div className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium leading-6 text-white">
                  Email address
                </label>
                <div className="mt-2">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="block w-full rounded-md border-0 bg-white/5 py-1.5 text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm sm:leading-6"
                  />
                </div>
              </div>
              <div>
                <button
                  disabled={!email || isButtonDisabled}
                  onClick={signIn}
                  className={`disabled:opacity-40 flex w-full justify-center rounded-md bg-indigo-500 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-indigo-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 ${
                    isButtonDisabled ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {isLoading ? <CircularProgress size={20} color="inherit" /> : 'Sign In'}
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
        description="Il semblerait que vous vous inscriviez pour la première fois. Cliquez sur le bouton ci-dessous pour recevoir votre email d'inscription."
        actionText="Recevoir"
        onActionClick={handleSignUp}
      />
    </>
  );
}
