import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import { firestoreAdmin } from '@/app/firebaseAdmin';
import UserOrders from '@/app/components/order/UserOrders';
import { redirect } from 'next/navigation';
import { Order } from '@/app/types';

export default async function OrdersPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/auth/signin');
  }

  // Récupérer les commandes de l'utilisateur
  const ordersRef = firestoreAdmin.collection('orders');
  const snapshot = await ordersRef
    .where('userId', '==', session.user.uid)
    .orderBy('createdAt', 'desc')
    .get();

  const orders: Order[] = snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      userId: data.userId,
      deliveryDate: data.deliveryDate.toDate().toISOString(),
      products: data.products,
      totalAmount: data.totalAmount,
      status: data.status || 'En traitement',
      createdAt: data.createdAt.toDate().toISOString(),
      stripeSessionId: data.stripeSessionId,
      userEmail: data.userEmail,
      shippingAddress: data.shippingAddress,
      artistStatuses: data.artistStatuses || {},
      paymentId: data.paymentId,
    };
  });

  return <UserOrders orders={orders} />;
}
