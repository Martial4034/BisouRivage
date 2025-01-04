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
  try {
    console.log("\n🔄 DÉBUT DU PROCESSUS CHECKOUT");

    // 1. Vérification de l'authentification
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    console.log("👤 Authentification:", {
      userId: token?.sub,
      email: token?.email,
      authenticated: !!token
    });

    if (!token) {
      console.log("❌ Authentification échouée: Token manquant");
      return NextResponse.json(
        { error: 'Vous devez être connecté pour effectuer cette action.' },
        { status: 401 }
      );
    }

    // 2. Récupération des données
    const { cartItems, promoCodeId } = await req.json();
    console.log("🛒 Données du panier reçues:", {
      nombreArticles: cartItems.length,
      promoCodeId: promoCodeId || 'aucun',
      articles: cartItems.map((item: any) => ({
        id: item.id,
        size: item.size,
        frameOption: item.frameOption,
        quantity: item.quantity
      }))
    });

    // 3. Vérification du panier
    console.log("🔍 Vérification du panier...");
    const verificationResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/verification`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cartItems }),
    });

    const verificationData = await verificationResponse.json();
    console.log("✅ Résultat de la vérification:", {
      status: verificationResponse.status,
      hasChanges: verificationData.hasChanges,
      updates: verificationData.updates || [],
      promotion: verificationData.promotion || null
    });
    
    if (!verificationResponse.ok) {
      console.log("❌ Échec de la vérification:", verificationData.error);
      return NextResponse.json(
        { error: verificationData.error || 'Erreur lors de la vérification du panier' },
        { status: verificationResponse.status }
      );
    }

    if (verificationData.hasChanges) {
      console.log("⚠️ Modifications nécessaires:", verificationData.updates);
      return NextResponse.json(
        { 
          error: 'Le panier nécessite des mises à jour',
          updates: verificationData.updates 
        },
        { status: 400 }
      );
    }

    // 4. Vérification du code promo
    let promoCode = null;
    if (promoCodeId) {
      console.log("🎫 Vérification du code promo:", promoCodeId);
      const promoResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/secured/promo/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': req.headers.get('cookie') || '',
        },
        body: JSON.stringify({ code: promoCodeId }),
      });

      const promoData = await promoResponse.json();
      console.log("🏷️ Résultat code promo:", {
        status: promoResponse.status,
        valid: promoData.valid,
        discount: promoData.discount,
        message: promoData.message,
        code: promoCodeId
      });

      if (!promoResponse.ok) {
        console.log("❌ Code promo invalide:", promoData.error);
        return NextResponse.json(
          { error: promoData.error || 'Code promo invalide' },
          { status: promoResponse.status }
        );
      }

      if (promoData.valid) {
        promoCode = promoData;
        console.log("✅ Code promo validé:", {
          id: promoData.id,
          discount: promoData.discount,
          couponId: promoData.couponId
        });
      }
    }

    // 5. Gestion du customer Stripe
    const email = token.email as string;
    console.log("👥 Recherche du customer Stripe:", email);
    let customer;
    
    const existingCustomers = await stripe.customers.list({
      email: email,
      limit: 1,
    });

    if (existingCustomers.data.length > 0) {
      customer = existingCustomers.data[0];
      console.log("✅ Customer existant trouvé:", {
        customerId: customer.id,
        email: customer.email
      });
    } else {
      customer = await stripe.customers.create({
        email: email,
      });
      console.log("✅ Nouveau customer créé:", {
        customerId: customer.id,
        email: customer.email
      });
    }

    // 6. Création des line items
    console.log("📝 Création des line items...");
    const lineItems = await Promise.all(cartItems.map(async (item: any) => {
      console.log(`📦 Traitement de l'article ${item.id}...`);
      
      // Récupérer les données du produit depuis Firestore
      const productRef = firestoreAdmin.collection('uploads').doc(item.id);
      const productDoc = await productRef.get();

      if (!productDoc.exists) {
        throw new Error(`Le produit ${item.id} n'existe plus.`);
      }

      const productData = productDoc.data();
      if (!productData) {
        throw new Error(`Données invalides pour le produit ${item.id}`);
      }
      
      const sizeInfo = productData.sizes.find((s: any) => s.size === item.size);

      if (!sizeInfo) {
        throw new Error(`Format ${item.size} non trouvé pour le produit ${item.id}`);
      }

      console.log("📊 Informations du produit:", {
        id: item.id,
        size: item.size,
        nextSerialNumber: sizeInfo.nextSerialNumber,
        stock: sizeInfo.stock
      });

      // Vérifier le stock une dernière fois
      if (sizeInfo.stock < item.quantity) {
        throw new Error(`Stock insuffisant pour le produit ${productData.name} (${item.size}). Disponible : ${sizeInfo.stock}.`);
      }

      // Générer les numéros d'identification avec numéros de série
      const identificationNumbersMap = Array.from(
        { length: item.quantity },
        (_, index) => ({
          serialNumber: (sizeInfo.nextSerialNumber + index).toString().padStart(2, '0'),
          identificationNumber: generateIdentificationNumber(),
          size: item.size
        })
      );

      // Récupérer le prix à jour
      const priceResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/product/price`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: item.id,
          size: item.size,
          frameOption: item.frameOption,
          frameColor: item.frameColor,
          quantity: item.quantity
        }),
      });

      const { data: priceData } = await priceResponse.json();
      if (!priceResponse.ok) {
        throw new Error(`Erreur lors de la récupération du prix pour ${item.id}`);
      }

      return {
        price_data: {
          currency: 'eur',
          product_data: {
            name: `${priceData.productInfo.name} - ${item.size}${item.frameOption === "avec" ? ` avec cadre ${item.frameColor}` : ''}`,
            images: [priceData.productInfo.image],
            metadata: {
              id: item.id,
              imageUrl: priceData.productInfo.image,
              size: item.size,
              frameOption: item.frameOption,
              frameColor: item.frameColor || 'none',
              artisteName: priceData.productInfo.artisteName,
              artisteEmail: priceData.productInfo.artisteEmail,
              artisteId: priceData.productInfo.artisteId,
              nextSerialNumber: sizeInfo.nextSerialNumber,
              identificationNumbers: JSON.stringify(identificationNumbersMap),
            },
          },
          unit_amount: Math.round(priceData.unitPrice * 100),
        },
        quantity: item.quantity,
      };
    }));

    // Log détaillé des line items
    console.log("\n📦 Détails des line items créés:");
    lineItems.forEach((item, index) => {
      console.log(`\n🎨 Item ${index + 1}:`, {
        nom: item.price_data.product_data.name,
        quantité: item.quantity,
        prixUnitaire: `${item.price_data.unit_amount / 100}€`,
        total: `${(item.price_data.unit_amount * item.quantity) / 100}€`
      });
      
      console.log(`📋 Métadonnées de l'item ${index + 1}:`, {
        ...item.price_data.product_data.metadata,
        identificationNumbers: JSON.parse(item.price_data.product_data.metadata.identificationNumbers)
      });
    });

    console.log("\n💰 Total des articles:", {
      nombreArticles: lineItems.reduce((sum, item) => sum + item.quantity, 0),
      montantTotal: `${lineItems.reduce((sum, item) => sum + (item.price_data.unit_amount * item.quantity), 0) / 100}€`
    });

    // 7. Création de la session Stripe
    console.log("💳 Création de la session Stripe...");
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
        userId: token.sub as string,
        cartItemsCount: cartItems.length,
        promoCode: promoCodeId || '',
      },
      discounts: promoCodeId && promoCode ? [
        {
          promotion_code: promoCode.id,
        },
      ] : undefined,
    });

    console.log("✅ Session Stripe créée avec succès:", {
      sessionId: stripeSession.id,
      customerId: customer.id,
      totalItems: cartItems.length,
      promoApplied: !!promoCode,
      url: stripeSession.url
    });

    return NextResponse.json({ url: stripeSession.url });

  } catch (error: any) {
    console.error('❌ Erreur lors de la création de la session Stripe:', {
      error: error.message,
      code: error.statusCode,
      type: error.type
    });
    return NextResponse.json(
      { 
        error: error.message || 'Une erreur est survenue lors de la création de la session de paiement' 
      },
      { status: error.statusCode || 500 }
    );
  }
}
