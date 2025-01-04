import { NextResponse } from 'next/server';
import { firestoreAdmin } from '@/app/firebaseAdmin';

// Types de base
interface ProductSize {
  size: string;
  equivalentFrameSize: string;
  stock: number;
  price: number;
}

interface FrameOption {
  color: string;
  available: boolean;
  price: number;
  name: string;
}

interface ProductData {
  id: string;
  name: string;
  sizes: ProductSize[];
  images: Array<{ link: string }>;
  artisteName: string;
  artisteId: string;
}

interface CartItem {
  id: string;
  size: string;
  frameOption: "avec" | "sans";
  frameColor?: string;
  quantity: number;
}

interface VerificationUpdate {
  id: string;
  size: string;
  frameColor?: string;
  status: 'removed' | 'quantity_adjusted' | 'price_changed' | 'frame_unavailable';
  message: string;
  newQuantity?: number;
  newPrice?: number;
}

interface PromotionInfo {
  type: "3+1" | "4ème offert" | "free_item";
  offeredItems: {
    id: string;
    size: string;
    frameOption: "avec" | "sans";
    frameColor?: string;
    price: number;
    name: string;
  }[];
  savings: number;
  message?: string;
  appliedTo?: {
    id: string;
    size: string;
    frameColor?: string;
    price: number;
    quantity: number;
  };
}

interface ValidItem extends CartItem {
  productData: ProductData;
  priceInfo: {
    basePrice: number;
    framePrice: number;
  };
}

interface FormatData {
  frameOptions: FrameOption[];
}

interface VerificationResponse {
  updates: VerificationUpdate[];
  validItems: CartItem[];
  promotion: PromotionInfo | null;
  hasChanges: boolean;
}

// Fonction pour calculer le nombre total d'articles
const calculateTotalItems = (items: CartItem[]): number => {
  return items.reduce((total, item) => total + item.quantity, 0);
};

// Fonction pour trouver l'article le moins cher
const findCheapestItem = async (items: CartItem[]): Promise<{
  id: string;
  size: string;
  frameColor?: string;
  price: number;
  quantity: number;
  index: number;
}> => {
  let cheapestItem = null;
  let lowestPrice = Infinity;
  let itemIndex = -1;

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const priceResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/product/price`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productId: item.id,
        size: item.size,
        frameOption: item.frameOption,
        frameColor: item.frameColor,
        quantity: 1 // On vérifie le prix unitaire
      })
    });

    const priceData = await priceResponse.json();
    const unitPrice = priceData.data.unitPrice;

    if (unitPrice < lowestPrice) {
      lowestPrice = unitPrice;
      cheapestItem = {
        id: item.id,
        size: item.size,
        frameColor: item.frameColor,
        price: unitPrice,
        quantity: item.quantity,
        index: i
      };
    }
  }

  return cheapestItem!;
};

export async function POST(request: Request) {
  try {
    const { cartItems } = await request.json();
    const updates: VerificationUpdate[] = [];
    let validItems: CartItem[] = [];
    let promotion = null;

    // Vérifier chaque article
    for (const item of cartItems) {
      console.log(`\n🔍 Vérification de l'article ${item.id} (${item.size})`);
      
      const productRef = firestoreAdmin.collection('uploads').doc(item.id);
      const productDoc = await productRef.get();

      if (!productDoc.exists) {
        console.log(`❌ Produit ${item.id} non trouvé dans la base de données`);
        updates.push({
          id: item.id,
          size: item.size,
          status: 'removed',
          message: `Le produit n'est plus disponible.`,
        });
        continue;
      }

      const productData = productDoc.data() as ProductData;
      console.log(`✅ Produit trouvé:`, {
        id: item.id,
        name: productData.name,
        artisteName: productData.artisteName,
        sizes: productData.sizes.map(s => ({
          size: s.size,
          stock: s.stock,
          equivalentFrameSize: s.equivalentFrameSize
        }))
      });

      const sizeInfo = productData.sizes.find((s) => s.size === item.size);
      if (!sizeInfo) {
        console.log(`❌ Format ${item.size} non trouvé pour ${productData.name}`);
        updates.push({
          id: item.id,
          size: item.size,
          status: 'removed',
          message: `Le format ${item.size} n'est plus disponible.`,
        });
        continue;
      }

      // Vérifier le stock
      if (sizeInfo.stock <= 0) {
        console.log(`❌ Stock épuisé pour ${productData.name} (${item.size})`);
        updates.push({
          id: item.id,
          size: item.size,
          status: 'removed',
          message: `Le produit est en rupture de stock.`,
        });
        continue;
      }

      if (sizeInfo.stock < item.quantity) {
        console.log(`⚠️ Stock insuffisant pour ${productData.name} (${item.size}): ${sizeInfo.stock} disponible(s)`);
        updates.push({
          id: item.id,
          size: item.size,
          status: 'quantity_adjusted',
          message: `La quantité a été ajustée à ${sizeInfo.stock} (stock disponible).`,
          newQuantity: sizeInfo.stock,
        });
        item.quantity = sizeInfo.stock;
      }

      let framePrice = 0;
      if (item.frameOption === "avec" && item.frameColor) {
        console.log(`🖼️ Vérification du cadre pour ${item.size} (${item.frameColor})`);
        const formatRef = firestoreAdmin.collection('formats').doc(sizeInfo.equivalentFrameSize.replace('cm', ''));
        const formatDoc = await formatRef.get();
        
        if (!formatDoc.exists) {
          console.log(`❌ Format de cadre ${sizeInfo.equivalentFrameSize} non trouvé`);
          updates.push({
            id: item.id,
            size: item.size,
            frameColor: item.frameColor,
            status: 'frame_unavailable',
            message: `Le cadre n'est plus disponible pour ce format.`,
          });
          continue;
        }

        const formatData = formatDoc.data() as FormatData;
        console.log(`✅ Options de cadre trouvées:`, formatData.frameOptions);
        
        const frameOption = formatData.frameOptions.find(f => f.color === item.frameColor);
        
        if (!frameOption || !frameOption.available) {
          console.log(`❌ Couleur de cadre ${item.frameColor} non disponible`);
          updates.push({
            id: item.id,
            size: item.size,
            frameColor: item.frameColor,
            status: 'frame_unavailable',
            message: `Cette couleur de cadre n'est plus disponible.`,
          });
          continue;
        }

        framePrice = frameOption.price;
        console.log(`💰 Prix du cadre: ${framePrice}`);
      }

      validItems.push({
        ...item,
        productData: {
          id: item.id,
          name: productData.name,
          sizes: productData.sizes,
          images: productData.images,
          artisteName: productData.artisteName,
          artisteId: productData.artisteId
        },
        priceInfo: {
          basePrice: sizeInfo.price,
          framePrice
        }
      });
    }

    // Appliquer la promotion si le total d'articles est >= 4
    const totalItems = calculateTotalItems(validItems);
    console.log("📊 Nombre total d'articles:", totalItems);

    if (totalItems >= 4) {
      const cheapestItem = await findCheapestItem(validItems);
      console.log("🏷️ Article le moins cher trouvé:", cheapestItem);

      promotion = {
        type: "free_item",
        appliedTo: cheapestItem,
        message: "Le produit le moins cher est offert !"
      };

      // Si l'article le moins cher a une quantité > 1, on ajuste son prix
      if (cheapestItem.quantity > 1) {
        const discountPerUnit = cheapestItem.price / cheapestItem.quantity;
        updates.push({
          id: cheapestItem.id,
          size: cheapestItem.size,
          frameColor: cheapestItem.frameColor,
          status: "price_changed",
          message: "Un article offert dans le lot",
          newPrice: cheapestItem.price - discountPerUnit
        });
      }
    }

    return NextResponse.json({
      updates,
      validItems,
      promotion,
      hasChanges: updates.length > 0
    });

  } catch (error) {
    console.error("❌ Erreur lors de la vérification:", error);
    return NextResponse.json({ error: "Erreur lors de la vérification du panier" }, { status: 500 });
  }
}