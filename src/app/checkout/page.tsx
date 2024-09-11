'use client';

import { Button } from '@/app/components/ui/button';
import { useCart } from '@/app/hooks/use-cart';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Check, Loader2, X } from 'lucide-react';
import { formatPrice } from '@/app/lib/utils';
import Image from 'next/image';
import Link from 'next/link';
import { useToast } from "@/app/hooks/use-toast";

const CheckoutPage = () => {
  const { items, removeItem, updateQuantity, clearCart } = useCart();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast(); // Hook pour les notifications

  useEffect(() => {
    setIsMounted(true);
    console.log("Vérification du panier...");
    verifyCart(); // Vérifier les produits du panier dès l'arrivée sur la page
  }, []);

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
            updateQuantity(update.id, update.newQuantity);
          } else if (update.status === 'price_changed') {
            // TODO: Mettre à jour les prix si nécessaire
            console.log("Prix changé pour:", update.id);
          } else if (update.status === 'removed') {
            removeItem(update.id); // Retirer les éléments qui ne sont plus disponibles
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

  // Calcul du total du panier
  const cartTotal = items.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );
  const fee = 10; // Exemples de frais de transaction

  // Fonction de gestion du paiement (avec vérification supplémentaire avant Stripe)
  const handleCheckout = async () => {
    setIsLoading(true);
  
    try {
      const response = await fetch('/api/secured/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cartItems: items, // Envoyer les produits au backend pour vérification et création de la session Stripe
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
      }
    } catch (err) {
      setError('Erreur lors de la création de la session Stripe');
      setIsLoading(false);
    }
  };
  
  


  if (items.length === 0) {
    return (
      <div className="text-center mt-20">
        <h2 className="text-2xl">Votre panier est vide</h2>
        <Link href="/products">
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
                  <li key={item.id} className="flex py-6 sm:py-10">
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
                              href={`/product/${item.id}`}
                              className="font-medium text-gray-700 hover:text-gray-800"
                            >
                              {item.id} ({item.format})
                            </Link>
                          </h3>
                          <p className="text-sm mt-1">Artiste : {item.artist}</p>
                          <p className="mt-1 text-sm font-medium text-gray-900">
                            {formatPrice(item.price)} x {item.quantity}
                          </p>
                        </div>

                        <div className="mt-4 sm:mt-0 sm:pr-9">
                          <div className="absolute right-0 top-0">
                            <Button
                              aria-label="remove product"
                              onClick={() => removeItem(item.id)}
                              variant="ghost"
                            >
                              <X className="h-5 w-5" aria-hidden="true" />
                            </Button>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 flex space-x-2">
                        <Button
                          variant="outline"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                        >
                          -
                        </Button>
                        <span>{item.quantity}</span>
                        <Button
                          variant="outline"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
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
                <p className="text-base">{formatPrice(cartTotal + fee)}</p>
              </div>
            </div>

            {error && <p className="text-red-500 mt-4">{error}</p>}

            <Button
              className="w-full mt-6"
              onClick={handleCheckout}
              disabled={isLoading}
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Payer'}
            </Button>
          </section>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
