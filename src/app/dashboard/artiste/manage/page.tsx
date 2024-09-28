"use client";

import { useEffect, useState } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/app/firebase";
import { useSession } from 'next-auth/react';
import { useRouter } from "next/navigation";
import Breadcrumbs from "@/app/components/home/Breadcrumbs";
import ImageGrid from "@/app/components/artiste/manage/ImageGrid";
import { Button } from "@/app/components/ui/button"; // shadcn button
import { Plus } from "lucide-react"; // Icon from lucide-react

interface ImageData {
  id: string;
  format: string;
  images: { id: number; link: string }[];
  email: string;
}

export default function ManageImages() {
  const { data: session, status } = useSession();
  const [images, setImages] = useState<ImageData[]>([]);
  const [loading, setLoading] = useState(true);
  const [formatFilter, setFormatFilter] = useState("all");
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return; // Si la session est encore en cours de chargement, on attend

    // Vérification que la session et l'utilisateur existent, et que le rôle est artiste
    if (session && session.user && session.user.email && session.user.role === "artiste") {
      fetchImages(session.user.email); // Appeler fetchImages avec l'email de l'utilisateur
    } else {
      router.push("/403"); // Rediriger vers la page d'erreur si l'utilisateur n'a pas le bon rôle
    }
  }, [session, status, router]);

  const fetchImages = async (userEmail: string) => {
    try {
      const q = query(collection(db, "uploads"), where("artisteEmail", "==", userEmail));
      const snapshot = await getDocs(q);
      if (snapshot.empty) {
        setLoading(false);
        return;
      }

      const fetchedImages: ImageData[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        format: doc.data().format,
        images: doc.data().images,
        email: doc.data().email,
      }));
      setImages(fetchedImages);
    } catch (error) {
      console.error("Error fetching images:", error);
    } finally {
      setLoading(false);
    }
  };



  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/artiste/delete/${id}`, { method: "DELETE" });
      if (!response.ok) {
        throw new Error("Erreur lors de la suppression");
      }
      setImages((prev) => prev.filter((image) => image.id !== id));
    } catch (error) {
      console.error("Erreur lors de la suppression du produit:", error);
    }
  };

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
    <div className="h-full bg-white px-8">
      {/* Titre pour les artistes avec une marge supérieure */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-3xl font-bold mt-6">Gérer ses images</h1>

        {/* Bouton pour rediriger vers l'upload */}
        <div className="mt-10">
        <Button onClick={() => router.push('/dashboard/artiste')} variant="outline">
          <Plus className="mr-2 h-5 w-5" /> Publier une image
        </Button>
        </div>
      </div>

      {/* Breadcrumbs pour filtrer les formats */}
      <Breadcrumbs formatFilter={formatFilter} setFormatFilter={setFormatFilter} />

      <div className="max-w-screen-xl mx-auto">
        {/* Affichage des images filtrées */}
        <ImageGrid formatFilter={formatFilter} images={images} onDelete={handleDelete} />
      </div>
    </div>
  );
}
