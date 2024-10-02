'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useInView } from 'react-intersection-observer';
import { Button } from '@/app/components/ui/button';
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/app/components/ui/alert-dialog';

interface ImageCardProps {
  imageUrl: string;
  title: string;
  format: 'H' | 'V';
  id: string;
  onDelete: (id: string) => void;
}

export default function ImageCard({ imageUrl, title, format, id, onDelete }: ImageCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  const handleEditClick = () => {
    localStorage.setItem('editId', id);
  };

  return (
    <div ref={ref} className="flex flex-col items-center">
      <div
        className="relative w-full"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {!isLoaded && <div className="bg-gray-200 animate-pulse h-64 w-full" />}

        {inView && (
          <>
            <img
              src={imageUrl}
              alt={title}
              className={`object-cover w-full transition-opacity duration-500 ${
                isLoaded ? 'opacity-100' : 'opacity-0'
              } ${format === 'V' ? 'h-[625px]' : 'h-[300px]'}`}
              onLoad={() => setIsLoaded(true)}
            />

            {isHovered && (
              <div className="absolute inset-0 bg-black bg-opacity-50 flex flex-col items-center justify-center text-white">
                {/* Appeler handleEditClick lorsque l'on clique sur Modifier */}
                <Link href="/dashboard/artiste" passHref>
                  <Button variant="ghost" className="mb-4" onClick={handleEditClick}>
                    Modifier
                  </Button>
                </Link>

                {/* Bouton Supprimer avec confirmation */}
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive">Supprimer</Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <h1>Supprimer ce produit ?</h1>
                      <h2>{`ID du produit : ${id}`}</h2>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Annuler</AlertDialogCancel>
                      <AlertDialogAction onClick={() => onDelete(id)}>Supprimer</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            )}
          </>
        )}
      </div>

      {/* Titre de l'image */}
      <p className="text-center mt-2">{title}</p>
    </div>
  );
}
