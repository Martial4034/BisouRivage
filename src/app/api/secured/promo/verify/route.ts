import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getToken } from 'next-auth/jwt';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
});

interface PromoCodeResponse {
  valid: boolean;
  message: string;
  discount?: number;
  id?: string;
  couponId?: string;
}

export async function POST(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token) {
    return NextResponse.json(
      { error: 'Il semblerait que vous ne soyez pas connecté à votre compte.' },
      { status: 401 }
    );
  }

  try {
    const { code } = await req.json();
    const email = token.email as string;

    // Rechercher le customer
    const customers = await stripe.customers.list({
      email: email,
      limit: 1,
    });

    let customer;
    if (customers.data.length > 0) {
      customer = customers.data[0];
    } else {
      customer = await stripe.customers.create({
        email: email,
      });
    }

    // Rechercher le code promo
    const promotionCodes = await stripe.promotionCodes.list({
      code: code,
      active: true,
    });

    if (promotionCodes.data.length === 0) {
      return NextResponse.json({
        valid: false,
        message: "Ce code promo n'existe pas ou a expiré"
      });
    }

    const promoCode = promotionCodes.data[0];
    
    // Vérifier les restrictions du code promo
    if (promoCode.restrictions) {
      if (promoCode.restrictions.first_time_transaction && customer.created > promoCode.created) {
        return NextResponse.json({
          valid: false,
          message: "Ce code est réservé aux premiers achats"
        });
      }
    }

    // Vérifier si le code est lié à des customers spécifiques
    if (promoCode.customer) {
      if (promoCode.customer !== customer.id) {
        return NextResponse.json({
          valid: false,
          message: "Ce code promo n'est pas valide pour votre compte"
        });
      }
    }

    const coupon = await stripe.coupons.retrieve(promoCode.coupon.id);
    
    const response: PromoCodeResponse = {
      valid: true,
      discount: coupon.percent_off || (coupon.amount_off ? coupon.amount_off / 100 : 0),
      id: promoCode.id,
      couponId: promoCode.coupon.id,
      message: "Code promo appliqué avec succès"
    };

    return NextResponse.json(response);

  } catch (error: any) {
    console.error('Erreur lors de la vérification du code promo:', error);
    const errorResponse: PromoCodeResponse = {
      valid: false,
      message: error.message || "Une erreur est survenue lors de la vérification du code promo"
    };
    return NextResponse.json(errorResponse, { status: 500 });
  }
} 