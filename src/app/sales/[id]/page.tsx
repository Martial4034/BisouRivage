"use client";

import * as React from "react";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/app/hooks/use-cart";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Skeleton } from "@/app/components/ui/skeleton";
import { Button } from "@/app/components/ui/button";
import Image from "next/image";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/app/firebase";
import { useToast } from "@/app/hooks/use-toast";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/app/components/ui/tooltip";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/app/components/ui/carousel";
import { useMediaQuery } from "react-responsive";
import useEmblaCarousel from "embla-carousel-react";
import Head from "next/head";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/app/components/ui/accordion";
import PromotionalBanner from "@/app/components/PromotionalBanner";

// Interfaces importées
import { ImageFirestoreData, ImageData } from "@/app/types";

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

  // Ajouter cet état avec les autres états au début du composant
  const [frameOption, setFrameOption] = useState<"avec" | "sans">("avec");

  useEffect(() => {
    // Fonction pour récupérer les données de l'image
    const fetchImageData = async () => {
      try {
        const docRef = doc(db, "uploads", params.id);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
          router.push("/404");
          return;
        }

        const data = docSnap.data() as ImageFirestoreData;
        if (!data) {
          router.push("/404");
          return;
        }

        // Convertir le Timestamp en date formatée
        const createdAtDate = data.createdAt.toDate();
        const createdAtFormatted = format(createdAtDate, "dd MMMM yyyy", {
          locale: fr,
        });

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
        const availableSize =
          data.sizes.find((size) => size.stock > 0) || data.sizes[0];
        setSelectedSize(availableSize.size);
        setSelectedPrice(availableSize.price);
      } catch (error) {
        console.error("Error fetching document:", error);
        router.push("/404");
      }
      setIsLoading(false);
    };

    fetchImageData();
  }, [params.id, router]);

  useEffect(() => {
    if (emblaApi) {
      emblaApi.on("select", () => {
        setSelectedImageIndex(emblaApi.selectedScrollSnap());
      });
    }
  }, [emblaApi]);

  const handleAddToCart = () => {
    if (!imageData || !selectedSize || !selectedPrice) {
      console.error("Veuillez sélectionner un format.");
      return;
    }

    const selectedFormat = imageData.sizes.find(
      (size) => size.size === selectedSize
    );

    const product = {
      id: params.id,
      name: `Image ${params.id}`,
      price: selectedPrice,
      image: imageData.images[selectedImageIndex]?.link || "",
      format: selectedSize,
      frameOption: frameOption, // Ajout de l'option de cadre
      quantity: 1,
      stock: selectedFormat?.stock || 0,
      artisteName: imageData.artisteName,
      artisteEmail: imageData.artisteEmail,
      artisteId: imageData.artisteId,
      serialNumber:
        selectedFormat?.nextSerialNumber || "SerailNumber Introuvable",
      initialStock: selectedFormat?.initialStock || "InitialStock Introuvable",
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
          <div
            className="flex-1 border-2 border-gray-300 p-6 rounded-none shadow"
            style={{ height: "400px" }}
          >
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
  const isVertical = imageData.format.toLowerCase() === "vertical";

  // Dimensions based on format
  const mainImageHeight = isVertical ? 625 : 400; // 16:9 aspect ratio for horizontal images
  const mainImageWidth = isVertical ? 410 : 600;
  const thumbnailHeight = isVertical ? 125 : 100;

  return (
    <>
      <Head>
        <title>
          {params.id} - {imageData.artisteName} - BisouRivage
        </title>
        <meta name="description" content={imageData.description} />
        <meta
          property="og:title"
          content={`${params.id} - ${imageData.artisteName} - BisouRivage`}
        />
        <meta property="og:description" content={imageData.description} />
        <meta property="og:image" content={imageData.images[0]?.link || ""} />
        <meta
          property="og:url"
          content={`https://bisourivage.fr/sales/${params.id}`}
        />
      </Head>

      <PromotionalBanner />

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
                        <div
                          className={`relative w-full ${
                            isVertical ? "h-[625px]" : "h-[300px]"
                          }`}
                        >
                          <Image
                            src={image.link}
                            alt={`Image ${index + 1}`}
                            fill
                            sizes={`(max-width: 768px) 100vw, ${
                              isVertical ? "400px" : "600px"
                            }`}
                            style={{ objectFit: "cover" }}
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
                        selectedImageIndex === index
                          ? "bg-black"
                          : "bg-gray-300"
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
                    src={imageData.images[selectedImageIndex]?.link || ""}
                    alt={`Image ${selectedImageIndex + 1}`}
                    fill
                    sizes={`${mainImageWidth}px`}
                    style={{ objectFit: "cover" }}
                    className="shadow-md transition-transform duration-200 ease-in-out transform hover:scale-105"
                  />
                </div>

                {/* Vignettes */}
                <div
                  className={`mt-4 grid ${
                    isVertical ? "grid-cols-3 gap-2" : "grid-cols-4 gap-2"
                  }`}
                >
                  {imageData.images.map((image, index) => (
                    <div
                      key={index}
                      className={`relative cursor-pointer ${
                        !isVertical ? "border-2 border-gray-300" : "border-none"
                      } overflow-hidden transition-shadow duration-200 ease-in-out hover:shadow-lg`}
                      onClick={() => handleImageClick(index)}
                      style={{ width: "100%", height: thumbnailHeight }}
                    >
                      <Image
                        src={image.link}
                        alt={`Thumbnail ${index + 1}`}
                        fill
                        sizes="100%"
                        style={{ objectFit: "cover" }}
                        className=""
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Section Détails */}
          <div className="flex-1 border-2 border-gray-300 p-6 rounded-none shadow">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              Titre : {params.id}
            </h2>
            <p className="text-md text-gray-600 mb-2">
              Artiste :{" "}
              <span className="font-semibold">{imageData.artisteName}</span>
            </p>
            <p className="text-md text-gray-600 mb-2">
              Date :{" "}
              <span className="font-semibold">{imageData.createdAt}</span>
            </p>

            <p className="text-gray-700 mb-4">{imageData.description}</p>

            {/* Ajout des nouvelles informations */}
            <div className="pl-4 mb-6 space-y-2">
              <p className="flex items-center gap-2">
                <span className="font-semibold text-gray-700">→</span>
                Impression pigment giclée sur papier fine Art mat
              </p>
              <p className="flex items-center gap-2">
                <span className="text-gray-700 font-bold">→</span>
                Tirages limité en{" "}
                {selectedSize
                  ? imageData.sizes.find((s) => s.size === selectedSize)
                      ?.initialStock
                  : "..."}{" "}
                exemplaires
              </p>
              <p className="flex items-center gap-2">
                <span className="text-gray-700 font-semibold">→</span>
                Œuvre fournie avec un certificat d'authenticité NFC
              </p>
            </div>

            {/* Sélection du cadre */}
            <div className="mb-6">
              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={() => setFrameOption("sans")}
                  variant={frameOption === "sans" ? "default" : "outline"}
                  className={`flex items-center justify-center ${
                    frameOption === "sans"
                      ? "bg-transparent text-black border-[1.2px] border-black"
                      : "bg-black text-white"
                  } hover:bg-gray-600 transition-colors duration-200`}
                >
                  Sans cadre
                </Button>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        disabled={true}
                        variant="outline"
                        className="flex items-center justify-center bg-gray-300 text-gray-500 cursor-not-allowed"
                      >
                        Avec cadre
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>
                        L&apos;option d&apos;achat avec cadre arrive bientôt !
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>

            <p className="text-lg font-semibold text-gray-800 mb-2">
              Disponible en plusieurs tailles
            </p>

            {/* Sélection de Format */}
            <div className="mb-6">
              <p className="text-sm mb-2">Sélectionnez un format :</p>
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
                    variant={selectedSize === size.size ? "default" : "outline"}
                    className={`flex items-center justify-center ${
                      size.stock <= 0
                        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                        : selectedSize === size.size
                        ? "bg-transparent text-black border-[1.2px] border-black"
                        : "bg-black text-white"
                    } hover:bg-gray-600 transition-colors duration-200`}
                  >
                    {size.size} {size.stock <= 0 && "(Rupture de stock)"}
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
                  title: "Produit ajouté",
                  description: `Format sélectionné : ${selectedSize}`,
                  variant: "default",
                });
              }}
              disabled={!selectedSize || isAdded}
              variant={isAdded ? "secondary" : "default"}
              className={`w-full ${
                !selectedSize ? "cursor-not-allowed opacity-50" : ""
              } ${
                isAdded ? "bg-gray-500" : "bg-black"
              } hover:bg-gray-700 transition-colors duration-200`}
            >
              {isAdded ? "Ajouté au panier" : "Ajouter au panier"}
            </Button>

            {/* Message sur la disponibilité */}
            {selectedSize && (
              <div className="mt-4 text-sm italic text-center">
                {(() => {
                  const selectedSizeData = imageData.sizes.find(
                    (s) => s.size === selectedSize
                  );
                  if (!selectedSizeData) return null;

                  const { nextSerialNumber, initialStock } = selectedSizeData;
                  const remainingStock = selectedSizeData.stock;

                  if (nextSerialNumber === 1) {
                    return (
                      <p className="text-green-600 font-medium">
                        Vous serez le premier et obtiendrez le n°1
                      </p>
                    );
                  } else if (remainingStock >= initialStock / 2) {
                    return (
                      <p className="text-blue-600 font-medium">
                        Vous obtiendrez l&apos;exemplaire n°{nextSerialNumber}.
                        Vous serez parmi les {Math.ceil(initialStock / 2)}{" "}
                        premiers
                      </p>
                    );
                  } else {
                    return (
                      <p className="text-orange-600 font-medium">
                        Plus que {remainingStock} exemplaires disponibles dans
                        le format sélectionné
                      </p>
                    );
                  }
                })()}
              </div>
            )}

            {/* Accordion pour Livraison et Retours */}
            <div className="mt-6">
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="shipping">
                  <AccordionTrigger className="text-left font-semibold">
                    Livraison et Retours
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-gray-600 space-y-4">
                    <p>
                      Comme nous manipulons des œuvres d'art fragiles, nous
                      emballons soigneusement toutes les pièces et utilisons
                      uniquement un service signé pour toutes nos expéditions.
                    </p>

                    <p>
                      Toutes les impressions A3 et A4 sont expédiées dans des
                      boîtes de présentation à plat et les impressions A2 sont
                      expédiées dans des tubes. Nous avons fait concevoir les
                      tubes spécifiquement pour expédier cette tailles et ils
                      sont beaucoup plus larges que les tubes habituels afin
                      qu'ils ne conservent pas leur courbure.
                    </p>

                    <p>
                      La livraison en France prend 2 à 3 jours ouvrables, en
                      Europe environ 5 jours et dans le reste du monde 7 à 10
                      jours. Veuillez noter que les délais de livraison sont
                      actuellement variables.
                    </p>

                    <div className="space-y-2">
                      <p>Expédition en France : 15€</p>
                      <p>Expédition dans l'UE : 65€*</p>
                      <p>Reste du monde : 65€*</p>
                      <p>
                        Retrait sur rendez-vous à Saint-Etienne au 32 Rue de la
                        Résistance
                      </p>
                    </div>

                    <p className="italic">
                      * Des droits de douane et des droits supplémentaires
                      peuvent s'appliquer et sont à la charge de l'acheteur.
                    </p>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
