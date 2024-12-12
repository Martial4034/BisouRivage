import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2024-06-20',
});

export async function POST(req: Request) {
  try {
    const { code } = await req.json();

    // Rechercher le code promo dans Stripe
    const promotionCodes = await stripe.promotionCodes.list({
      code: code,
      active: true,
    });

    if (promotionCodes.data.length > 0) {
      const promoCode = promotionCodes.data[0];
      const coupon = await stripe.coupons.retrieve(promoCode.coupon.id);
      
      return NextResponse.json({
        valid: true,
        discount: coupon.percent_off || 0,
        id: promoCode.id
      });
    }

    return NextResponse.json({ valid: false });
  } catch (error) {
    console.error('Erreur lors de la vérification du code promo:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la vérification du code promo' },
      { status: 500 }
    );
  }
} 