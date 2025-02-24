import { doc, getDoc } from "firebase/firestore";
import { db } from "@/app/firebase";

interface ImageData {
  id: string;
  description: string;
  sizes: { size: string; price: number; stock: number; nextSerialNumber: number; initialStock: number; equivalentFrameSize: string; }[];
  images: { link: string }[];
  artisteName: string;
  artisteEmail: string;
  artisteId: string;
}

export async function fetchData(collection: string, id: string): Promise<ImageData | null> {
  try {
    const docRef = doc(db, collection, id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return { id, ...docSnap.data() } as ImageData;
    } else {
      console.error(`No document found with ID: ${id}`);
      return null;
    }
  } catch (error) {
    console.error(`Error fetching document with ID ${id}:`, error);
    return null;
  }
}
