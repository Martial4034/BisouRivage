import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getToken } from 'next-auth/jwt';
import { firestoreAdmin } from '@/app/firebaseAdmin';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
});

export async function POST(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
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
      const sizeInfoIndex = productData?.sizes.findIndex(
        (size: any) => size.size === item.format
      );
      const sizeInfo = productData?.sizes[sizeInfoIndex];

      if (!sizeInfo || sizeInfo.stock < item.quantity) {
        return NextResponse.json(
          {
            message: `Stock insuffisant pour le produit ${item.name} (${item.format}). Disponible : ${sizeInfo?.stock || 0}.`,
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
              imageUrl: item.image,
              artisteName: item.artisteName,
              artisteEmail: item.artisteEmail,
              artisteId: item.artisteId,
              format: item.format,
            },
          },
          unit_amount: sizeInfo.price * 100,
        },
        quantity: item.quantity,
      });
    }
    const stripeSession = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/checkout/success`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/checkout/cancel`,
      automatic_tax: { enabled: true },
      billing_address_collection: 'required',
      shipping_address_collection: {
        allowed_countries: ['FR'],
      },
      shipping_options: [
        {
          shipping_rate_data: {
            type: 'fixed_amount',
            fixed_amount: {
              amount: 1250,
              currency: 'eur',
            },
            display_name: 'Frais de livraison',
            delivery_estimate: {
              minimum: {
                unit: 'business_day',
                value: 7,
              },
              maximum: {
                unit: 'business_day',
                value: 20,
              },
            },
          },
        },
      ],
      customer_email: token.email as string,
      phone_number_collection: {
        enabled: true,
      },
      metadata: {
        userId: token.uid as string,
      },
    });
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
