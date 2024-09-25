import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import { Order } from '@/app/types';
import { firestoreAdmin } from '@/app/firebaseAdmin';
import OrderSummary from '@/app/components/order/OrderSummary';

export default async function SuccessPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    // Rediriger vers la page de connexion ou afficher un message
    return <p>Veuillez vous connecter pour voir votre commande.</p>;
  }

  // Récupérer la dernière commande de l'utilisateur
  const ordersRef = firestoreAdmin.collection('orders');
  const snapshot = await ordersRef
    .where('userId', '==', session.user.uid)
    .orderBy('createdAt', 'desc')
    .limit(1)
    .get();

  if (snapshot.empty) {
    return <p>Aucune commande trouvée.</p>;
  }

  const orderDoc = snapshot.docs[0];
  const data = orderDoc.data();

  // Convertir les types non sérialisables
  const orderData: Order = {
    id: orderDoc.id,
    deliveryDate: data.deliveryDate.toDate().toISOString(), // Convertir Timestamp en chaîne
    products: data.products,
    totalAmount: data.totalAmount,
    shippingAddress: data.shippingAddress,
    artistStatuses: data.artistStatuses,
    createdAt: data.createdAt.toDate().toISOString(), // Convertir Timestamp en chaîne
    stripeSessionId: data.stripeSessionId,
    paymentId: data.paymentId,
    userId: data.userId,
    userEmail: data.userEmail,
  };

  if (typeof window !== 'undefined') {
    localStorage.setItem('cart', '');
  }

  return <OrderSummary order={orderData} />;
}