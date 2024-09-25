'use client';

import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/app/hooks/use-cart';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Skeleton } from '@/app/components/ui/skeleton';
import { Button } from '@/app/components/ui/button';
import Image from 'next/image';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/app/firebase';
import { useToast } from '@/app/hooks/use-toast';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/app/components/ui/carousel';
import { useMediaQuery } from 'react-responsive';
import useEmblaCarousel from 'embla-carousel-react';

// Interfaces importées
import { ImageFirestoreData, ImageData } from '@/app/types';

export default function ImageDetails({ params }: { params: { id: string } }) {
  const [imageData, setImageData] = useState<ImageData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedPrice, setSelectedPrice] = useState<number | null>(null);
  const [isAdded, setIsAdded] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const { addItem } = useCart();
  const router = useRouter();
  const { toast } = useToast();

  // Détecter si l'utilisateur est sur mobile
  const isMobile = useMediaQuery({ maxWidth: 767 });

  // Référence pour Embla Carousel
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false });

  useEffect(() => {
    // Fonction pour récupérer les données de l'image
    const fetchImageData = async () => {
      try {
        const docRef = doc(db, 'uploads', params.id);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
          router.push('/404');
          return;
        }

        const data = docSnap.data() as ImageFirestoreData;
        if (!data) {
          router.push('/404');
          return;
        }

        // Convertir le Timestamp en date formatée
        const createdAtDate = data.createdAt.toDate();
        const createdAtFormatted = format(createdAtDate, 'dd MMMM yyyy', { locale: fr });

        setImageData({
          artisteEmail: data.artisteEmail,
          artisteId: data.artisteId,
          artisteName: data.artisteName,
          createdAt: createdAtFormatted, // Date formatée
          description: data.description,
          format: data.format,
          images: data.images,
          mainImage: data.mainImage,
          sizes: data.sizes,
        });

        // Sélectionner automatiquement la première taille disponible en stock
        const availableSize = data.sizes.find((size) => size.stock > 0) || data.sizes[0];
        setSelectedSize(availableSize.size);
        setSelectedPrice(availableSize.price);
      } catch (error) {
        console.error('Error fetching document:', error);
        router.push('/404');
      }
      setIsLoading(false);
    };

    fetchImageData();
  }, [params.id, router]);

  useEffect(() => {
    if (emblaApi) {
      emblaApi.on('select', () => {
        setSelectedImageIndex(emblaApi.selectedScrollSnap());
      });
    }
  }, [emblaApi]);

  const handleAddToCart = () => {
    if (!imageData || !selectedSize || !selectedPrice) {
      console.error('Veuillez sélectionner un format.');
      return;
    }

    const selectedFormat = imageData.sizes.find((size) => size.size === selectedSize);

    const product = {
      id: params.id,
      name: `Image ${params.id}`,
      price: selectedPrice,
      image: imageData.images[selectedImageIndex]?.link || '',
      format: selectedSize,
      quantity: 1,
      stock: selectedFormat?.stock || 0,
      artisteName: imageData.artisteName,
      artisteEmail: imageData.artisteEmail,
      artisteId: imageData.artisteId,
    };

    addItem(product);
    setIsAdded(true);
  };

  const handleImageClick = (index: number) => {
    setSelectedImageIndex(index);
    if (emblaApi) {
      emblaApi.scrollTo(index);
    }
  };

  if (isLoading) {
    // Loader Skeleton
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Section Image Skeleton */}
          <div className="flex-1">
            <Skeleton className="w-full h-96 mb-4" />
            <div className="grid grid-cols-4 gap-2">
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="w-20 h-20" />
              ))}
            </div>
          </div>

          {/* Section Détails Skeleton */}
          <div className="flex-1 border-2 border-gray-300 p-6 rounded-none shadow" style={{ height: '400px' }}>
            <Skeleton className="h-8 mb-4" />
            <Skeleton className="h-4 mb-2" />
            <Skeleton className="h-4 mb-2" />
            <Skeleton className="h-4 mb-4" />
            <Skeleton className="h-6 mb-4 w-1/2" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!imageData) {
    return null; // Ou un message d'erreur approprié
  }

  // Vérifier si le format est vertical
  const isVertical = imageData.format.toLowerCase() === 'vertical';

  // Dimensions based on format
  const mainImageHeight = isVertical ? 625 : 400; // 16:9 aspect ratio for horizontal images
  const mainImageWidth = isVertical ? 410 : 600;
  const thumbnailHeight = isVertical ? 125 : 100;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Section Image */}
        <div className="flex-1">
          {isMobile ? (
            // Carrousel sur mobile sans autoplay
            <div>
              <Carousel ref={emblaRef} className="w-full">
                <CarouselContent>
                  {imageData.images.map((image, index) => (
                    <CarouselItem key={index}>
                      <div className={`relative w-full ${isVertical ? 'h-[625px]' : 'h-[300px]'}`}>
                        <Image
                          src={image.link}
                          alt={`Image ${index + 1}`}
                          fill
                          sizes={`(max-width: 768px) 100vw, ${isVertical ? '400px' : '600px'}`}
                          style={{ objectFit: 'cover' }}
                          className="shadow-md"
                        />
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
              </Carousel>
              {/* Barre de progression découpée */}
              <div className="mt-2 flex justify-center space-x-1">
                {imageData.images.map((_, index) => (
                  <div
                    key={index}
                    className={`h-1 w-6 rounded-full cursor-pointer ${
                      selectedImageIndex === index ? 'bg-black' : 'bg-gray-300'
                    }`}
                    onClick={() => handleImageClick(index)}
                  ></div>
                ))}
              </div>
            </div>
          ) : (
            // Image principale et vignettes sur desktop
            <div className="flex flex-col gap-4">
              <div
                className="relative mx-auto"
                style={{ width: mainImageWidth, height: mainImageHeight }}
              >
                <Image
                  src={imageData.images[selectedImageIndex]?.link || ''}
                  alt={`Image ${selectedImageIndex + 1}`}
                  fill
                  sizes={`${mainImageWidth}px`}
                  style={{ objectFit: 'cover' }}
                  className="shadow-md transition-transform duration-200 ease-in-out transform hover:scale-105"
                />
              </div>

              {/* Vignettes */}
              <div className={`mt-4 grid ${isVertical ? 'grid-cols-3 gap-2' : 'grid-cols-4 gap-2'}`}>
                {imageData.images.map((image, index) => (
                  <div
                    key={index}
                    className={`relative cursor-pointer ${!isVertical ? 'border-2 border-gray-300' : 'border-none'} overflow-hidden transition-shadow duration-200 ease-in-out hover:shadow-lg`}
                    onClick={() => handleImageClick(index)}
                    style={{ width: '100%', height: thumbnailHeight }}
                  >
                    <Image
                      src={image.link}
                      alt={`Thumbnail ${index + 1}`}
                      fill
                      sizes="100%"
                      style={{ objectFit: 'cover' }}
                      className=""
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Section Détails */}
        <div className="flex-1 border-2 border-gray-300 p-6 rounded-none shadow" style={{ height: '420px' }}>
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Titre : {params.id}</h2>
          <p className="text-md text-gray-600 mb-2">
            Artiste : <span className="font-semibold">{imageData.artisteName}</span>
          </p>
          <p className="text-md text-gray-600 mb-2">
            Date : <span className="font-semibold">{imageData.createdAt}</span>
          </p>

          <p className="text-gray-700 mb-4">{imageData.description}</p>

          <p className="text-lg font-semibold text-gray-800 mb-2">Disponible en plusieurs tailles</p>

          {/* Sélection de Format */}
          <div className="mb-6">
            <p className="text-md font-semibold mb-2">Sélectionnez un format :</p>
            <div className="flex flex-wrap gap-2">
              {imageData.sizes.map((size) => (
                <Button
                  key={size.size}
                  onClick={() => {
                    setSelectedSize(size.size);
                    setSelectedPrice(size.price);
                    setIsAdded(false);
                  }}
                  disabled={size.stock <= 0}
                  variant={selectedSize === size.size ? 'default' : 'outline'}
                  className={`flex items-center justify-center ${
                    size.stock <= 0
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-black text-white'
                  } hover:bg-gray-700 transition-colors duration-200`}
                >
                  {size.size} {size.stock <= 0 && '(Rupture de stock)'}
                </Button>
              ))}
            </div>
          </div>

          {/* Prix et Ajouter au Panier */}
          <p className="text-2xl font-bold mb-4">Prix: {selectedPrice} €</p>
          <Button
            onClick={() => {
              handleAddToCart();
              toast({
                title: 'Produit ajouté',
                description: `Format sélectionné : ${selectedSize}`,
                variant: 'default',
              });
            }}
            disabled={!selectedSize || isAdded}
            variant={isAdded ? 'secondary' : 'default'}
            className={`w-full ${
              !selectedSize ? 'cursor-not-allowed opacity-50' : ''
            } ${
              isAdded ? 'bg-gray-500' : 'bg-black'
            } hover:bg-gray-700 transition-colors duration-200`}
          >
            {isAdded ? 'Ajouté au panier' : 'Ajouter au panier'}
          </Button>
        </div>
      </div>
    </div>
  );
}
