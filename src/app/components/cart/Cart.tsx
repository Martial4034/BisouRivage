'use client';

import { ShoppingCart } from 'lucide-react';
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
import { useCart } from '@/app/hooks/use-cart'; // Zustand hook
import { ScrollArea } from '@/app/components/ui/scroll-area';
import CartItem from '@/app/components/cart/CartItem';
import { useEffect, useState } from 'react';

const Cart = () => {
  const { items } = useCart(); // Accès au hook Zustand
  const itemCount = items.length;
  const [isMounted, setIsMounted] = useState<boolean>(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const cartTotal = items.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

  const fee = 10; // Exemple de frais de transaction

  return (
    <Sheet>
      <SheetTrigger className='group -m-2 flex items-center p-2'>
        <ShoppingCart
          aria-hidden='true'
          className='h-6 w-6 flex-shrink-0 text-gray-400 group-hover:text-gray-500'
        />
        <span className='ml-2 text-sm font-medium text-gray-700 group-hover:text-gray-800'>
          {isMounted ? itemCount : 0}
        </span>
      </SheetTrigger>
      <SheetContent className='flex w-full flex-col pr-0 sm:max-w-lg'>
        <SheetHeader className='space-y-2.5 pr-6'>
          <SheetTitle>Panier ({itemCount})</SheetTitle>
        </SheetHeader>
        {itemCount > 0 ? (
          <>
            <div className='flex w-full flex-col pr-6'>
              <ScrollArea>
                {items.map((item) => (
                  <CartItem
                    product={{
                      id: item.id,
                      name: item.name,
                      price: item.price,
                      image: item.image,
                      format: item.format,
                      quantity: item.quantity,
                      stock: item.stock,
                      artist: item.artist
                    }} // Passer les bonnes propriétés à CartItem
                    key={item.id}
                  />
                ))}
              </ScrollArea>
            </div>
            <div className='space-y-4 pr-6'>
              <Separator />
              <div className='space-y-1.5 text-sm'>
                <div className='flex'>
                  <span className='flex-1'>Livraison</span>
                  <span>{formatPrice(fee)}</span>
                </div>
                <div className='flex'>
                  <span className='flex-1'>Total</span>
                  <span>{formatPrice(cartTotal + fee)}</span>
                </div>
              </div>

              <SheetFooter>
                <SheetTrigger asChild>
                  <Link
                    href='/checkout'
                    className={buttonVariants({
                      className: 'w-full',
                    })}
                  >
                    Continue to Checkout
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
              href='/products'
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
