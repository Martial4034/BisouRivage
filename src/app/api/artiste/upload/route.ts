import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import {
  storageAdmin,
  firestoreAdmin,
  FieldValue,
  FieldPath,
} from "@/app/firebaseAdmin";

export async function POST(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  if (!token || token.role !== "artiste") {
    return NextResponse.json(
      { error: "Unauthorized or Forbidden" },
      { status: 403 }
    );
  }

  try {
    const formData = await req.formData();
    const artisteName = formData.get("artiste_name") as string;
    const description = formData.get("description") as string;
    const format = formData.get("format") as string;
    const sizes = JSON.parse(formData.get("sizes") as string); // Récupérer les tailles avec stock et prix

    const cleanedSizes = sizes.map(
      (sizeObj: { size: string; price: number; stock: number }) => ({
        size: sizeObj.size,
        price: sizeObj.price,
        stock: sizeObj.stock,
      })
    );

    // Correct retrieval of images with dynamic keys (images_0, images_1, etc.)
    const images: any[] = [];
    formData.forEach((value, key) => {
      if (key.startsWith("images_") && value instanceof File) {
        images.push(value);
      }
    });

    if (images.length === 0) {
      return NextResponse.json(
        { error: "No images uploaded" },
        { status: 400 }
      );
    }

    // Log for debugging
    console.log("Images received:", images.length);

    const formatPrefix = format === "vertical" ? "V" : "H";
    const nextId = await getNextIdForFormat(formatPrefix);
    const docId = `${formatPrefix}${nextId}`;
    const uploadPath = `photos/${token.email}/${docId}`;

    const imageLinks: { id: number; link: string }[] = [];
    for (let i = 0; i < images.length; i++) {
      const image = images[i];
      const arrayBuffer = await image.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const imagePath = `${uploadPath}/image_${i}.jpg`;
      const fileRef = storageAdmin.bucket().file(imagePath);
      await fileRef.save(buffer, { contentType: image.type });
      await fileRef.makePublic();
      const publicUrl = `https://storage.googleapis.com/${
        storageAdmin.bucket().name
      }/${imagePath}`;
      imageLinks.push({ id: i, link: publicUrl });
    }

    const newUploadRef = firestoreAdmin.collection("uploads").doc(docId);
    await newUploadRef.set({
      artisteId: token.uid,
      artisteEmail: token.email,
      artisteName,
      format,
      description,
      sizes: cleanedSizes,
      mainImage: imageLinks[0]?.link || "",
      images: imageLinks,
      createdAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ message: "Upload successful", imageLinks });
  } catch (error) {
    console.error("Error uploading images:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

async function getNextIdForFormat(formatPrefix: string): Promise<string> {
  const lastDoc = await firestoreAdmin
    .collection("uploads")
    .where("format", "==", formatPrefix === "V" ? "vertical" : "horizontal")
    .orderBy(FieldPath.documentId(), "desc")
    .limit(1)
    .get();

  if (lastDoc.empty) {
    return "001";
  }

  const lastId = lastDoc.docs[0].id;
  const lastNumber = parseInt(lastId.substring(1), 10);
  const nextNumber = (lastNumber + 1).toString().padStart(3, "0");

  return nextNumber;
}
