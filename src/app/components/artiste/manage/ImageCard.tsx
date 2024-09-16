import { useState } from 'react';
import Link from 'next/link';
import { useInView } from 'react-intersection-observer';
import { Button } from '@/app/components/ui/button'; // shadcn Button
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogFooter, AlertDialogAction, AlertDialogCancel } from '@/app/components/ui/alert-dialog';

interface ImageCardProps {
  imageUrl: string;
  title: string;
  format: 'H' | 'V'; // Horizontal ou Vertical
  id: string;
  onDelete: (id: string) => void; // Fonction pour supprimer l'image
}

export default function ImageCard({ imageUrl, title, format, id, onDelete }: ImageCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const { ref, inView } = useInView({
    triggerOnce: true, // Charger une seule fois
    threshold: 0.1, // Charger lorsque 10% de l'image est visible
  });

  return (
    <div ref={ref} className="flex flex-col items-center">
      <div
        className="relative w-full"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {!isLoaded && (
          <div className="bg-gray-200 animate-pulse h-64 w-full" />
        )}

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
                <Link href={`/dashboard/artiste?edit=${id}`} passHref>
                  <Button variant="ghost" className="mb-4">
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
                      <h2>Supprimer ce produit ?</h2>
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

      {/* Titre de l'image, à l'extérieur de la div contenant l'image */}
      <p className="text-center mt-2">{title}</p>
    </div>
  );
}
