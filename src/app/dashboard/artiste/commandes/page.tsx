import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import { firestoreAdmin } from '@/app/firebaseAdmin';
import ArtistOrders from '@/app/components/order/ArtistOrders';
import { redirect } from 'next/navigation';
import { Order, Product } from '@/app/types';

export default async function ArtistOrdersPage() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'artiste') {
    redirect('/auth/signin');
  }

  // Récupérer les commandes contenant les produits de l'artiste
  const ordersRef = firestoreAdmin.collection('orders');
  const snapshot = await ordersRef.get();

  const artistOrders: Order[] = [];

  snapshot.docs.forEach((doc) => {
    const data = doc.data();
    const artistProducts = data.products.filter(
      (product: Product) => product.artisteId === session.user.uid
    );

    if (artistProducts.length > 0) {
      artistOrders.push({
        id: doc.id,
        stripeSessionId: data.stripeSessionId,
        userId: data.userId,
        userEmail: data.userEmail,
        createdAt: data.createdAt.toDate().toISOString(),
        deliveryDate: data.deliveryDate.toDate().toISOString(),
        totalAmount: artistProducts.reduce((sum: number, product: Product) => sum + product.price * product.quantity, 0),
        shippingAddress: data.shippingAddress,
        products: artistProducts,
        artistStatuses: data.status || 'En traitement',
        paymentId: data.paymentId,
      });
    }
  });

  return <ArtistOrders orders={artistOrders} artistId={session.user.uid} />;
}
