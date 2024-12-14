// src/app/auth/signin/page.tsx

'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect, Suspense } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { CircularProgress } from '@mui/material';
import { CustomAlertDialog } from '@/app/components/ui/CustomAlertDialog';
import { useStoreRedirectUrl } from '@/app/hooks/useStoreRedirectUrl';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from '@/app/components/ui/input-otp';
import { Button } from '@/app/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/app/components/ui/dialog';
import { useSearchParams } from 'next/navigation';

function SigninContent() {
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [isOtpDialogOpen, setIsOtpDialogOpen] = useState(false);
  const [error, setError] = useState('');
  const [otpError, setOtpError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isOtpLoading, setIsOtpLoading] = useState(false);
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);
  const [timer, setTimer] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const fromToken = searchParams.get('fromToken');
    const emailParam = searchParams.get('email');
    
    if (fromToken === 'true') {
      const storedEmail = window.localStorage.getItem('emailForSignIn');
      if (storedEmail) {
        setEmail(storedEmail);
        setIsOtpDialogOpen(true);
      }
    }

    if (emailParam) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (emailRegex.test(emailParam)) {
        setEmail(emailParam);
      }
    }
  }, [searchParams]);

  useStoreRedirectUrl();

  useEffect(() => {
    if (status === 'authenticated') {
      let redirectUrl = localStorage.getItem('redirectUrl') || '/';
      if (redirectUrl === '/auth/signin-token') {
      redirectUrl = '/';
      }
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

  const sendOtp = async () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Veuillez saisir une adresse email valide');
      return;
    }

    setIsButtonDisabled(true);
    setIsLoading(true);
    setError('');
    setSuccess('');
    setOtpError('');
    try {
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.message);

      if (result.userExists) {
        setSuccess('Un code à 6 chiffres vous a été envoyé par email.');
        setTimer(600); // 10 minutes
        setIsOtpDialogOpen(true);
      } else {
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
      const response = await fetch('/api/auth/registerUser', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.message);

      setIsModalOpen(false);
      setSuccess('Votre compte a été créé. Un code à 6 chiffres vous a été envoyé par email.');
      setTimer(600); // 10 minutes
      setIsOtpDialogOpen(true);
    } catch (error: any) {
      setIsLoading(false);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      sendOtp();
    }
  };

  const handleOtpChange = (value: string) => {
    if (/^\d*$/.test(value) && value.length <= 6) {
      setOtpCode(value);
    }
  };

  const submitOtp = async () => {
    setIsOtpLoading(true);
    setOtpError('');
    try {
      if (otpCode.length !== 6) {
        setOtpError('Veuillez entrer un code à 6 chiffres.');
        setIsOtpLoading(false);
        return;
      }

      const signInResult = await signIn('credentials', {
        redirect: false,
        email: email,
        code: otpCode,
        callbackUrl: '/',
      });

      if (signInResult?.error) {
        setOtpError(signInResult.error);
      } else {
        router.push('/');
      }
    } catch (error: any) {
      setOtpError(error.message);
    } finally {
      setIsOtpLoading(false);
    }
  };

  const handleClose = () => {
    setIsModalOpen(false);
  };

  return (
    <>
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="w-full max-w-md px-6 py-12 bg-white text-black shadow-lg rounded-lg">
          <div className="sm:mx-auto sm:w-full sm:max-w-md">
            <img
              className="mx-auto h-20 w-auto mb-8"
              src="/BISOU_RIVAGE_BLEU_FOND_TRANSPARENT.svg"
              alt="Logo de l'application BisouRivage"
            />
            <h2 className="mt-4 text-center text-3xl font-bold tracking-tight text-black">
              Connexion à votre compte
            </h2>
          </div>

          <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
            <div className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Adresse email
                </label>
                <div className="mt-2">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={handleKeyDown}
                    required
                    className="block w-full rounded-md bg-black/5 text-black py-2 px-3 shadow-sm focus:ring-2 focus:ring-black focus:border-black placeholder-gray-400 sm:text-sm"
                    placeholder="Entrez votre email"
                  />
                </div>
              </div>

              <div>
                <button
                  disabled={isButtonDisabled}
                  onClick={sendOtp}
                  className={`w-full flex justify-center rounded-md bg-black py-2 text-sm font-semibold text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-black focus:ring-opacity-50 transition duration-150 ease-in-out ${
                    isButtonDisabled ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {isLoading ? <CircularProgress size={20} color="inherit" /> : 'Envoyer le code'}
                </button>
              </div>



              {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
              {success && 
                <div>
                  <button
                    onClick={() => setIsOtpDialogOpen(true)}
                    className="w-full flex justify-center rounded-md bg-gray-500 py-2 text-sm font-semibold text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-black focus:ring-opacity-50 transition duration-150 ease-in-out"
                  >
                    Entrer votre code
                  </button>
                  <p className="mt-2 text-sm text-green-600">{success}</p>
                </div>
              }
            </div>
          </div>
        </div>
      </div>

      <CustomAlertDialog
        isOpen={isModalOpen}
        onClose={handleClose}
        title="Inscription"
        description="Il semblerait que vous vous inscriviez pour la première fois. Cliquez sur le bouton ci-dessous pour recevoir votre code d'inscription."
        actionText="Recevoir"
        onActionClick={handleSignUp}
      />

      <Dialog open={isOtpDialogOpen} onOpenChange={setIsOtpDialogOpen}>
        <DialogContent>
            <DialogHeader>
            <DialogTitle>Entrez le code reçu</DialogTitle>
            </DialogHeader>
          <div className="mt-4 flex justify-center">
            <InputOTP maxLength={6} value={otpCode} onChange={handleOtpChange}>
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
              </InputOTPGroup>
              <InputOTPSeparator />
              <InputOTPGroup>
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>
          </div>
          {otpError && <p className="mt-2 text-sm text-red-600 text-center">{otpError}</p>}
          <div className="mt-4 flex justify-end">
            <Button onClick={submitOtp} disabled={isOtpLoading}>
              {isOtpLoading ? <CircularProgress size={20} color="inherit" /> : 'Valider'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function Signin() {
  return (
    <Suspense fallback={<CircularProgress />}>
      <SigninContent />
    </Suspense>
  );
}
