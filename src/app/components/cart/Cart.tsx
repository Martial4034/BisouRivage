'use client';

import { ShoppingBag, ShoppingCart } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/app/components/ui/sheet';
import { Separator } from '@/app/components/ui/separator';
import { formatPrice } from '@/app/lib/utils';
import Link from 'next/link';
import { buttonVariants } from '@/app/components/ui/button';
import { useCart } from '@/app/hooks/use-cart';
import { ScrollArea } from '@/app/components/ui/scroll-area';
import CartItem from '@/app/components/cart/CartItem';
import { useEffect, useState } from 'react';

interface CartItemDetails {
  totalPrice: number;
  productInfo: {
    name: string;
    image: string;
    artisteName: string;
    artisteEmail: string;
    artisteId: string;
  };
  frameInfo?: {
    name: string;
    price: number;
  };
  stock: number;
}

const CartItemSkeleton = () => (
  <div className='flex items-center space-x-4 p-4 border-b animate-pulse'>
    <div className='w-[50px] h-[50px] bg-gray-200 rounded'/>
    <div className='flex-1 space-y-2'>
      <div className='h-4 bg-gray-200 rounded w-3/4'/>
      <div className='h-3 bg-gray-200 rounded w-1/2'/>
    </div>
  </div>
);

const Cart = () => {
  const { items } = useCart();
  const [isMounted, setIsMounted] = useState<boolean>(false);
  const [itemsDetails, setItemsDetails] = useState<Map<string, CartItemDetails>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const itemCount = items.length;

  // Charger les détails de tous les items
  useEffect(() => {
    const fetchItemsDetails = async () => {
      setIsLoading(true);
      const detailsMap = new Map<string, CartItemDetails>();

      for (const item of items) {
        try {
          const response = await fetch('/api/product/price', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              productId: item.id,
              size: item.size,
              frameOption: item.frameOption,
              frameColor: item.frameColor
            }),
          });

          if (!response.ok) continue;
          
          const { data } = await response.json();
          const key = `${item.id}-${item.size}-${item.frameOption}-${item.frameColor}`;
          detailsMap.set(key, data);
        } catch (error) {
          console.error('Erreur lors du chargement des détails:', error);
        }
      }

      setItemsDetails(detailsMap);
      setIsLoading(false);
    };

    if (isMounted && items.length > 0) {
      fetchItemsDetails();
    }
  }, [items, isMounted]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Calculer le total du panier
  const cartTotal = items.reduce((total, item) => {
    const key = `${item.id}-${item.size}-${item.frameOption}-${item.frameColor}`;
    const details = itemsDetails.get(key);
    return total + (details?.totalPrice || 0) * item.quantity;
  }, 0);

  const fee = 12.5;

  if (!isMounted) {
    return null;
  }

  return (
    <Sheet>
      <SheetTrigger className='group -m-2 flex items-center p-2'>
        <ShoppingBag
          aria-hidden='true'
          className='h-6 w-6 flex-shrink-0 text-gray-400 group-hover:text-gray-500'
        />
        <span className='ml-2 text-sm font-medium text-gray-700 pr-2 group-hover:text-gray-800'>
          {itemCount}
        </span>
        <span className="text-sm text-black">mon panier</span>
      </SheetTrigger>
      <SheetContent className='flex w-full flex-col pr-0 sm:max-w-lg'>
        <SheetHeader className='space-y-2.5 pr-6'>
          <SheetTitle>Panier ({itemCount})</SheetTitle>
        </SheetHeader>
        {itemCount > 0 ? (
          <>
            <div className='flex w-full flex-col pr-6'>
              <ScrollArea>
                {isLoading ? (
                  // Afficher les skeletons pendant le chargement
                  Array(itemCount).fill(0).map((_, i) => (
                    <CartItemSkeleton key={i} />
                  ))
                ) : (
                  items.map((item) => (
                    <CartItem
                      key={`${item.id}-${item.size}-${item.frameOption}-${item.frameColor}`}
                      item={item}
                    />
                  ))
                )}
              </ScrollArea>
            </div>
            <div className='space-y-4 pr-6'>
              <Separator />
              <div className='space-y-1.5 text-sm'>
                {isLoading ? (
                  <div className='animate-pulse space-y-2'>
                    <div className='h-4 bg-gray-200 rounded w-1/2'/>
                    <div className='h-4 bg-gray-200 rounded w-3/4'/>
                  </div>
                ) : (
                  <>
                    <div className='flex'>
                      <span className='flex-1'>Livraison</span>
                      <span>{formatPrice(fee)}</span>
                    </div>
                    <div className='flex'>
                      <span className='flex-1'>Total</span>
                      <span>{formatPrice(cartTotal + fee)}</span>
                    </div>
                  </>
                )}
              </div>

              <SheetFooter>
                <SheetTrigger asChild>
                  <Link
                    href='/checkout'
                    className={buttonVariants({
                      className: 'w-full',
                    })}
                  >
                    {isLoading ? 'Chargement...' : 'Continuer vers le paiement'}
                  </Link>
                </SheetTrigger>
              </SheetFooter>
            </div>
          </>
        ) : (
          <div className='flex h-full flex-col items-center justify-center space-y-1'>
            <div
              aria-hidden='true'
              className='relative mb-4 h-80 w-80 flex items-center justify-center text-muted-foreground'
            >
              <ShoppingCart size={175} strokeWidth={1}/>
            </div>
            <div className='text-xl font-semibold'>Votre panier est vide</div>
            <SheetTrigger asChild>
              <Link
                href='/'
                className={buttonVariants({
                  variant: 'link',
                  size: 'sm',
                  className: 'text-sm text-muted-foreground',
                })}
              >
                Ajouter des articles au panier pour commander
              </Link>
            </SheetTrigger>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default Cart;
