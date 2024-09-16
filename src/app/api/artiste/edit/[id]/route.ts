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
    if (existingData?.email !== token.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const formData = await req.formData();
    const description = formData.get('description') as string;
    const format = formData.get('format') as string;
    const sizes = JSON.parse(formData.get('sizes') as string);

    // Nettoyage des formats
    const cleanedSizes = sizes.map((sizeObj: { size: string, price: number, stock: number }) => ({
      size: sizeObj.size,
      price: sizeObj.price,
      stock: sizeObj.stock,
    }));

    const images = formData.getAll('images[]') as File[];

    if (!existingDoc.exists) {
      console.error(`Document with ID ${docId} not found.`);
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }
    const existingImages = existingData?.images || [];

    // Suppression de toutes les anciennes images du storage Firebase
    for (let i = 0; i < existingImages.length; i++) {
      const existingImageLink = existingImages[i]?.link;
      if (existingImageLink) {
        try {
          const filePath = existingImageLink.split(`${storageAdmin.bucket().name}/`)[1]; 
          
          if (!filePath) {
            console.error(`Le chemin de l'image est incorrect : ${existingImageLink}`);
            continue;
          }
    
          const oldImageRef = storageAdmin.bucket().file(filePath);
          
          console.log(`Tentative de suppression de l'image: ${filePath}`);
          
          // Suppression de l'image
          await oldImageRef.delete();
          console.log(`Image supprimée avec succès : ${existingImageLink}`);
        } catch (error) {
          console.error(`Erreur lors de la suppression de l'ancienne image ${existingImageLink}:`, error);
        }
      }
    }
    

    // Upload des nouvelles images
    const imageLinks: { id: number, link: string }[] = [];
    for (let i = 0; i < images.length; i++) {
      const image = images[i];
      if (image && image.size > 0) {
        // Nouvelle image à uploader
        const arrayBuffer = await image.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const imagePath = `photos/${token.email}/${docId}/image_${i}_${Date.now()}.jpg`; // Utilisation d'un timestamp pour éviter le cache
        const fileRef = storageAdmin.bucket().file(imagePath);

        // Enregistrer la nouvelle image
        await fileRef.save(buffer, { contentType: image.type });
        await fileRef.makePublic();
        const publicUrl = `https://storage.googleapis.com/${storageAdmin.bucket().name}/${imagePath}`;
        console.log(`Nouvelle image uploadée : ${publicUrl}`);
        imageLinks.push({ id: i, link: publicUrl });
      }
    }

    // Mettre à jour le document Firestore avec les nouveaux liens d'image
    await existingDocRef.update({
      description,
      format,
      sizes: cleanedSizes,
      images: imageLinks, // Mise à jour avec les nouveaux liens d'image
      updatedAt: FieldValue.serverTimestamp(),
    });

    console.log('Document mis à jour avec succès', docId);
    return NextResponse.json({ message: 'Document updated successfully' });
  } catch (error) {
    console.error('Error updating document:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
