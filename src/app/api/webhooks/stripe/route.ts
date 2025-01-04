import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { headers } from "next/headers";
import { firestoreAdmin, FieldValue } from "@/app/firebaseAdmin";
import { Resend } from "resend";
import { OrderSummaryEmailTemplate } from "@/app/components/email/OrderEmailTemplates";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
});

const resend = new Resend(process.env.RESEND_API_KEY!);

export async function POST(req: NextRequest) {
  const buf = await req.text();
  const sig = headers().get("stripe-signature") || "";

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      buf,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error("⚠️  Webhook signature verification failed.", err.message);
    return NextResponse.json({ error: "Webhook Error" }, { status: 400 });
  }

  // Handle the event
  switch (event.type) {
    case "checkout.session.completed":
      const session = event.data.object as Stripe.Checkout.Session;

      if (!session.metadata || !session.metadata.userId) {
        console.error("Session metadata is missing userId.");
        return NextResponse.json(
          { error: "Session metadata is missing userId." },
          { status: 400 }
        );
      }

      await handleCheckoutSession(session);
      break;
    default:
      return NextResponse.json({ received: true });
  }

  async function handleCheckoutSession(session: Stripe.Checkout.Session) {
    try {
      console.log("🔄 Traitement de la session de paiement:", session.id);

      // Récupérer les détails de la session
      const stripeSession = await stripe.checkout.sessions.retrieve(session.id, {
        expand: ["line_items", "line_items.data.price.product"],
      });

      console.log("📦 Récupération des line items...");
      const lineItems = stripeSession.line_items?.data || [];

      // Extraire les informations des produits
      const products = lineItems.map((item: any) => {
        const productMetadata = item.price?.product?.metadata || {};
        let identificationNumbers = [];
        
        try {
          identificationNumbers = JSON.parse(productMetadata.identificationNumbers || '[]');
          console.log(`✅ Numéros d'identification parsés pour ${productMetadata.id}:`, identificationNumbers);
        } catch (error) {
          console.error(`❌ Erreur parsing identificationNumbers pour ${productMetadata.id}:`, error);
          identificationNumbers = [];
        }

        return {
          productId: productMetadata.id || "unknown",
          price: ((item.price?.unit_amount ?? 0) * (item.quantity ?? 0)) / 100,
          quantity: item.quantity ?? 0,
          imageUrl: productMetadata.imageUrl || "",
          artisteEmail: productMetadata.artisteEmail || "unknown",
          artisteName: productMetadata.artisteName || "Artiste Anonyme",
          artisteId: productMetadata.artisteId || "unknown",
          name: item.price?.product?.name || "unknown",
          size: productMetadata.size || "unknown",
          frameOption: productMetadata.frameOption || "sans",
          frameColor: productMetadata.frameColor,
          identificationNumbers: identificationNumbers
        };
      });

      console.log("📅 Calcul de la date de livraison...");
      const deliveryDate = new Date();
      deliveryDate.setDate(deliveryDate.getDate() + 15);

      // Obtenir la liste des artistes impliqués
      const artistIds = Array.from(new Set(products.map((p) => p.artisteId)));
      const artistStatuses = Object.fromEntries(
        artistIds.map(id => [id, 'Pas Commencé'])
      );

      // Calculer les montants
      const subtotal = lineItems.reduce((sum, item) => 
        sum + ((item.price?.unit_amount ?? 0) * (item.quantity ?? 0)), 0) / 100;
      const shippingCost = 12.50; // Frais de livraison fixes
      const discount = session.total_details?.amount_discount ? session.total_details.amount_discount / 100 : 0;

      console.log("💰 Détails des montants:", {
        subtotal,
        shippingCost,
        discount,
        total: (session.amount_total ?? 0) / 100
      });

      // Préparer les données de la commande
      const orderData = {
        stripeSessionId: session.id,
        userId: session.metadata?.userId || "anonymous",
        userEmail: session.customer_details?.email || "",
        createdAt: FieldValue.serverTimestamp(),
        deliveryDate: deliveryDate,
        subtotal,
        shippingCost,
        discount,
        totalAmount: (session.amount_total ?? 0) / 100,
        shippingAddress: session.customer_details?.address || {},
        paymentId: session.payment_intent || "unknown",
        products,
        artistStatuses,
        promoCode: session.metadata?.promoCode || null
      };

      // Enregistrer la commande dans Firestore
      console.log("💾 Enregistrement de la commande...");
      const orderId = session.id.slice(-10);
      const orderRef = firestoreAdmin.collection("orders").doc(orderId);
      await orderRef.set(orderData);

      // Mettre à jour le stock et les numéros de série
      console.log("🔄 Mise à jour des stocks...");
      for (const product of products) {
        const productRef = firestoreAdmin.collection("uploads").doc(product.productId);
        
        await firestoreAdmin.runTransaction(async (transaction) => {
          const productDoc = await transaction.get(productRef);
          if (!productDoc.exists) {
            throw new Error(`Product ${product.productId} does not exist.`);
          }

          const productData = productDoc.data();
          if (!productData) {
            throw new Error(`Invalid data for product ${product.productId}`);
          }

          const sizes = productData.sizes || [];
          const sizeIndex = sizes.findIndex(
            (s: any) => s.size === product.size
          );

          if (sizeIndex === -1) {
            throw new Error(`Size ${product.size} not found for product ${product.productId}`);
          }

          // Mise à jour du stock
          const currentStock = sizes[sizeIndex].stock;
          if (currentStock < product.quantity) {
            throw new Error(`Insufficient stock for product ${product.productId}`);
          }

          sizes[sizeIndex].stock = currentStock - product.quantity;

          // Ajouter les numéros d'identification au produit
          const identificationNumbersWithDetails = product.identificationNumbers.map((idNum: any) => ({
            ...idNum,
            size: product.size,
            frameOption: product.frameOption,
            frameColor: product.frameColor,
            productId: product.productId,
            orderId: orderId
          }));

          // Mettre à jour le document
          transaction.update(productRef, {
            sizes,
            identificationNumbers: FieldValue.arrayUnion(...identificationNumbersWithDetails)
          });

          console.log(`✅ Stock mis à jour pour ${product.productId}:`, {
            size: product.size,
            newStock: sizes[sizeIndex].stock,
            identificationNumbersAdded: identificationNumbersWithDetails.length
          });
        });
      }

      // Préparer et envoyer l'email de confirmation
      console.log("📧 Préparation de l'email...");
      const emailData = {
        userEmail: orderData.userEmail,
        deliveryDate: orderData.deliveryDate.toLocaleDateString("fr-FR"),
        products: orderData.products,
        totalAmount: orderData.totalAmount,
        subtotal: orderData.subtotal,
        discount: orderData.discount,
        shippingCost: orderData.shippingCost
      };

      console.log("📨 Envoi de l'email de confirmation...");
      try {
        await resend.emails.send({
          from: "Bisourivage <support@bisourivage.fr>",
          to: [orderData.userEmail],
          subject: "Votre commande Bisourivage - Confirmation",
          react: OrderSummaryEmailTemplate({ ...emailData }),
        });
        console.log("✅ Email envoyé avec succès");
      } catch (emailError) {
        console.error("❌ Erreur lors de l'envoi de l'email:", emailError);
      }

    } catch (error) {
      console.error("❌ Erreur lors du traitement de la session:", error);
      throw error;
    }
  }

  return NextResponse.json({ received: true });
}
