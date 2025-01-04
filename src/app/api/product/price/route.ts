import { NextResponse } from 'next/server';
import { db } from '@/app/firebase';
import { doc, getDoc } from 'firebase/firestore';

interface PriceRequest {
  productId: string;
  size: string;
  frameOption: "avec" | "sans";
  frameColor?: string;
  quantity: number;
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as PriceRequest;
    const { productId, size, frameOption, frameColor, quantity = 1 } = body;

    // Vérifications de base
    if (quantity < 1) {
      return NextResponse.json({ 
        error: "La quantité doit être supérieure à 0" 
      }, { status: 400 });
    }

    // Récupérer les informations du produit
    const productDoc = await getDoc(doc(db, "uploads", productId));
    if (!productDoc.exists()) {
      return NextResponse.json({ 
        error: "Produit non trouvé" 
      }, { status: 404 });
    }
    const productData = productDoc.data();

    // Vérifier le stock et récupérer les données de taille
    const sizeData = productData.sizes.find((s: any) => s.size === size);
    if (!sizeData) {
      return NextResponse.json({ 
        error: `Format ${size} non trouvé pour le produit ${productId}` 
      }, { status: 404 });
    }

    // Vérification du stock
    if (quantity > sizeData.stock) {
      return NextResponse.json({ 
        error: `Stock insuffisant. Disponible: ${sizeData.stock}`,
        data: { 
          stock: sizeData.stock,
          productInfo: {
            name: productData.name,
            artisteName: productData.artisteName,
            artisteId: productData.artisteId,
            image: productData.images[0].link,
          }
        }
      }, { status: 400 });
    }

    let basePrice = 0;
    let framePrice = 0;
    let frameData = null;

    // Récupérer le format de cadre correspondant
    const formatDoc = await getDoc(doc(db, "formats", sizeData.equivalentFrameSize.replace('cm', '')));
    if (!formatDoc.exists()) {
      return NextResponse.json({ 
        error: `Format de cadre ${sizeData.equivalentFrameSize} non trouvé` 
      }, { status: 404 });
    }

    const formatData = formatDoc.data();

    // Trouver l'option sans cadre pour le prix de base
    const baseFrameOption = formatData.frameOptions.find((f: any) => f.color === "none");
    if (!baseFrameOption) {
      return NextResponse.json({ 
        error: "Prix de base non trouvé" 
      }, { status: 404 });
    }

    basePrice = baseFrameOption.price;

    // Si avec cadre, ajouter le prix du cadre
    if (frameOption === "avec" && frameColor && frameColor !== "none") {
      const selectedFrameOption = formatData.frameOptions.find((f: any) => f.color === frameColor);
      if (!selectedFrameOption) {
        return NextResponse.json({ 
          error: `Couleur de cadre ${frameColor} non trouvée` 
        }, { status: 404 });
      }

      frameData = selectedFrameOption;
      framePrice = selectedFrameOption.price - basePrice;
    }

    // Calcul du prix original sans réduction par quantité
    const originalTotal = (basePrice + framePrice) * quantity;
    const originalUnitPrice = basePrice + framePrice;

    // Calcul des réductions par quantité
    let discountPercentage = 0;
    if (quantity >= 10) discountPercentage = 15;
    else if (quantity >= 5) discountPercentage = 10;
    else if (quantity >= 3) discountPercentage = 5;

    const totalBeforeDiscount = originalTotal;
    const discount = (totalBeforeDiscount * discountPercentage) / 100;
    const finalTotal = totalBeforeDiscount - discount;
    const unitPrice = finalTotal / quantity;

    return NextResponse.json({
      success: true,
      data: {
        id: productId,
        basePrice,
        framePrice,
        quantity,
        discountPercentage,
        originalTotal,        // Prix total original sans réduction
        originalUnitPrice,    // Prix unitaire original sans réduction
        totalBeforeDiscount,
        discount,
        totalPrice: finalTotal,
        unitPrice,
        productInfo: {
          name: productData.name,
          artisteName: productData.artisteName,
          artisteId: productData.artisteId,
          image: productData.images[0].link,
        },
        frameInfo: frameData,
        stock: sizeData.stock
      }
    });

  } catch (error) {
    console.error("❌ Erreur lors du calcul du prix:", error);
    return NextResponse.json({ 
      error: "Une erreur est survenue lors du calcul du prix" 
    }, { status: 500 });
  }
} 