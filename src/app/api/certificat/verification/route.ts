import { NextResponse } from 'next/server';
import { firestoreAdmin } from '@/app/firebaseAdmin';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const identificationNumber = body.identificationNumber;
    
    console.log("Numéro reçu:", identificationNumber);

    if (!identificationNumber) {
      return NextResponse.json(
        { message: "Numéro d'identification manquant" },
        { status: 400 }
      );
    }

    const uploadsRef = firestoreAdmin.collection('uploads');
    const snapshot = await uploadsRef.get();
    
    console.log("Nombre de documents trouvés:", snapshot.size);

    let found = false;
    let productInfo = null;

    for (const doc of snapshot.docs) {
      const data = doc.data();
      console.log("Document ID:", doc.id);
      console.log("identificationNumbers:", data.identificationNumbers);

      if (data.identificationNumbers && Array.isArray(data.identificationNumbers)) {
        const matchingNumber = data.identificationNumbers.find(
          (num: any) => {
            console.log("Comparaison:", num.identificationNumber, "avec", identificationNumber);
            return num.identificationNumber === identificationNumber;
          }
        );

        if (matchingNumber) {
          const sizeInfo = data.sizes.find((size: any) => size.size === matchingNumber.size);
          const price = sizeInfo ? sizeInfo.price : null;

          const firstImage = data.images && data.images.length > 0 
            ? data.images[0].link 
            : data.mainImage;

          found = true;
          productInfo = {
            productId: doc.id,
            serialNumber: matchingNumber.serialNumber,
            size: matchingNumber.size,
            artisteName: data.artisteName,
            artisteEmail: data.artisteEmail,
            mainImage: data.mainImage,
            firstImageUrl: firstImage,
            format: data.format,
            price: price,
            identificationNumber: matchingNumber.identificationNumber,
            createdAt: data.createdAt ? new Date(data.createdAt.seconds * 1000).toLocaleDateString('fr-FR') : null
          };
          console.log("Correspondance trouvée:", productInfo);
          break;
        }
      }
    }

    if (!found) {
      console.log("Aucune correspondance trouvée");
      return NextResponse.json(
        { 
          message: "Numéro d'identification non trouvé",
          isValid: false 
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Numéro d'identification valide",
      isValid: true,
      productInfo
    });

  } catch (error: any) {
    console.error("Erreur complète:", error);
    return NextResponse.json(
      { 
        message: error.message,
        isValid: false 
      }, 
      { status: 500 }
    );
  }
}