import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getToken } from 'next-auth/jwt';
import { firestoreAdmin } from '@/app/firebaseAdmin';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
});

// Fonction pour générer un identificationNumber aléatoire
function generateIdentificationNumber(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  return Array.from({ length: 8 }, () => 
    chars.charAt(Math.floor(Math.random() * chars.length))
  ).join('');
}

export async function POST(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const { cartItems, promoCodeId } = await req.json();
    const lineItems = [];

    // Rechercher ou créer le customer Stripe
    let customer;
    const email = token.email as string;
    
    // Rechercher si le customer existe déjà
    const existingCustomers = await stripe.customers.list({
      email: email,
      limit: 1,
    });

    if (existingCustomers.data.length > 0) {
      customer = existingCustomers.data[0];
    } else {
      // Créer un nouveau customer si nécessaire
      customer = await stripe.customers.create({
        email: email,
      });
    }

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
      console.log("Size info:", sizeInfo);
      console.log("Next serial number:", sizeInfo.nextSerialNumber);

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

      // Modifier la génération des identificationNumbers
      const identificationNumbersMap = Array.from(
        { length: item.quantity },
        (_, index) => ({
          serialNumber: (sizeInfo.nextSerialNumber + index).toString().padStart(2, '0'),
          identificationNumber: generateIdentificationNumber(),
          size: sizeInfo.size
        })
      );

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
              serialNumber: sizeInfo.nextSerialNumber,
              identificationNumbers: JSON.stringify(identificationNumbersMap),
            },
          },
          unit_amount: sizeInfo.price * 100,
        },
        quantity: item.quantity,
      });
    }
    const stripeSession = await stripe.checkout.sessions.create({
      customer: customer.id,
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/checkout/success`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/checkout/cancel`,
      automatic_tax: { enabled: true },
      billing_address_collection: 'required',
      shipping_address_collection: {
        allowed_countries: ['FR', 'AE'],
      },
      customer_update: {
        shipping: 'auto',
        address: 'auto',
        name: 'auto',
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
      phone_number_collection: {
        enabled: true,
      },
      metadata: {
        userId: token.uid as string,
      },
      discounts: promoCodeId ? [
        {
          promotion_code: promoCodeId,
        },
      ] : undefined,
    });
    return NextResponse.json(
      { url: stripeSession.url },
      { status: 200 }
    );
  } catch (err: any) {
    console.error('Erreur Stripe:', err);
    return NextResponse.json(
      { message: err.message },
      { status: err.statusCode || 500 }
    );
  }
}
