import { useCart } from '@/app/hooks/use-cart';
import { formatPrice } from '@/app/lib/utils';
import Image from 'next/image';

const CartItem = ({ product }: { product: { id: string, name: string, price: number, image: string, format: string, quantity: number, stock: number, artisteName: string, artisteEmail: string, artisteId: string} }) => {
  const { removeItem } = useCart();

  return (
    <div className='flex items-center space-x-4'>
      <Image src={product.image} alt={product.name} width={50} height={50} className='object-cover' />
      <div className='flex-1'>
        <h4>{product.name} ({product.format})</h4>
        <p>{formatPrice(product.price)} x {product.quantity}</p>
      </div>
      <button
        onClick={() => removeItem(product.id, product.format)}
        className='text-red-500'>
        Supprimer
      </button>
    </div>
  );
};

export default CartItem;
