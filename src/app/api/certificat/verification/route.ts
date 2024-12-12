import { NextResponse } from 'next/server';
import { firestoreAdmin } from '@/app/firebaseAdmin';

export async function POST(request: Request) {
  try {
    const { certificateNumber } = await request.json();

    if (!certificateNumber || certificateNumber.length !== 8) {
      return NextResponse.json(
        { message: 'Numéro de certificat invalide' },
        { status: 400 }
      );
    }

    const ordersRef = firestoreAdmin.collection('orders');
    const snapshot = await ordersRef.get();
    let foundProduct = null;
    let purchaseDate = null;

    for (const doc of snapshot.docs) {
      const orderData = doc.data();
      
      for (const product of orderData.products) {
        if (product.identificationNumbersMap) {
          for (const mapping of product.identificationNumbersMap) {
            if (mapping.hasOwnProperty(certificateNumber)) {
              foundProduct = {
                productId: product.productId,
                imageUrl: product.imageUrl,
                artisteName: product.artisteName,
                format: product.format,
                name: product.name,
                serialNumber: mapping[certificateNumber],
                price: product.price,
                purchaseDate: orderData.createdAt.toDate().toISOString(),
                deliveryDate: orderData.deliveryDate.toDate().toISOString()
              };
              
              purchaseDate = orderData.createdAt.toDate();
              break;
            }
          }
        }
        
        if (foundProduct) break;
      }
      
      if (foundProduct) break;
    }

    if (!foundProduct) {
      return NextResponse.json(
        { message: 'Numéro de certificat non trouvé' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Certificat vérifié avec succès',
      product: foundProduct,
      purchaseDate,
    });

  } catch (error) {
    console.error('Erreur lors de la vérification du certificat:', error);
    return NextResponse.json(
      { message: 'Erreur lors de la vérification du certificat' },
      { status: 500 }
    );
  }
}


