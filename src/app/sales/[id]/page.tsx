'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/app/firebase'; // Import de la configuration Firebase
import { useCart } from '@/app/hooks/use-cart'; // Utilisation du hook Zustand pour le panier

// Fonction pour récupérer les données de Firestore (côté client)
async function fetchImageDetails(id: string) {
  const docRef = doc(db, 'uploads', id);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    return docSnap.data();
  } else {
    return null;
  }
}

export default function ImageDetails({ params }: { params: { id: string } }) {
  const [imageData, setImageData] = useState<any>(null); // État pour stocker les détails de l'image
  const [isLoading, setIsLoading] = useState(true); // État de chargement
  const [selectedSize, setSelectedSize] = useState<string | null>(null); // Taille sélectionnée
  const [selectedPrice, setSelectedPrice] = useState<number | null>(null); // Prix sélectionné
  const [isAdded, setIsAdded] = useState(false); // État pour savoir si l'item a été ajouté au panier
  const { addItem } = useCart(); // Utiliser le hook useCart pour ajouter au panier
  const router = useRouter(); // Pour gérer les redirections

  useEffect(() => {
    // Fonction pour récupérer les données et les stocker dans l'état
    const fetchData = async () => {
      const data = await fetchImageDetails(params.id);
      if (!data) {
        router.push('/404'); // Rediriger si le document n'existe pas
      } else {
        setImageData(data);
        // Pré-sélectionner le format avec la taille intermédiaire (ou plus grand)
        const defaultSize = data.sizes[Math.floor(data.sizes.length / 2)];
        setSelectedSize(defaultSize.size);
        setSelectedPrice(defaultSize.price);
      }
      setIsLoading(false); // Fin du chargement
    };

    fetchData();
  }, [params.id, router]);

  // Fonction pour ajouter l'image au panier
  const handleAddToCart = () => {
    if (!imageData || !selectedSize || !selectedPrice) {
      console.error('Please select a format first.');
      return;
    }

    const selectedFormat = imageData.sizes.find((size: any) => size.size === selectedSize);

    const product = {
      id: params.id,
      name: `Image ${params.id}`,
      price: selectedPrice, // Prix en fonction du format sélectionné
      image: imageData.images[0]?.link || '', // L'image principale
      format: selectedSize, // Le format sélectionné
      quantity: 1, // Par défaut, une unité
      stock: selectedFormat.stock, // Ajouter la quantité disponible
      artist: imageData.artist || 'Unknown artist', // Ajouter le nom de l'artiste (si disponible)
    };

    addItem(product); // Ajouter l'article au panier
    setIsAdded(true); // Mettre à jour l'état pour indiquer que l'article a été ajouté
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">{params.id}</h1>

      {/* Afficher les détails de l'image */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Afficher l'image principale */}
        <div>
          <img
            src={imageData.images[0]?.link || ''}
            alt={params.id}
            className="w-full h-auto object-cover"
          />
        </div>

        {/* Afficher les détails à droite */}
        <div>
          <p className="text-xl font-bold mb-2">ID: {params.id}</p>
          <p className="text-lg mb-2">Description: {imageData.description}</p>

          {/* Afficher le prix du format sélectionné */}
          <p className="text-lg font-bold mb-4">Prix: {selectedPrice} €</p>

          {/* Sélection des formats disponibles */}
          <div className="mb-4">
            <p className="text-lg font-semibold mb-2">Sélectionnez un format :</p>
            <div className="flex space-x-2">
              {imageData.sizes.map((size: any) => (
                <button
                  key={size.size}
                  onClick={() => {
                    setSelectedSize(size.size);
                    setSelectedPrice(size.price);
                  }}
                  disabled={size.stock <= 0}
                  className={`px-4 py-2 border rounded ${size.stock <= 0 ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : selectedSize === size.size ? 'bg-blue-500 text-white' : 'bg-white text-black'}`}
                >
                  {size.size}
                </button>
              ))}
            </div>
          </div>

          {/* Bouton Ajouter au panier */}
          <button
            onClick={handleAddToCart}
            disabled={!selectedSize || isAdded}
            className={`px-4 py-2 text-white ${isAdded ? 'bg-gray-500' : 'bg-blue-500'} ${!selectedSize ? 'cursor-not-allowed' : ''}`}
          >
            {isAdded ? 'Ajouté au panier' : 'Ajouter au panier'}
          </button>

          {/* Mockups - autres images */}
          <div className="mt-4">
            <h3 className="text-xl font-bold mb-2">Autres images :</h3>
            <div className="grid grid-cols-2 gap-4">
              {imageData.images.slice(1).map((image: any, index: number) => (
                <img
                  key={index}
                  src={image.link}
                  alt={`image-mockup-${index}`}
                  className="w-full h-auto object-cover"
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
