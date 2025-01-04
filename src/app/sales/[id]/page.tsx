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
import { doc, getDoc, getDocs, collection } from "firebase/firestore";
import { db } from "@/app/firebase";
import { useToast } from "@/app/hooks/use-toast";
import { CircularProgress } from '@mui/material';
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

// Ajout des interfaces pour les formats
interface FrameOption {
  name: string;
  color: string;
  imageUrl: string;
  price: number;
  available: boolean;
}

interface Format {
  id: string;
  size: string;
  frameOptions: FrameOption[];
}

// Ajouter cette interface avec les autres
interface ColorPoint {
  color: string;
  urlPoint: string;
}

// Ajouter ces constantes en haut du fichier
const FRAME_STYLES = {
  container: {
    position: 'relative' as const,
    width: '100%',
    height: '100%',
  },
  frame: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    zIndex: 2,
  },
  image: {
    position: 'absolute' as const,
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '70%',
    height: '70%',
    zIndex: 1,
  }
};

// Composant de débogage
const DebugInfo = ({ 
  data, 
  formats,
  selectedSize,
  selectedColor,
  frameOption,
  selectedFrame,
  colorPoints,
  error 
}: { 
  data: ImageData | null;
  formats: Format[];
  selectedSize: string | null;
  selectedColor: string | null;
  frameOption: "avec" | "sans";
  selectedFrame: FrameOption | null;
  colorPoints: ColorPoint[];
  error?: string;
}) => {
  // Trouver le format équivalent pour la taille sélectionnée
  const selectedSizeData = data?.sizes.find(s => s.size === selectedSize);
  const equivalentFrameSize = selectedSizeData?.equivalentFrameSize;
  const formatData = formats.find(f => f.size === equivalentFrameSize);

  const debugData = {
    "🎯 Sélections actuelles": {
      "Taille sélectionnée": selectedSize,
      "Taille équivalente cadre": equivalentFrameSize,
      "Option de cadre": frameOption,
      "Couleur sélectionnée": selectedColor,
    },
    "📦 Informations produit": {
      "Format du produit": data?.format,
      "Stock disponible": selectedSizeData ? {
        "Taille": selectedSizeData.size,
        "Stock initial": selectedSizeData.initialStock,
        "Stock restant": selectedSizeData.stock,
        "Prochain numéro": selectedSizeData.nextSerialNumber,
      } : null,
    },
    "🎨 Couleurs disponibles": colorPoints.map(point => ({
      color: point.color,
      url: point.urlPoint
    })),
    "🖼️ Format correspondant": formatData ? {
      "Taille": formatData.size,
      "Options de cadre": formatData.frameOptions.map(option => ({
        nom: option.name,
        couleur: option.color,
        prix: option.price,
        disponible: option.available,
        imageUrl: option.imageUrl
      }))
    } : null,
    "🔍 Cadre sélectionné": selectedFrame ? {
      nom: selectedFrame.name,
      couleur: selectedFrame.color,
      prix: selectedFrame.price,
      imageUrl: selectedFrame.imageUrl
    } : null,
  };

  return (
    <div className="fixed top-4 right-4 p-4 bg-black/80 text-white rounded-lg max-w-lg max-h-[80vh] overflow-auto">
      <h3 className="text-xl font-bold mb-2">Debug Info</h3>
      {error && (
        <div className="mb-4 p-2 bg-red-500/50 rounded">
          <h4 className="font-bold">❌ Erreur:</h4>
          <p>{error}</p>
        </div>
      )}
      <pre className="text-xs whitespace-pre-wrap">
        {JSON.stringify(debugData, null, 2)}
      </pre>
    </div>
  );
};

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

  // États existants...
  const [formats, setFormats] = useState<Format[]>([]);
  const [isLoadingFormats, setIsLoadingFormats] = useState(true);
  const [selectedFrame, setSelectedFrame] = useState<FrameOption | null>(null);
  const [basePrice, setBasePrice] = useState<number>(0);
  const [debugError, setDebugError] = useState<string>("");

  // Ajouter ces états
  const [colorPoints, setColorPoints] = useState<ColorPoint[]>([]);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [isLoadingColors, setIsLoadingColors] = useState(true);

  // Ajouter cette fonction pour récupérer les points de couleur
  const fetchColorPoints = async () => {
    try {
      console.log("🎨 Récupération des points de couleur...");
      const colorDoc = await getDoc(doc(db, 'formats', 'couleurs'));
      
      if (!colorDoc.exists()) {
        console.error("❌ Document des couleurs non trouvé");
        return;
      }

      const colorData = colorDoc.data();
      console.log("📊 Points de couleur récupérés:", colorData.colors);
      setColorPoints(colorData.colors);
    } catch (error) {
      console.error("❌ Erreur lors de la récupération des couleurs:", error);
    } finally {
      setIsLoadingColors(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      console.log("🚀 Démarrage du fetchData");
      setIsLoading(true);
      try {
        // Récupération des données du produit
        console.log("📦 Récupération du produit:", params.id);
        const docRef = doc(db, "uploads", params.id);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
          const error = "❌ Document non trouvé";
          console.error(error);
          setDebugError(error);
          router.push("/404");
          return;
        }

        const data = docSnap.data() as ImageFirestoreData;
        console.log("📄 Données du produit:", data);

        if (!data) {
          const error = "❌ Les données du produit sont vides";
          setDebugError(error);
          console.error(error);
          return;
        }

        // Validation des données requises
        const hasRequiredFields = 
          data.artisteName && 
          data.format && 
          data.images && 
          data.sizes;

        if (!hasRequiredFields) {
          const error = "❌ Champs requis manquants dans les données du produit";
          setDebugError(error);
          console.error(error);
          return;
        }

        // Récupération des formats
        console.log("🎯 Récupération des formats");
        const formatsSnapshot = await getDocs(collection(db, 'formats'));
        const formatsData = formatsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Format[];

        if (formatsData.length === 0) {
          const error = "❌ Aucun format trouvé dans la base de données";
          setDebugError(error);
          console.error(error);
          return;
        }

        console.log("📊 Formats récupérés:", formatsData);

        // Traitement des données
        const createdAtDate = data.createdAt.toDate();
        const createdAtFormatted = format(createdAtDate, "dd MMMM yyyy", {
          locale: fr,
        });

        setImageData({
          artisteEmail: data.artisteEmail,
          artisteId: data.artisteId,
          artisteName: data.artisteName,
          createdAt: createdAtFormatted,
          description: data.description,
          format: data.format,
          images: data.images,
          mainImage: data.mainImage,
          sizes: data.sizes,
        });

        // Vérification des tailles disponibles
        const availableSize = data.sizes.find((size) => size.stock > 0) || data.sizes[0];
        if (!availableSize) {
          const error = "❌ Aucune taille disponible pour ce produit";
          setDebugError(error);
          console.error(error);
          return;
        }

        console.log("📏 Taille disponible trouvée:", availableSize);
        setSelectedSize(availableSize.size);

        // Vérification du format correspondant
        const formatData = formatsData.find(f => f.size === availableSize.equivalentFrameSize);
        if (!formatData) {
          const error = `❌ Format ${availableSize.equivalentFrameSize} non trouvé dans la base`;
          setDebugError(error);
          console.error(error);
          return;
        }

        setFormats(formatsData);

        // Ajouter l'appel pour récupérer les couleurs
        await fetchColorPoints();
        
      } catch (error: unknown) {
        const errorMessage = `🚨 Erreur lors du chargement: ${error instanceof Error ? error.message : 'Erreur inconnue'}`;
        console.error(errorMessage);
        setDebugError(errorMessage);
      } finally {
        setIsLoading(false);
        setIsLoadingFormats(false);
      }
    };

    fetchData();
  }, [params.id, router]);

  useEffect(() => {
    if (emblaApi) {
      emblaApi.on("select", () => {
        setSelectedImageIndex(emblaApi.selectedScrollSnap());
      });
    }
  }, [emblaApi]);

  const handleAddToCart = async () => {
    try {
      if (!selectedSize) {
        toast({
          title: "Format requis",
          description: "Veuillez sélectionner un format avant d'ajouter au panier",
          variant: "destructive",
        });
        return;
      }

      if (frameOption === "avec" && !selectedFrame) {
        toast({
          title: "Couleur de cadre requise",
          description: "Veuillez sélectionner une couleur de cadre",
          variant: "destructive",
        });
        return;
      }

      // Vérifier le stock
      const sizeData = imageData?.sizes.find(s => s.size === selectedSize);
      if (!sizeData || sizeData.stock <= 0) {
        toast({
          title: "Stock épuisé",
          description: "Ce format n'est plus disponible",
          variant: "destructive",
        });
        return;
      }

      // Créer l'item pour le panier
      const cartItem = {
        id: params.id,
        size: selectedSize,
        frameOption,
        frameColor: frameOption === "avec" ? selectedFrame?.color : undefined,
        quantity: 1
      };

      // Vérifier le prix avant l'ajout
      const priceResponse = await fetch('/api/product/price', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: params.id,
          size: selectedSize,
          frameOption,
          frameColor: selectedFrame?.color
        }),
      });

      if (!priceResponse.ok) {
        throw new Error("Erreur lors de la vérification du prix");
      }

      const priceData = await priceResponse.json();
      console.log("💰 Prix vérifié:", priceData);

      // Ajouter au panier
      addItem(cartItem);
      setIsAdded(true);

      toast({
        title: "Ajouté au panier",
        description: `${selectedSize} ${frameOption === "avec" ? `avec cadre ${selectedFrame?.name || ''}` : "sans cadre"}`,
      });

      setTimeout(() => {
        setIsAdded(false);
      }, 2000);

    } catch (error) {
      console.error("Erreur lors de l'ajout au panier:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de l'ajout au panier",
        variant: "destructive",
      });
    }
  };

  const handleImageClick = (index: number) => {
    setSelectedImageIndex(index);
    if (emblaApi) {
      emblaApi.scrollTo(index);
    }
  };

  // Fonction pour calculer le prix total
  const calculatePrice = () => {
    console.log("💲 Calcul du prix - Données actuelles:", {
      selectedSize,
      frameOption,
      selectedFrame
    });
    
    if (!selectedSize) return 0;
    
    if (frameOption === "sans") {
      const sizeData = imageData?.sizes.find(s => s.size === selectedSize);
      console.log("📏 Données de taille trouvées:", sizeData);
      
      const formatData = formats.find(f => f.size === sizeData?.equivalentFrameSize);
      console.log("📐 Format correspondant:", formatData);
      
      const baseFrameOption = formatData?.frameOptions.find(f => f.color === "none");
      console.log("🏷️ Prix de base trouvé:", baseFrameOption?.price);
      
      return baseFrameOption?.price || 0;
    } else {
      console.log("🖼️ Prix du cadre sélectionné:", selectedFrame?.price);
      return selectedFrame?.price || 0;
    }
  };

  // Fonction pour gérer le changement de taille
  const handleSizeChange = (size: string) => {
    console.log("🔄 Changement de taille:", size);
    setSelectedSize(size);
    setSelectedFrame(null);
    
    const sizeData = imageData?.sizes.find(s => s.size === size);
    console.log("📏 Données de la nouvelle taille:", sizeData);
    
    const formatData = formats.find(f => f.size === sizeData?.equivalentFrameSize);
    console.log("📐 Nouveau format correspondant:", formatData);
    
    const baseFrameOption = formatData?.frameOptions.find(f => f.color === "none");
    console.log("💰 Nouveau prix de base:", baseFrameOption?.price);
    
    if (baseFrameOption) {
      setBasePrice(baseFrameOption.price);
    }
  };

  // Ajouter cette fonction pour gérer la sélection de couleur
  const handleColorSelect = (color: string) => {
    console.log("🎨 Couleur sélectionnée:", color);
    setSelectedColor(color);
    
    // Trouver le frame correspondant
    const selectedFormat = formats.find(f => {
      const sizeData = imageData?.sizes.find(s => s.size === selectedSize);
      return f.size === sizeData?.equivalentFrameSize;
    });

    const frameOption = selectedFormat?.frameOptions.find(f => f.color === color);
    console.log("🖼️ Option de cadre correspondante:", frameOption);
    
    if (frameOption) {
      setSelectedFrame(frameOption);
    }
  };

  if (isLoading) {
    console.log("⌛ Affichage du loader");
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
          <div className="flex-1 border-2 border-gray-300 p-6 rounded-none shadow" style={{ height: "400px" }}>
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
    console.log("❌ Pas de données d'image");
    return <div>Aucune donnée disponible</div>;
  }

  console.log("🎨 Rendu de la page avec les données:", {
    imageData,
    formats,
    selectedSize,
    frameOption,
    selectedFrame
  });

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
              <div>
                {/* Image principale avec ou sans cadre */}
                <div className="relative mb-4" style={{ height: mainImageHeight, width: mainImageWidth }}>
                  {frameOption === "avec" && selectedFrame ? (
                    <div style={FRAME_STYLES.container}>
                      {/* Image du cadre en arrière-plan */}
                      <Image
                        src={selectedFrame.imageUrl}
                        alt={`Cadre ${selectedFrame.name}`}
                        fill
                        style={FRAME_STYLES.frame}
                        className="pointer-events-none"
                        priority
                      />
                      
                      {/* Image du produit centrée et réduite */}
                      <div style={FRAME_STYLES.image}>
                        <Image
                          src={imageData.images[selectedImageIndex].link}
                          alt={`Image ${selectedImageIndex + 1}`}
                          fill
                          style={{ 
                            objectFit: "contain",
                          }}
                          className="rounded-none"
                          priority
                        />
                      </div>
                    </div>
                  ) : (
                    // Image sans cadre (normale)
                    <Image
                      src={imageData.images[selectedImageIndex].link}
                      alt={`Image ${selectedImageIndex + 1}`}
                      fill
                      style={{ 
                        objectFit: isVertical ? "contain" : "cover",
                      }}
                      className="rounded-lg"
                      priority
                    />
                  )}
                </div>

                {/* Miniatures */}
                <div className="grid grid-cols-4 gap-2">
                  {imageData.images.map((image, index) => (
                    <div
                      key={index}
                      onClick={() => setSelectedImageIndex(index)}
                      className={`relative cursor-pointer ${
                        selectedImageIndex === index ? "ring-2 ring-blue-500" : ""
                      }`}
                      style={{ height: thumbnailHeight }}
                    >
                      {frameOption === "avec" && selectedFrame ? (
                        <div style={FRAME_STYLES.container}>
                          <Image
                            src={selectedFrame.imageUrl}
                            alt={`Cadre miniature ${selectedFrame.name}`}
                            fill
                            style={FRAME_STYLES.frame}
                            className="pointer-events-none"
                          />
                          <div style={FRAME_STYLES.image}>
                            <Image
                              src={image.link}
                              alt={`Miniature ${index + 1}`}
                              fill
                              style={{ objectFit: "contain" }}
                              className="rounded-none"
                            />
                          </div>
                        </div>
                      ) : (
                        // Miniature sans cadre
                        <Image
                          src={image.link}
                          alt={`Miniature ${index + 1}`}
                          fill
                          style={{ objectFit: isVertical ? "contain" : "cover" }}
                          className="rounded-lg"
                        />
                      )}
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
              <h3 className="text-xl mb-2">Options de finition</h3>
              <div className="flex gap-2 mb-4">
                <Button
                  onClick={() => {
                    console.log("🔄 Option sélectionnée: sans cadre");
                    setFrameOption("sans");
                    setSelectedFrame(null);
                    setSelectedColor(null);
                  }}
                  variant={frameOption === "sans" ? "default" : "outline"}
                >
                  Sans cadre
                </Button>
                <Button
                  onClick={() => {
                    console.log("🔄 Option sélectionnée: avec cadre");
                    setFrameOption("avec");
                    // Présélectionner la première couleur disponible (blanc par défaut)
                    const defaultColor = colorPoints.find(point => point.color === "blanc")?.color || colorPoints[0]?.color;
                    if (defaultColor) {
                      console.log("🎨 Présélection de la couleur:", defaultColor);
                      handleColorSelect(defaultColor);
                    }
                  }}
                  variant={frameOption === "avec" ? "default" : "outline"}
                >
                  Avec cadre
                </Button>
              </div>

              {/* Sélection des tailles */}
              <div className="mb-4">
                <h4 className="text-sm mb-2">Format :</h4>
                <div className="flex flex-wrap gap-2">
                  {imageData.sizes.map((size) => (
                    <Button
                      key={size.size}
                      onClick={() => handleSizeChange(size.size)}
                      variant={selectedSize === size.size ? "default" : "outline"}
                    >
                      {frameOption === "sans" ? size.size : size.equivalentFrameSize}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Options de couleur si "avec cadre" est sélectionné */}
              {frameOption === "avec" && selectedSize && (
                <div className="mt-4">
                  <h4 className="text-sm mb-2">Sélectionnez une couleur :</h4>
                  
                  {isLoadingColors ? (
                    <div className="flex justify-center">
                      <CircularProgress size={24} />
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-4 mb-6">
                      {colorPoints.map((point) => {
                        console.log(`🎨 Tentative d'affichage du point de couleur:`, {
                          color: point.color,
                          url: point.urlPoint,
                          isValidUrl: point.urlPoint?.startsWith('https://'),
                        });
                        
                        // Vérifier si l'URL est valide
                        if (!point.urlPoint || !point.urlPoint.startsWith('https://')) {
                          console.error(`❌ URL invalide pour ${point.color}:`, point.urlPoint);
                          return null;
                        }

                        return (
                          <div
                            key={point.color}
                            onClick={() => handleColorSelect(point.color)}
                            className={`relative cursor-pointer transition-all duration-200 ${
                              selectedColor === point.color 
                                ? 'transform scale-110' 
                                : 'hover:scale-105'
                            }`}
                          >
                            <div className={`
                              rounded-full 
                              p-0.5
                              ${selectedColor === point.color 
                                ? 'border-4 border-blue-500' 
                                : 'border border-gray-300 hover:border-gray-400'
                              }
                            `}>
                              <div className="relative w-[30px] h-[30px] rounded-full overflow-hidden bg-gray-100">
                                <Image
                                  src={point.urlPoint}
                                  alt={`Couleur ${point.color}`}
                                  width={30}
                                  height={30}
                                  className="rounded-full object-cover"
                                  priority={true}
                                  onError={(e) => {
                                    console.error(`❌ Erreur de chargement de l'image pour ${point.color}:`, {
                                      url: point.urlPoint,
                                      error: e
                                    });
                                    // Utiliser une couleur de fond comme fallback
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = 'none';
                                    target.parentElement!.style.backgroundColor = point.color === 'blanc' ? '#FFFFFF' : 
                                                                                       point.color === 'noir' ? '#000000' : 
                                                                                       point.color === 'rouge' ? '#FF0000' : 
                                                                                       '#CCCCCC';
                                  }}
                                  onLoad={() => {
                                    console.log(`✅ Image chargée avec succès pour ${point.color}:`, point.urlPoint);
                                  }}
                                />
                              </div>
                            </div>
                            <span className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs whitespace-nowrap">
                              {point.color.replace('motif-', '')}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Aperçu du cadre sélectionné */}
                  {selectedFrame && (
                    <div className="mt-8">
                      <h4 className="text-sm mb-2">Aperçu du cadre :</h4>
                      <div className="relative h-40 w-full">
                        <Image
                          src={selectedFrame.imageUrl}
                          alt={selectedFrame.name}
                          fill
                          style={{ objectFit: "contain" }}
                        />
                      </div>
                      <p className="text-center mt-2">{selectedFrame.name}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Prix et Ajouter au Panier */}
            <div className="mt-6">
              <p className="text-2xl font-bold mb-4">Prix: {calculatePrice()}€</p>
              <Button
                onClick={handleAddToCart}
                className="w-full"
                disabled={isAdded || !selectedSize}
              >
                {isAdded ? "Ajouté au panier" : "Ajouter au panier"}
              </Button>
            </div>

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

      {/* Composant de débogage */}
      {/* <DebugInfo 
        data={imageData}
        formats={formats}
        selectedSize={selectedSize}
        selectedColor={selectedColor}
        frameOption={frameOption}
        selectedFrame={selectedFrame}
        colorPoints={colorPoints}
        error={debugError}
      /> */}
    </>
  );
}
