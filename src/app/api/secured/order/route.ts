import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route'; // Chemin mis à jour
import { firestoreAdmin, FieldValue } from '@/app/firebaseAdmin'; // Firebase Admin pour interagir avec la base de données
import Stripe from 'stripe';
import { Resend } from 'resend';
import { OrderSummaryEmailTemplate } from '@/app/components/email/OrderEmailTemplates';

const resend = new Resend(process.env.RESEND_API_KEY!);

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
});

export async function POST(req: NextRequest) {
  // Vous pouvez appeler getServerSession sans req et res dans le App Router
  const session = await getServerSession(authOptions);


  try {
    const { stripeSessionId } = await req.json();
    console.log('stripeSessionId:', stripeSessionId);

    // Récupérer les informations de la session Stripe
    const stripeSession = await stripe.checkout.sessions.retrieve(
      stripeSessionId,
      {
        expand: ['line_items', 'line_items.data.price.product'],
      }
    );

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const user = session.user;
    const lineItems = stripeSession.line_items?.data || [];

    const products = lineItems.map((item: any) => ({
      productId: item.price?.product?.metadata?.id || 'unknown',
      price: ((item.price?.unit_amount ?? 0) * (item.quantity ?? 0)) / 100,
      quantity: item.quantity ?? 0,
      imageUrl: item.price?.product?.metadata?.imageUrl || '',
      artisteName: item.price?.product?.metadata?.artisteName || 'unknown',
      name: item.price?.product?.name || 'unknown',
      format: item.price?.product?.metadata?.format || 'unknown',
    }));

    // Calcul de la date de livraison (15 jours après la commande)
    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + 15);

    // Stocker la commande dans Firestore
    const orderRef = firestoreAdmin.collection('orders').doc();
    await orderRef.set({
      userId: user.uid,
      userEmail: user.email,
      createdAt: FieldValue.serverTimestamp(),
      deliveryDate: deliveryDate, // Date de livraison calculée
      totalAmount: (stripeSession.amount_total ?? 0) / 100, // Total après taxes
      shippingAddress: stripeSession.customer_details?.address || {},
      products,
    });

    // Mettre à jour le stock des produits
    for (const product of products) {
      const productRef = firestoreAdmin
        .collection('uploads')
        .doc(product.productId);
      await productRef.update({
        stock: FieldValue.increment(-product.quantity),
      });
    }

    // Préparer les données pour l'email
    const totalAmount = (stripeSession.amount_total ?? 0) / 100; // Calculez le montant total après les taxes
    const userEmail = user.email; // L'email de l'utilisateur

    if (!userEmail) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const emailData = {
      email: userEmail,
      orderId: orderRef.id,
      deliveryDate: deliveryDate.toLocaleDateString('fr-FR'),
      products, // Tableau des produits achetés
      totalAmount, // Montant total
    };

    // Envoyer l'email avec le récapitulatif de la commande
    const { data, error } = await resend.emails.send({
      from: 'support@bisourivage.fr',
      to: [userEmail],
      subject: 'Votre récapitulatif de commande',
      react: OrderSummaryEmailTemplate({ ...emailData }),
    });

    if (error) {
      console.error('Error sending email:', error);
      return NextResponse.json(
        { message: 'Failed to send email.' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: 'Order stored successfully', orderId: orderRef.id },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error processing order:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
