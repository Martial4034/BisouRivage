// app/orders/[orderId]/page.tsx

import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import { firestoreAdmin } from '@/app/firebaseAdmin';
import { redirect } from 'next/navigation';
import { Order, OrderFirestoreData, Product } from '@/app/types';
import OrderDetails from '@/app/components/order/OrderDetails';

export default async function OrderDetailsPage({ params }: { params: { orderId: string } }) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'artiste') {
    redirect('/auth/signin');
  }

  const { orderId } = params;

  // Récupérer la commande
  const orderRef = firestoreAdmin.collection('orders').doc(orderId);
  const orderDoc = await orderRef.get();

  if (!orderDoc.exists) {
    return <p>Commande non trouvée.</p>;
  }

  const data = orderDoc.data() as OrderFirestoreData;

  // Filtrer les produits appartenant à l'artiste
  const artistProducts = data.products.filter(
    (product: Product) => product.artisteId === session.user.uid
  );

  if (artistProducts.length === 0) {
    return <p>Aucun produit de cette commande ne vous appartient.</p>;
  }

  const order: Order = {
    id: orderDoc.id,
    stripeSessionId: data.stripeSessionId,
    userId: data.userId,
    userEmail: data.userEmail,
    createdAt: data.createdAt.toDate().toISOString(),
    deliveryDate: data.deliveryDate.toDate().toISOString(),
    totalAmount: artistProducts.reduce((sum: number, product: Product) => sum + product.price * product.quantity, 0),
    shippingAddress: data.shippingAddress,
    products: artistProducts,
    artistStatuses: data.artistStatuses,
    paymentId: data.paymentId,
  };

  return <OrderDetails order={order} />;
}
