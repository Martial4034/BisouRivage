import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import { firestoreAdmin } from '@/app/firebaseAdmin';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'artiste') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { orderId, productId, newStatus } = await req.json();

  if (!orderId || !productId || !newStatus) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  try {
    const orderRef = firestoreAdmin.collection('orders').doc(orderId);
    const orderDoc = await orderRef.get();

    if (!orderDoc.exists) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const orderData = orderDoc.data();
    const products = orderData?.products || [];

    // Trouver le produit dans la commande
    const productIndex = products.findIndex(
      (product: any) =>
        product.productId === productId && product.artisteId === session.user.uid
    );

    if (productIndex === -1) {
      return NextResponse.json({ error: 'Product not found in order or access denied' }, { status: 404 });
    }

    // Mettre à jour le statut du produit
    products[productIndex].status = newStatus;

    // Mettre à jour la commande avec le nouveau statut du produit
    await orderRef.update({ products });

    // Mettre à jour le statut global de la commande
    const artistStatuses = orderData?.artistStatuses || {};

    // Vérifier les statuts actuels de tous les produits de cet artiste
    const artistProducts = products.filter(
      (product: any) => product.artisteId === session.user.uid
    );

    const allArtistProductsCompleted = artistProducts.every(
      (product: any) => product.status === 'Terminé'
    );

    const allArtistProductsStarted = artistProducts.some(
      (product: any) => product.status === 'En Cours' || product.status === 'Pas Commencé'
    );

    if (allArtistProductsCompleted) {
      artistStatuses[session.user.uid] = 'Terminé';
    } else if (allArtistProductsStarted) {
      artistStatuses[session.user.uid] = 'En Cours';
    } else {
      artistStatuses[session.user.uid] = 'Pas Commencé';
    }

    // Mettre à jour `artistStatuses` dans la commande
    await orderRef.update({ artistStatuses });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating product status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}