import { useCart } from '@/app/hooks/use-cart';
import { formatPrice } from '@/app/lib/utils';
import Image from 'next/image';
import { useEffect, useState } from 'react';

interface CartItemProps {
  item: {
    id: string;
    size: string;
    frameOption: "avec" | "sans";
    frameColor?: string;
    quantity: number;
  }
}

const CartItem = ({ item }: CartItemProps) => {
  const { removeItem } = useCart();
  const [itemDetails, setItemDetails] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchItemDetails = async () => {
      setIsLoading(true);
      setError(null);
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

        if (!response.ok) {
          throw new Error('Erreur lors de la récupération des détails');
        }
        
        const { data } = await response.json();
        setItemDetails(data);
      } catch (error) {
        console.error('Erreur:', error);
        setError('Impossible de charger les détails de cet article');
      } finally {
        setIsLoading(false);
      }
    };

    fetchItemDetails();
  }, [item]);

  if (error) {
    return (
      <div className='flex items-center space-x-4 p-4 border-b bg-red-50'>
        <div className='flex-1'>
          <p className='text-red-600'>{error}</p>
          <button
            onClick={() => removeItem(item.id, item.size, item.frameColor)}
            className='text-red-500 hover:text-red-700 text-sm'
          >
            Retirer du panier
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return <div>Chargement...</div>;
  }

  return (
    <div className='flex items-center space-x-4 p-4 border-b hover:bg-gray-50 transition-colors'>
      <Image 
        src={itemDetails.productInfo.image} 
        alt={itemDetails.productInfo.name} 
        width={50} 
        height={50} 
        className='object-cover rounded'
      />
      <div className='flex-1'>
        <h4 className='font-medium'>{itemDetails.id}</h4>
        <p className='text-sm text-gray-600'>
          Format: {item.size}
          {item.frameOption === "avec" && ` - ${itemDetails.frameInfo.name}`}
        </p>
        <p className='text-sm font-medium'>
          {formatPrice(itemDetails.totalPrice)} x {item.quantity}
        </p>
      </div>
      <button
        onClick={() => removeItem(item.id, item.size, item.frameColor)}
        className='text-red-500 hover:text-red-700'
      >
        Supprimer
      </button>
    </div>
  );
};

export default CartItem;
