// src/app/api/artiste/delete/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import {
  firestoreAdmin,
  storageAdmin,
  FieldValue,
} from '@/app/firebaseAdmin';

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  if (!token || token.role !== 'artiste') {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
  }

  const productId = params.id;

  try {
    // Récupérer le document du produit
    const productDocRef = firestoreAdmin.collection('uploads').doc(productId);
    const productDoc = await productDocRef.get();

    if (!productDoc.exists) {
      return NextResponse.json({ error: 'Produit non trouvé' }, { status: 404 });
    }

    const productData = productDoc.data();

    // Vérifier que l'utilisateur authentifié est le propriétaire du produit
    if (productData?.artisteEmail !== token.email) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    // Supprimer les images du produit dans Firebase Storage
    if (!productData) {
      return NextResponse.json({ error: 'Produit non trouvé' }, { status: 404 });
    }
    const images = productData.images as Array<{ id: number; link: string }>;
    const artisteEmail = productData.artisteEmail;
    const storageBucket = storageAdmin.bucket();

    // Chemin du dossier dans Firebase Storage
    const uploadPath = `photos/${artisteEmail}/${productId}`;

    // Supprimer le dossier et tous ses fichiers
    await deleteFolder(storageBucket, uploadPath);

    // Supprimer le document du produit dans Firestore
    await productDocRef.delete();

    return NextResponse.json({ message: 'Produit supprimé avec succès' }, { status: 200 });
  } catch (error) {
    console.error('Erreur lors de la suppression du produit :', error);
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 });
  }
}

// Fonction pour supprimer un dossier et tous ses fichiers dans Firebase Storage
async function deleteFolder(bucket: any, folderPath: string) {
  const [files] = await bucket.getFiles({ prefix: folderPath });

  if (files.length === 0) {
    console.log('Aucun fichier à supprimer dans le dossier:', folderPath);
    return;
  }

  const deletionPromises = files.map((file: any) => file.delete());

  await Promise.all(deletionPromises);
}
