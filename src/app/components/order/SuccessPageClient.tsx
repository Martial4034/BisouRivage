'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CircularProgress } from '@mui/material';
import { useSession } from 'next-auth/react';
import CustomLoader from '@/app/components/ui/CustomLoader';

interface Order {
  id: string;
  deliveryDate: string;
  products: { name: string; quantity: number; price: number }[];
  totalAmount: number;
}

export default function SuccessPageClient({ sessionId }: { sessionId?: string }) {
  const router = useRouter();
  const { data: session } = useSession();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const response = await fetch(`/api/secured/order`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ stripeSessionId: sessionId }),
        });

        const data = await response.json();
        if (response.ok) {
          setOrder(data.order);
        } else {
          console.error('Error fetching order:', data);
          router.push('/checkout');
        }
      } catch (error) {
        console.error('Error fetching order:', error);
        router.push('/checkout');
      } finally {
        setLoading(false);
      }
    };

    if (sessionId && session?.user) {
      fetchOrder();
    } else {
      router.push('/checkout');
    }
  }, [sessionId, session, router]);

  if (loading) {
    return <CustomLoader />;
  }

  if (!order) {
    return <p>Commande introuvable.</p>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold">Merci pour votre commande !</h1>
      <p>
        Votre commande #{order.id} a été confirmée. La livraison est prévue pour le{' '}
        {new Date(order.deliveryDate).toLocaleDateString()}.
      </p>
      <h2 className="text-xl mt-4">Résumé de la commande :</h2>
      <ul>
        {order.products.map((product, index) => (
          <li key={index}>
            <p>Produit : {product.name}</p>
            <p>Quantité : {product.quantity}</p>
            <p>Prix total : {product.price}</p>
          </li>
        ))}
      </ul>
      <p>Total de la commande : {order.totalAmount} €</p>
    </div>
  );
}