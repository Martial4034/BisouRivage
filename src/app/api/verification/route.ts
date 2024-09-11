import { NextResponse } from 'next/server';
import { firestoreAdmin } from '@/app/firebaseAdmin'; // Firebase admin

export async function POST(req: Request) {
  const { cartItems } = await req.json();

  try {
    const updates = [];
    for (const item of cartItems) {
      const productRef = firestoreAdmin.collection('uploads').doc(item.id);
      const productDoc = await productRef.get();

      if (!productDoc.exists) {
        updates.push({
          id: item.id,
          status: 'removed',
          message: `Le produit ${item.name} n'est plus disponible.`,
        });
        continue;
      }

      const productData = productDoc.data();
      if (!productData) {
        updates.push({
          id: item.id,
          status: 'removed',
          message: `Impossible de trouver les détails du produit ${item.name}.`,
        });
        continue;
      }

      const sizeInfo = productData.sizes.find((size: any) => size.size === item.format);

      if (sizeInfo.stock < item.quantity) {
        updates.push({
          id: item.id,
          status: 'quantity_adjusted',
          message: `Le stock du produit ${item.name} (${item.format}) a été ajusté à ${sizeInfo.stock}.`,
          newQuantity: sizeInfo.stock,
        });
      }

      if (sizeInfo.price !== item.price) {
        updates.push({
          id: item.id,
          status: 'price_changed',
          message: `Le prix du produit ${item.name} (${item.format}) a changé.`,
          newPrice: sizeInfo.price,
        });
      }
    }

    return NextResponse.json({ updates });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 400 });
  }
}
