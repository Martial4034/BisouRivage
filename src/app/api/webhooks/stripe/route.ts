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
      // Récupérer les détails de la session
      const stripeSession = await stripe.checkout.sessions.retrieve(
        session.id,
        {
          expand: ["line_items", "line_items.data.price.product"],
        }
      );

      const lineItems = stripeSession.line_items?.data || [];

      // Extraire les informations des produits
      const products = lineItems.map((item: any) => {
        const productMetadata = item.price?.product?.metadata || {};
        const identificationNumbersMap = JSON.parse(productMetadata.identificationNumbers || '[]');
        
        return {
          productId: productMetadata.id || "unknown",
          price: ((item.price?.unit_amount ?? 0) * (item.quantity ?? 0)) / 100,
          quantity: item.quantity ?? 0,
          imageUrl: productMetadata.imageUrl || "",
          artisteEmail: productMetadata.artisteEmail || "unknown",
          artisteName: productMetadata.artisteName || "Artiste Anonyme",
          artisteId: productMetadata.artisteId || "Id non connu",
          name: item.price?.product?.name || "unknown",
          format: productMetadata.format || "unknown",
          serialNumber: productMetadata.serialNumber || "0",
          identificationNumbersMap: identificationNumbersMap,
        };
      });

      // Calcul de la date de livraison (par exemple, 15 jours après la commande)
      const deliveryDate = new Date();
      deliveryDate.setDate(deliveryDate.getDate() + 15);

      // Obtenir la liste des artistes impliqués dans la commande
      const artistIds = Array.from(new Set(products.map((p) => p.artisteId)));

      // Initialiser les statuts des artistes à "Pas Commencé"
      const artistStatuses: { [key: string]: string } = {};
      artistIds.forEach((id) => {
        artistStatuses[id] = 'Pas Commencé';
      });

      // Préparer les données de la commande
      const orderData = {
        stripeSessionId: session.id,
        userId: session.metadata?.userId || "anonymous",
        userEmail: session.customer_details?.email || "",
        createdAt: FieldValue.serverTimestamp(),
        deliveryDate: deliveryDate,
        totalAmount: (session.amount_total ?? 0) / 100,
        shippingAddress: session.customer_details?.address || {},
        paymentId: session.payment_intent || "Transaction inconnue",
        products,
        artistStatuses,
      };

      // Enregistrer la commande dans Firestore
      const orderId = session.id.slice(-10);
      const orderRef = firestoreAdmin.collection("orders").doc(orderId);
      await orderRef.set(orderData);

      // Mettre à jour le stock des produits
      for (const product of products) {
        const productRef = firestoreAdmin.collection("uploads").doc(product.productId);

        const serialNumbers = await firestoreAdmin.runTransaction(async (transaction) => {
          const productDoc = await transaction.get(productRef);
          if (!productDoc.exists) {
            throw new Error(`Product ${product.productId} does not exist.`);
          }

          const productData = productDoc.data();
          const sizes = productData?.sizes || [];
          const formatIndex = sizes.findIndex(
            (size: { size: string }) => size.size === product.format
          );

          if (formatIndex === -1) {
            throw new Error(
              `Format ${product.format} for product ID ${product.productId} does not exist.`
            );
          }

          const currentStock = sizes[formatIndex].stock;
          const currentSerialNumber = sizes[formatIndex].nextSerialNumber || 1;

          // Générer les numéros de série pour cette commande
          const generatedSerialNumbers = Array.from({ length: product.quantity }, (_, i) => 
            (currentSerialNumber + i).toString().padStart(2, '0')
          );

          // Mise à jour du stock et du prochain numéro de série
          sizes[formatIndex].stock = currentStock - product.quantity;
          sizes[formatIndex].nextSerialNumber = currentSerialNumber + product.quantity;



          // Mettre à jour le document avec les sizes et serialNumbers
          transaction.update(productRef, { 
            sizes,
            
          });

          return generatedSerialNumbers;
        });

        // Ajouter les numéros de série au produit dans la commande
        product.serialNumber = serialNumbers.join(', ');
      }

      // Préparer les données de l'email
      const emailData = {
        userEmail: orderData.userEmail,
        deliveryDate: orderData.deliveryDate.toLocaleDateString("fr-FR"),
        products: orderData.products,
        totalAmount: orderData.totalAmount,
      };

      console.log("Email data:", emailData);

      // Envoyer l'email de confirmation
      try {
        await resend.emails.send({
          from: "support@bisourivage.fr",
          to: [orderData.userEmail],
          subject: "Votre récapitulatif de commande",
          react: OrderSummaryEmailTemplate({ ...emailData }),
        });
      } catch (emailError) {
        console.error("Error sending confirmation email:", emailError);
      }
    } catch (error) {
      console.error("Error handling checkout session:", error);
      return NextResponse.json(
        { error: "Error during checkout session." },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ received: true });
}
