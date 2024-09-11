'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/app/components/ui/button';
import { Loader2 } from 'lucide-react';

const SuccessPage = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionId = searchParams ? searchParams.get('session_id') : null; // Gestion de la possibilité que searchParams soit null
  const [session, setSession] = useState<any>(null); // Utilisation de "any" pour des types flexibles
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSession = async () => {
      if (!sessionId) {
        setError('Session ID manquante');
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/secured/checkout/session?session_id=${sessionId}`);
        const sessionData = await response.json();

        if (sessionData.error) {
          setError(sessionData.error);
        } else {
          setSession(sessionData);
        }
      } catch (err) {
        setError('Erreur lors de la récupération de la session Stripe');
      } finally {
        setLoading(false);
      }
    };

    fetchSession();
  }, [sessionId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-10 w-10 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center mt-20">
        <h2 className="text-2xl text-red-600">Erreur : {error}</h2>
        <Button onClick={() => router.push('/products')} className="mt-4">
          Retour aux produits
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-white py-24 sm:py-32">
      <div className="max-w-2xl mx-auto text-center">
        <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
          Paiement réussi !
        </h2>
        <p className="mt-6 text-lg leading-8 text-gray-600">
          Merci pour votre achat. Votre paiement a été traité avec succès.
        </p>
        <Button onClick={() => router.push('/products')} className="mt-8">
          Continuer vos achats
        </Button>
      </div>
    </div>
  );
};

export default SuccessPage;
