import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { firestoreAdmin } from '@/app/firebaseAdmin'; // Firebase admin

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
});

export async function POST(req: Request) {
  try {
    const { cartItems } = await req.json(); // Récupérer les données envoyées depuis le client

    // Préparer les articles pour Stripe Checkout
    const lineItems = [];

    for (const item of cartItems) {
      // Récupérer les détails du produit à partir de Firebase
      const productRef = firestoreAdmin.collection('uploads').doc(item.id);
      const productDoc = await productRef.get();

      if (!productDoc.exists) {
        return NextResponse.json({ message: `Le produit ${item.id} n'existe plus.` }, { status: 400 });
      }

      const productData = productDoc.data();
      const sizeInfo = productData?.sizes.find((size: any) => size.size === item.format);

      // Vérifier le stock
      if (sizeInfo.stock < item.quantity) {
        return NextResponse.json({
          message: `Stock insuffisant pour le produit ${item.name} (${item.format}). Disponible : ${sizeInfo.stock}.`,
        }, { status: 400 });
      }

      // Vérifier le prix
      if (sizeInfo.price !== item.price) {
        return NextResponse.json({
          message: `Le prix du produit ${item.name} (${item.format}) a changé.`,
        }, { status: 400 });
      }

      // Ajouter l'article à la session Stripe
      lineItems.push({
        price_data: {
          currency: 'eur',
          product_data: {
            name: item.name,
            images: [item.image],
          },
          unit_amount: sizeInfo.price * 100, // Prix en centimes
        },
        quantity: item.quantity,
      });
    }

    // Créer la session Stripe
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${req.headers.get('origin')}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get('origin')}/checkout/cancelled`,
      automatic_tax: { enabled: true },
    });

    // Renvoie l'URL de Stripe Checkout
    return NextResponse.json({ url: session.url }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: err.statusCode || 500 });
  }
}
