import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { storageAdmin, firestoreAdmin, FieldValue } from '@/app/firebaseAdmin';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  if (!token || token.role !== 'artiste') {
    return NextResponse.json({ error: 'Unauthorized or Forbidden' }, { status: 403 });
  }

  const docId = params.id;

  try {
    // Récupérer le document existant
    const existingDocRef = firestoreAdmin.collection('uploads').doc(docId);
    const existingDoc = await existingDocRef.get();

    if (!existingDoc.exists) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    const existingData = existingDoc.data();

    // Vérifier si l'email du token correspond à l'email du produit
    if (existingData?.artisteEmail !== token.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const formData = await req.formData();
    const description = formData.get('description') as string;
    const format = formData.get('format') as string;
    const sizes = JSON.parse(formData.get('sizes') as string);

    // Nettoyage des formats
    const cleanedSizes = sizes.map((sizeObj: { 
      size: string;
      equivalentFrameSize: string;
      stock: number;
    }) => {
      // On récupère l'initialStock et nextSerialNumber existants pour cette taille
      const existingSize = existingData?.sizes.find((s: any) => s.size === sizeObj.size);
      return {
        size: sizeObj.size,
        equivalentFrameSize: sizeObj.equivalentFrameSize,
        stock: sizeObj.stock,
        initialStock: existingSize?.initialStock || sizeObj.stock,
        nextSerialNumber: existingSize?.nextSerialNumber || 1,
      };
    });

    // Collect all images (new files or existing links)
    const imageLinks: { id: number, link: string }[] = [];
    for (let i = 0; i < 6; i++) {
      const image = formData.get(`images_${i}`);
      if (image instanceof File) {
        // Nouvelle image à uploader
        const arrayBuffer = await image.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const imagePath = `photos/${token.email}/${docId}/image_${i}_${Date.now()}.jpg`; // Utilisation d'un timestamp pour éviter le cache
        const fileRef = storageAdmin.bucket().file(imagePath);
        await fileRef.save(buffer, { contentType: image.type });
        await fileRef.makePublic();
        const publicUrl = `https://storage.googleapis.com/${storageAdmin.bucket().name}/${imagePath}`;
        console.log(`Nouvelle image uploadée : ${publicUrl}`);
        imageLinks.push({ id: i, link: publicUrl });
      } else if (typeof image === 'string') {
        // Si c'est une ancienne image (lien)
        imageLinks.push({ id: i, link: image });
      }
    }

    // Mettre à jour le document Firestore avec les nouveaux liens d'image
    await existingDocRef.update({
      description,
      format,
      sizes: cleanedSizes,
      images: imageLinks,
      updatedAt: FieldValue.serverTimestamp(),
    });

    console.log('Document mis à jour avec succès', docId);
    return NextResponse.json({ message: 'Document updated successfully' });
  } catch (error) {
    console.error('Error updating document:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

