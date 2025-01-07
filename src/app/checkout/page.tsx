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
    image: string;
    stock: number;
    discountPercentage?: number;
    originalTotal?: number;
    originalUnitPrice?: number;
  };
}

// Types pour la gestion des états de chargement et des erreurs
interface LoadingStates {
  verification: boolean;
  priceUpdate: boolean;
  quantityUpdate: boolean;
  checkout: boolean;
}

interface ErrorStates {
  verification: string | null;
  priceUpdate: string | null;
  quantityUpdate: string | null;
  checkout: string | null;
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

interface VerificationUpdate {
  id: string;
  size: string;
  frameColor?: string;
  status: 'removed' | 'quantity_adjusted' | 'price_changed' | 'frame_unavailable';
  message: string;
  newQuantity?: number;
  newPrice?: number;
}

// Ajout des types pour la promotion
interface Promotion {
  type: "free_item";
  appliedTo: {
    id: string;
    size: string;
    frameColor?: string;
    price: number;
    quantity: number;
  };
  message: string;
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
  const [loadingStates, setLoadingStates] = useState<LoadingStates>({
    verification: false,
    priceUpdate: false,
    quantityUpdate: false,
    checkout: false
  });
  const [errors, setErrors] = useState<ErrorStates>({
    verification: null,
    priceUpdate: null,
    quantityUpdate: null,
    checkout: null
  });
  const [promotion, setPromotion] = useState<Promotion | null>(null);

  // Fonction utilitaire pour générer une clé unique pour chaque item
  const getItemKey = (item: CheckoutItem) => `${item.id}-${item.size}-${item.frameColor}`;

  // Initialisation
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Chargement des détails des produits
  useEffect(() => {
    const fetchItemDetails = async () => {
      if (!isMounted || items.length === 0) return;

      setIsLoadingDetails(true);
      try {
        console.log("🛒 Chargement des détails des produits...", items);
        const itemsWithData = await Promise.all(
          items.map(async (item) => {
            console.log(`📦 Chargement des détails pour l'article:`, {
              id: item.id,
              size: item.size,
              frameOption: item.frameOption,
              frameColor: item.frameColor
            });

            const response = await fetchWithRetry('/api/product/price', {
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

            const { data, error } = response;

            if (error) {
              throw new Error(`Erreur pour l'article ${item.id}: ${error}`);
            }

            console.log(`✅ Détails reçus pour l'article ${item.id}:`, data);

            return {
              ...item,
              details: {
                name: data.productInfo.name || 'Produit sans nom',
                artisteName: data.productInfo.artisteName || 'Artiste inconnu',
                basePrice: data.basePrice || 0,
                framePrice: data.framePrice || 0,
                totalPrice: data.totalPrice || 0,
                unitPrice: data.unitPrice || 0,
                image: data.productInfo.image || '/placeholder.jpg',
                stock: data.stock || 0,
                discountPercentage: data.discountPercentage,
                originalTotal: data.originalTotal,
                originalUnitPrice: data.originalUnitPrice,
              }
            };
          })
        );

        console.log("🎉 Tous les détails chargés:", itemsWithData);
        setItemsWithDetails(itemsWithData);
        
        // Calculer le total initial
        const subtotal = itemsWithData.reduce(
          (sum, item) => sum + (item.details?.totalPrice || 0) * item.quantity,
          0
        );
        const discountAmount = (subtotal * discount) / 100;
        setCartTotal(subtotal - discountAmount + fee);

      } catch (error) {
        console.error("❌ Erreur lors du chargement des détails:", error);
        toast({
          title: "Erreur",
          description: "Impossible de charger les détails des produits",
          variant: "destructive",
        });
      } finally {
        setIsLoadingDetails(false);
      }
    };

    fetchItemDetails();
  }, [items, isMounted, toast, discount, fee]);

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
    if (!items.length) return;

    try {
      console.log("🔄 Vérification du panier:", items);
      const response = await fetchWithRetry('/api/verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cartItems: items,
        }),
      });

      if (response.updates && response.updates.length > 0) {
        let hasChanges = false;
        response.updates.forEach((update: CartUpdate) => {
          console.log("📝 Mise à jour:", update);
          toast({
            title: 'Mise à jour du panier',
            description: update.message,
            variant: update.status === 'removed' ? 'destructive' : 'default',
          });

          if (update.status === 'quantity_adjusted' && update.newQuantity) {
            updateQuantity(update.id, update.size, update.frameColor, update.newQuantity);
            hasChanges = true;
          } else if (update.status === 'removed') {
            removeItem(update.id, update.size, update.frameColor);
            hasChanges = true;
          }
        });

        if (hasChanges) {
          await updateAllPrices();
        }
      }
    } catch (err) {
      console.error("❌ Erreur lors de la vérification du panier:", err);
      toast({
        title: 'Erreur',
        description: 'Une erreur est survenue lors de la vérification du panier.',
        variant: 'destructive',
      });
    }
  };

  // Fonction pour les appels API avec retry
  const fetchWithRetry = async (url: string, options: RequestInit, maxRetries = 3) => {
    let lastError;
    
    for (let i = 0; i < maxRetries; i++) {
      try {
        const response = await fetch(url, options);
        const data = await response.json();

        // Si la réponse contient une erreur d'authentification
        if (response.status === 401) {
          return { error: data.error, status: 401 };
        }

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        return data;
      } catch (error) {
        console.error(`Tentative ${i + 1}/${maxRetries} échouée:`, error);
        lastError = error;
        if (i < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
        }
      }
    }
    throw lastError;
  };

  // Validation des données
  const validateCartItem = (item: CheckoutItem): ValidationResult => {
    const errors: string[] = [];
    
    if (!item.id) errors.push("ID du produit manquant");
    if (!item.size) errors.push("Format non spécifié");
    if (item.quantity < 1) errors.push("Quantité invalide");
    if (item.frameOption === "avec" && !item.frameColor) {
      errors.push("Couleur de cadre non spécifiée pour l'option avec cadre");
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  };

  // Synchronisation des données du panier avec vérification des cadres
  const synchronizeCartData = async () => {
    setLoadingStates(prev => ({ ...prev, verification: true }));
    try {
      console.log("🔄 Début de la synchronisation du panier");
      
      const verificationResponse = await fetchWithRetry('/api/verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cartItems: items }),
      });

      console.log("📋 Résultat de la vérification:", verificationResponse);

      // Mise à jour de la promotion
      if (verificationResponse.promotion) {
        setPromotion(verificationResponse.promotion);
        toast({
          title: "Promotion appliquée !",
          description: verificationResponse.promotion.message,
        });
      } else {
        setPromotion(null);
      }

      let needsUpdate = false;

      if (verificationResponse.updates && verificationResponse.updates.length > 0) {
        for (const update of verificationResponse.updates) {
          console.log("🔄 Traitement de la mise à jour:", update);
          
          switch (update.status) {
            case 'removed':
              console.log("❌ Suppression de l'article:", update);
              removeItem(update.id, update.size, update.frameColor);
              toast({
                title: "Article retiré",
                description: update.message,
                variant: "destructive",
              });
              needsUpdate = true;
              break;
              
            case 'quantity_adjusted':
              if (update.newQuantity) {
                console.log("📦 Ajustement de la quantité:", update);
                updateQuantity(update.id, update.size, update.frameColor, update.newQuantity);
                toast({
                  title: "Quantité ajustée",
                  description: update.message,
                });
                needsUpdate = true;
              }
              break;
              
            case 'frame_unavailable':
              console.log("🖼️ Cadre non disponible:", update);
              toast({
                title: "Cadre non disponible",
                description: update.message,
                variant: "destructive",
              });
              removeItem(update.id, update.size, update.frameColor);
              needsUpdate = true;
              break;
              
            case 'price_changed':
              console.log("💰 Prix mis à jour:", update);
              toast({
                title: "Prix mis à jour",
                description: update.message,
              });
              needsUpdate = true;
              break;
          }
        }

        if (needsUpdate) {
          console.log("🔄 Mise à jour des prix nécessaire");
          await updateAllPrices();
        }
      }

    } catch (error) {
      console.error('❌ Erreur lors de la synchronisation:', error);
      setErrors(prev => ({
        ...prev,
        verification: "Erreur lors de la vérification du panier"
      }));
      toast({
        title: "Erreur de synchronisation",
        description: "Impossible de vérifier le contenu du panier",
        variant: "destructive",
      });
    } finally {
      setLoadingStates(prev => ({ ...prev, verification: false }));
    }
  };

  // Mise à jour de handleQuantityChange avec la nouvelle logique
  const handleQuantityChange = async (item: CheckoutItem, newQuantity: number) => {
    const itemKey = getItemKey(item);
    
    if (newQuantity < 1 || newQuantity > (item.details?.stock || 0)) return;

    try {
      setLoadingQuantityUpdates(prev => ({ ...prev, [itemKey]: true }));
      
      // Vérifier d'abord la disponibilité
      const verificationResponse = await fetchWithRetry('/api/verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cartItems: [{
            id: item.id,
            size: item.size,
            frameOption: item.frameOption,
            frameColor: item.frameColor,
            quantity: newQuantity
          }]
        }),
      });

      if (verificationResponse.updates.length > 0) {
        const update = verificationResponse.updates[0];
        if (update.status === 'removed') {
          throw new Error("Ce produit n'est plus disponible");
        }
        if (update.status === 'quantity_adjusted') {
          newQuantity = update.newQuantity!;
        }
      }

      // Obtenir le prix mis à jour
      const priceResponse = await fetchWithRetry('/api/product/price', {
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

      const { data, error } = priceResponse;

      if (error) {
        throw new Error(error);
      }

      // Mettre à jour la quantité dans le panier
      updateQuantity(item.id, item.size, item.frameColor, newQuantity);

      // Mettre à jour les détails de l'item
      const updatedItems = itemsWithDetails.map(i => 
        i.id === item.id && i.size === item.size && i.frameColor === item.frameColor
          ? {
              ...i,
              quantity: newQuantity,
              details: {
                ...i.details!,
                totalPrice: data.totalPrice,
                unitPrice: data.unitPrice,
                stock: data.stock,
                discountPercentage: data.discountPercentage,
                originalTotal: data.originalTotal,
                originalUnitPrice: data.originalUnitPrice,
              }
            }
          : i
      );

      setItemsWithDetails(updatedItems);
      recalculateTotal(updatedItems);

    } catch (error) {
      console.error('Erreur lors de la mise à jour de la quantité:', error);
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Impossible de mettre à jour la quantité",
        variant: "destructive",
      });
    } finally {
      setLoadingQuantityUpdates(prev => ({ ...prev, [itemKey]: false }));
    }
  };

  // Mise à jour de handleCheckout avec la nouvelle logique
  const handleCheckout = async () => {
    if (!session) {
      setIsModalOpen(true);
      return;
    }

    setLoadingStates(prev => ({ ...prev, checkout: true }));
    setErrors(prev => ({ ...prev, checkout: null }));

    try {
      // Valider tous les articles
      const validationErrors: string[] = [];
      items.forEach(item => {
        const validation = validateCartItem(item);
        if (!validation.isValid) {
          validationErrors.push(...validation.errors);
        }
      });

      if (validationErrors.length > 0) {
        throw new Error(`Erreurs de validation: ${validationErrors.join(', ')}`);
      }

      // Synchroniser une dernière fois avant le checkout
      await synchronizeCartData();

      const response = await fetchWithRetry('/api/secured/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cartItems: items,
          promoCodeId: promoCode
        }),
      });

      if (response.url) {
        router.push(response.url);
      } else {
        throw new Error("URL de paiement non reçue");
      }

    } catch (error) {
      console.error('❌ Erreur lors du checkout:', error);
      setErrors(prev => ({
        ...prev,
        checkout: error instanceof Error ? error.message : "Erreur lors de la création du paiement"
      }));
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Une erreur est survenue lors du paiement",
        variant: "destructive",
      });
    } finally {
      setLoadingStates(prev => ({ ...prev, checkout: false }));
    }
  };

  const handleClose = () => {
    setIsModalOpen(false);
  };

  const redirectToSignIn = () => {
    router.push('/auth/signin');
  };

  // Fonction optimisée pour appliquer le code promo
  const handleApplyPromoCode = async (codeToApply = promoCode) => {
    if (!codeToApply || isApplyingPromo) return;

    // Vérifier si l'utilisateur est connecté
    if (!session) {
      setIsModalOpen(true);
      return;
    }
    
    setIsApplyingPromo(true);
    try {
      const response = await fetchWithRetry('/api/secured/promo/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ code: codeToApply }),
        credentials: 'include' // Ajouter les credentials pour envoyer le cookie de session
      });

      if (response.status === 401) {
        setIsModalOpen(true);
        toast({
          title: 'Connexion requise',
          description: response.error || 'Vous devez être connecté pour utiliser un code promo',
          variant: 'destructive',
        });
        return;
      }

      if (response.valid) {
        setDiscount(response.discount);
        setAppliedPromoCode(response.id);
        localStorage.setItem('promoCode', codeToApply);
        
        // Recalculer le total avec la nouvelle réduction
        const subtotal = itemsWithDetails.reduce(
          (sum, item) => sum + (item.details?.totalPrice || 0),
          0
        );
        const discountAmount = (subtotal * response.discount) / 100;
        setCartTotal(subtotal - discountAmount + fee);

        toast({
          title: 'Code promo appliqué',
          description: response.message || `Réduction de ${response.discount}% appliquée`,
        });
      } else {
        setPromoCode('');
        localStorage.removeItem('promoCode');
        toast({
          title: 'Code promo invalide',
          description: response.message || 'Ce code promo n\'est pas valide',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('❌ Erreur lors de l\'application du code promo:', error);
      toast({
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Impossible de vérifier le code promo',
        variant: 'destructive',
      });
    } finally {
      setIsApplyingPromo(false);
    }
  };

  // Effet pour charger le code promo sauvegardé
  useEffect(() => {
    if (isMounted) {
      const savedCode = localStorage.getItem('promoCode');
      if (savedCode) {
        setPromoCode(savedCode);
        handleApplyPromoCode(savedCode);
      }
    }
  }, [isMounted]);

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

  // Mise à jour de updateAllPrices avec une meilleure gestion des erreurs
  const updateAllPrices = async () => {
    if (!itemsWithDetails.length) return;

    setIsLoadingDetails(true);
    console.log("💰 Début de la mise à jour des prix", itemsWithDetails);
    
    try {
      const updatedItems = await Promise.all(
        itemsWithDetails.map(async (item) => {
          console.log(`📦 Mise à jour du prix pour l'article:`, {
            id: item.id,
            size: item.size,
            frameOption: item.frameOption,
            frameColor: item.frameColor
          });

          const response = await fetchWithRetry('/api/product/price', {
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

          if (!response.data) {
            console.error(`❌ Données manquantes pour l'article ${item.id}:`, response);
            return item; // Garder l'ancien état si erreur
          }

          const { data } = response;
          console.log(`✅ Prix mis à jour pour l'article ${item.id}:`, data);

          // Calculer les prix avec réduction si un code promo est appliqué
          const discountedUnitPrice = appliedPromoCode 
            ? data.unitPrice * (1 - discount / 100)
            : data.unitPrice;
          const discountedTotalPrice = appliedPromoCode 
            ? data.totalPrice * (1 - discount / 100)
            : data.totalPrice;

          return {
            ...item,
            details: {
              ...item.details!,
              name: data.productInfo.name || item.details?.name || 'Produit sans nom',
              artisteName: data.productInfo.artisteName || item.details?.artisteName || 'Artiste inconnu',
              totalPrice: data.totalPrice,
              basePrice: data.basePrice,
              framePrice: data.framePrice,
              unitPrice: data.unitPrice,
              image: data.productInfo.image || item.details?.image || '/placeholder.jpg',
              stock: data.stock,
              discountedPrice: discountedTotalPrice,
              discountedUnitPrice: discountedUnitPrice,
            }
          };
        })
      );

      console.log("✅ Mise à jour des prix terminée:", updatedItems);
      
      // Ne mettre à jour que si nous avons des articles valides
      if (updatedItems.length > 0) {
        setItemsWithDetails(updatedItems);
        recalculateTotal(updatedItems);
      }
      
    } catch (error) {
      console.error('❌ Erreur lors de la mise à jour des prix:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour les prix",
        variant: "destructive",
      });
    } finally {
      setIsLoadingDetails(false);
    }
  };

  // Ajout d'une vérification supplémentaire pour les articles avec cadre
  useEffect(() => {
    if (isMounted && items.length > 0) {
      const hasFramedItems = items.some(item => item.frameOption === "avec");
      console.log("🖼️ Articles avec cadre détectés:", hasFramedItems);
      
      if (hasFramedItems) {
        // Double vérification pour les articles avec cadre
        const timeoutId = setTimeout(() => {
          synchronizeCartData();
        }, 500); // Petit délai pour s'assurer que tout est bien initialisé
        
        return () => clearTimeout(timeoutId);
      }
    }
  }, [isMounted, items]);

  // Synchronisation initiale au montage
  useEffect(() => {
    if (isMounted && items.length > 0) {
      synchronizeCartData();
    }
  }, [isMounted, items]);

  if (!isMounted) {
    return null;
  }

  if (isLoadingDetails) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <CustomLoader />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-white">
        <div className="text-center space-y-6 max-w-md mx-auto">
          <h2 className="text-2xl font-semibold text-gray-900 sm:text-3xl">
            Votre panier est vide
          </h2>
          <p className="text-gray-500 text-sm sm:text-base">
            Vous n'avez pas d'article dans votre panier
          </p>
          <Link 
            href="/" 
            className="inline-flex items-center justify-center w-full sm:w-auto px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black transition-colors duration-200"
          >
            Découvrir nos produits
          </Link>
        </div>
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
              {itemsWithDetails.map((item) => {
                const isDiscounted = promotion?.appliedTo?.id === item.id && 
                                    promotion?.appliedTo?.size === item.size && 
                                    promotion?.appliedTo?.frameColor === item.frameColor;
                
                return (
                  <li key={getItemKey(item)} className="flex py-6 sm:py-10">
                    <div className="flex-shrink-0">
                      <Link href={`/sales/${item.id}`}>
                        <Image
                          src={item.details?.image || '/placeholder.jpg'}
                          alt={`${item.details?.name || 'Image du produit'} - Format: ${item.size}${item.frameOption === "avec" ? ` avec cadre ${item.frameColor}` : ''}`}
                          width={100}
                          height={100}
                          className="object-cover rounded w-auto h-auto hover:opacity-80 transition-opacity"
                          style={{ aspectRatio: '1/1' }}
                          priority
                        />
                      </Link>
                    </div>

                    {/* Détails du produit */}
                    <div className="ml-4 flex flex-1 flex-col justify-between sm:ml-6">
                      <div>
                        <Link 
                          href={`/sales/${item.id}`}
                          className="group"
                        >
                          <h3 className="text-base font-medium group-hover:text-gray-600 transition-colors">
                            {item.details?.name}
                          </h3>
                        </Link>
                        <p className="mt-1 text-sm text-gray-500">
                          Format: {item.size}
                          {item.frameOption === "avec" && ` + Cadre ${item.frameColor}`}
                        </p>
                        <Link 
                          href={`/sales/${item.id}`}
                          className="group"
                        >
                          <p className="mt-1 text-sm text-gray-500 group-hover:text-gray-600 transition-colors">
                            Artiste: {item.details?.artisteName}
                          </p>
                        </Link>

                        {/* Prix et quantité */}
                        <div className="mt-4 flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleQuantityChange(item, item.quantity - 1)}
                              disabled={item.quantity <= 1 || loadingQuantityUpdates[getItemKey(item)]}
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
                          </div>
                          <button
                            onClick={() => removeItem(item.id, item.size, item.frameColor)}
                            className="text-sm text-red-600 hover:text-red-800"
                          >
                            Supprimer
                          </button>
                        </div>

                        {/* Prix détaillés avec promotion */}
                        <div className="mt-4 space-y-1 text-sm">
                          <div className="flex justify-between text-gray-500">
                            <span>Prix unitaire:</span>
                            <span>{formatPrice(item.details?.basePrice || 0)}</span>
                          </div>
                          {item.frameOption === "avec" && (
                            <div className="flex justify-between text-gray-500">
                              <span>Cadre:</span>
                              <span>+ {formatPrice(item.details?.framePrice || 0)}</span>
                            </div>
                          )}
                          <div className="flex justify-between font-medium">
                            <span>Prix unitaire total:</span>
                            <span>{formatPrice(item.details?.unitPrice || 0)}</span>
                          </div>
                          <div className="flex justify-between font-medium text-black pt-2 border-t">
                            <span>
                              Total ({item.quantity} {item.quantity > 1 ? 'articles' : 'article'})
                              {isDiscounted && (
                                <span className="text-green-600 ml-2">
                                  (1 article offert !)
                                </span>
                              )}:
                            </span>
                            <div className="text-right">
                              {isDiscounted ? (
                                <>
                                  <span className="line-through text-gray-500 mr-2">
                                    {formatPrice((item.details?.totalPrice || 0))}
                                  </span>
                                  <span className="text-green-600">
                                    {formatPrice((item.details?.totalPrice || 0) - (item.details?.unitPrice || 0))}
                                  </span>
                                </>
                              ) : (
                                <span>{formatPrice((item.details?.totalPrice || 0))}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Résumé de la commande */}
          <div className="mt-16 rounded-lg bg-gray-50 px-4 py-6 sm:p-6 lg:col-span-5 lg:mt-0 lg:p-8">
            <h2 className="text-lg font-medium text-gray-900">Résumé de la commande</h2>
            <div className="mt-6 space-y-4">
              {/* Prix total avant réduction */}
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">Sous-total</p>
                <p className="text-sm font-medium">
                  {formatPrice(itemsWithDetails.reduce((sum, item) => 
                    sum + (item.details?.totalPrice || 0),
                    0
                  ))}
                </p>
              </div>

              {/* Code promo */}
              <div className="flex flex-col space-y-2">
                <p className="text-sm font-medium">Code promo</p>
                <div className="flex space-x-2">
                  <Input
                    type="text"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    placeholder="Entrez votre code"
                    disabled={!!appliedPromoCode}
                    className="flex-1"
                  />
                  {appliedPromoCode ? (
                    <Button
                      onClick={() => {
                        setPromoCode('');
                        setAppliedPromoCode(null);
                        setDiscount(0);
                        localStorage.removeItem('promoCode');
                      }}
                      variant="outline"
                      className="whitespace-nowrap"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button
                      onClick={() => handleApplyPromoCode()}
                      disabled={isApplyingPromo || !promoCode}
                      variant="outline"
                      className="whitespace-nowrap"
                    >
                      {isApplyingPromo ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        'Appliquer'
                      )}
                    </Button>
                  )}
                </div>
              </div>

              {/* Réduction code promo */}
              {appliedPromoCode && discount > 0 && (
                <div className="flex items-center justify-between text-green-600">
                  <p className="text-sm">Code promo ({discount}%)</p>
                  <p className="text-sm font-medium">
                    -{formatPrice(
                      itemsWithDetails.reduce((sum, item) => 
                        sum + (item.details?.totalPrice || 0),
                        0
                      ) * (discount / 100)
                    )}
                  </p>
                </div>
              )}

              {/* Frais de livraison */}
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">Frais de livraison</p>
                <p className="text-sm font-medium">{formatPrice(fee)}</p>
              </div>

              {/* Total final */}
              <div className="flex items-center justify-between border-t border-gray-200 pt-4">
                <p className="text-base font-medium">Total</p>
                <p className="text-base font-medium">
                  {formatPrice(
                    // Prix total initial
                    itemsWithDetails.reduce((sum, item) => 
                      sum + (item.details?.totalPrice || 0),
                      0
                    )
                    // Appliquer la réduction du code promo
                    * (1 - (discount / 100))
                    // Ajouter les frais de livraison
                    + fee
                  )}
                </p>
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

          {/* Modal de connexion */}
          <CustomAlertDialog
            isOpen={isModalOpen}
            onClose={handleClose}
            title="Connexion requise"
            description="Vous devez être connecté pour procéder au paiement. Veuillez vous connecter ou vous inscrire."
            actionText="Se connecter"
            onActionClick={redirectToSignIn}
          />
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
