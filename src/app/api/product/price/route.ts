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

    console.log("💰 Calcul du prix pour:", {
      productId,
      size,
      frameOption,
      frameColor,
      quantity
    });

    // Vérifications de base
    if (quantity < 1) {
      console.log("❌ Quantité invalide:", quantity);
      return NextResponse.json({ 
        error: "La quantité doit être supérieure à 0" 
      }, { status: 400 });
    }

    // Récupérer les informations du produit
    const productDoc = await getDoc(doc(db, "uploads", productId));
    if (!productDoc.exists()) {
      console.log("❌ Produit non trouvé:", productId);
      return NextResponse.json({ 
        error: "Produit non trouvé" 
      }, { status: 404 });
    }

    const productData = productDoc.data();
    if (!productData || !productData.sizes || !Array.isArray(productData.sizes)) {
      console.error("❌ Structure du produit invalide:", productData);
      return NextResponse.json({ 
        error: "Structure du produit invalide" 
      }, { status: 500 });
    }

    // Construire les informations du produit
    const productInfo = {
      name: productData.description || 'Sans titre',
      artisteName: productData.artisteName || '',
      artisteId: productData.artisteId || '',
      image: productData.mainImage || productData.images?.[0]?.link || '/placeholder.jpg',
    };

    console.log("✅ Produit trouvé:", {
      id: productId,
      ...productInfo,
      sizes: productData.sizes.length
    });

    // Vérifier le stock et récupérer les données de taille
    const sizeData = productData.sizes.find((s: any) => s.size === size);
    if (!sizeData || !sizeData.equivalentFrameSize) {
      console.error(`❌ Format ${size} invalide ou incomplet:`, sizeData);
      return NextResponse.json({ 
        error: `Format ${size} non trouvé ou invalide pour le produit ${productId}` 
      }, { status: 404 });
    }

    console.log("✅ Format trouvé:", {
      size: sizeData.size,
      stock: sizeData.stock,
      equivalentFrameSize: sizeData.equivalentFrameSize
    });

    // Vérification du stock
    if (quantity > sizeData.stock) {
      console.log(`⚠️ Stock insuffisant. Demandé: ${quantity}, Disponible: ${sizeData.stock}`);
      return NextResponse.json({ 
        error: `Stock insuffisant. Disponible: ${sizeData.stock}`,
        data: { 
          stock: sizeData.stock,
          productInfo
        }
      }, { status: 400 });
    }

    // Récupérer le format de cadre correspondant
    console.log(`🖼️ Recherche du format de cadre: ${sizeData.equivalentFrameSize}`);
    const formatDoc = await getDoc(doc(db, "formats", sizeData.equivalentFrameSize.replace('cm', '')));
    if (!formatDoc.exists()) {
      console.log(`❌ Format de cadre ${sizeData.equivalentFrameSize} non trouvé`);
      return NextResponse.json({ 
        error: `Format de cadre ${sizeData.equivalentFrameSize} non trouvé` 
      }, { status: 404 });
    }

    const formatData = formatDoc.data();
    if (!formatData || !formatData.frameOptions || !Array.isArray(formatData.frameOptions)) {
      console.error("❌ Structure du format invalide:", formatData);
      return NextResponse.json({ 
        error: "Structure du format invalide" 
      }, { status: 500 });
    }

    console.log("✅ Options de cadre trouvées:", formatData.frameOptions);

    // Trouver l'option sans cadre pour le prix de base
    const baseFrameOption = formatData.frameOptions.find((f: any) => f.color === "none");
    if (!baseFrameOption || typeof baseFrameOption.price !== 'number') {
      console.log("❌ Prix de base non trouvé:", baseFrameOption);
      return NextResponse.json({ 
        error: "Prix de base non trouvé" 
      }, { status: 404 });
    }

    let basePrice = baseFrameOption.price;
    let framePrice = 0;
    let frameData = null;

    // Si avec cadre, ajouter le prix du cadre
    if (frameOption === "avec" && frameColor) {
      console.log(`🎨 Recherche du prix pour la couleur: ${frameColor}`);
      const selectedFrameOption = formatData.frameOptions.find((f: any) => f.color === frameColor);
      
      if (!selectedFrameOption) {
        console.log(`❌ Couleur de cadre ${frameColor} non trouvée`);
        return NextResponse.json({ 
          error: `Couleur de cadre ${frameColor} non trouvée` 
        }, { status: 404 });
      }

      if (!selectedFrameOption.available) {
        console.log(`❌ Couleur de cadre ${frameColor} non disponible`);
        return NextResponse.json({ 
          error: `Couleur de cadre ${frameColor} non disponible` 
        }, { status: 400 });
      }

      if (typeof selectedFrameOption.price !== 'number') {
        console.log(`❌ Prix invalide pour la couleur ${frameColor}:`, selectedFrameOption.price);
        return NextResponse.json({ 
          error: `Prix invalide pour la couleur ${frameColor}` 
        }, { status: 500 });
      }

      frameData = selectedFrameOption;
      framePrice = selectedFrameOption.price - basePrice;
      console.log("💰 Prix calculés:", {
        basePrice,
        framePrice,
        total: basePrice + framePrice
      });
    }

    // Calculs finaux
    const baseTotal = basePrice * quantity;
    const framePriceTotal = framePrice * quantity;
    const originalTotal = baseTotal + framePriceTotal;
    const originalUnitPrice = basePrice + framePrice;
    const totalBeforeDiscount = originalTotal;
    const discount = 0; // Pas de réduction pour le moment
    const finalTotal = totalBeforeDiscount;
    const unitPrice = originalUnitPrice; // Prix unitaire reste le même

    const response = {
      success: true,
      data: {
        id: productId,
        basePrice, // Prix unitaire de base
        framePrice, // Prix unitaire du cadre
        quantity,
        discountPercentage: 0,
        originalTotal, // Prix total (base + cadre) × quantité
        originalUnitPrice, // Prix unitaire (base + cadre)
        totalBeforeDiscount,
        discount,
        totalPrice: finalTotal,
        unitPrice,
        productInfo,
        frameInfo: frameData,
        stock: sizeData.stock
      }
    };

    console.log("✅ Réponse finale:", {
      id: productId,
      name: response.data.productInfo.name,
      basePrice: response.data.basePrice,
      framePrice: response.data.framePrice,
      quantity: response.data.quantity,
      unitPrice: response.data.unitPrice,
      totalPrice: response.data.totalPrice,
      hasFrame: frameOption === "avec"
    });

    return NextResponse.json(response);

  } catch (error) {
    console.error("❌ Erreur lors du calcul du prix:", error);
    return NextResponse.json({ 
      error: "Une erreur est survenue lors du calcul du prix" 
    }, { status: 500 });
  }
} 