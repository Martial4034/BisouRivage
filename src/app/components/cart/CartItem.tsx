import { useCart } from '@/app/hooks/use-cart';
import { formatPrice } from '@/app/lib/utils';
import Image from 'next/image';

const CartItem = ({ product }: { product: { id: string, name: string, price: number, image: string, format: string, quantity: number, stock: number, artist: string } }) => {
  const { removeItem } = useCart();

  return (
    <div className='flex items-center space-x-4'>
      <Image src={product.image} alt={product.name} width={50} height={50} className='object-cover' />
      <div className='flex-1'>
        <h4>{product.name}</h4>
        <p>Format : {product.format}</p>
        <p>Artiste : {product.artist}</p>
        <p>{formatPrice(product.price)} x {product.quantity}</p>
        <p>En stock : {product.stock}</p> {/* Afficher le stock */}
      </div>
      <button
        onClick={() => removeItem(product.id)}
        className='text-red-500'>
        Supprimer
      </button>
    </div>
  );
};

export default CartItem;
