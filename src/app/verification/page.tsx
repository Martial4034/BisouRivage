'use client';

import { useState, useEffect, Suspense } from 'react';
import { CircularProgress } from '@mui/material';
import { CustomAlertDialog } from '@/app/components/ui/CustomAlertDialog';
import CertificateDetails from '@/app/components/certificate/CertificateDetails';
import { useSearchParams } from 'next/navigation';

function VerificationForm() {
  const [certificateNumber, setCertificateNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [verifiedProduct, setVerifiedProduct] = useState(null);
  
  const searchParams = useSearchParams();

  useEffect(() => {
    const certParam = searchParams.get('certificat');
    if (certParam && certParam.length === 8) {
      setCertificateNumber(certParam.toUpperCase());
      verifyCertificate(certParam.toUpperCase());
    }
  }, [searchParams]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase().slice(0, 8);
    setCertificateNumber(value);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      verifyCertificate(certificateNumber);
    }
  };

  const verifyCertificate = async (number: string) => {
    if (number.length !== 8) {
      setError('Le numéro de certificat doit contenir 8 caractères');
      return;
    }

    setIsLoading(true);
    setError('');

    console.log("Numéro à vérifier:", number);
    try {
      const response = await fetch('/api/certificat/verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ identificationNumber: number }),
      });

      const data = await response.json();
      console.log("Réponse de l'API:", data);

      if (!response.ok) {
        throw new Error(data.message || 'Une erreur est survenue');
      }

      if (data.productInfo) {
        setVerifiedProduct(data.productInfo);
      }
    } catch (err: any) {
      setError(err.message);
      setIsModalOpen(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setIsModalOpen(false);
  };

  if (verifiedProduct) {
    return <CertificateDetails product={verifiedProduct} />;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-white">
      <div className="w-full max-w-md px-6 py-12 bg-white text-black shadow-lg rounded-lg">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <img
            className="mx-auto h-20 w-auto mb-8"
            src="/BISOU_RIVAGE_BLEU_FOND_TRANSPARENT.svg"
            alt="Logo de l'application BisouRivage"
          />
          <h2 className="mt-4 text-center text-3xl font-bold tracking-tight text-black">
            Vérification de certificat
          </h2>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="space-y-6">
            <div>
              <label htmlFor="certificate" className="block text-sm font-medium text-gray-700">
                Numéro de certificat
              </label>
              <div className="mt-2">
                <input
                  id="certificate"
                  name="certificate"
                  type="text"
                  value={certificateNumber}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  required
                  className="block w-full rounded-md bg-black/5 text-black py-2 px-3 shadow-sm focus:ring-2 focus:ring-black focus:border-black placeholder-gray-400 sm:text-sm"
                  placeholder="Entrez le numéro de certificat"
                />
              </div>
            </div>

            <div>
              <button
                onClick={() => verifyCertificate(certificateNumber)}
                disabled={isLoading}
                className={`w-full flex justify-center rounded-md bg-black py-2 text-sm font-semibold text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-black focus:ring-opacity-50 transition duration-150 ease-in-out ${
                  isLoading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {isLoading ? <CircularProgress size={20} color="inherit" /> : 'Vérifier'}
              </button>
            </div>

            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
          </div>
        </div>
      </div>

      <CustomAlertDialog
        isOpen={isModalOpen}
        onClose={handleClose}
        title="Numéro invalide"
        description="Il semblerait que le numéro de certificat soit invalide."
        actionText="Fermer"
        onActionClick={handleClose}
      />
    </div>
  );
}

// Composant principal qui enveloppe le formulaire dans Suspense
export default function VerificationPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <CircularProgress />
      </div>
    }>
      <VerificationForm />
    </Suspense>
  );
} 