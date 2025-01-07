"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "@/app/firebase";
import ImageCard from "./ImageCard";
import { Dialog, DialogContent } from "@/app/components/ui/dialog";
import { useRouter, usePathname } from "next/navigation";
import { CircularProgress } from '@mui/material';
import { useMediaQuery } from "react-responsive";
import ImageDetails from "@/app/sales/[id]/page";

interface ImageData {
  id: string;
  format: string;
  images: { id: number; link: string }[];
}

export default function ImageGrid({ formatFilter }: { formatFilter: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const [images, setImages] = useState<ImageData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const isMobile = useMediaQuery({ maxWidth: 767 });

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
          format: doc.data().format,
          images: doc.data().images,
        }));

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

  // Gérer l'ouverture du Dialog
  const handleImageClick = (id: string) => {
    if (isMobile) {
      router.push(`/sales/${id}`);
    } else {
      window.history.pushState({}, '', `/sales/${id}`);
      setSelectedImage(id);
    }
  };

  // Gérer la fermeture du Dialog
  const handleClose = () => {
    window.history.pushState({}, '', '/');
    setSelectedImage(null);
  };

  // Gérer le bouton retour du navigateur
  useEffect(() => {
    const handlePopState = () => {
      if (window.location.pathname === '/') {
        setSelectedImage(null);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

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
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {images.map((image, index) => (
          <div
            key={index}
            onClick={() => handleImageClick(image.id)}
            className="cursor-pointer"
          >
            <ImageCard
              imageUrl={image.images[0]?.link || ""}
              secondImageUrl={image.images[1]?.link || ""}
              title={image.id}
              format={image.format === "vertical" ? "V" : "H"}
              id={image.id}
            />
          </div>
        ))}
      </div>

      {!isMobile && selectedImage && (
        <Dialog 
          open={true} 
          onOpenChange={handleClose}
        >
          <DialogContent 
            className="max-w-[1335px] w-full h-[95vh] p-0 border-none !overflow-hidden mx-auto"
          >
            <div className="h-full overflow-hidden">
              <ImageDetails params={{ id: selectedImage }} />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
