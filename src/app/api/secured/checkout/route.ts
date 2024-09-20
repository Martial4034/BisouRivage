import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getToken } from 'next-auth/jwt';
import { firestoreAdmin } from '@/app/firebaseAdmin';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
});

export async function POST(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  console.log('Token:', token);


  if (!token) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const { cartItems } = await req.json();

    const lineItems = [];

    for (const item of cartItems) {
      const productRef = firestoreAdmin.collection('uploads').doc(item.id);
      const productDoc = await productRef.get();

      if (!productDoc.exists) {
        return NextResponse.json(
          { message: `Le produit ${item.id} n'existe plus.` },
          { status: 400 }
        );
      }

      const productData = productDoc.data();
      const sizeInfo = productData?.sizes.find(
        (size: any) => size.size === item.format
      );

      if (sizeInfo.stock < item.quantity) {
        return NextResponse.json(
          {
            message: `Stock insuffisant pour le produit ${item.name} (${item.format}). Disponible : ${sizeInfo.stock}.`,
          },
          { status: 400 }
        );
      }

      if (sizeInfo.price !== item.price) {
        return NextResponse.json(
          {
            message: `Le prix du produit ${item.name} (${item.format}) a changé.`,
          },
          { status: 400 }
        );
      }

      const item_name_format = item.name + ' (' + item.format + ')';

      lineItems.push({
        price_data: {
          currency: 'eur',
          product_data: {
            name: item_name_format,
            images: [item.image],
            metadata: {
              id: item.id,
              formatId: item.formatId,
              imageUrl: item.image,
              artisteName: item.artisteName,
              format: item.format,
            },
          },
          unit_amount: sizeInfo.price * 100,
        },
        quantity: item.quantity,
      });
    }
    

    // Utiliser 'token.email' et 'token.sub' (qui correspond à l'UID de l'utilisateur)
    const stripeSession = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${req.headers.get('origin')}/checkout/success`,
      cancel_url: `${req.headers.get('origin')}/checkout/cancel`,
      automatic_tax: { enabled: true },
      billing_address_collection: 'required',
      shipping_address_collection: {
        allowed_countries: ['FR'],
      },
      customer_email: token.email as string,
      metadata: {
        userId: token.uid as string,
      },
    });

    console.log('stripeSession', stripeSession);

    return NextResponse.json(
      { url: stripeSession.url },
      { status: 200 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { message: err.message },
      { status: err.statusCode || 500 }
    );
  }
}
