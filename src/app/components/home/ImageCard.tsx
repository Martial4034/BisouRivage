import { useState } from 'react';
import Link from 'next/link';
import { useInView } from 'react-intersection-observer';

interface ImageCardProps {
  imageUrl: string;
  secondImageUrl: string; // On ajoute cette ligne
  title: string;
  format: 'H' | 'V'; // Horizontal ou Vertical
  id: string;
}

export default function ImageCard({ imageUrl, secondImageUrl, title, format, id }: ImageCardProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isHovered, setIsHovered] = useState(false); // État pour le survol
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1, 
  });

  return (
    <div
      ref={ref}
      className="relative"
      onMouseEnter={() => setIsHovered(true)} // Activer l'affichage de la deuxième image au survol
      onMouseLeave={() => setIsHovered(false)} // Revenir à la première image après le survol
    >
      {!isLoaded && (
        <div className="bg-gray-200 animate-pulse h-64 w-full" />
      )}
      {inView && (
        <Link href={`/sales/${id}`} passHref>
            <img
              src={isHovered ? secondImageUrl : imageUrl} // Changer l'image en fonction du survol
              alt={title}
              className={`object-cover w-full transition-opacity duration-500 ${
                isLoaded ? 'opacity-100' : 'opacity-0'
              } ${format === 'V' ? 'h-[625px]' : 'h-[300px]'}`} // Taille ajustée pour plus de visibilité
              onLoad={() => setIsLoaded(true)}
            />
        </Link>
      )}
      <p className="text-center font-medium text-gray-800 mt-4" 
            style={{ fontFamily: 'Inter, sans-serif' }}
      
      >{title}</p>
    </div>
  );
}
