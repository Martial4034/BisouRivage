'use client';

import { Button } from '@/app/components/ui/button';
import { useCart } from '@/app/hooks/use-cart';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Check, Loader2, X } from 'lucide-react';
import { formatPrice } from '@/app/lib/utils';
import Image from 'next/image';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useToast } from "@/app/hooks/use-toast";
import { CustomAlertDialog } from '@/app/components/ui/CustomAlertDialog';

const CheckoutPage = () => {
  const { data: session, status } = useSession();
  const { items, removeItem, updateQuantity, updatePrice, clearCart } = useCart();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { toast } = useToast();
  const [cartTotal, setCartTotal] = useState(0);

  useEffect(() => {
    // Vérifier si la notification d'annulation est dans localStorage
    const isCancelled = window.localStorage.getItem('checkoutCancelled');

    if (isCancelled) {
      // Afficher la notification toast si le paiement a été annulé
      toast({
        title: 'Annulation du paiement',
        description: "Votre paiement a été annulé. Veuillez réessayer.",
        variant: 'destructive',
      });

      // Retirer l'indicateur du localStorage après affichage
      window.localStorage.removeItem('checkoutCancelled');
    }
  }, [toast]);

  useEffect(() => {
    setIsMounted(true);
    console.log("Vérification du panier...");
    verifyCart(); // Vérifier les produits du panier dès l'arrivée sur la page
  }, []);

  const fee = 10; 
  useEffect(() => {
    const total = items.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );
    setCartTotal(total + fee);
  }, [items]);

  // Fonction pour vérifier les éléments du panier
  const verifyCart = async () => {
    try {
      console.log("Envoi de la requête de vérification...");
      const response = await fetch('/api/verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cartItems: items, // Envoyer les éléments du panier pour vérification
        }),
      });

      const data = await response.json();
      console.log("Réponse reçue de la vérification:", data);

      // Si des modifications ont été apportées, les afficher dans des toasts
      if (data.updates) {
        data.updates.forEach((update: any) => {
          toast({
            title: 'Mise à jour du panier',
            description: update.message,
            variant: update.status === 'removed' ? 'destructive' : 'default',
          });

          // Ajuster les éléments du panier en fonction des modifications
          if (update.status === 'quantity_adjusted') {
            updateQuantity(update.id, update.format, update.newQuantity);
          } else if (update.status === 'price_changed') {
            updatePrice(update.id, update.format, update.newPrice);
          } else if (update.status === 'removed') {
            removeItem(update.id, update.format); // Retirer les éléments qui ne sont plus disponibles
          }
        });
      }
    } catch (err) {
      console.error("Erreur lors de la vérification du panier:", err);
      toast({
        title: 'Erreur',
        description: 'Une erreur est survenue lors de la vérification du panier.',
        variant: 'destructive',
      });
    }
  };

  const handleCheckout = async () => {
    setIsLoading(true);

    if (status !== 'authenticated') {
      setIsModalOpen(true);
      setIsLoading(false);
      return;
    }

    try {
      // Vérifier le panier avant de procéder
      await verifyCart();

      // Obtenir les items mis à jour après la vérification
      const updatedItems = useCart.getState().items;
      console.log('Items après vérification:', updatedItems);

      // Vérifier si le panier est vide après la vérification
      if (updatedItems.length === 0) {
        toast({
          title: 'Panier vide',
          description: 'Votre panier est vide après la vérification. Veuillez ajouter des produits avant de procéder au paiement.',
          variant: 'destructive',
        });
        setIsLoading(false);
        return;
      }

      // Recalculer le total du panier
      const updatedCartTotal = updatedItems.reduce(
        (total, item) => total + item.price * item.quantity,
        0
      );
      setCartTotal(updatedCartTotal);

      // Procéder à la création de la session Stripe avec les items mis à jour
      const response = await fetch('/api/secured/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cartItems: updatedItems, // Utiliser les produits mis à jour
        }),
      });

      const { url, error } = await response.json();

      if (error) {
        setError(error);
        setIsLoading(false);
        return;
      }

      if (url) {
        window.location.href = url; // Rediriger vers Stripe Checkout
      } else {
        // Si aucune URL n'est retournée, arrêter le loader
        setIsLoading(false);
      }
    } catch (err) {
      console.error("Erreur lors du checkout:", err);
      setError('Erreur lors de la création de la session Stripe');
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setIsModalOpen(false);
  };

  const redirectToSignIn = () => {
    router.push('/auth/signin');
  };

  if (items.length === 0) {
    return (
      <div className="text-center mt-20">
        <h2 className="text-2xl">Votre panier est vide</h2>
        <Link href="/">
          <Button className="mt-4">Voir les produits</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white">
      <div className="mx-auto max-w-2xl px-4 pb-24 pt-16 sm:px-6 lg:max-w-7xl lg:px-8">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
          Votre Panier
        </h1>

        <div className="mt-12 lg:grid lg:grid-cols-12 lg:items-start lg:gap-x-12 xl:gap-x-16">
          {/* Liste des produits */}
          <div className="lg:col-span-7">
            <ul className="divide-y divide-gray-200 border-b border-t border-gray-200">
              {isMounted &&
                items.map((item) => (
                  <li key={`${item.id}-${item.format}`} className="flex py-6 sm:py-10">
                    <div className="flex-shrink-0">
                      <Image
                        src={item.image}
                        alt={item.id}
                        width={100}
                        height={100}
                        className="object-cover"
                      />
                    </div>

                    <div className="ml-4 flex flex-1 flex-col justify-between sm:ml-6">
                      <div className="relative pr-9 sm:grid sm:grid-cols-2 sm:gap-x-6 sm:pr-0">
                        <div>
                          <h3 className="text-sm">
                            <Link
                              href={`/sales/${item.id}`}
                              className="font-medium text-gray-700 hover:text-gray-800"
                            >
                              {item.name} ({item.format})
                            </Link>
                          </h3>
                          <p className="text-sm mt-1">Artiste : {item.artisteName}</p>
                          <p className="mt-1 text-sm font-medium text-gray-900">
                            {formatPrice(item.price)} x {item.quantity}
                          </p>
                        </div>

                        <div className="mt-4 sm:mt-0 sm:pr-9">
                          <div className="absolute right-0 top-0">
                            <Button
                              aria-label="remove product"
                              onClick={() => removeItem(item.id, item.format)}
                              variant="ghost"
                            >
                              <X className="h-5 w-5" aria-hidden="true" />
                            </Button>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 flex items-center space-x-2">
                        <Button
                          variant="outline"
                          onClick={() => updateQuantity(item.id, item.format, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                        >
                          -
                        </Button>
                        <span className="text-center">{item.quantity}</span>
                        <Button
                          variant="outline"
                          onClick={() => updateQuantity(item.id, item.format, item.quantity + 1)}
                          disabled={item.quantity >= item.stock}
                        >
                          +
                        </Button>
                      </div>

                    </div>
                  </li>
                ))}
            </ul>
          </div>

          {/* Résumé de la commande */}
          <section className="mt-16 bg-gray-50 p-8 lg:col-span-5 lg:mt-0">
            <h2 className="text-lg font-medium text-gray-900">Résumé de la commande</h2>
            <div className="mt-6 space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm">Sous-total</p>
                <p className="text-sm font-medium">{formatPrice(cartTotal)}</p>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-sm">Frais de transaction</p>
                <p className="text-sm font-medium">{formatPrice(fee)}</p>
              </div>
              <div className="flex items-center justify-between font-medium text-gray-900">
                <p className="text-base">Total</p>
                <p className="text-base">{formatPrice(cartTotal)}</p>
              </div>
            </div>

            {error && <p className="text-red-500 mt-4">{error}</p>}

            <Button
              className="w-full mt-6"
              onClick={handleCheckout}
              disabled={isLoading || items.length === 0}
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Payer'}
            </Button>
          </section>
        </div>
      </div>
      <CustomAlertDialog
        isOpen={isModalOpen}
        onClose={handleClose}
        title="Connexion requise"
        description="Vous devez être connecté pour procéder au paiement. Veuillez vous connecter ou vous inscrire."
        actionText="Se connecter"
        onActionClick={redirectToSignIn}
      />
    </div>
  );
};

export default CheckoutPage;
