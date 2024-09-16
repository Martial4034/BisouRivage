"use client";

import { useState } from "react";
import ImageCard from "./ImageCard"; // Assurez-vous que ce composant est bien importé

interface ImageData {
  id: string;
  format: string;
  images: { id: number; link: string }[];
}

export default function ImageGrid({ formatFilter, images, onDelete }: { formatFilter: string, images: ImageData[], onDelete: (id: string) => void }) {
  const [loading, setLoading] = useState(false);

  // Gestion du chargement
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {[...Array(6)].map((_, index) => (
          <div key={index} className="w-full h-64 bg-gray-200 animate-pulse" />
        ))}
      </div>
    );
  }

  // Filtrer les images par format
  const filteredImages = images.filter((image) =>
    formatFilter === "all"
      ? true
      : formatFilter === "V"
      ? image.format === "vertical"
      : image.format === "horizontal"
  );

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
      {filteredImages.map((image, index) => (
        <ImageCard
          key={index}
          imageUrl={image.images[0]?.link || ""}
          title={image.id}
          format={image.format === "vertical" ? "V" : "H"}
          id={image.id}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
