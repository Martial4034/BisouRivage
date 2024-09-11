"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "@/app/firebase"; // Firebase client
import ImageCard from "./ImageCard"; // Assurez-vous que c'est bien importé

interface ImageData {
  id: string;
  format: string; // Ajout du champ format pour filtrer
  images: { id: number; link: string }[];
}

export default function ImageGrid({ formatFilter }: { formatFilter: string }) {
  const [images, setImages] = useState<ImageData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchImages() {
      try {
        const q = query(collection(db, "uploads"), orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
          console.log("No images found");
          setLoading(false);
          return;
        }

        const fetchedImages: ImageData[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          format: doc.data().format, // Récupération du format (horizontal ou vertical)
          images: doc.data().images,
        }));

        // Filtrer les images selon le format (horizontal ou vertical)
        const filteredImages = fetchedImages.filter((image) =>
          formatFilter === "all"
            ? true
            : formatFilter === "V"
            ? image.format === "vertical"
            : image.format === "horizontal"
        );

        setImages(filteredImages);
      } catch (error) {
        console.error("Error fetching images:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchImages();
  }, [formatFilter]);

  // Gestion du chargement (skeleton)
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {[...Array(6)].map((_, index) => (
          <div key={index} className="w-full h-64 bg-gray-200 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
      {images.map((image, index) => (
        <ImageCard
          key={index}
          imageUrl={image.images[0]?.link || ""}
          secondImageUrl={image.images[1]?.link || ""}
          title={image.id}
          format={image.format === "vertical" ? "V" : "H"} // Utilisation du format pour ajuster la taille des images
          id={image.id}
        />
      ))}
    </div>
  );
}
