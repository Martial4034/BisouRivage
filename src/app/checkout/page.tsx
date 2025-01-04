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
import { Input } from '@/app/components/ui/input';
import CustomLoader from '@/app/components/ui/CustomLoader';

// Ajout des types pour les mises à jour du panier
interface CartUpdate {
  id: string;
  status: 'quantity_adjusted' | 'removed';
  message: string;
  newQuantity?: number;
  size: string;
  frameColor?: string;
}

interface CheckoutItem {
  id: string;
  size: string;
  frameOption: "avec" | "sans";
  frameColor?: string;
  quantity: number;
  details?: {
    name: string;
    artisteName: string;
    basePrice: number;
    framePrice: number;
    totalPrice: number;
    unitPrice: number;
    originalTotal: number;
    originalUnitPrice: number;
    discountPercentage: number;
    image: string;
    stock: number;
  };
}

const CheckoutPage = () => {
  const { data: session, status } = useSession();
  const { items, removeItem, updateQuantity } = useCart();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [itemsWithDetails, setItemsWithDetails] = useState<CheckoutItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { toast } = useToast();
  const [cartTotal, setCartTotal] = useState(0);
  const [isLoadingDetails, setIsLoadingDetails] = useState(true);
  const [promoCode, setPromoCode] = useState('');
  const [isApplyingPromo, setIsApplyingPromo] = useState(false);
  const [discount, setDiscount] = useState(0);
  const [appliedPromoCode, setAppliedPromoCode] = useState<string | null>(null);
  const fee = 12.5;
  const [loadingQuantityUpdates, setLoadingQuantityUpdates] = useState<{[key: string]: boolean}>({});

  // Charger les détails initiaux
  useEffect(() => {
    const fetchItemDetails = async () => {
      setIsLoadingDetails(true);
      try {
        const itemsWithData = await Promise.all(
          items.map(async (item) => {
            const response = await fetch('/api/product/price', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                productId: item.id,
                size: item.size,
                frameOption: item.frameOption,
                frameColor: item.frameColor,
                quantity: item.quantity
              }),
            });

            if (!response.ok) {
              throw new Error(`Erreur lors de la récupération des détails pour ${item.id}`);
            }

            const { data } = await response.json();
            return {
              ...item,
              details: {
                name: data.productInfo.name,
                artisteName: data.productInfo.artisteName,
                basePrice: data.basePrice,
                framePrice: data.framePrice,
                totalPrice: data.totalPrice,
                unitPrice: data.unitPrice,
                originalTotal: data.originalTotal,
                originalUnitPrice: data.originalUnitPrice,
                discountPercentage: data.discountPercentage,
                image: data.productInfo.image,
                stock: data.stock,
              }
            };
          })
        );

        setItemsWithDetails(itemsWithData);
      } catch (error) {
        console.error("Erreur lors du chargement des détails:", error);
        toast({
          title: "Erreur",
          description: "Impossible de charger les détails des produits",
          variant: "destructive",
        });
      } finally {
        setIsLoadingDetails(false);
      }
    };

    if (isMounted && items.length > 0) {
      fetchItemDetails();
    }
  }, [items, isMounted, toast, updateQuantity]);

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
  }, []);

  useEffect(() => {
    if (isMounted && items.length > 0) {
      verifyCart();
    }
  }, [isMounted, items]);

  useEffect(() => {
    if (itemsWithDetails.length > 0) {
      const subtotal = itemsWithDetails.reduce(
        (sum, item) => sum + (item.details?.totalPrice || 0) * item.quantity,
        0
      );
      const discountAmount = (subtotal * discount) / 100;
      const totalWithDiscount = subtotal - discountAmount;
      setCartTotal(totalWithDiscount + fee);
    }
  }, [itemsWithDetails, discount, fee]);

  // Fonction pour vérifier les éléments du panier
  const verifyCart = async () => {
    try {
      const response = await fetch('/api/verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cartItems: items,
        }),
      });

      const data = await response.json();

      if (data.updates) {
        data.updates.forEach((update: CartUpdate) => {
          toast({
            title: 'Mise à jour du panier',
            description: update.message,
            variant: update.status === 'removed' ? 'destructive' : 'default',
          });

          if (update.status === 'quantity_adjusted' && update.newQuantity) {
            updateQuantity(update.id, update.size, update.frameColor, update.newQuantity);
          } else if (update.status === 'removed') {
            removeItem(update.id, update.size, update.frameColor);
          }
        });

        await updateAllPrices();
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
      const response = await fetch('/api/secured/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: itemsWithDetails.map(item => ({
            id: item.id,
            size: item.size,
            frameOption: item.frameOption,
            frameColor: item.frameColor,
            quantity: item.quantity,
            unitPrice: item.details?.unitPrice || 0,
            totalPrice: (item.details?.totalPrice || 0) * item.quantity,
            discountPercentage: item.details?.discountPercentage || 0
          })),
          cartTotal: cartTotal,
          promoCode: appliedPromoCode,
          discount: discount
        }),
      });

      const { url, error } = await response.json();

      if (error) {
        setError(error);
        toast({
          title: "Erreur",
          description: error,
          variant: "destructive",
        });
        return;
      }

      if (url) {
        window.location.href = url;
      }
    } catch (err) {
      console.error("Erreur lors du checkout:", err);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la création du paiement",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setIsModalOpen(false);
  };

  const redirectToSignIn = () => {
    router.push('/auth/signin');
  };

  const handleApplyPromoCode = async () => {
    if (!promoCode || isApplyingPromo) return;

    setIsApplyingPromo(true);
    try {
      const response = await fetch('/api/secured/promo/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: promoCode }),
      });

      const data = await response.json();

      if (data.valid) {
        setDiscount(data.discount);
        setAppliedPromoCode(promoCode);

        // Mettre à jour les prix avec la réduction
        const updatedItems = itemsWithDetails.map(item => ({
          ...item,
          details: item.details ? {
            ...item.details,
            discountedUnitPrice: item.details.unitPrice * (1 - data.discount / 100),
            discountedPrice: item.details.totalPrice * (1 - data.discount / 100)
          } : item.details
        }));

        setItemsWithDetails(updatedItems);

        toast({
          title: "Code promo appliqué",
          description: `Réduction de ${data.discount}% appliquée`,
        });
      } else {
        toast({
          title: "Code promo invalide",
          description: "Ce code promo n'est pas valide",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Erreur:', error);
      toast({
        title: "Erreur",
        description: "Impossible de vérifier le code promo",
        variant: "destructive",
      });
    } finally {
      setIsApplyingPromo(false);
    }
  };

  useEffect(() => {
    const savedCode = localStorage.getItem('promoCode');
    if (savedCode) {
      setPromoCode(savedCode);
      handleApplyPromoCode();
    }
  }, []);

  // Mise à jour du calcul du total
  useEffect(() => {
    if (itemsWithDetails.length > 0) {
      const subtotal = itemsWithDetails.reduce(
        (sum, item) => sum + (item.details?.totalPrice || 0) * item.quantity,
        0
      );
      const discountAmount = (subtotal * discount) / 100;
      setCartTotal(subtotal - discountAmount + fee);
    }
  }, [itemsWithDetails, discount, fee]);

  // Fonction pour recalculer le total
  const recalculateTotal = (items: CheckoutItem[]) => {
    const subtotal = items.reduce(
      (sum, item) => sum + (item.details?.totalPrice || 0) * item.quantity,
      0
    );
    const discountAmount = (subtotal * discount) / 100;
    setCartTotal(subtotal - discountAmount + fee);
  };

  // Fonction pour mettre à jour tous les prix
  const updateAllPrices = async () => {
    setIsLoadingDetails(true);
    try {
      const updatedItems = await Promise.all(
        itemsWithDetails.map(async (item) => {
          const response = await fetch('/api/product/price', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              productId: item.id,
              size: item.size,
              frameOption: item.frameOption,
              frameColor: item.frameColor,
              quantity: item.quantity
            }),
          });

          if (!response.ok) {
            throw new Error(`Erreur pour l'article ${item.id}`);
          }

          const { data } = await response.json();

          // Calculer les prix avec réduction si un code promo est appliqué
          const discountedUnitPrice = appliedPromoCode 
            ? data.unitPrice * (1 - discount / 100)
            : undefined;
          const discountedTotalPrice = appliedPromoCode 
            ? data.totalPrice * (1 - discount / 100)
            : undefined;

          return {
            ...item,
            details: {
              ...item.details!,
              totalPrice: data.totalPrice,
              basePrice: data.basePrice,
              framePrice: data.framePrice,
              unitPrice: data.unitPrice,
              discountedPrice: discountedTotalPrice,
              discountedUnitPrice: discountedUnitPrice,
            }
          };
        })
      );

      setItemsWithDetails(updatedItems);
      recalculateTotal(updatedItems);
    } catch (error) {
      console.error('Erreur lors de la mise à jour des prix:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour les prix",
        variant: "destructive",
      });
    } finally {
      setIsLoadingDetails(false);
    }
  };

  // Fonction pour générer une clé unique pour chaque item
  const getItemKey = (item: CheckoutItem) => `${item.id}-${item.size}-${item.frameColor}`;

  // Modifier la fonction handleQuantityChange
  const handleQuantityChange = async (item: CheckoutItem, newQuantity: number) => {
    const itemKey = getItemKey(item);
    
    try {
      setLoadingQuantityUpdates(prev => ({ ...prev, [itemKey]: true }));
      
      // Vérifier d'abord la disponibilité
      const response = await fetch('/api/product/price', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: item.id,
          size: item.size,
          frameOption: item.frameOption,
          frameColor: item.frameColor,
          quantity: newQuantity
        }),
      });

      const { data, error } = await response.json();

      if (error) {
        throw new Error(error);
      }

      if (data.stock < newQuantity) {
        toast({
          title: "Stock limité",
          description: `Il ne reste que ${data.stock} exemplaire${data.stock > 1 ? 's' : ''} en stock.`,
          variant: "destructive",
        });
        return;
      }

      // Mettre à jour la quantité dans le panier
      updateQuantity(item.id, item.size, item.frameColor, newQuantity);
      
      // Calculer les prix avec réduction
      const discountedUnitPrice = appliedPromoCode 
        ? data.unitPrice * (1 - discount / 100)
        : undefined;
      const discountedTotalPrice = appliedPromoCode 
        ? data.totalPrice * (1 - discount / 100)
        : undefined;

      // Mettre à jour les détails de l'item avec les nouveaux prix
      const updatedItems = itemsWithDetails.map(i => 
        i.id === item.id && i.size === item.size && i.frameColor === item.frameColor
          ? {
              ...i,
              quantity: newQuantity,
              details: {
                ...i.details!,
                totalPrice: data.totalPrice,
                basePrice: data.basePrice,
                framePrice: data.framePrice,
                unitPrice: data.unitPrice,
                originalTotal: data.originalTotal,
                originalUnitPrice: data.originalUnitPrice,
                discountPercentage: data.discountPercentage,
                stock: data.stock,
              }
            }
          : i
      );

      setItemsWithDetails(updatedItems);
      recalculateTotal(updatedItems);

      // Afficher le message de réduction si applicable
      if (data.discountPercentage > 0) {
        toast({
          title: "Réduction appliquée",
          description: `Réduction de ${data.discountPercentage}% appliquée sur la quantité !`,
        });
      }

    } catch (error) {
      console.error('Erreur:', error);
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Impossible de mettre à jour la quantité",
        variant: "destructive",
      });
    } finally {
      setLoadingQuantityUpdates(prev => ({ ...prev, [itemKey]: false }));
    }
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

        {isLoadingDetails ? (
          <div className="mt-12">
            <CustomLoader />
          </div>
        ) : (
          <div className="mt-12 lg:grid lg:grid-cols-12 lg:items-start lg:gap-x-12 xl:gap-x-16">
            {/* Liste des produits */}
            <div className="lg:col-span-7">
              <ul className="divide-y divide-gray-200 border-b border-t border-gray-200">
                {itemsWithDetails.map((item) => (
                  <li key={`${item.id}-${item.size}-${item.frameColor}`} className="flex py-6 sm:py-10">
                    <div className="flex-shrink-0">
                      <Image
                        src={item.details?.image || ''}
                        alt={item.details?.name || ''}
                        width={100}
                        height={100}
                        className="object-cover rounded"
                      />
                    </div>

                    <div className="ml-4 flex flex-1 flex-col justify-between sm:ml-6">
                      <div>
                        <h3 className="text-base font-medium">{item.details?.name}</h3>
                        <p className="mt-1 text-sm text-gray-500">
                          Format: {item.size}
                          {item.frameOption === "avec" && ` - Cadre: ${item.frameColor}`}
                        </p>
                        <p className="mt-1 text-sm text-gray-500">
                          Artiste: {item.details?.artisteName}
                        </p>
                        <div className="mt-1 text-sm">
                          <span className="font-medium flex items-center gap-2">
                            {item.details?.discountPercentage ? (
                              <>
                                <span className="line-through text-gray-500">
                                  {formatPrice(item.details.originalUnitPrice || item.details.unitPrice)}
                                </span>
                                <span className="text-green-600">
                                  {formatPrice(item.details.unitPrice)}
                                </span>
                                <span className="text-xs text-green-600">
                                  (-{item.details.discountPercentage}%)
                                </span>
                              </>
                            ) : (
                              formatPrice(item.details?.unitPrice || 0)
                            )}
                          </span>
                          <span className="ml-2">× {item.quantity}</span>
                        </div>
                        <p className="mt-1 font-medium flex items-center gap-2">
                          Total: 
                          {item.details?.discountPercentage ? (
                            <>
                              <span className="line-through text-gray-500">
                                {formatPrice(item.details.originalTotal || (item.details.unitPrice * item.quantity))}
                              </span>
                              <span className="text-green-600">
                                {formatPrice(item.details.totalPrice)}
                              </span>
                            </>
                          ) : (
                            formatPrice(item.details?.totalPrice || 0)
                          )}
                        </p>
                      </div>

                      <div className="mt-4 flex items-center justify-between">
                        <div className="mt-4 flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleQuantityChange(item, item.quantity - 1)}
                            disabled={
                              item.quantity <= 1 || 
                              loadingQuantityUpdates[getItemKey(item)]
                            }
                          >
                            {loadingQuantityUpdates[getItemKey(item)] ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              '-'
                            )}
                          </Button>
                          <span className="text-center w-8">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleQuantityChange(item, item.quantity + 1)}
                            disabled={
                              item.quantity >= (item.details?.stock || 0) || 
                              loadingQuantityUpdates[getItemKey(item)]
                            }
                          >
                            {loadingQuantityUpdates[getItemKey(item)] ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              '+'
                            )}
                          </Button>
                          {item.quantity === (item.details?.stock || 0) && (
                            <span className="text-xs text-orange-600 ml-2">
                              Stock maximum atteint
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => removeItem(item.id, item.size, item.frameColor)}
                          className="text-sm text-red-600 hover:text-red-800"
                        >
                          Supprimer
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* Résumé de la commande */}
            <div className="mt-16 rounded-lg bg-gray-50 px-4 py-6 sm:p-6 lg:col-span-5 lg:mt-0 lg:p-8">
              <h2 className="text-lg font-medium text-gray-900">Résumé de la commande</h2>

              <div className="mt-6 space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600">Sous-total</p>
                  <div className="text-sm font-medium">
                    {appliedPromoCode ? (
                      <div className="flex items-center gap-2">
                        <span className="line-through text-gray-500">
                          {formatPrice(cartTotal - fee)}
                        </span>
                        <span className="text-green-600">
                          {formatPrice((cartTotal - fee) * (1 - discount / 100))}
                        </span>
                      </div>
                    ) : (
                      formatPrice(cartTotal - fee)
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600">Frais de livraison</p>
                  <p className="text-sm font-medium">{formatPrice(fee)}</p>
                </div>

                {appliedPromoCode && (
                  <div className="flex items-center justify-between text-sm text-green-600">
                    <p>Réduction ({discount}%)</p>
                    <p>-{formatPrice((cartTotal - fee) * (discount / 100))}</p>
                  </div>
                )}

                <div className="flex items-center justify-between border-t border-gray-200 pt-4">
                  <p className="text-base font-medium">Total</p>
                  <div className="text-base font-medium">
                    {appliedPromoCode ? (
                      <div className="flex items-center gap-2">
                        <span className="line-through text-gray-500">
                          {formatPrice(cartTotal)}
                        </span>
                        <span className="text-green-600">
                          {formatPrice(cartTotal * (1 - discount / 100))}
                        </span>
                      </div>
                    ) : (
                      formatPrice(cartTotal)
                    )}
                  </div>
                </div>

                {/* Code promo */}
                <div className="mt-4">
                  <div className="flex space-x-2">
                    <Input
                      type="text"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value)}
                      placeholder="Code promo"
                      disabled={!!appliedPromoCode}
                    />
                    <Button
                      onClick={handleApplyPromoCode}
                      disabled={isApplyingPromo || !promoCode || !!appliedPromoCode}
                      variant="outline"
                    >
                      {isApplyingPromo ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        'Appliquer'
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              <Button
                onClick={handleCheckout}
                className="w-full mt-6"
                disabled={isLoading || itemsWithDetails.length === 0}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Procéder au paiement'
                )}
              </Button>
            </div>
          </div>
        )}
      </div>

      <CustomAlertDialog
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Connexion requise"
        description="Vous devez être connecté pour procéder au paiement."
        actionText="Se connecter"
        onActionClick={() => router.push('/auth/signin')}
      />
    </div>
  );
};

export default CheckoutPage;
