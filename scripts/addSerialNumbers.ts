import { firestoreAdmin } from "@/app/firebaseAdmin";

async function addSerialNumbersToProducts() {
  const productsRef = firestoreAdmin.collection("uploads");
  const snapshot = await productsRef.get();

  for (const doc of snapshot.docs) {
    const data = doc.data();
    const sizes = data.sizes || [];

    // Ajouter nextSerialNumber à chaque taille si elle n'existe pas
    const updatedSizes = sizes.map((size: any) => ({
      ...size,
      nextSerialNumber: size.nextSerialNumber || 1
    }));

    await doc.ref.update({ sizes: updatedSizes });
  }

  console.log("Migration completed successfully");
}

addSerialNumbersToProducts().catch(console.error); 